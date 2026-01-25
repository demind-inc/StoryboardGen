import React, { useEffect, useRef, useState } from "react";
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

const Sidebar: React.FC<SidebarProps> = ({
  mode,
  onModeChange,
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
      <div className={styles["sidebar__header"]}>
        <div className="brand brand--compact">
          <div className="brand__icon">
            <img
              src="/assets/images/logo.png"
              alt="StoryboardGen Logo"
              className="brand__icon-image"
            />
          </div>
          <div className="brand__text">
            <p className="brand__eyebrow">Workspace</p>
            <h3 className="brand__title">StoryboardGen</h3>
          </div>
        </div>
        <div className={styles["sidebar__header-actions"]}>
          <div className={styles["sidebar__profile"]} ref={accountMenuRef}>
            <button
              className={styles["sidebar__profile-btn"]}
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              title="Account"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
            {isAccountMenuOpen && (
              <div className={styles["sidebar__profile-menu"]}>
                <div className={styles["sidebar__profile-email"]}>
                  {displayEmail}
                </div>
                <div className={styles["sidebar__profile-sub"]}>
                  <p className={styles["sidebar__profile-label"]}>
                    {subscriptionLabel ||
                      (isSubscribed ? "Subscribed" : "Free")}
                  </p>
                  <p className={styles["sidebar__profile-meta"]}>
                    {isSubscribed
                      ? subscriptionPrice || "Active"
                      : "3 credits included"}
                  </p>
                  {isSubscribed && expiredAt && (
                    <p
                      className={styles["sidebar__profile-meta"]}
                      style={{ fontSize: "0.75rem", color: "#ff6b6b" }}
                    >
                      Expired: {formatDate(expiredAt)}
                    </p>
                  )}
                  {isSubscribed && unsubscribedAt && (
                    <p
                      className={styles["sidebar__profile-meta"]}
                      style={{ fontSize: "0.75rem", color: "#ffa500" }}
                    >
                      Unsubscribed: {formatDate(unsubscribedAt)}
                    </p>
                  )}
                  <div className={styles["sidebar__profile-actions"]}>
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
                  className={styles["sidebar__profile-signout"]}
                  onClick={onSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles["sidebar__section"]}>
        <nav className={styles["sidebar__nav"]}>
          <button
            className={`${styles["sidebar__nav-item"]} ${
              activePanel === "manual" ? styles["is-active"] : ""
            }`}
            onClick={() => {
              onPanelChange("manual");
              router.push("/dashboard");
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ marginRight: "8px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </button>
        </nav>
      </div>

      <div className={styles["sidebar__section"]}>
        <p className={styles["sidebar__eyebrow"]}>Saved</p>
        <nav className={styles["sidebar__nav"]}>
          <button
            className={`${styles["sidebar__nav-item"]} ${
              activePanel === "saved" ? styles["is-active"] : ""
            }`}
            onClick={() => {
              onPanelChange("saved");
              router.push("/saved/image");
            }}
          >
            Images
          </button>
        </nav>
      </div>

      <div className={styles["sidebar__footer"]}>
        <div className={styles["sidebar__plan-info"]}>
          <div className={styles["sidebar__plan-row"]}>
            <span className={styles["sidebar__plan-label"]}>Plan</span>
            <span className={styles["sidebar__plan-value"]}>
              {isSubscribed && planType ? planType.toUpperCase() : "Free"}
            </span>
          </div>
          <div className={styles["sidebar__plan-row"]}>
            <span className={styles["sidebar__plan-label"]}>Credits</span>
            <span className={styles["sidebar__plan-value"]}>
              {isSubscribed
                ? remainingCredits !== undefined && totalCredits !== undefined
                  ? `${remainingCredits}/${totalCredits}`
                  : "--/--"
                : remainingCredits !== undefined
                ? `${remainingCredits}/3`
                : "3"}
            </span>
          </div>
        </div>
        {!isSubscribed && onOpenBilling && (
          <button
            className={styles["sidebar__upgrade-btn"]}
            onClick={onOpenBilling}
          >
            Upgrade
          </button>
        )}
      </div>

      <div className={styles["sidebar__footer-section"]}>
        <Footer />
      </div>
    </div>
  );
};

export default Sidebar;
