import './globals.css';
import { CartProvider } from '../src/components/CartContext';
import { getOrganizationSchema, getWebSiteSchema } from '../src/lib/data';

export const metadata = {
  metadataBase: new URL('https://www.jewellerystellara.com'),
  title: {
    default: 'Stellara | Artificial Jewellery & China Gold Jewellery Online',
    template: '%s | Stellara Jewellery',
  },
  description:
    'Shop Stellara – your destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings and rings.',
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
      'Shop Stellara – your destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings and rings.',
    url: 'https://www.jewellerystellara.com',
    siteName: 'Stellara',
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
      'Shop Stellara – your destination for artificial jewellery, China gold jewellery, imitation jewellery sets, necklaces, earrings and rings.',
    images: ['/hero.png'],
    creator: '@jewellerystellara',
  },
  category: 'shopping',
};

// Sitewide JSON-LD (@graph containing Organization and WebSite)
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    getOrganizationSchema(),
    getWebSiteSchema(),
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
        {/* Sitewide JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
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
