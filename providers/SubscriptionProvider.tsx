import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { useUsage } from "../hooks/useUsage";
import type { UseUsageReturn } from "../hooks/useUsage";

const SubscriptionContext = createContext<UseUsageReturn | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { session, authStatus } = useAuth();
  const userId = session?.user?.id;
  const usageValue = useUsage(userId, authStatus);

  useEffect(() => {
    if (authStatus === "signed_in" && userId) {
      usageValue.refreshSubscription(userId);
      usageValue.refreshUsage(userId);
      usageValue.refreshHasGeneratedFreeImage(userId);
    }
  }, [
    authStatus,
    userId,
    usageValue.refreshSubscription,
    usageValue.refreshUsage,
    usageValue.refreshHasGeneratedFreeImage,
  ]);

  return (
    <SubscriptionContext.Provider value={usageValue}>
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
