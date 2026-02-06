import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faFolder,
  faClockRotateLeft,
  faPlay,
  faCamera,
  faGear,
  faCircle,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Footer from "../Footer/Footer";
import {
  TikTokIcon,
  InstagramIcon,
  CustomGuidelinesIcon,
  HashtagIcon,
  AIIcon,
} from "../DashboardV2/DashboardIcons";
import PaymentModal from "../PaymentModal/PaymentModal";
import styles from "./Sidebar.module.scss";
import { useProjectList } from "../../hooks/useProjectService";

const SIDEBAR_ICON_MAP = {
  star: faStar,
  folder: faFolder,
  history: faClockRotateLeft,
  play: faPlay,
  camera: faCamera,
  settings: faGear,
  dot: faCircle,
} as const;

export type PanelKey =
  | "saved"
  | "projects"
  | "manual"
  | "settings"
  | "tiktok"
  | "instagram"
  | "customGuidelines"
  | "hashtags";

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

const SidebarIcon: React.FC<{ name: keyof typeof SIDEBAR_ICON_MAP }> = ({
  name,
}) => (
  <FontAwesomeIcon
    icon={SIDEBAR_ICON_MAP[name] ?? faFolder}
    className={styles.sidebar__icon}
    style={{ width: 16, height: 16 }}
    aria-hidden
  />
);

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
  const isHashtagsActive = activePanel === "hashtags";
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

  const userId = session?.user?.id;
  const {
    data: projectListData,
    isLoading: isProjectsLoading,
    error: projectListError,
  } = useProjectList(userId);
  const savedProjects = useMemo(
    () =>
      projectListData?.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
      })) ?? [],
    [projectListData]
  );
  const [activeSavedProjectId, setActiveSavedProjectId] = useState<
    string | null
  >(null);
  const [isSavedProjectsOpen, setIsSavedProjectsOpen] = useState(false);

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

  if (projectListError) {
    console.error("Failed to load projects:", projectListError);
  }

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
              <AIIcon className={styles.sidebar__icon} />
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
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{ width: 12, height: 12 }}
                />
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
              <SidebarIcon name="camera" />
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
                isHashtagsActive ? styles.isActive : ""
              }`}
              onClick={() => router.push("/rules/hashtags")}
            >
              <span className={styles.sidebar__iconWrap} aria-hidden>
                <HashtagIcon />
              </span>
              Hashtags
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
