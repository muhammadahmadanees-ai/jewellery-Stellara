import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demctbygmsrlycyaewwy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_NCrXwL1vhQGlPmrHPGXkNg_djSg9V_i';

// Server / build-time Supabase client
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const SITE_URL = 'https://www.jewellerystellara.com';

// ── Slugify Helper ─────────────────────────────────────────────────────────────
export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ── Image Parser ───────────────────────────────────────────────────────────────
export function parseProductImages(imgField) {
  if (!imgField) {
    return { images: [], colors: {}, colorStock: {}, defaultImg: '' };
  }
  if (typeof imgField === 'string' && imgField.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(imgField);
      const images = parsed.images || [];
      const colors = parsed.colors || {};
      const colorStock = parsed.colorStock || {};
      const defaultImg = images[0] || Object.values(colors)[0] || '';
      return { images, colors, colorStock, defaultImg };
    } catch {
      // fallback
    }
  }
  return {
    images: [imgField],
    colors: {},
    colorStock: {},
    defaultImg: imgField,
  };
}

// ── Collections Fetcher ────────────────────────────────────────────────────────
export async function getCollections() {
  try {
    const { data, error } = await supabaseServer
      .from('collections')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      return [];
    }

    return (data || []).map((col) => {
      const slug = slugify(col.name || col.title || 'unnamed');
      return {
        id: col.id,
        slug,
        name: col.name || col.title || 'Unnamed',
        desc: col.description || col.desc || '',
        img: col.img || col.imageurl || col.image || '',
        parentId: col.parent_id || col.parentId || '',
        type: col.type || 'collection',
        order: col.order !== undefined ? Number(col.order) : 0,
      };
    });
  } catch (err) {
    console.error('Exception fetching collections:', err);
    return [];
  }
}

export async function getCollectionBySlug(slug) {
  const collections = await getCollections();
  return (
    collections.find(
      (c) => c.slug === slug || c.id === slug || slugify(c.name) === slug
    ) || null
  );
}

// ── Products Fetcher ───────────────────────────────────────────────────────────
export async function getProducts(collectionId = null) {
  try {
    let query = supabaseServer.from('client_products').select('*').order('order', { ascending: true });
    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    const collections = await getCollections();
    const colMap = {};
    collections.forEach((c) => {
      colMap[c.id] = c;
    });

    return (data || []).map((prod) => {
      const col = colMap[prod.collection_id];
      const colName = col ? col.name : '';
      const colSlug = col ? col.slug : '';
      const slug = slugify(prod.name || 'product') || prod.id;
      const parsed = parseProductImages(prod.img);

      return {
        id: prod.id,
        slug,
        collectionId: prod.collection_id,
        collectionName: colName,
        collectionSlug: colSlug,
        name: prod.name || 'Unnamed Product',
        desc: prod.description || '',
        img: prod.img || '',
        parsedImg: parsed,
        defaultImg: parsed.defaultImg,
        images: parsed.images.length > 0 ? parsed.images : [parsed.defaultImg].filter(Boolean),
        colors: parsed.colors,
        colorStock: parsed.colorStock,
        sizes: prod.sizes || '',
        refcode: prod.refcode || '',
        price: Number(prod.price) || 0,
        discountPrice: prod.discount_price ? Number(prod.discount_price) : null,
        stock: prod.stock !== undefined ? prod.stock : null,
        showSizes: prod.show_sizes !== undefined ? prod.show_sizes : true,
        isBestseller: !!prod.is_bestseller,
        order: prod.order !== undefined ? Number(prod.order) : 0,
      };
    });
  } catch (err) {
    console.error('Exception fetching products:', err);
    return [];
  }
}

export async function getProductBySlugOrId(slugOrId) {
  const all = await getProducts();
  return (
    all.find(
      (p) =>
        p.slug === slugOrId ||
        p.id === slugOrId ||
        slugify(p.name) === slugOrId ||
        String(p.refcode || '').toLowerCase() === String(slugOrId).toLowerCase()
    ) || null
  );
}

export async function getBestSellers() {
  try {
    const { data, error } = await supabaseServer
      .from('best_seller_products')
      .select('*');

    if (error) {
      console.error('Error fetching best sellers view:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exception fetching best sellers:', err);
    return [];
  }
}

// ── Schema.org Generators ──────────────────────────────────────────────────────

/**
 * §3.1 Organization Schema
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Stellara',
    alternateName: 'Stellara Jewellery',
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 600,
      height: 600,
    },
    image: `${SITE_URL}/hero.png`,
    description:
      'Stellara is an online destination for artificial and China gold jewellery, offering rings, necklaces, and earrings crafted for everyday wear at a fraction of the cost of real gold.',
    email: 'jewellerystellara@gmail.com',
    telephone: '+923164934759',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+923164934759',
        contactType: 'customer service',
        email: 'jewellerystellara@gmail.com',
        areaServed: 'PK',
        availableLanguage: ['en', 'ur'],
      },
    ],
    sameAs: ['https://www.instagram.com/jewellerystellara'],
  };
}

/**
 * §3.2 WebSite Schema
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'Stellara',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    inLanguage: 'en-US',
  };
}

/**
 * §3.3 FAQPage Schema (Verbatim 8 Q&As)
 */
export function getFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does delivery take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Orders are delivered within 4 to 5 working days from the date of order confirmation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your return policy for breakage or defects?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If your jewellery arrives broken or with a manufacturing defect, you can request a return or exchange within 7 days of delivery. Please share clear photos or video of the issue along with your order details so it can be processed quickly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you accept returns for reasons other than breakage or defects?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Returns are only accepted in cases of breakage or defect within 7 days of delivery. Change-of-mind returns are not accepted.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is STELLARA jewellery made of?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Stellara pieces are crafted using China gold, known for its durability, shine, and affordability compared to real gold.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I take care of my jewellery?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Avoid applying perfume, lotion, or any chemical sprays directly on the jewellery, as this can affect its shine and coating over time. Apply perfume first, then wear your jewellery.',
        },
      },
      {
        '@type': 'Question',
        name: 'How should I clean and store my pieces?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Wipe gently with a soft, dry cloth after each use. Store in a dry place, ideally in a pouch or box, away from moisture and direct sunlight.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I exchange my order for a different design or size?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Exchanges are only applicable in case of breakage or defect within 7 days. For sizing concerns, contact the support team before ordering to confirm measurements.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I request a return or report a defect?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Contact Stellara within 7 days of delivery with the order number and photos or video of the issue, and the support team will guide you through the process.',
        },
      },
    ],
  };
}

/**
 * §3.4 BreadcrumbList Schema
 */
export function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * §3.5 Product Schema
 */
export function getProductSchema(product) {
  const productUrl = `${SITE_URL}/products/${product.slug}`;
  const effectivePrice = product.discountPrice || product.price;
  const inStock = product.stock === null || product.stock > 0;

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.defaultImg || `${SITE_URL}/hero.png`];

  const colorKeys = product.colors ? Object.keys(product.colors) : [];
  const primaryColor = colorKeys.length > 0 ? colorKeys[0] : null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    image: images,
    description:
      product.desc ||
      `Buy ${product.name} crafted in radiant China gold with premium zircon sparkle from Stellara Jewellery.`,
    sku: product.refcode || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Stellara',
    },
    material: 'China Gold',
    category: product.collectionName || 'Jewellery',
  };

  if (primaryColor) {
    schema.color = primaryColor;
    schema.additionalProperty = [
      {
        '@type': 'PropertyValue',
        name: 'Available Colors',
        value: colorKeys.join(', '),
      },
    ];
  }

  schema.offers = {
    '@type': 'Offer',
    url: productUrl,
    priceCurrency: 'PKR',
    price: String(effectivePrice),
    availability: inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: 'PKR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 4,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PK',
        returnPolicyCategory:
          'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        refundType: 'https://schema.org/ExchangeRefund',
      },
  };

  return schema;
}

/**
 * §3.7 WebPage Schema
 */
export function getWebPageSchema({ title, description, url, type = 'WebPage', primaryImage = null }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#${type.toLowerCase()}`,
    url: url,
    name: title,
    description: description,
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
    about: {
      '@id': `${SITE_URL}/#organization`,
    },
  };

  if (primaryImage) {
    schema.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: primaryImage,
      width: 1200,
      height: 630,
    };
  }

  return schema;
}
