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

  // 4. If user entered only the 20-character project ref
  if (/^[a-z0-9]{20}$/i.test(clean)) {
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

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  // Check env vars first, then localStorage overrides
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  const rawUrl = localUrl || envUrl;
  const rawKey = localKey || envKey;

  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = normalizeSupabaseKey(rawKey);

  // Self-heal localStorage if the saved values had quotes or extra paths
  if (typeof window !== 'undefined') {
    if (localUrl && localUrl !== url) {
      localStorage.setItem(STORAGE_URL_KEY, url);
    }
    if (localKey && localKey !== anonKey) {
      localStorage.setItem(STORAGE_ANON_KEY, anonKey);
    }
  }

  // Basic check to see if it's not empty and not the placeholder
  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project.supabase.co') &&
    !anonKey.includes('your-anon-key') &&
    (url.startsWith('https://') || url.startsWith('http://localhost')) &&
    anonKey.length >= 20
  );

  return { url, anonKey, isConfigured };
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
