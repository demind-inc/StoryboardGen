import React from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../../types";
import { useAuth } from "../../../providers/AuthProvider";
import { useSubscription } from "../../../providers/SubscriptionProvider";
import Sidebar from "../../../components/Sidebar/Sidebar";
import SavedProjectsPanel from "../SavedProjectsPanel";
import { useProjectList } from "../../../hooks/useProjectService";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  free: "Free",
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const SavedProjectsListPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const mode: AppMode = "manual";
  const userId = session?.user?.id;
  const { data: projects = [], isLoading } = useProjectList(userId);

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
            activePanel="projects"
            onPanelChange={(panel) => {
              if (panel === "manual") {
                router.push("/dashboard");
              } else if (panel === "saved") {
                router.push("/saved/image");
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

          <SavedProjectsPanel
            projects={projects}
            projectListLoading={isLoading}
            selectedProject={null}
            isLoadingDetail={false}
            planType={subscription.planType}
            onSelectProject={(projectId) =>
              router.push("/saved/project/" + projectId)
            }
          />
        </div>
      </main>
    </div>
  );
};

export default SavedProjectsListPage;
