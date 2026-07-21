/**
 * imageHelper.js
 * Utility to parse and build product image data.
 * 
 * Supports two formats for the product `img` field:
 * 1. Plain URL string (legacy): "https://...image.jpg"
 * 2. JSON string (new): '{"images":["url1","url2"],"colors":{"Black":"url1","White":"url2"}}'
 */

// Common jewelry color name → hex code mapping
const COLOR_HEX_MAP = {
  'black': '#1a1a1a',
  'white': '#f5f5f5',
  'silver': '#c0c0c0',
  'gold': '#d4a847',
  'rose gold': '#b76e79',
  'rosegold': '#b76e79',
  'champagne': '#f7e7ce',
  'red': '#c0392b',
  'blue': '#2c3e8c',
  'navy': '#1b2a4a',
  'green': '#2d6a4f',
  'pink': '#e8a0bf',
  'purple': '#7b2d8e',
  'brown': '#6d4c41',
  'grey': '#9e9e9e',
  'gray': '#9e9e9e',
  'beige': '#d4c5a9',
  'ivory': '#fffff0',
  'pearl': '#eae0c8',
  'platinum': '#e5e4e2',
  'copper': '#b87333',
  'bronze': '#cd7f32',
  'burgundy': '#800020',
  'maroon': '#800000',
  'teal': '#008080',
  'coral': '#ff7f50',
  'turquoise': '#40e0d0',
  'yellow': '#f1c40f',
  'orange': '#e67e22',
  'mint': '#98ff98',
  'lavender': '#e6e6fa',
  'cream': '#fffdd0',
  'charcoal': '#36454f',
  'midnight': '#191970',
  'olive': '#808000',
  'rust': '#b7410e',
  'tan': '#d2b48c',
  'peach': '#ffcba4',
  'magenta': '#ff00ff',
  'wine': '#722f37',
  'slate': '#708090',
  'sand': '#c2b280',
  'emerald': '#50c878',
  'sapphire': '#0f52ba',
  'ruby': '#e0115f',
  'diamond': '#b9f2ff',
  'onyx': '#353839',
  'amber': '#ffbf00',
  'crystal clear': '#e8f4f8',
  'crystalclear': '#e8f4f8',
};

/**
 * Parse the product img field into a structured object.
 * @param {string} imgField - The raw img field value from the database.
 * @returns {{ images: string[], colors: Object<string, string>, colorStock: Object<string, number>, defaultImg: string }}
 */
export function parseProductImages(imgField) {
  if (!imgField) {
    return { images: [], colors: {}, colorStock: {}, defaultImg: '' };
  }

  // Try parsing as JSON
  if (imgField.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(imgField);
      const images = parsed.images || [];
      const colors = parsed.colors || {};
      const colorStock = parsed.colorStock || {};
      const defaultImg = images[0] || Object.values(colors)[0] || '';
      return { images, colors, colorStock, defaultImg };
    } catch (e) {
      // Not valid JSON, treat as plain URL
    }
  }

  // Plain URL string (legacy format)
  return {
    images: [imgField],
    colors: {},
    colorStock: {},
    defaultImg: imgField
  };
}

/**
 * Build the img field value from images array, colors map, and color stock map.
 * If there are no colors/stock and only one image, returns the plain URL (backward compatible).
 * @param {string[]} images - Array of image URLs.
 * @param {Object<string, string>} colors - Map of color name → image URL.
 * @param {Object<string, number>} colorStock - Map of color name → stock count.
 * @returns {string}
 */
export function buildProductImgField(images, colors, colorStock) {
  const filteredImages = images.filter(Boolean);
  const hasColors = Object.keys(colors).length > 0;
  const hasColorStock = Object.keys(colorStock || {}).length > 0;

  // If single image and no colors and no color stock, return plain URL for backward compatibility
  if (filteredImages.length <= 1 && !hasColors && !hasColorStock) {
    return filteredImages[0] || '';
  }

  return JSON.stringify({ images: filteredImages, colors, colorStock: colorStock || {} });
}

/**
 * Get the hex code for a color name.
 * Falls back to a hash-based color if not in the lookup table.
 * @param {string} colorName
 * @returns {string} hex color code
 */
export function getColorHex(colorName) {
  if (!colorName) return '#ccc';
  const lower = colorName.toLowerCase().trim();
  if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];

  // Generate a consistent color from the name using a simple hash
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 55%)`;
}

/**
 * Check if a color is very light (needs a visible border).
 * @param {string} colorName
 * @returns {boolean}
 */
export function isLightColor(colorName) {
  const light = ['white', 'ivory', 'cream', 'pearl', 'beige', 'champagne', 'sand', 'mint', 'lavender', 'peach', 'diamond', 'crystal clear', 'crystalclear'];
  return light.includes((colorName || '').toLowerCase().trim());
}

/**
 * Automatically deduct overall stock and color variant stock for a product.
 * @param {Object} supabase - Supabase client instance
 * @param {Object} product - Product object
 * @param {number} qtyToDeduct - Quantity ordered
 * @param {string} selectedColor - Selected color variant name (optional)
 */
export async function deductProductStock(supabase, product, qtyToDeduct, selectedColor) {
  if (!product || !product.id || !qtyToDeduct || qtyToDeduct <= 0) return;

  const updates = {};
  const qty = Number(qtyToDeduct) || 1;

  // 1. Deduct overall stock if set
  if (product.stock !== null && product.stock !== undefined) {
    updates.stock = Math.max(0, Number(product.stock) - qty);
  }

  // 2. Parse img field to inspect and deduct color variant stock
  const parsedImg = parseProductImages(product.img);
  const colorStock = { ...(parsedImg.colorStock || {}) };

  // Resolve color name (handles strings like "Color: Red" or "Red")
  let colorName = (selectedColor || '').trim();
  if (colorName.toLowerCase().startsWith('color:')) {
    colorName = colorName.replace(/color:/i, '').trim();
  }

  let colorStockUpdated = false;
  if (colorName && Object.keys(colorStock).length > 0) {
    const matchingKey = Object.keys(colorStock).find(k => k.toLowerCase().trim() === colorName.toLowerCase().trim());
    if (matchingKey && colorStock[matchingKey] !== undefined) {
      const currentVariantStock = Number(colorStock[matchingKey]) || 0;
      colorStock[matchingKey] = Math.max(0, currentVariantStock - qty);
      colorStockUpdated = true;
    }
  }

  if (colorStockUpdated) {
    updates.img = buildProductImgField(parsedImg.images, parsedImg.colors, colorStock);
  }

  if (Object.keys(updates).length > 0) {
    try {
      const { error } = await supabase.from('products').update(updates).eq('id', product.id);
      if (error) {
        console.warn(`[deductProductStock] Error updating stock for product ${product.id}:`, error);
      }
    } catch (e) {
      console.warn(`[deductProductStock] Exception updating stock:`, e);
    }
  }
}
