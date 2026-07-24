import './globals.css';
import { CartProvider } from '../src/components/CartContext';

export const metadata = {
  metadataBase: new URL('https://www.jewellerystellara.com'),
  title: {
    default: 'Stellara | Artificial Jewellery & China Gold Jewellery Online | jewellerystellara.com',
    // Note: domain shown in title for brand recognition in SERPs
    template: '%s | Stellara Jewellery',
  },
  description:
    'Shop Stellara – your #1 destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings & rings. Premium quality at affordable prices.',
  keywords: [
    'artificial jewellery',
    'china gold jewellery',
    'stellara',
    'jewellery stellara',
    'stellara jewellery',
    'imitation jewellery',
    'fashion jewellery',
    'artificial necklace',
    'artificial earrings',
    'artificial rings',
    'gold plated jewellery',
    'china jewellery online',
    'artificial jewellery online',
    'cheap artificial jewellery',
    'latest artificial jewellery',
    'bridal artificial jewellery',
    'artificial jewellery set',
    'online jewellery store',
    'buy jewellery online',
    'affordable gold jewellery',
  ],
  authors: [{ name: 'Stellara', url: 'https://www.jewellerystellara.com' }],
  creator: 'Stellara',
  publisher: 'Stellara',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.jewellerystellara.com',
  },
  openGraph: {
    title: 'Stellara | Artificial Jewellery & China Gold Jewellery Online',
    description:
      'Shop Stellara – your #1 destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings & rings.',
    url: 'https://www.jewellerystellara.com',
    siteName: 'Stellara Jewellery',
    images: [
      {
        url: 'https://www.jewellerystellara.com/hero.png',
        width: 1200,
        height: 630,
        alt: 'Stellara – Artificial & China Gold Jewellery',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stellara | Artificial Jewellery & China Gold Jewellery Online',
    description:
      'Shop Stellara – your #1 destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings & rings.',
    images: ['/hero.png'],
    creator: '@stellara',
  },
  category: 'shopping',
};

// JSON-LD Structured Data for Google Rich Results
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.jewellerystellara.com/#organization',
      name: 'Stellara Jewellery',
      url: 'https://www.jewellerystellara.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.jewellerystellara.com/logo.png',
      },
      description:
        'Stellara is a premium online store for artificial jewellery, China gold jewellery, and imitation jewellery sets.',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.jewellerystellara.com/#website',
      url: 'https://www.jewellerystellara.com',
      name: 'Stellara Jewellery',
      description:
        'Shop artificial jewellery, China gold jewellery, necklaces, earrings & rings at Stellara.',
      publisher: { '@id': 'https://www.jewellerystellara.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.jewellerystellara.com/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Store',
      '@id': 'https://www.jewellerystellara.com/#store',
      name: 'Stellara Jewellery',
      url: 'https://www.jewellerystellara.com',
      description:
        'Buy artificial jewellery & China gold jewellery online. Explore necklaces, earrings, rings and jewellery sets at Stellara.',
      image: 'https://www.jewellerystellara.com/hero.png',
      priceRange: '$$',
      currenciesAccepted: 'PKR',
      paymentAccepted: 'Cash, Credit Card, Bank Transfer',
      hasMap: '',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.cdnfonts.com/css/blanka" rel="stylesheet" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
