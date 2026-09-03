import { getCollections, getProducts, SITE_URL } from '../src/lib/data';

export const revalidate = 3600;

export default async function sitemap() {
  const [collections, products] = await Promise.all([
    getCollections(),
    getProducts(),
  ]);

  const now = new Date().toISOString();

  // Static routes
  const staticRoutes = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic collection routes
  const collectionRoutes = collections.map((col) => ({
    url: `${SITE_URL}/collections/${col.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic product routes
  const productRoutes = products.map((prod) => ({
    url: `${SITE_URL}/products/${prod.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
