// src/lib/recentlyViewed.js

const STORAGE_KEY = 'stellara_recently_viewed';
const MAX_ITEMS = 10;

export function getRecentlyViewed() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading recently viewed:', e);
    return [];
  }
}

export function recordRecentlyViewed(product) {
  if (typeof window === 'undefined' || !product) return;
  try {
    const id = product.id;
    if (!id) return;

    // Extract best direct image URL
    let img = '';
    if (product.defaultImg) {
      img = product.defaultImg;
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      img = product.images[0];
    } else if (typeof product.img === 'string') {
      const trimmed = product.img.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          img = (parsed.images && parsed.images[0]) || '';
        } catch (_) {
          img = product.img;
        }
      } else {
        img = product.img;
      }
    }

    const item = {
      id: String(product.id),
      name: product.name || 'Jewellery Item',
      slug: product.slug || '',
      img: img || '',
      price: product.price || 0,
      discount_price: product.discountPrice || product.discount_price || 0,
    };

    const current = getRecentlyViewed();
    // Remove if already exists so we re-insert at the head
    const filtered = current.filter(
      (p) => String(p.id) !== String(item.id) && (!item.slug || p.slug !== item.slug)
    );
    const updated = [item, ...filtered].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('recentlyViewedUpdated'));
  } catch (e) {
    console.error('Error recording recently viewed:', e);
  }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('recentlyViewedUpdated'));
  } catch (e) {
    console.error('Error clearing recently viewed:', e);
  }
}
