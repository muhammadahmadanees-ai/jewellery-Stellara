"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchData } from '../supabase';
import Navbar from './Navbar';
import Hero from './Hero';
import Collections from './Collections';
import Contact from './Contact';
import FAQ from './FAQ';
import Footer from './Footer';

// Drawer & Modals
import MenuDrawer from './MenuDrawer';
import OrderModal from './OrderModal';
import SampleFormModal from './SampleFormModal';
import Lightbox from './Lightbox';
import SearchModal from './SearchModal';
import ScrollToTop from './ScrollToTop';
import WhatsAppButton from './WhatsAppButton';
import CartDrawer from './CartDrawer';

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function HomePageClient({ initialCollections = [] }) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSampleFormOpen, setIsSampleFormOpen] = useState(false);
  const [sampleProduct, setSampleProduct] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ── On mount: client-side safety net redirect for legacy query parameters ──
  useEffect(() => {
    prefetchData();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const collectionSlug = params.get('collection');
      const productId = params.get('product');

      if (productId) {
        router.replace(`/products/${productId}`);
        return;
      }
      if (collectionSlug) {
        router.replace(`/collections/${collectionSlug}`);
        return;
      }
    }

    const scrollToTarget = (selectorOrId) => {
      const target =
        document.querySelector(selectorOrId) ||
        document.getElementById(selectorOrId.replace(/^#/, ''));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    const rawHash = window.location.hash;
    if (rawHash) {
      const normalised = rawHash === '#collection' ? '#collections' : rawHash;
      [200, 500, 1000].forEach((delay) => setTimeout(() => scrollToTarget(normalised), delay));
    }

    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [router]);

  // Navigate to canonical product route
  const handleOpenProduct = (prod) => {
    if (!prod) return;
    const slug = prod.slug || slugify(prod.name) || prod.id;
    router.push(`/products/${slug}`);
  };

  // Navigate to canonical collection route
  const handleSelectCollection = (col) => {
    if (!col) return;
    const slug = col.slug || slugify(col.name) || col.id;
    router.push(`/collections/${slug}`);
  };

  const handleGoCollections = () => {
    const el = document.getElementById('collections');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push('/collections');
    }
  };

  return (
    <div className="home-page">
      <main>
        <Navbar
          onOrderSamples={() => setIsOrderModalOpen(true)}
          onToggleDrawer={() => setIsDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onGoCollections={handleGoCollections}
        />

        <MenuDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSelectCollection={handleSelectCollection}
          onOpenProduct={handleOpenProduct}
        />

        <div>
          <Hero />
          <Collections
            initialCollections={initialCollections}
            onSelectCollection={handleSelectCollection}
            onOpenProduct={handleOpenProduct}
          />
        </div>

        <FAQ />
        <Contact />
        <Footer />

        {/* Cart Drawer */}
        <CartDrawer />

        {/* Modals */}
        {isOrderModalOpen && (
          <OrderModal
            onClose={() => setIsOrderModalOpen(false)}
            onOpenSampleForm={() => {
              setIsOrderModalOpen(false);
              setSampleProduct(null);
              setIsSampleFormOpen(true);
            }}
          />
        )}

        {isSampleFormOpen && (
          <SampleFormModal
            onClose={() => setIsSampleFormOpen(false)}
            initialProduct={sampleProduct}
          />
        )}

        {isSearchOpen && (
          <SearchModal
            onClose={() => setIsSearchOpen(false)}
            onOpenProduct={handleOpenProduct}
          />
        )}

        {lightboxImg && (
          <Lightbox
            img={lightboxImg}
            images={lightboxImages}
            onClose={() => {
              setLightboxImg(null);
              setLightboxImages([]);
            }}
          />
        )}
        <ScrollToTop />
        <WhatsAppButton />
      </main>
    </div>
  );
}
