/**
 * SHOPNEX Supabase Configuration
 * Stores central database and shared storage keys for multi-visitor sync.
 *
 * NOTE: Only the PUBLIC ANON KEY belongs here.
 * NEVER put service_role / private keys in client-side code!
 */

const STORAGE_KEYS = {
  SUPABASE_URL: 'shopnex_supabase_url',
  SUPABASE_ANON_KEY: 'shopnex_supabase_anon_key',
  STORAGE_BUCKET: 'shopnex_storage_bucket'
};

// Default project configuration (can be updated here or in Admin Settings UI)
export const DEFAULT_SUPABASE_CONFIG = {
  // Enter your Supabase Project URL, e.g. "https://abcdefghijklmnopqrst.supabase.co"
  url: "https://your-project.supabase.co",
  // Enter your Supabase anon (public) key
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key",
  // Storage bucket name for product audio files
  storageBucket: "product-music"
};

export function getSupabaseConfig() {
  const localUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  const localBucket = localStorage.getItem(STORAGE_KEYS.STORAGE_BUCKET);

  const url = (localUrl && localUrl.trim()) || DEFAULT_SUPABASE_CONFIG.url;
  const anonKey = (localKey && localKey.trim()) || DEFAULT_SUPABASE_CONFIG.anonKey;
  const storageBucket = (localBucket && localBucket.trim()) || DEFAULT_SUPABASE_CONFIG.storageBucket;

  const isConfigured =
    url &&
    url.startsWith('https://') &&
    !url.includes('your-project.supabase.co') &&
    anonKey &&
    !anonKey.includes('your-anon-key') &&
    anonKey.length > 20;

  return {
    url,
    anonKey,
    storageBucket,
    isConfigured
  };
}

export function saveSupabaseConfig({ url, anonKey, storageBucket }) {
  if (url) localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  if (anonKey) localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
  if (storageBucket) localStorage.setItem(STORAGE_KEYS.STORAGE_BUCKET, storageBucket.trim());
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  localStorage.removeItem(STORAGE_KEYS.STORAGE_BUCKET);
}
