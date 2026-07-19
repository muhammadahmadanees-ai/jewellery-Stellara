import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In-memory cache to make loading collections and products instant
const cache = {
  collections: null,
  products: {},
  allProductsById: {},
  isPrefetching: false,
  prefetchPromise: null
};

export const getCollectionsCache = () => cache.collections;
export const getProductsCache = (id) => cache.products[id];
export const getProductByIdFromCache = (id) => cache.allProductsById[id];
export const getAllProductsFromCache = () => {
  const all = [];
  Object.keys(cache.products).forEach(colId => {
    all.push(...cache.products[colId]);
  });
  return all.length > 0 ? all : null;
};

export const prefetchData = async () => {
  if (cache.prefetchPromise) return cache.prefetchPromise;

  cache.isPrefetching = true;
  cache.prefetchPromise = (async () => {
    try {
      const [colsRes, prodsRes] = await Promise.all([
        supabase.from('collections').select('*').order('order'),
        supabase.from('client_products').select('*').order('order')
      ]);

      if (colsRes.data) {
        cache.collections = colsRes.data;
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
      }
    } catch (e) {
      console.warn("Background prefetch failed", e);
    } finally {
      cache.isPrefetching = false;
    }
  })();

  return cache.prefetchPromise;
};

export const fetchCollectionsCached = async () => {
  if (cache.collections) return cache.collections;
  await prefetchData();
  if (cache.collections) return cache.collections;
  const { data, error } = await supabase.from('collections').select('*').order('order');
  if (error) throw error;
  cache.collections = data;
  return data;
};

export const fetchProductsCached = async (collectionId) => {
  if (cache.products[collectionId]) return cache.products[collectionId];
  await prefetchData();
  if (cache.products[collectionId]) return cache.products[collectionId];
  const { data, error } = await supabase.from('client_products').select('*').eq('collection_id', collectionId).order('order');
  if (error) throw error;
  cache.products[collectionId] = data;
  return data;
};
