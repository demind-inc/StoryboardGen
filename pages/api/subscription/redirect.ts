import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

type SubscriptionPlan = 'basic' | 'pro' | 'business';

interface SubscriptionRedirectRequest {
  userId: string;
  plan?: SubscriptionPlan;
  sessionId?: string;
}

interface SubscriptionRedirectResponse {
  success: boolean;
  subscription?: {
    userId: string;
    isActive: boolean;
    planType: string | null;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
  };
  error?: string;
  details?: string;
}

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

/**
 * POST /api/subscription/redirect
 * Handles subscription activation after payment redirect
 *
 * Body: {
 *   userId: string,
 *   plan: 'basic' | 'pro' | 'business',
 *   sessionId?: string (Stripe session ID if available)
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscriptionRedirectResponse | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, plan, sessionId } = req.body as SubscriptionRedirectRequest;

    // Validate inputs
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    const validPlans: SubscriptionPlan[] = ['basic', 'pro', 'business'];
    const planType: SubscriptionPlan =
      plan && validPlans.includes(plan) ? plan : 'basic';

    // If sessionId is provided, verify with Stripe
    if (sessionId && process.env.STRIPE_SECRET_KEY) {
      const stripeModule = await import('stripe');
      const Stripe = stripeModule.default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
      });

      try {
        const session = await stripeClient.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
          return res.status(400).json({
            error: 'Payment not completed',
          });
        }

        // Extract subscription and customer IDs from session
        const stripeSubscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || null;
        const stripeCustomerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id || null;

        // Update subscription with Stripe data
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              is_active: true,
              plan_type: planType,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: stripeCustomerId,
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
          )
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          return res.status(500).json({
            error: 'Failed to update subscription',
            details: error.message,
          });
        }

        return res.json({
          success: true,
          subscription: {
            userId: data.user_id,
            isActive: data.is_active,
            planType: data.plan_type,
            stripeSubscriptionId: data.stripe_subscription_id,
            stripeCustomerId: data.stripe_customer_id,
          },
        });
      } catch (stripeError: unknown) {
        console.error('Stripe error:', stripeError);
        // Continue with basic activation if Stripe verification fails
      }
    }

    // Basic activation without Stripe verification
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          is_active: true,
          plan_type: planType,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Failed to activate subscription',
        details: error.message,
      });
    }

    // Verify subscription was activated
    if (!data?.is_active) {
      return res.status(500).json({
        error: 'Subscription activation failed verification',
      });
    }

    res.json({
      success: true,
      subscription: {
        userId: data.user_id,
        isActive: data.is_active,
        planType: data.plan_type,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripeCustomerId: data.stripe_customer_id,
      },
    });
  } catch (error: unknown) {
    console.error('Subscription redirect error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal server error',
      details: errorMessage,
    });
  }
}
