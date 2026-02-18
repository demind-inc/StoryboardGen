import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../types";
import { useAuth } from "../providers/AuthProvider";
import { useSubscription } from "../providers/SubscriptionProvider";
import Sidebar, { PanelKey } from "../components/Sidebar/Sidebar";
import DashboardMain from "../components/DashboardV2/DashboardMain";
import { useDashboardManual } from "../hooks/useDashboardManual";
import styles from "./DashboardPage.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  free: "Free",
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DashboardPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<PanelKey>("manual");
  const mode: AppMode = "manual";

  const openBillingFromQuery = router.query.openBilling === "1";

  const handleBillingHandled = () => {
    if (openBillingFromQuery) {
      router.replace("/dashboard", undefined, { shallow: true });
    }
  };

  const dashboard = useDashboardManual({
    userId: session?.user?.id,
    authStatus,
  });

  useEffect(() => {
    if (openBillingFromQuery) {
      subscription.setIsPaymentModalOpen(true);
      handleBillingHandled();
    }
  }, [
    openBillingFromQuery,
    subscription.setIsPaymentModalOpen,
    handleBillingHandled,
  ]);

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
      <main className={`app__body ${styles.body}`}>
        <div className="app__content">
          <Sidebar
            mode={mode}
            onModeChange={() => {}}
            activePanel={activePanel}
            onPanelChange={(panel) => setActivePanel(panel)}
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
            onOpenBilling={() => subscription.setIsPaymentModalOpen(true)}
            onCancelSubscription={() => {}}
            onSignOut={signOut}
          />

          <DashboardMain dashboard={dashboard} />

        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
