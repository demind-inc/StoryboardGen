import { useQuery } from "@tanstack/react-query";
import { getSubscription } from "../services/subscriptionService";
import { queryKeys } from "../lib/queryKeys";
import { normalizeUuid } from "../lib/uuid";

export function useSubscriptionQuery(userId: string | undefined) {
  const normalizedUserId = normalizeUuid(userId);
  console.log("normalizedUserId", normalizedUserId);
  return useQuery({
    queryKey: queryKeys.subscription.byUser(normalizedUserId),
    queryFn: () => getSubscription(normalizedUserId!),
    enabled: !!normalizedUserId,
  });
}
