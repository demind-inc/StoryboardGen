import type { SubscriptionPlan } from "../types";

export interface CheckoutResponse {
  url: string;
}

export interface SyncSubscriptionResponse {
  success: true;
  subscription: {
    plan_type?: SubscriptionPlan | null;
    [key: string]: unknown;
  };
}

export interface CancelSubscriptionResponse {
  success: true;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ApiErrorResponse;
    throw new Error(err.error || "Request failed");
  }
  return data as T;
}

export async function createCheckoutSession(
  userId: string,
  plan: SubscriptionPlan
): Promise<CheckoutResponse> {
  const res = await fetch("/api/subscription/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, plan }),
  });
  return handleResponse<CheckoutResponse>(res);
}

export async function syncSubscription(
  sessionId: string,
  userId: string
): Promise<SyncSubscriptionResponse> {
  const res = await fetch("/api/subscription/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId }),
  });
  return handleResponse<SyncSubscriptionResponse>(res);
}

export async function cancelSubscription(
  userId: string
): Promise<CancelSubscriptionResponse> {
  const res = await fetch("/api/subscription/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return handleResponse<CancelSubscriptionResponse>(res);
}
