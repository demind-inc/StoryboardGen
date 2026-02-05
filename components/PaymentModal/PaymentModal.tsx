import React, { useState } from "react";
import { SubscriptionPlan } from "../../types";
import { trackSubscriptionInitiated } from "../../lib/analytics";
import { useCreateCheckoutSession } from "../../hooks/useSubscriptionApi";
import { InlineSpinner } from "../Spinner/InlineSpinner";
import styles from "./PaymentModal.module.scss";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: SubscriptionPlan;
  paymentUrls?: Partial<Record<SubscriptionPlan, string>>;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
  userId?: string;
}

const plans = [
  {
    plan: "basic" as SubscriptionPlan,
    badge: "BASIC",
    title: "For trying the\nworkflow",
    price: "$15/mo",
    credits: "90 credits / month",
    note: "1 credit = 1 image. Credits\nreset monthly.",
    bullets: ["90 images each month", "Email support"],
  },
  {
    plan: "pro" as SubscriptionPlan,
    badge: "PRO",
    title: "For weekly\nstorytellers",
    price: "$29/mo",
    credits: "180 credits / month",
    note: "1 credit = 1 image. Credits\nreset monthly.",
    bullets: ["180 images each month", "Email support"],
  },
  {
    plan: "business" as SubscriptionPlan,
    badge: "BUSINESS",
    title: "For teams and\nvolume",
    price: "$79/mo",
    credits: "600 credits / month",
    note: "1 credit = 1 image. Credits\nreset monthly.",
    bullets: ["600 images each month", "Email support"],
  },
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planType,
  paymentUrls,
  onPlanSelect,
  userId,
}) => {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const createCheckout = useCreateCheckoutSession({
    onError: (error) => {
      console.error("Failed to create checkout session:", error);
      alert(`Failed to start checkout: ${error.message}`);
      setLoadingPlan(null);
    },
  });

  if (!isOpen) return null;

  const handlePlanClick = async (plan: SubscriptionPlan) => {
    onPlanSelect?.(plan);
    trackSubscriptionInitiated(plan);

    if (userId) {
      setLoadingPlan(plan);
      try {
        const { url } = await createCheckout.mutateAsync({ userId, plan });
        if (url) {
          window.location.href = url;
        }
      } catch {
        setLoadingPlan(null);
      }
    } else {
      const planUrl = paymentUrls?.[plan];
      if (planUrl) {
        window.location.href = planUrl;
      }
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles["payment-modal__backdrop"]}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={handleBackdropClick}
    >
      <div className={styles["payment-modal"]}>
        <button
          className={styles["payment-modal__close"]}
          aria-label="Close payment modal"
          onClick={onClose}
        >
          ×
        </button>
        <h3 id="payment-modal-title" className={styles["payment-modal__title"]}>
          Upgrade your plan
        </h3>
        <p className={styles["payment-modal__lead"]}>
          Choose the plan that fits your workflow. Cancel anytime.
        </p>
        <div className={styles["payment-modal__plans"]}>
          {plans.map((planOption) => {
            const isSelected = planType === planOption.plan;
            const planLabel =
              planOption.badge.charAt(0) +
              planOption.badge.slice(1).toLowerCase();
            return (
              <div
                key={planOption.plan}
                className={`${styles["payment-modal__plan-card"]} ${
                  isSelected ? styles["is-selected"] : ""
                }`}
              >
                <div className={styles["payment-modal__plan-pill"]}>
                  {planOption.badge}
                </div>
                <p className={styles["payment-modal__plan-title"]}>
                  {planOption.title.split("\n").map((line, index) => (
                    <span
                      key={`${planOption.plan}-title-${index}`}
                      className={styles["payment-modal__plan-line"]}
                    >
                      {line}
                    </span>
                  ))}
                </p>
                <p className={styles["payment-modal__plan-price"]}>
                  {planOption.price}
                </p>
                <p className={styles["payment-modal__plan-credits"]}>
                  {planOption.credits}
                </p>
                <p className={styles["payment-modal__plan-note"]}>
                  {planOption.note.split("\n").map((line, index) => (
                    <span
                      key={`${planOption.plan}-note-${index}`}
                      className={styles["payment-modal__plan-line"]}
                    >
                      {line}
                    </span>
                  ))}
                </p>
                <ul className={styles["payment-modal__plan-bullets"]}>
                  {planOption.bullets.map((bullet) => (
                    <li key={`${planOption.plan}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
                {(() => {
                  const isLoading = loadingPlan === planOption.plan;
                  const planUrl = paymentUrls?.[planOption.plan];

                  if (userId) {
                    // Use new Checkout Session API
                    return (
                      <button
                        className={styles["payment-modal__plan-button"]}
                        onClick={() => handlePlanClick(planOption.plan)}
                        disabled={isLoading}
                      >
                        {isLoading ? <InlineSpinner /> : `Choose ${planLabel}`}
                      </button>
                    );
                  } else if (planUrl) {
                    // Fallback to static payment URLs
                    return (
                      <a
                        className={styles["payment-modal__plan-button"]}
                        href={planUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          onPlanSelect?.(planOption.plan);
                        }}
                      >
                        Choose {planLabel}
                      </a>
                    );
                  } else {
                    return (
                      <div className={styles["payment-modal__plan-error"]}>
                        Link not configured
                      </div>
                    );
                  }
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
