import './globals.css';
import { CartProvider } from '../src/components/CartContext';

export const metadata = {
  title: 'Stellara Jewellery | Stellar Elegance, Starry Nights',
  description: 'Discover premium, handcrafted diamonds and precious gemstones by Stellara Jewellery, capturing the essence of light and luxury.',
  keywords: 'Stellara Jewellery, luxury jewellery, handcrafted diamonds, gold necklaces, starry nights collection, premium rings',
  openGraph: {
    title: 'Stellara Jewellery | Stellar Elegance, Starry Nights',
    description: 'Discover premium, handcrafted diamonds and precious gemstones by Stellara Jewellery, capturing the essence of light and luxury.',
    type: 'website',
  }
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
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
