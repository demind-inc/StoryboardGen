/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Note: For client-side access, use NEXT_PUBLIC_ prefix in .env.local
  // The env property here makes server-side env vars available to client
  env: {
    SUPABASE_URL:
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    STRIPE_LINK_BASIC:
      process.env.STRIPE_LINK_BASIC ||
      process.env.NEXT_PUBLIC_STRIPE_LINK_BASIC,
    STRIPE_LINK_PRO:
      process.env.STRIPE_LINK_PRO || process.env.NEXT_PUBLIC_STRIPE_LINK_PRO,
    STRIPE_LINK_BUSINESS:
      process.env.STRIPE_LINK_BUSINESS ||
      process.env.NEXT_PUBLIC_STRIPE_LINK_BUSINESS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL,
    SUPABASE_ROLE_KEY: process.env.SUPABASE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID_BASIC: process.env.STRIPE_PRICE_ID_BASIC,
    STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO,
    STRIPE_PRICE_ID_BUSINESS: process.env.STRIPE_PRICE_ID_BUSINESS,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
};

// Injected content via Sentry wizard below (only applied in production)

const { withSentryConfig } = require("@sentry/nextjs");

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "waki-d7",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
};

module.exports =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
    : nextConfig;
