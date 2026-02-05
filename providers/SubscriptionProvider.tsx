import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import { useUsage } from "../hooks/useUsage";
import type { UseUsageReturn } from "../hooks/useUsage";
import { trackButtonClick } from "../lib/analytics";
import { normalizeUuid } from "../lib/uuid";

const SubscriptionContext = createContext<UseUsageReturn | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { session, authStatus } = useAuth();
  const userId = normalizeUuid(session?.user?.id);
  const usageValue = useUsage(userId, authStatus);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const openPaymentModal = useCallback(() => {
    trackButtonClick("open_payment_modal");
    setIsPaymentModalOpen(true);
  }, []);

  const value = useMemo<UseUsageReturn>(
    () => ({
      ...usageValue,
      isPaymentModalOpen,
      setIsPaymentModalOpen,
      openPaymentModal,
    }),
    [usageValue, isPaymentModalOpen, openPaymentModal]
  );

  useEffect(() => {
    if (authStatus === "signed_in" && userId) {
      usageValue.refreshHasGeneratedFreeImage(userId);
    }
  }, [authStatus, userId, usageValue.refreshHasGeneratedFreeImage]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): UseUsageReturn => {
  const value = useContext(SubscriptionContext);
  if (value == null) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return value;
};
