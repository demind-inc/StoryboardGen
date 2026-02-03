import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar, { PanelKey } from "../../components/Sidebar/Sidebar";
import SavedImagesPanel from "./SavedImagesPanel";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const SavedImagesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut } = useAuth();
  const router = useRouter();
  const [librarySort, setLibrarySort] = useState<"newest" | "oldest">("newest");
  const mode: AppMode = "manual";

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

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
              }
            }}
            onOpenSettings={() => router.push("/settings")}
            displayEmail={displayEmail}
            isSubscribed={false}
            subscriptionLabel={"Free"}
            subscriptionPrice={PLAN_PRICE_LABEL.basic}
            planType={undefined}
            remainingCredits={undefined}
            totalCredits={undefined}
            expiredAt={null}
            unsubscribedAt={null}
            subscriptionStatus={null}
            onOpenBilling={() => {}}
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
