import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getProducts,
  getProductBySlugOrId,
  getProductSchema,
  getWebPageSchema,
  getBreadcrumbSchema,
  SITE_URL,
} from '../../../src/lib/data';
import Navbar from '../../../src/components/Navbar';
import Footer from '../../../src/components/Footer';
import CartDrawer from '../../../src/components/CartDrawer';
import ProductDetailClient from '../../../src/components/ProductDetailClient';

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Stellara Jewellery',
    };
  }

  const canonicalUrl = `${SITE_URL}/products/${product.slug}`;
  const title = `${product.name} | China Gold & Zircon Jewellery | Stellara`;
  const description =
    product.desc
      ? product.desc.slice(0, 160).replace(/\n/g, ' ')
      : `Buy ${product.name} crafted in China gold with premium zircons from Stellara Jewellery. Price: Rs. ${product.price}.`;

  const primaryImg = product.defaultImg || (product.images && product.images[0]) || `${SITE_URL}/hero.png`;

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
          url: primaryImg,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImg],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);

  if (!product) {
    notFound();
  }

  // Fetch other products in same collection for related items
  const allCollectionProducts = await getProducts(product.collectionId);
  const relatedProducts = allCollectionProducts.filter((p) => p.id !== product.id);

  const canonicalUrl = `${SITE_URL}/products/${product.slug}`;
  const collectionUrl = product.collectionSlug
    ? `${SITE_URL}/collections/${product.collectionSlug}`
    : `${SITE_URL}/collections`;

  const breadcrumbs = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Collections', url: `${SITE_URL}/collections` },
    ...(product.collectionName
      ? [{ name: product.collectionName, url: collectionUrl }]
      : []),
    { name: product.name, url: canonicalUrl },
  ];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      getProductSchema(product),
      getWebPageSchema({
        title: `${product.name} | Stellara Jewellery`,
        description: product.desc,
        url: canonicalUrl,
        type: 'ItemPage',
        primaryImage: product.defaultImg || null,
      }),
      getBreadcrumbSchema(breadcrumbs),
    ],
  };

  return (
    <div className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Navbar />

      <main style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Visual Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '2rem' }}>
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
              {product.collectionName && (
                <>
                  <li>/</li>
                  <li>
                    <Link
                      href={`/collections/${product.collectionSlug}`}
                      style={{ color: 'var(--brand-gold)', textDecoration: 'none' }}
                    >
                      {product.collectionName}
                    </Link>
                  </li>
                </>
              )}
              <li>/</li>
              <li style={{ color: '#1a1a1c', fontWeight: '600' }}>{product.name}</li>
            </ol>
          </nav>

          <ProductDetailClient product={product} relatedProducts={relatedProducts} />
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
