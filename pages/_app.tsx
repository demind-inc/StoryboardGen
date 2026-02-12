import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "../providers/AuthProvider";
import { SubscriptionProvider } from "../providers/SubscriptionProvider";
import { createQueryClient } from "../lib/queryClient";
import "../App.scss";
// Import page-level styles here (Next.js requires global CSS in _app.tsx)
import "./LandingPage.scss";

const queryClient = createQueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLandingPage = router.pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <div className="app-shell">
            <Component {...pageProps} />
          </div>
          {!isLandingPage && (
            <div className="mobile-unsupported" role="alert">
              <div className="mobile-unsupported__card">
                <p className="mobile-unsupported__eyebrow">Not supported</p>
                <h1 className="mobile-unsupported__title">
                  This app is optimized for desktop
                </h1>
                <p className="mobile-unsupported__copy">
                  Open StoryboardGen on a larger screen to continue.
                </p>
              </div>
            </div>
          )}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
