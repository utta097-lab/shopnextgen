/**
 * SHOPNEX Supabase Central Service
 * Handles Shared Database Queries, Shared Storage (Music Uploads), and Real Admin Authentication.
 */

import { getSupabaseConfig } from '../config/supabaseConfig.js';

let supabaseClient = null;
let supabaseModulePromise = null;

/**
 * Lazily loads the Supabase client from ESM CDN
 */
async function loadSupabaseModule() {
  if (!supabaseModulePromise) {
    supabaseModulePromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(mod => mod.createClient)
      .catch(err => {
        console.error('Failed to load Supabase SDK from CDN:', err);
        supabaseModulePromise = null;
        throw err;
      });
  }
  return supabaseModulePromise;
}

/**
 * Initializes and caches the Supabase client
 */
export async function getSupabase() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (supabaseClient && supabaseClient.__configUrl === config.url && supabaseClient.__configKey === config.anonKey) {
    return supabaseClient;
  }

  try {
    const createClient = await loadSupabaseModule();
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'shopnex_admin_auth_v1'
      }
    });
    supabaseClient.__configUrl = config.url;
    supabaseClient.__configKey = config.anonKey;
    return supabaseClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}

/**
 * Resets cached client instance (e.g. after config changes)
 */
export function resetSupabaseClient() {
  supabaseClient = null;
}

/**
 * Tests connection to Supabase database
 */
export async function testConnection() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      connected: false,
      message: 'Supabase credentials not yet configured. Please enter your Project URL and Anon Key in Admin Settings.'
    };
  }

  try {
    const sb = await getSupabase();
    if (!sb) {
      return { connected: false, message: 'Could not initialize Supabase SDK.' };
    }

    const { data, error, count } = await sb
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        error: error.message,
        message: `Database connection error: ${error.message} (Tip: Did you run supabase_schema.sql in your Supabase SQL Editor?)`
      };
    }

    return {
      connected: true,
      count: count || 0,
      message: `Connected successfully to Supabase! Found ${count || 0} products in database.`
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      message: `Connection failed: ${err.message}`
    };
  }
}

/**
 * Maps database row (snake_case) to client product object (camelCase)
 */
function mapRowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price !== null ? Number(row.price) : null,
    originalPrice: row.original_price !== null ? Number(row.original_price) : null,
    discount: row.discount !== null ? Number(row.discount) : null,
    image: row.image || row.thumbnail || '',
    images: Array.isArray(row.images) ? row.images : (row.image ? [row.image] : []),
    thumbnail: row.thumbnail || row.image || '',
    // Shared Central Product Music URL
    musicUrl: row.music_url || row.audio || null,
    audio: row.music_url || row.audio || null,
    song: row.music_url || row.audio || null,
    video: row.video || null,
    shortDescription: row.short_description || '',
    description: row.description || '',
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewCount: row.review_count !== null ? Number(row.review_count) : null,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    specifications: typeof row.specifications === 'object' && row.specifications ? row.specifications : {},
    availability: row.availability !== false,
    featured: !!row.featured,
    badge: row.badge || row.category || 'SHOWCASE'
  };
}

/**
 * Maps client product object (camelCase) to database row (snake_case)
 */
function mapProductToRow(prod) {
  const music = prod.musicUrl || prod.audio || prod.song || null;
  return {
    id: prod.id,
    name: prod.name,
    category: prod.category,
    price: prod.price !== null && prod.price !== undefined ? Number(prod.price) : null,
    original_price: prod.originalPrice !== null && prod.originalPrice !== undefined ? Number(prod.originalPrice) : null,
    discount: prod.discount !== null && prod.discount !== undefined ? Number(prod.discount) : null,
    image: prod.image || prod.thumbnail || '',
    images: Array.isArray(prod.images) ? prod.images : (prod.image ? [prod.image] : []),
    thumbnail: prod.thumbnail || prod.image || '',
    music_url: music,
    audio: music,
    video: prod.video || null,
    short_description: prod.shortDescription || '',
    description: prod.description || '',
    rating: prod.rating !== null && prod.rating !== undefined ? Number(prod.rating) : 5.0,
    review_count: prod.reviewCount !== null && prod.reviewCount !== undefined ? Number(prod.reviewCount) : null,
    highlights: Array.isArray(prod.highlights) ? prod.highlights : [],
    specifications: prod.specifications || {},
    availability: prod.availability !== false,
    featured: !!prod.featured,
    badge: prod.badge || prod.category || 'SHOWCASE',
    updated_at: new Date().toISOString()
  };
}

// ============================================================================
// 1. PRODUCTS DATABASE OPERATIONS (SHARED ACROSS ALL VISITORS)
// ============================================================================

/**
 * Fetch all products from central Supabase database
 */
export async function fetchRemoteProducts() {
  const sb = await getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return null;
    }

    if (!Array.isArray(data)) return [];
    return data.map(mapRowToProduct);
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
    return null;
  }
}

/**
 * Save or update a product in central Supabase database
 */
export async function saveRemoteProduct(productData) {
  const sb = await getSupabase();
  if (!sb) {
    throw new Error('Supabase is not configured. Please configure your Project URL and Key in Admin Settings.');
  }

  const row = mapProductToRow(productData);

  const { data, error } = await sb
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('row-level security'))) {
      throw new Error('Permission Denied: Your account is not authorized as a SHOPNEX administrator. Database write access is restricted to verified admins in shopnex_admins.');
    }
    throw error;
  }

  return mapRowToProduct(data);
}

/**
 * Delete a product from central Supabase database
 */
export async function deleteRemoteProduct(productId) {
  const sb = await getSupabase();
  if (!sb) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await sb
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('row-level security'))) {
      throw new Error('Permission Denied: Your account is not authorized as a SHOPNEX administrator. Product deletion is restricted to verified admins in shopnex_admins.');
    }
    throw error;
  }

  return true;
}

/**
 * Seed or batch-sync base products to Supabase
 */
export async function syncBaseProductsToSupabase(baseProducts) {
  const sb = await getSupabase();
  if (!sb) {
    throw new Error('Supabase is not configured.');
  }

  const rows = baseProducts.map(mapProductToRow);

  const { data, error } = await sb
    .from('products')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('row-level security'))) {
      throw new Error('Permission Denied: Your account is not authorized as a SHOPNEX administrator. Database write access is restricted to verified admins in shopnex_admins.');
    }
    throw error;
  }

  return true;
}

// ============================================================================
// 2. SHARED ONLINE MUSIC STORAGE (SUPABASE STORAGE)
// ============================================================================

/**
 * Upload an audio file to shared Supabase Storage bucket ('product-music')
 * Returns the permanent public CDN URL accessible to every visitor worldwide.
 *
 * @param {File} file The selected audio file
 * @param {string} productId Target product identifier
 * @param {function} onProgress Progress callback (pct: number)
 * @returns {Promise<{ publicUrl: string, filePath: string, fileName: string }>}
 */
export async function uploadProductMusic(file, productId, onProgress = null) {
  const sb = await getSupabase();
  if (!sb) {
    throw new Error('Supabase is not configured. Please configure your Project URL and Key in Admin Settings.');
  }

  const config = getSupabaseConfig();
  const bucketName = config.storageBucket || 'product-music';

  // 1. Validate file format
  const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!validExtensions.includes(ext) && !file.type.startsWith('audio/')) {
    throw new Error(`Unsupported audio format (.${ext}). Supported formats: MP3, WAV, OGG, M4A.`);
  }

  // 2. Validate file size (50MB maximum)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 50MB.`);
  }

  if (typeof onProgress === 'function') onProgress(15);

  // 3. Create sanitized unique storage path: product-music/{productId}/{timestamp}_{cleanFilename}
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const filePath = `${productId || 'track'}/${timestamp}_${cleanName}`;

  if (typeof onProgress === 'function') onProgress(40);

  // 4. Upload to Supabase Storage
  const { data, error } = await sb.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'audio/mpeg'
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    // Provide user-friendly advice for common storage bucket setup issues
    if (error.message && error.message.toLowerCase().includes('bucket not found')) {
      throw new Error(`Storage bucket "${bucketName}" not found. Please run the SQL schema in supabase_schema.sql to create it.`);
    }
    if (
      (error.message && error.message.toLowerCase().includes('row-level security')) ||
      error.statusCode === 403 ||
      error.status === 403 ||
      error.error === 'Unauthorized'
    ) {
      throw new Error('Storage Permission Denied: Your account is not authorized as a SHOPNEX administrator. Music upload is restricted to verified admins in shopnex_admins.');
    }
    throw error;
  }

  if (typeof onProgress === 'function') onProgress(85);

  // 5. Retrieve permanent public URL
  const { data: urlData } = sb.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Failed to generate public URL for uploaded audio.');
  }

  if (typeof onProgress === 'function') onProgress(100);

  return {
    publicUrl: urlData.publicUrl,
    filePath,
    fileName: file.name,
    fileSize: file.size
  };
}

/**
 * Remove an audio file from shared Supabase Storage bucket
 */
export async function deleteProductMusic(musicUrl) {
  if (!musicUrl) return false;

  const sb = await getSupabase();
  if (!sb) return false;

  const config = getSupabaseConfig();
  const bucketName = config.storageBucket || 'product-music';

  try {
    // Extract file path from public URL if full URL was passed
    // URL format: .../storage/v1/object/public/product-music/folder/filename.mp3
    const bucketMarker = `/${bucketName}/`;
    let relativePath = musicUrl;
    if (musicUrl.includes(bucketMarker)) {
      relativePath = decodeURIComponent(musicUrl.split(bucketMarker)[1]);
    }

    if (relativePath) {
      const { data, error } = await sb.storage.from(bucketName).remove([relativePath]);
      if (error) {
        console.warn('Could not remove file from storage:', error);
        if (
          (error.message && error.message.toLowerCase().includes('row-level security')) ||
          error.statusCode === 403 ||
          error.status === 403
        ) {
          throw new Error('Storage Permission Denied: Only authorized SHOPNEX admins can delete music files.');
        }
        return false;
      }
      return true;
    }
  } catch (err) {
    console.warn('Could not remove file from storage:', err);
    throw err;
  }
  return false;
}

// ============================================================================
// 3. ADMIN AUTHENTICATION (SUPABASE AUTH & AUTHORIZATION)
// ============================================================================

/**
 * Real Admin Login with email & password via Supabase Auth
 */
export async function signInAdmin(email, password) {
  const sb = await getSupabase();
  if (!sb) {
    throw new Error('Supabase is not configured. Please enter your credentials in Admin Settings.');
  }

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Admin Sign Out
 */
export async function signOutAdmin() {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

/**
 * Get currently authenticated admin user
 */
export async function getAdminUser() {
  const sb = await getSupabase();
  if (!sb) return null;

  try {
    const { data: { session } } = await sb.auth.getSession();
    return session ? session.user : null;
  } catch (err) {
    return null;
  }
}

/**
 * Verifies if the currently authenticated user is an authorized SHOPNEX administrator
 * Checked securely against the server-side shopnex_admins table and is_admin() function.
 */
export async function checkIsAdmin() {
  const sb = await getSupabase();
  if (!sb) return false;

  try {
    const user = await getAdminUser();
    if (!user) return false;

    // 1. Try server-side RPC function check_is_admin()
    const { data: rpcIsAdmin, error: rpcErr } = await sb.rpc('check_is_admin');
    if (!rpcErr && typeof rpcIsAdmin === 'boolean') {
      return rpcIsAdmin;
    }

    // 2. Try is_admin() RPC
    const { data: isAdm, error: admErr } = await sb.rpc('is_admin');
    if (!admErr && typeof isAdm === 'boolean') {
      return isAdm;
    }

    // 3. Fallback query directly against shopnex_admins table using auth.uid()
    const { data, error } = await sb
      .from('shopnex_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }

    return false;
  } catch (err) {
    console.warn('Error checking admin authorization status:', err);
    return false;
  }
}

/**
 * Subscribe to Supabase Auth state changes
 */
export async function onAdminAuthStateChange(callback) {
  const sb = await getSupabase();
  if (!sb) return () => {};

  const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
    callback(event, session ? session.user : null);
  });

  return () => {
    subscription.unsubscribe();
  };
}
