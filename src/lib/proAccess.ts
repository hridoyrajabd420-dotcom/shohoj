import { UserSubscription, UserProfile, SubscriptionPlan, SubscriptionStatus } from '../types';
import { User } from '@supabase/supabase-js';

export interface ProAccessResult {
  /** Is the user currently authenticated? */
  isAuthenticated: boolean;
  /** Is the user on Free plan? In all-free mode, all features are unrestricted */
  isFreePlan: boolean;
  /** Legacy flag: always true for authenticated users so no feature is blocked */
  isProPlan: boolean;
  /** Legacy flag: always true for authenticated users so no feature is blocked */
  isProActive: boolean;
  /** Legacy flag: never expired */
  hasExpired: boolean;
  /** Legacy flag: never pending */
  isPending: boolean;
  /** Legacy flag: never inactive if authenticated */
  isInactive: boolean;
  /** Effective plan */
  effectivePlan: SubscriptionPlan;
  /** Status string */
  status: SubscriptionStatus;
  /** Expiration date string or null */
  expiresAt: string | null;
  /** Started ISO date string or null */
  startedAt: string | null;
  /** Days remaining before expiration, or null */
  daysRemaining: number | null;
}

/**
 * Evaluates user access.
 * In Shohoj Bebsha ALL-FREE mode, every authenticated user gets full access to all features!
 * No Pro lock, no subscriptions, no payment requirement.
 */
export function evaluateProAccess(
  user: User | null,
  _profile?: UserProfile | null,
  _subscription?: UserSubscription | null
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

  // All features are 100% free for all authenticated users
  return {
    isAuthenticated: true,
    isFreePlan: true,
    isProPlan: true,
    isProActive: true,
    hasExpired: false,
    isPending: false,
    isInactive: false,
    effectivePlan: 'free',
    status: 'active',
    expiresAt: null,
    startedAt: null,
    daysRemaining: null,
  };
}
