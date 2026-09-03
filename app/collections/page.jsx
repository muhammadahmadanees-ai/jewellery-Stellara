import Link from 'next/link';
import { getCollections, getWebPageSchema, getBreadcrumbSchema, SITE_URL } from '../../src/lib/data';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/Footer';
import CartDrawer from '../../src/components/CartDrawer';
import ScrollToTop from '../../src/components/ScrollToTop';
import WhatsAppButton from '../../src/components/WhatsAppButton';

export const revalidate = 3600;

export const metadata = {
  title: 'Jewellery Collections | Artificial & China Gold Sets',
  description:
    'Explore Stellara’s complete catalogue of artificial jewellery collections: Zircon Pendant Sets, Zircon Pendants, and Zircon Earrings in radiant China gold.',
  alternates: {
    canonical: `${SITE_URL}/collections`,
  },
  openGraph: {
    title: 'Jewellery Collections | Stellara Jewellery',
    description:
      'Explore Stellara’s complete catalogue of artificial jewellery collections in radiant China gold.',
    url: `${SITE_URL}/collections`,
    siteName: 'Stellara',
    images: [{ url: `${SITE_URL}/hero.png`, width: 1200, height: 630 }],
  },
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  const breadcrumbs = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Collections', url: `${SITE_URL}/collections` },
  ];

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      getWebPageSchema({
        title: 'Jewellery Collections | Stellara',
        description: 'Explore Stellara’s complete catalogue of artificial jewellery collections.',
        url: `${SITE_URL}/collections`,
        type: 'CollectionPage',
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
          <nav aria-label="Breadcrumb" style={{ marginBottom: '2rem' }}>
            <ol style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#666' }}>
              <li>
                <Link href="/" style={{ color: 'var(--brand-gold)', textDecoration: 'none' }}>
                  <i className="fas fa-home" style={{ marginRight: '4px' }}></i> Home
                </Link>
              </li>
              <li>/</li>
              <li style={{ color: '#1a1a1c', fontWeight: '600' }}>Collections</li>
            </ol>
          </nav>

          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1c' }}>
              Our Jewellery Collections
            </h1>
            <p style={{ maxWidth: '650px', margin: '0 auto', color: '#666', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Discover our signature designs crafted in radiant China gold and shimmering fire zircons. Every collection is curated for timeless elegance and everyday luxury.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid #f0ebe3',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '280px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#faf8f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                        padding: '1.5rem',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                  ) : (
                    <i className="fas fa-layer-group fa-4x" style={{ color: '#ccc' }}></i>
                  )}
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: 'var(--brand-gold)',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Collection
                  </span>
                  <h2
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      marginBottom: '0.6rem',
                      color: '#1a1a1c',
                    }}
                  >
                    {col.name}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: '#666',
                      lineHeight: '1.5',
                      marginBottom: '1.2rem',
                      flexGrow: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {col.desc}
                  </p>
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#8B1A1A',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Explore Products &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
}
