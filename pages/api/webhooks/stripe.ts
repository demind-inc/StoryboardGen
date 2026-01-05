import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

type SubscriptionPlan = 'basic' | 'pro' | 'business';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events
 *
 * Note: For production, configure the webhook endpoint in Stripe Dashboard
 * and set STRIPE_WEBHOOK_SECRET environment variable in Vercel.
 * The webhook URL should be: https://yourdomain.com/api/webhooks/stripe
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ received: boolean } | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Stripe configuration missing' });
  }

  const stripeModule = await import('stripe');
  const Stripe = stripeModule.default;
  const stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
  });

  const sig = req.headers['stripe-signature'] as string | undefined;
  let event: Stripe.Event;

  // Get raw body for signature verification
  const rawBody = await getRawBody(req);

  // Verify webhook signature if webhook secret is provided
  if (webhookSecret && sig) {
    try {
      event = stripeClient.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      // In production, reject if signature verification fails
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).send(`Webhook Error: ${errorMessage}`);
      }
      // In development, try to parse as JSON
      try {
        event = JSON.parse(rawBody.toString()) as Stripe.Event;
      } catch (parseErr) {
        return res.status(400).send(`Webhook Error: ${errorMessage}`);
      }
    }
  } else {
    // If no webhook secret, parse the event directly (works for development)
    try {
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to parse webhook body:', errorMessage);
      return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get user ID from metadata or customer email
        const userId = session.metadata?.user_id;
        const customerEmail =
          typeof session.customer_email === 'string'
            ? session.customer_email
            : null;

        if (!userId && !customerEmail) {
          console.error('No user ID or email found in checkout session');
          return res.status(400).json({ error: 'Missing user identifier' });
        }

        // If we have email but no userId, try to find user by email
        let finalUserId: string | undefined = userId;
        if (!finalUserId && customerEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single();

          if (profile) {
            finalUserId = profile.id;
          }
        }

        if (!finalUserId) {
          console.error('Could not determine user ID');
          return res.status(400).json({ error: 'User not found' });
        }

        // Determine plan from metadata or price
        const planType = (session.metadata?.plan as SubscriptionPlan) || 'basic';

        // Update subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: finalUserId,
              is_active: true,
              plan_type: planType,
              stripe_subscription_id:
                typeof session.subscription === 'string'
                  ? session.subscription
                  : session.subscription?.id || null,
              stripe_customer_id:
                typeof session.customer === 'string'
                  ? session.customer
                  : session.customer?.id || null,
              current_period_end:
                session.subscription_details?.metadata?.current_period_end
                  ? new Date(
                      session.subscription_details.metadata.current_period_end *
                        1000
                    ).toISOString()
                  : null,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          );

        if (subError) {
          console.error('Failed to update subscription:', subError);
          return res.status(500).json({ error: 'Failed to update subscription' });
        }

        console.log(`Subscription activated for user ${finalUserId}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive =
          event.type === 'customer.subscription.updated' &&
          subscription.status === 'active';

        // Update subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({
            is_active: isActive,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to update subscription:', error);
          return res.status(500).json({ error: 'Failed to update subscription' });
        }

        console.log(
          `Subscription ${subscription.id} ${isActive ? 'activated' : 'deactivated'}`
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Update subscription period end if it's a subscription invoice
        if (invoice.subscription) {
          const subscriptionId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription.id;

          const { error } = await supabase
            .from('subscriptions')
            .update({
              is_active: true,
              current_period_end: invoice.period_end
                ? new Date(invoice.period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('Failed to update subscription period:', error);
          } else {
            console.log(`Subscription period updated for ${subscriptionId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // Optionally deactivate subscription on payment failure
        if (invoice.subscription) {
          const subscriptionId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription.id;

          const { error } = await supabase
            .from('subscriptions')
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('Failed to deactivate subscription:', error);
          } else {
            console.log(
              `Subscription deactivated due to payment failure: ${subscriptionId}`
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Helper function to get raw body for Next.js
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
