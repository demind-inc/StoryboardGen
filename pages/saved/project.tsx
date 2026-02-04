import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import SavedProjectsPanel from "./SavedProjectsPanel";
import { fetchProjectDetail } from "../../services/projectService";
import type { ProjectDetail } from "../../types";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const SavedProjectsPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadProjectDetail = useCallback(
    async (userId: string, projectId: string) => {
      setIsLoadingDetail(true);
      try {
        const detail = await fetchProjectDetail({ userId, projectId });
        setSelectedProject(detail);
      } catch (error) {
        console.error("Failed to load project detail:", error);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    []
  );

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
  console.log(selectedProject);

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
            onSelectSavedProject={(projectId) => {
              const userId = session?.user?.id;
              if (!userId) return;
              loadProjectDetail(userId, projectId);
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
            selectedProject={selectedProject}
            isLoading={isLoadingDetail}
          />
        </div>
      </main>
    </div>
  );
};

export default SavedProjectsPage;
