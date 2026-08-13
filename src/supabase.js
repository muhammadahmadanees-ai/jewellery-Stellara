import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Persistent localStorage cache ──────────────────────────────────────────
// Data is cached in localStorage so repeat visitors don't re-download anything.
// TTL: 30 minutes for products/collections, 10 minutes for best sellers.
const CACHE_KEY_COLLECTIONS  = 'stellara_cache_collections';
const CACHE_KEY_PRODUCTS     = 'stellara_cache_products';
const CACHE_KEY_BESTSELLERS  = 'stellara_cache_bestsellers';
const TTL_MAIN   = 30 * 60 * 1000;  // 30 min
const TTL_BEST   = 10 * 60 * 1000;  // 10 min

function lsGet(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts, ttl } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function lsSet(key, data, ttl) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now(), ttl })); } catch {}
}

// ─── In-memory cache (for instant reads within same page session) ────────────
const cache = {
  collections: null,
  products: {},
  allProductsById: {},
  isPrefetching: false,
  prefetchPromise: null
};

export const getCollectionsCache  = () => cache.collections;
export const getProductsCache     = (id) => cache.products[id];
export const getProductByIdFromCache = (id) => cache.allProductsById[id];
export const getAllProductsFromCache = () => {
  const all = [];
  Object.keys(cache.products).forEach(colId => all.push(...cache.products[colId]));
  return all.length > 0 ? all : null;
};

// ─── Best Sellers ─────────────────────────────────────────────────────────────
export const fetchBestSellers = async () => {
  // 1. Check localStorage cache first (avoids a DB round-trip for 10 min)
  const cached = lsGet(CACHE_KEY_BESTSELLERS);
  if (cached) return cached;

  // 2. Fetch from the pre-aggregated DB view
  const { data, error } = await supabase.from('best_seller_products').select('*');
  if (error) throw error;

  lsSet(CACHE_KEY_BESTSELLERS, data, TTL_BEST);
  return data;
};

// ─── Prefetch all collections + products ────────────────────────────────────
export const prefetchData = async () => {
  if (cache.prefetchPromise) return cache.prefetchPromise;

  // If we already have valid data in localStorage, hydrate memory and return
  const lsCols  = lsGet(CACHE_KEY_COLLECTIONS);
  const lsProds = lsGet(CACHE_KEY_PRODUCTS);
  if (lsCols && lsProds) {
    cache.collections = lsCols;
    // Re-hydrate grouped + byId maps
    lsProds.forEach(prod => {
      const colId = prod.collection_id;
      if (colId) {
        if (!cache.products[colId]) cache.products[colId] = [];
        cache.products[colId].push(prod);
      }
      cache.allProductsById[prod.id] = prod;
    });
    return Promise.resolve();
  }

  cache.isPrefetching = true;
  cache.prefetchPromise = (async () => {
    try {
      const [colsRes, prodsRes] = await Promise.all([
        supabase.from('collections').select('*').order('order'),
        supabase.from('client_products').select('*').order('order')
      ]);

      if (colsRes.data) {
        cache.collections = colsRes.data;
        lsSet(CACHE_KEY_COLLECTIONS, colsRes.data, TTL_MAIN);
      }

      if (prodsRes.data) {
        const grouped = {};
        const byId = {};
        prodsRes.data.forEach(prod => {
          const colId = prod.collection_id;
          if (colId) {
            if (!grouped[colId]) grouped[colId] = [];
            grouped[colId].push(prod);
          }
          byId[prod.id] = prod;
        });
        cache.products = grouped;
        cache.allProductsById = byId;
        // Store flat array in localStorage
        lsSet(CACHE_KEY_PRODUCTS, prodsRes.data, TTL_MAIN);
      }
    } catch (e) {
      console.warn('Background prefetch failed', e);
    } finally {
      cache.isPrefetching = false;
    }
  })();

  return cache.prefetchPromise;
};

// ─── Cached fetchers ─────────────────────────────────────────────────────────
export const fetchCollectionsCached = async () => {
  if (cache.collections) return cache.collections;
  await prefetchData();
  if (cache.collections) return cache.collections;
  const { data, error } = await supabase.from('collections').select('*').order('order');
  if (error) throw error;
  cache.collections = data;
  lsSet(CACHE_KEY_COLLECTIONS, data, TTL_MAIN);
  return data;
};

export const fetchProductsCached = async (collectionId) => {
  if (cache.products[collectionId]) return cache.products[collectionId];
  await prefetchData();
  if (cache.products[collectionId]) return cache.products[collectionId];
  const { data, error } = await supabase
    .from('client_products').select('*')
    .eq('collection_id', collectionId).order('order');
  if (error) throw error;
  cache.products[collectionId] = data;
  return data;
};
