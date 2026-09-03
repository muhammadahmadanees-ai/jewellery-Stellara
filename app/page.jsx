import { permanentRedirect } from 'next/navigation';
import {
  getCollections,
  getProductBySlugOrId,
  getCollectionBySlug,
  getWebPageSchema,
  getFAQSchema,
  SITE_URL,
} from '../src/lib/data';
import HomePageClient from '../src/components/HomePageClient';

export const revalidate = 3600; // ISR: revalidate at most once per hour

export const metadata = {
  title: 'Stellara | Artificial Jewellery & China Gold Jewellery Online',
  description:
    'Shop Stellara – your destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings and rings.',
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: 'Stellara | Artificial Jewellery & China Gold Jewellery Online',
    description:
      'Shop Stellara – your destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings and rings.',
    url: `${SITE_URL}/`,
    siteName: 'Stellara',
    images: [
      {
        url: `${SITE_URL}/hero.png`,
        width: 1200,
        height: 630,
        alt: 'Stellara – Artificial & China Gold Jewellery',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default async function Page({ searchParams }) {
  const sp = await searchParams;

  // 0c Priority Fix: Server-side permanent redirect for legacy query parameters
  if (sp?.product) {
    const prod = await getProductBySlugOrId(sp.product);
    if (prod) {
      permanentRedirect(`/products/${prod.slug}`);
    }
  }

  if (sp?.collection) {
    const col = await getCollectionBySlug(sp.collection);
    if (col) {
      permanentRedirect(`/collections/${col.slug}`);
    }
  }

  const collections = await getCollections();

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      getWebPageSchema({
        title: 'Stellara | Artificial Jewellery & China Gold Jewellery Online',
        description:
          'Shop Stellara – your destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings and rings.',
        url: `${SITE_URL}/`,
        primaryImage: `${SITE_URL}/hero.png`,
      }),
      getFAQSchema(),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomePageClient initialCollections={collections} />
    </>
  );
}
