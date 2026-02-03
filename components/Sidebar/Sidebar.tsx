import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode } from "../../types";
import Footer from "../Footer/Footer";
import styles from "./Sidebar.module.scss";

export type PanelKey = "saved" | "manual";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${year} ${month} ${day}`;
};

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

const Sidebar: React.FC<SidebarProps> = ({
  activePanel,
  onPanelChange,
  onOpenSettings,
  displayEmail,
  isSubscribed,
  subscriptionLabel,
  subscriptionPrice,
  planType,
  remainingCredits,
  totalCredits,
  expiredAt,
  unsubscribedAt,
  subscriptionStatus,
  onOpenBilling,
  onCancelSubscription,
  onSignOut,
}) => {
  const router = useRouter();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const isManualActive = activePanel === "manual";
  const isSavedActive = activePanel === "saved";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  return (
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
          <div className={styles.sidebar__brandEyebrow}>Prompt Gen</div>
          <div className={styles.sidebar__brandTitle}>StoryboardGen</div>
        </div>
        <div className={styles.sidebar__headerActions}>
          <div className={styles.sidebar__profile} ref={accountMenuRef}>
            <button
              className={styles.sidebar__profileBtn}
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              title="Account"
            >
              <SidebarIcon name="settings" />
            </button>
            {isAccountMenuOpen && (
              <div className={styles.sidebar__profileMenu}>
                <div className={styles.sidebar__profileEmail}>
                  {displayEmail}
                </div>
                <div className={styles.sidebar__profileSub}>
                  <p className={styles.sidebar__profileLabel}>
                    {subscriptionLabel ||
                      (isSubscribed ? "Subscribed" : "Free")}
                  </p>
                  <p className={styles.sidebar__profileMeta}>
                    {isSubscribed
                      ? subscriptionPrice || "Active"
                      : "3 credits included"}
                  </p>
                  {isSubscribed && expiredAt && (
                    <p className={styles.sidebar__profileMeta}>
                      Expired: {formatDate(expiredAt)}
                    </p>
                  )}
                  {isSubscribed && unsubscribedAt && (
                    <p className={styles.sidebar__profileMeta}>
                      Unsubscribed: {formatDate(unsubscribedAt)}
                    </p>
                  )}
                  <div className={styles.sidebar__profileActions}>
                    {isSubscribed && subscriptionStatus !== "unsubscribed" ? (
                      <button onClick={onCancelSubscription}>
                        Cancel subscription
                      </button>
                    ) : !isSubscribed ? (
                      <button onClick={onOpenBilling}>Upgrade</button>
                    ) : null}
                  </div>
                </div>
                <button
                  className={styles.sidebar__profileSignout}
                  onClick={onSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
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
          <button className={styles.sidebar__navItem} disabled>
            <SidebarIcon name="folder" />
            Saved Projects
          </button>
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
        <p className={styles.sidebar__eyebrow}>Platforms</p>
        <nav className={styles.sidebar__nav}>
          <button className={styles.sidebar__navItem} disabled>
            <SidebarIcon name="play" />
            TikTok Rules
          </button>
          <button className={styles.sidebar__navItem} disabled>
            <SidebarIcon name="camera" />
            Instagram Rules
          </button>
        </nav>
      </div>

      <div className={styles.sidebar__divider} />

      <div className={styles.sidebar__section}>
        <p className={styles.sidebar__eyebrow}>Settings</p>
        <nav className={styles.sidebar__nav}>
          <button className={styles.sidebar__navItem} onClick={onOpenSettings}>
            <SidebarIcon name="settings" />
            Settings
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
            {isSubscribed
              ? "500 images/month • Unlimited prompts"
              : "3 images/month • Limited prompts"}
          </div>
          <div className={styles.sidebar__planCredits}>
            {isSubscribed
              ? remainingCredits !== undefined && totalCredits !== undefined
                ? `${remainingCredits}/${totalCredits} credits`
                : "--/-- credits"
              : remainingCredits !== undefined
              ? `${remainingCredits}/3 credits`
              : "3 credits"}
          </div>
        </div>
        {!isSubscribed && onOpenBilling && (
          <button
            className={styles.sidebar__upgradeBtn}
            onClick={onOpenBilling}
          >
            Upgrade
          </button>
        )}
      </div>

      <div className={styles.sidebar__footerSection}>
        <Footer />
      </div>
    </div>
  );
};

export default Sidebar;
