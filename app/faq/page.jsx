import Link from 'next/link';
import { getFAQSchema, getWebPageSchema, getBreadcrumbSchema, SITE_URL } from '../../src/lib/data';
import Navbar from '../../src/components/Navbar';
import FAQ from '../../src/components/FAQ';
import Footer from '../../src/components/Footer';
import CartDrawer from '../../src/components/CartDrawer';
import ScrollToTop from '../../src/components/ScrollToTop';
import WhatsAppButton from '../../src/components/WhatsAppButton';

export const revalidate = 86400;

export const metadata = {
  title: 'Frequently Asked Questions (FAQ) | Stellara Jewellery',
  description:
    'Got questions about delivery, China gold care, returns, or order tracking? Read our FAQ for quick answers about Stellara Jewellery.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'FAQ | Stellara Jewellery',
    description: 'Frequently Asked Questions about orders, delivery, care, and returns.',
    url: `${SITE_URL}/faq`,
    siteName: 'Stellara',
    images: [{ url: `${SITE_URL}/hero.png`, width: 1200, height: 630 }],
  },
};

export default function FAQPage() {
  const breadcrumbs = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'FAQ', url: `${SITE_URL}/faq` },
  ];

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      getWebPageSchema({
        title: 'FAQ | Stellara Jewellery',
        description: 'Frequently Asked Questions about orders, delivery, care, and returns.',
        url: `${SITE_URL}/faq`,
      }),
      getFAQSchema(),
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

      <main style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: '60px' }}>
        <div className="container">
          <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
            <ol style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#666' }}>
              <li>
                <Link href="/" style={{ color: 'var(--brand-gold)', textDecoration: 'none' }}>
                  <i className="fas fa-home" style={{ marginRight: '4px' }}></i> Home
                </Link>
              </li>
              <li>/</li>
              <li style={{ color: '#1a1a1c', fontWeight: '600' }}>FAQ</li>
            </ol>
          </nav>
        </div>

        <FAQ />
      </main>

      <Footer />
      <CartDrawer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
}
