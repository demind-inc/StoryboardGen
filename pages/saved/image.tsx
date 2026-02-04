import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Sidebar, { PanelKey } from "../../components/Sidebar/Sidebar";
import SavedImagesPanel from "./SavedImagesPanel";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const SavedImagesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const [librarySort, setLibrarySort] = useState<"newest" | "oldest">("newest");
  const mode: AppMode = "manual";

  if (authStatus === "checking") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Checking your session...</p>
      </div>
    );
  }

  if (authStatus !== "signed_in") {
    return null;
  }

  return (
    <div className="app">
      <main className="app__body">
        <div className="app__content">
          <Sidebar
            mode={mode}
            onModeChange={() => {}}
            activePanel="saved"
            onPanelChange={(panel) => {
              if (panel === "manual") {
                router.push("/dashboard");
              } else if (panel === "saved") {
                router.push("/saved/image");
              } else if (panel === "projects") {
                router.push("/saved/project");
              }
            }}
            onOpenSettings={() => router.push("/settings")}
            displayEmail={displayEmail}
            isSubscribed={subscription.subscription?.isActive ?? false}
            subscriptionLabel={
              subscription.subscription?.planType
                ? subscription.subscription.planType.charAt(0).toUpperCase() +
                  subscription.subscription.planType.slice(1)
                : "Free"
            }
            subscriptionPrice={
              subscription.subscription?.planType
                ? PLAN_PRICE_LABEL[subscription.subscription.planType]
                : "—"
            }
            planType={subscription.planType}
            remainingCredits={subscription.usage?.remaining}
            totalCredits={subscription.usage?.monthlyLimit}
            expiredAt={subscription.subscription?.expiredAt ?? null}
            unsubscribedAt={subscription.subscription?.unsubscribedAt ?? null}
            subscriptionStatus={subscription.subscription?.status ?? null}
            onOpenBilling={() => router.push("/dashboard?openBilling=1")}
            onCancelSubscription={() => {}}
            onSignOut={signOut}
          />

          <SavedImagesPanel
            sortDirection={librarySort}
            onSortChange={setLibrarySort}
            onSelectReferenceSet={() => {}}
          />
        </div>
      </main>
    </div>
  );
};

export default SavedImagesPage;
