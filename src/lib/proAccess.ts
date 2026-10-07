import { UserSubscription, UserProfile, SubscriptionPlan, SubscriptionStatus } from '../types';
import { User } from '@supabase/supabase-js';

export interface ProAccessResult {
  /** Is the user currently authenticated? */
  isAuthenticated: boolean;
  /** Is the user currently treated as being on the Free plan (either by plan or because Pro expired)? */
  isFreePlan: boolean;
  /** Did the user sign up for / acquire the Pro plan? */
  isProPlan: boolean;
  /** Is the Pro subscription currently valid and active (not expired, status = active)? */
  isProActive: boolean;
  /** Has the Pro subscription expired? */
  hasExpired: boolean;
  /** Is the subscription status pending verification? */
  isPending: boolean;
  /** Is the subscription inactive? */
  isInactive: boolean;
  /** Resolved active plan (defaults to 'free' if expired) */
  effectivePlan: SubscriptionPlan;
  /** Status string */
  status: SubscriptionStatus;
  /** Raw expiration ISO date string or null */
  expiresAt: string | null;
  /** Started ISO date string or null */
  startedAt: string | null;
  /** Days remaining before expiration, or null */
  daysRemaining: number | null;
}

/**
 * Evaluates whether a user has active Pro access.
 * Expired Pro subscriptions automatically evaluate as Free.
 */
export function evaluateProAccess(
  user: User | null,
  profile: UserProfile | null,
  subscription: UserSubscription | null
): ProAccessResult {
  if (!user) {
    return {
      isAuthenticated: false,
      isFreePlan: true,
      isProPlan: false,
      isProActive: false,
      hasExpired: false,
      isPending: false,
      isInactive: true,
      effectivePlan: 'free',
      status: 'inactive',
      expiresAt: null,
      startedAt: null,
      daysRemaining: null,
    };
  }

  // Resolve plan
  const subPlan = (subscription?.plan || '').toString().toLowerCase();
  const profPlan = (profile?.plan || '').toString().toLowerCase();
  const resolvedPlan: SubscriptionPlan =
    subPlan === 'pro' || profPlan === 'pro' ? 'pro' : 'free';

  // Resolve status
  const subStatus = (subscription?.status || '').toString().toLowerCase();
  const profStatus = (profile?.subscription_status || '').toString().toLowerCase();
  let resolvedStatus: SubscriptionStatus = 'active';

  if (subStatus === 'pending' || profStatus === 'pending') {
    resolvedStatus = 'pending';
  } else if (subStatus === 'inactive' || profStatus === 'inactive') {
    resolvedStatus = 'inactive';
  } else if (subStatus === 'expired' || profStatus === 'expired') {
    resolvedStatus = 'expired';
  }

  // Resolve expiration date
  const expiresAt =
    subscription?.expires_at || profile?.subscription_expires_at || null;
  const startedAt =
    subscription?.started_at || subscription?.created_at || profile?.created_at || null;

  let hasExpired = resolvedStatus === 'expired';
  let daysRemaining: number | null = null;

  if (expiresAt) {
    const expDate = new Date(expiresAt);
    const now = new Date();
    if (!isNaN(expDate.getTime())) {
      const diffMs = expDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (diffMs <= 0) {
        hasExpired = true;
        resolvedStatus = 'expired';
      }
    }
  }

  const isProPlan = resolvedPlan === 'pro';

  // Strict Pro access: Must be pro plan, status active, and not expired
  const isProActive = isProPlan && resolvedStatus === 'active' && !hasExpired;

  // If expired or not active pro, behaves as Free
  const isFreePlan = !isProActive;
  const effectivePlan: SubscriptionPlan = isProActive ? 'pro' : 'free';

  return {
    isAuthenticated: true,
    isFreePlan,
    isProPlan,
    isProActive,
    hasExpired,
    isPending: resolvedStatus === 'pending',
    isInactive: resolvedStatus === 'inactive' || hasExpired,
    effectivePlan,
    status: resolvedStatus,
    expiresAt,
    startedAt,
    daysRemaining,
  };
}
