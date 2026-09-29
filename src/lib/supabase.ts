import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'shohoj_bebsha_supabase_url';
const STORAGE_ANON_KEY = 'shohoj_bebsha_supabase_anon_key';

/**
 * Normalizes Supabase URL to prevent:
 * - Trailing slashes
 * - Manually appended /auth or /auth/v1 paths (which cause Kong 404: "Invalid path specified in request URL")
 * - Manually appended /rest or /rest/v1 paths
 * - Surrounding quotes or whitespace
 * - Dashboard URLs (e.g. supabase.com/dashboard/project/<ref>)
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  // 1. Remove zero-width characters and whitespace
  let clean = rawUrl.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  // 2. Strip surrounding quotes (double, single, backticks, typographical quotes)
  clean = clean.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '').trim();

  if (!clean) return '';

  // 3. Convert dashboard URLs to standard API URL: https://<ref>.supabase.co
  const dashboardMatch = clean.match(/(?:supabase\.com\/dashboard\/project|app\.supabase\.com\/project)\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // 4. If user entered only the project reference (e.g. 15-35 alphanum chars without dots or slashes)
  if (/^[a-z0-9_-]{15,35}$/i.test(clean) && !clean.includes('.') && !clean.includes('/')) {
    return `https://${clean}.supabase.co`;
  }

  // 5. Ensure protocol is present
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  // 6. Strip any trailing paths like /auth, /auth/v1, /rest, /rest/v1, or /
  try {
    const parsed = new URL(clean);
    // For standard Supabase cloud projects (*.supabase.co), base URL is strictly the origin
    if (parsed.hostname.endsWith('.supabase.co')) {
      return parsed.origin;
    }

    // For custom domains or self-hosted instances:
    let pathname = parsed.pathname.replace(/\/+$/, '');
    pathname = pathname.replace(/\/(auth|rest)(\/v1)?$/i, '');
    const result = `${parsed.origin}${pathname}`;
    return result.replace(/\/+$/, '');
  } catch {
    return clean.replace(/\/+$/, '').replace(/\/(auth|rest)(\/v1)?$/i, '');
  }
}

/**
 * Normalizes Supabase Anon / Publishable Key to remove:
 * - Surrounding quotes
 * - Accidental spaces, tabs, or newlines
 */
export function normalizeSupabaseKey(rawKey: string): string {
  if (!rawKey) return '';
  let clean = rawKey.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  clean = clean.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '').trim();
  clean = clean.replace(/\s+/g, '');
  return clean;
}

/**
 * Verifies if the provided URL and Anon Key meet valid Supabase requirements.
 */
export function isSupabaseConfigured(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return false;
  // Reject template placeholders
  if (url.includes('your-project') || url.includes('placeholder')) return false;
  if (anonKey.includes('your-anon-key') || anonKey.includes('placeholder')) return false;
  // Valid URL protocol
  if (!url.startsWith('https://') && !url.startsWith('http://')) return false;
  // Supabase anon keys are tokens of reasonable length
  if (anonKey.length < 10) return false;

  return true;
}

export interface SupabaseConfigInfo {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

/**
 * Reads Supabase credentials with strict prioritization:
 * 1. Vite client-side environment variables (import.meta.env.VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
 * 2. Fallback to localStorage (for local manual testing if env vars are missing)
 */
export function getSupabaseCredentials(): SupabaseConfigInfo {
  // 1. Vite client-side environment variables (Primary source of truth for Netlify & production builds)
  const envUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
  const envKey = normalizeSupabaseKey(import.meta.env.VITE_SUPABASE_ANON_KEY || '');

  if (isSupabaseConfigured(envUrl, envKey)) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  // 2. Secondary fallback: Local storage (for manual local development if env vars were not injected)
  const localUrl = typeof window !== 'undefined' ? normalizeSupabaseUrl(localStorage.getItem(STORAGE_URL_KEY) || '') : '';
  const localKey = typeof window !== 'undefined' ? normalizeSupabaseKey(localStorage.getItem(STORAGE_ANON_KEY) || '') : '';

  if (isSupabaseConfigured(localUrl, localKey)) {
    return {
      url: localUrl,
      anonKey: localKey,
      isConfigured: true,
      source: 'storage',
    };
  }

  // Neither is configured
  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
    isConfigured: false,
    source: 'none',
  };
}

export function saveSupabaseCredentials(rawUrl: string, rawKey: string) {
  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = normalizeSupabaseKey(rawKey);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url);
    localStorage.setItem(STORAGE_ANON_KEY, anonKey);
  }

  // Reset client instance so subsequent calls instantiate with the clean credentials
  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  }
  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance || currentUrl !== url || currentKey !== anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      });
      currentUrl = url;
      currentKey = anonKey;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Convenience Supabase client export
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    }
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
