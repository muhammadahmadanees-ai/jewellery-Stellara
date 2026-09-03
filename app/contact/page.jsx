import Link from 'next/link';
import { getWebPageSchema, getBreadcrumbSchema, SITE_URL } from '../../src/lib/data';
import Navbar from '../../src/components/Navbar';
import Contact from '../../src/components/Contact';
import Footer from '../../src/components/Footer';
import CartDrawer from '../../src/components/CartDrawer';
import ScrollToTop from '../../src/components/ScrollToTop';
import WhatsAppButton from '../../src/components/WhatsAppButton';

export const revalidate = 86400;

export const metadata = {
  title: 'Contact Us | Stellara Jewellery',
  description:
    'Have questions or need assistance? Reach out to Stellara Jewellery via WhatsApp (+92 316 4934759), email, or our contact form.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact Us | Stellara Jewellery',
    description: 'Get in touch with Stellara customer support for inquiries, orders, and customizations.',
    url: `${SITE_URL}/contact`,
    siteName: 'Stellara',
    images: [{ url: `${SITE_URL}/hero.png`, width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Contact', url: `${SITE_URL}/contact` },
  ];

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      getWebPageSchema({
        title: 'Contact Us | Stellara Jewellery',
        description: 'Contact Stellara customer support for inquiries, orders, and customizations.',
        url: `${SITE_URL}/contact`,
        type: 'ContactPage',
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
              <li style={{ color: '#1a1a1c', fontWeight: '600' }}>Contact Us</li>
            </ol>
          </nav>
        </div>

        <Contact />
      </main>

      <Footer />
      <CartDrawer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
}
