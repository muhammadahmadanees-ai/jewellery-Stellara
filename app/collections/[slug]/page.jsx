import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getCollections,
  getCollectionBySlug,
  getProducts,
  getWebPageSchema,
  getBreadcrumbSchema,
  SITE_URL,
} from '../../../src/lib/data';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import CartDrawer from '../../../src/components/CartDrawer';
import ScrollToTop from '../../../src/components/ScrollToTop';
import WhatsAppButton from '../../../src/components/WhatsAppButton';
import CollectionProductsGrid from '../../../src/components/CollectionProductsGrid';

export const revalidate = 3600;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found | Stellara',
    };
  }

  const canonicalUrl = `${SITE_URL}/collections/${collection.slug}`;
  const title = `${collection.name} | Artificial & China Gold Jewellery | Stellara`;
  const description =
    collection.desc ||
    `Shop our ${collection.name} collection at Stellara. Premium artificial & China gold jewellery with unmatched craftsmanship.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Stellara',
      images: [
        {
          url: collection.img || `${SITE_URL}/hero.png`,
          width: 1200,
          height: 630,
          alt: collection.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [collection.img || '/hero.png'],
    },
  };
}

export default async function CollectionDetailPage({ params }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const [allCollections, products] = await Promise.all([
    getCollections(),
    getProducts(collection.id),
  ]);

  const otherCollections = allCollections.filter((c) => c.id !== collection.id);

  const canonicalUrl = `${SITE_URL}/collections/${collection.slug}`;
  const breadcrumbs = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Collections', url: `${SITE_URL}/collections` },
    { name: collection.name, url: canonicalUrl },
  ];

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      getWebPageSchema({
        title: `${collection.name} | Stellara`,
        description: collection.desc,
        url: canonicalUrl,
        type: 'CollectionPage',
        primaryImage: collection.img || null,
      }),
      getBreadcrumbSchema(breadcrumbs),
    ],
  };

  return (
    <div className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <Navbar />

      <main style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Visual Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
            <ol style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#666', flexWrap: 'wrap' }}>
              <li>
                <Link href="/" style={{ color: 'var(--brand-gold)', textDecoration: 'none' }}>
                  <i className="fas fa-home" style={{ marginRight: '4px' }}></i> Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/collections" style={{ color: 'var(--brand-gold)', textDecoration: 'none' }}>
                  Collections
                </Link>
              </li>
              <li>/</li>
              <li style={{ color: '#1a1a1c', fontWeight: '600' }}>{collection.name}</li>
            </ol>
          </nav>

          {/* Collection Header Banner */}
          <div
            style={{
              padding: '2.5rem 2rem',
              background: 'linear-gradient(135deg, #faf8f5 0%, #f4ede2 100%)',
              borderRadius: '16px',
              border: '1px solid #ebdccb',
              marginBottom: '2.5rem',
            }}
          >
            <div style={{ maxWidth: '800px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: '#8B1A1A',
                  fontWeight: '700',
                  display: 'inline-block',
                  marginBottom: '0.5rem',
                }}
              >
                Collection
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.4rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  color: '#1a1a1c',
                  lineHeight: '1.2',
                }}
              >
                {collection.name}
              </h1>
              <p
                style={{
                  color: '#555',
                  fontSize: '1.05rem',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                {collection.desc}
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#888', fontWeight: '500' }}>
                Showing {products.length} design{products.length !== 1 ? 's' : ''} in China gold & fire zircon
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <CollectionProductsGrid products={products} />

          {/* Explore Other Collections */}
          {otherCollections.length > 0 && (
            <div
              style={{
                borderTop: '1px solid #e8e0d5',
                marginTop: '5rem',
                paddingTop: '3rem',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p
                  style={{
                    color: '#8B1A1A',
                    fontSize: '0.8rem',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                  }}
                >
                  Discover More
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    margin: 0,
                    color: 'var(--text-color)',
                  }}
                >
                  Explore Other Collections
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {otherCollections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/collections/${col.slug}`}
                    style={{
                      textDecoration: 'none',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#fff',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: '1px solid #f0ebe3',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.25s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
                        background: '#f9f6f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {col.img ? (
                        <img
                          src={col.img}
                          alt={col.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '1rem',
                          }}
                        />
                      ) : (
                        <i className="fas fa-gem" style={{ fontSize: '2rem', color: '#ccc' }}></i>
                      )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          color: 'var(--text-color)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {col.name}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#8B1A1A', fontWeight: '600' }}>
                        View Collection &rarr;
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
}
