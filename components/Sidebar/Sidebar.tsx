import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Footer from "../Footer/Footer";
import {
  TikTokIcon,
  InstagramIcon,
  CustomGuidelinesIcon,
} from "../DashboardV2/DashboardIcons";
import PaymentModal from "../PaymentModal/PaymentModal";
import styles from "./Sidebar.module.scss";
import { fetchProjectList } from "../../services/projectService";

export type PanelKey =
  | "saved"
  | "projects"
  | "manual"
  | "settings"
  | "tiktok"
  | "instagram"
  | "customGuidelines";

interface SidebarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  activePanel: PanelKey;
  onPanelChange: (panel: PanelKey) => void;
  onOpenSettings: () => void;
  displayEmail: string;
  isSubscribed: boolean;
  subscriptionLabel?: string;
  subscriptionPrice?: string | null;
  planType?: string;
  remainingCredits?: number;
  totalCredits?: number;
  expiredAt?: string | null;
  unsubscribedAt?: string | null;
  subscriptionStatus?: string | null;
  onOpenBilling?: () => void;
  onCancelSubscription?: () => void;
  onSignOut: () => void;
  onSelectSavedProject?: (projectId: string) => void;
  onSavedProjectsClick?: () => void;
}

const SidebarIcon: React.FC<{ name: string }> = ({ name }) => {
  const path = useMemo(() => {
    switch (name) {
      case "star":
        return "M12 17.27l5.18 3.04-1.4-5.99L20 9.24l-6.09-.52L12 3 10.09 8.72 4 9.24l4.22 5.08-1.4 5.99L12 17.27z";
      case "folder":
        return "M10 4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6z";
      case "history":
        return "M13 3a9 9 0 00-9 9H1l3.5 3.5L8 12H5a8 8 0 118 8 1 1 0 010 2 10 10 0 100-20z";
      case "play":
        return "M8 5v14l11-7z";
      case "camera":
        return "M7 7l2-2h6l2 2h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2h3zm5 4a4 4 0 100 8 4 4 0 000-8z";
      case "settings":
        return "M19.14 12.94a7.97 7.97 0 000-1.88l2.03-1.58-2-3.46-2.39.96a7.72 7.72 0 00-1.62-.94l-.36-2.54h-4l-.36 2.54a7.72 7.72 0 00-1.62.94l-2.39-.96-2 3.46 2.03 1.58a7.97 7.97 0 000 1.88l-2.03 1.58 2 3.46 2.39-.96c.5.38 1.05.7 1.62.94l.36 2.54h4l.36-2.54c.57-.24 1.12-.56 1.62-.94l2.39.96 2-3.46-2.03-1.58zM12 15a3 3 0 110-6 3 3 0 010 6z";
      case "dot":
        return "M12 7a5 5 0 100 10 5 5 0 000-10z";
      default:
        return "M12 2a10 10 0 100 20 10 10 0 000-20z";
    }
  }, [name]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={styles.sidebar__icon}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
};

const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    activePanel,
    onPanelChange,
    onOpenSettings,
    isSubscribed,
    planType,
    remainingCredits,
    totalCredits,
    onOpenBilling,
    onSelectSavedProject,
  } = props;
  const { session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();

  const isManualActive = activePanel === "manual";
  const isSavedActive = activePanel === "saved";
  const isProjectsActive = activePanel === "projects";
  const isSettingsActive = activePanel === "settings";
  const isTikTokActive = activePanel === "tiktok";
  const isInstagramActive = activePanel === "instagram";
  const isCustomGuidelinesActive = activePanel === "customGuidelines";
  const creditText = useMemo(() => {
    if (isSubscribed) {
      if (
        typeof remainingCredits === "number" &&
        typeof totalCredits === "number"
      ) {
        return `${remainingCredits}/${totalCredits} credits`;
      }
      return "--/-- credits";
    }
    if (typeof remainingCredits === "number") {
      return `${remainingCredits}/3 credits`;
    }
    return "0/3 credits";
  }, [isSubscribed, remainingCredits, totalCredits]);

  const [savedProjects, setSavedProjects] = useState<
    { id: string; name: string; createdAt?: string | null }[]
  >([]);
  const [activeSavedProjectId, setActiveSavedProjectId] = useState<
    string | null
  >(null);
  const [isSavedProjectsOpen, setIsSavedProjectsOpen] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  const stripePlanLinks = useMemo(() => {
    const baseLinks = {
      basic: process.env.STRIPE_LINK_BASIC || "",
      pro: process.env.STRIPE_LINK_PRO || "",
      business: process.env.STRIPE_LINK_BUSINESS || "",
    };
    const userId = session?.user?.id;
    if (!userId) return baseLinks;
    const links: Partial<Record<SubscriptionPlan, string>> = {};
    for (const [plan, baseUrl] of Object.entries(baseLinks)) {
      if (baseUrl) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set("client_reference_id", userId);
          links[plan as SubscriptionPlan] = url.toString();
        } catch {
          links[plan as SubscriptionPlan] = baseUrl;
        }
      }
    }
    return links;
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    setIsProjectsLoading(true);
    fetchProjectList(userId)
      .then((list) =>
        setSavedProjects(
          list.map((project) => ({
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
          }))
        )
      )
      .catch((error) => {
        console.error("Failed to load projects:", error);
        setSavedProjects([]);
      })
      .finally(() => setIsProjectsLoading(false));
  }, [session?.user?.id]);

  // Keep projects subnav open on saved projects list or detail page; sync active project from route
  useEffect(() => {
    const path = router.pathname;
    const isProjectsList = path === "/saved/project";
    const isProjectDetail = path === "/saved/project/[projectId]";
    if (isProjectsList || isProjectDetail) {
      setIsSavedProjectsOpen(true);
    }
    if (isProjectDetail && router.query.projectId) {
      const id =
        typeof router.query.projectId === "string"
          ? router.query.projectId
          : router.query.projectId?.[0];
      if (id) setActiveSavedProjectId(id);
    }
  }, [router.pathname, router.query.projectId]);

  return (
    <>
      <div className={`${styles.sidebar} custom-scrollbar`}>
        <div className={styles.sidebar__header}>
          <div className={styles.sidebar__brand}>
            <div className={styles.sidebar__brandIcon}>
              <img
                src="/assets/images/logo.png"
                alt="StoryboardGen Logo"
                className={styles.sidebar__brandImage}
              />
            </div>
            <div className={styles.sidebar__brandText}>
              <span className={styles.sidebar__brandTitle}>StoryboardGen</span>
            </div>
          </div>
        </div>

        <div className={styles.sidebar__section}>
          <p className={styles.sidebar__eyebrow}>Workspace</p>
          <nav className={styles.sidebar__nav}>
            <button
              className={`${styles.sidebar__navItem} ${
                isManualActive ? styles.isActive : ""
              }`}
              onClick={() => {
                onPanelChange("manual");
                router.push("/dashboard");
              }}
            >
              <SidebarIcon name="star" />
              Generate
            </button>
            <button
              className={`${styles.sidebar__navItem} ${
                isProjectsActive ? styles.isActive : ""
              }`}
              onClick={() => {
                onPanelChange("projects");
                setIsSavedProjectsOpen(true);
                router.push("/saved/project");
                if (props.onSavedProjectsClick) {
                  props.onSavedProjectsClick();
                }
              }}
            >
              <SidebarIcon name="folder" />
              <span className={styles.sidebar__navLabel}>Saved project</span>
              <span className={styles.sidebar__navCaret} aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>
            {isProjectsActive && isSavedProjectsOpen && (
              <div className={styles.sidebar__subnav}>
                {isProjectsLoading ? (
                  <div className={styles.sidebar__subnavEmpty}>
                    Loading projects...
                  </div>
                ) : savedProjects.length === 0 ? (
                  <div className={styles.sidebar__subnavEmpty}>
                    No projects yet
                  </div>
                ) : (
                  savedProjects.map((project) => (
                    <button
                      key={project.id}
                      className={`${styles.sidebar__subnavItem} ${
                        activeSavedProjectId === project.id
                          ? styles.isActive
                          : ""
                      }`}
                      onClick={() => {
                        setActiveSavedProjectId(project.id);
                        router.push("/saved/project/" + project.id);
                        onSelectSavedProject?.(project.id);
                      }}
                    >
                      {project.name}
                    </button>
                  ))
                )}
              </div>
            )}
            <button
              className={`${styles.sidebar__navItem} ${
                isSavedActive ? styles.isActive : ""
              }`}
              onClick={() => {
                onPanelChange("saved");
                router.push("/saved/image");
              }}
            >
              <SidebarIcon name="history" />
              Saved Images
            </button>
          </nav>
        </div>

        <div className={styles.sidebar__divider} />

        <div className={styles.sidebar__section}>
          <p className={styles.sidebar__eyebrow}>Settings</p>
          <nav className={styles.sidebar__nav}>
            <button
              className={`${styles.sidebar__navItem} ${
                isTikTokActive ? styles.isActive : ""
              }`}
              onClick={() => router.push("/rules/tiktok")}
            >
              <span className={styles.sidebar__iconWrap} aria-hidden>
                <TikTokIcon />
              </span>
              TikTok Rules
            </button>
            <button
              className={`${styles.sidebar__navItem} ${
                isInstagramActive ? styles.isActive : ""
              }`}
              onClick={() => router.push("/rules/instagram")}
            >
              <span className={styles.sidebar__iconWrap} aria-hidden>
                <InstagramIcon />
              </span>
              Instagram Rules
            </button>
            <button
              className={`${styles.sidebar__navItem} ${
                isCustomGuidelinesActive ? styles.isActive : ""
              }`}
              onClick={() => router.push("/rules/custom-guidelines")}
            >
              <span className={styles.sidebar__iconWrap} aria-hidden>
                <CustomGuidelinesIcon />
              </span>
              Custom Guidelines
            </button>
            <button
              className={`${styles.sidebar__navItem} ${
                isSettingsActive ? styles.isActive : ""
              }`}
              onClick={onOpenSettings}
            >
              <SidebarIcon name="settings" />
              Account
            </button>
          </nav>
        </div>

        <div className={styles.sidebar__footer}>
          <div className={styles.sidebar__planCard}>
            <div className={styles.sidebar__planLabel}>Current Plan</div>
            <div className={styles.sidebar__planName}>
              {isSubscribed && planType ? planType.toUpperCase() : "Free Plan"}
            </div>
            <div className={styles.sidebar__planDesc}>
              {totalCredits != null
                ? `${totalCredits} credits/month`
                : isSubscribed
                ? "500 credits/month"
                : "3 credits/month"}
            </div>
            <div className={styles.sidebar__planCredits}>{creditText}</div>
          </div>
          {!isSubscribed && onOpenBilling && (
            <button
              className={styles.sidebar__upgradeBtn}
              onClick={onOpenBilling}
            >
              Upgrade
            </button>
          )}
          {!isSubscribed && !onOpenBilling && (
            <button
              className={styles.sidebar__upgradeBtn}
              onClick={subscription.openPaymentModal}
            >
              Upgrade
            </button>
          )}
        </div>

        <div className={styles.sidebar__footerSection}>
          <Footer />
        </div>
      </div>
      <PaymentModal
        isOpen={subscription.isPaymentModalOpen}
        onClose={() => subscription.setIsPaymentModalOpen(false)}
        planType={subscription.planType}
        paymentUrls={stripePlanLinks}
        onPlanSelect={(plan) => subscription.setPlanType(plan)}
        userId={session?.user?.id}
      />
    </>
  );
};

export default Sidebar;
