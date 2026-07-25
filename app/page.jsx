"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase, prefetchData, getProductByIdFromCache, fetchCollectionsCached, fetchProductsCached } from '../src/supabase';
import Navbar from '../src/components/Navbar';
import Hero from '../src/components/Hero';
import Collections from '../src/components/Collections';
import ProductsView from '../src/components/ProductsView';
import Contact from '../src/components/Contact';
import FAQ from '../src/components/FAQ';
import Footer from '../src/components/Footer';

// Drawer & Modals
import MenuDrawer from '../src/components/MenuDrawer';
import ProductModal from '../src/components/ProductModal';
import OrderModal from '../src/components/OrderModal';
import SampleFormModal from '../src/components/SampleFormModal';
import Lightbox from '../src/components/Lightbox';
import SearchModal from '../src/components/SearchModal';
import ScrollToTop from '../src/components/ScrollToTop';
import WhatsAppButton from '../src/components/WhatsAppButton';
import CartDrawer from '../src/components/CartDrawer';

// ── URL helpers ──────────────────────────────────────────────────────────────
const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const updateURL = (collectionSlug, productId) => {
  const params = new URLSearchParams();
  if (collectionSlug) params.set('collection', collectionSlug);
  if (productId)      params.set('product', String(productId));
  const query = params.toString();
  window.history.pushState({}, '', query ? `?${query}` : window.location.pathname);
};
// ─────────────────────────────────────────────────────────────────────────────

const Home = () => {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSampleFormOpen, setIsSampleFormOpen] = useState(false);
  const [sampleProduct, setSampleProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Track whether the URL was set by us (to avoid double-updates)
  const isUrlNav = useRef(false);
  // Skip the very first run so we don't wipe the URL before the deep-link loader reads it
  const isMounted = useRef(false);

  // ── Sync URL when collection / product changes ───────────────────────────
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; } // skip first mount run
    if (isUrlNav.current) { isUrlNav.current = false; return; }
    const slug = selectedCollection ? slugify(selectedCollection.name) : null;
    updateURL(slug, selectedProduct ? selectedProduct.id : null);
  }, [selectedCollection, selectedProduct]);

  // ── On mount: read URL params and auto-navigate ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const collectionSlug = params.get('collection');
    const productId = params.get('product');

    if (!collectionSlug) return; // Nothing to do

    const loadFromUrl = async () => {
      try {
        const collections = await fetchCollectionsCached();
        const match = collections.find(c => slugify(c.name) === collectionSlug);
        if (!match) return;

        // Map raw DB row → collectionData shape
        const data = {};
        for (let key in match) {
          data[key.toLowerCase().replace(/[\s_]+/g, '')] = match[key];
        }
        const collectionData = {
          id: match.id,
          name: data.name || data.title || 'Unnamed',
          desc: data.description || data.desc || '',
          img: data.img || data.imageurl || data.imgurl || data.image || '',
          parentId: data.parentid || '',
          type: data.type || 'collection',
          order: data.order !== undefined ? Number(data.order) : 0,
        };

        isUrlNav.current = true;
        setSelectedCollection(collectionData);

        // If a product ID was also in the URL, open it
        if (productId) {
          const products = await fetchProductsCached(match.id);
          const prodRaw = products?.find(p => String(p.id) === String(productId));
          if (prodRaw) {
            const pd = {};
            for (let key in prodRaw) pd[key.toLowerCase().replace(/[\s_]+/g, '')] = prodRaw[key];
            const prod = {
              id: prodRaw.id,
              name: pd.name || pd.title || 'Unnamed',
              desc: pd.description || pd.desc || pd.detail || '',
              img: pd.imageurl || pd.imgurl || pd.image || pd.img || pd.pic || '',
              sizesImg: pd.sizesimageurl || pd.sizeimage || pd.sizesimage || pd.sizepic || '',
              sizes: pd.sizes || pd.size || pd.availablesizes || pd.available_sizes || '',
              refcode: pd.refcode || pd.referencecode || pd.code || pd.refercode || '',
              price: pd.price || pd.cost || '',
              discount_price: prodRaw.discount_price || null,
              stock: prodRaw.stock !== undefined ? prodRaw.stock : null,
              show_sizes: prodRaw.show_sizes !== undefined ? prodRaw.show_sizes : true,
              collection: collectionData.name,
            };
            // Small delay so ProductsView renders first
            setTimeout(() => setSelectedProduct(prod), 400);
          }
        }
      } catch (e) {
        console.warn('Deep-link navigation failed:', e);
      }
    };

    loadFromUrl();
  }, []); // Run only once on mount

  const handleOpenProduct = async (prod) => {
    let fullProd = prod;
    if (!prod.desc || !prod.refcode || prod.refcode === 'N/A') {
       const cached = getProductByIdFromCache(prod.id);
       if (cached) {
           fullProd = {
             id: cached.id,
             name: cached.name || cached.title || 'Unnamed',
             desc: cached.description || cached.desc || cached.detail || '',
             img: cached.imageurl || cached.imgurl || cached.image || cached.img || cached.pic || '',
             sizesImg: cached.sizesimageurl || cached.sizeimage || cached.sizesimage || cached.sizepic || '',
             sizes: cached.sizes || cached.size || cached.availablesizes || cached.available_sizes || cached['available sizes'] || cached['Available Sizes'] || '',
             refcode: cached.refcode || cached.referencecode || cached.code || cached.refercode || '',
             price: cached.price || cached.cost || '',
             stock: cached.stock !== undefined ? cached.stock : null,
             show_sizes: cached.show_sizes !== undefined ? cached.show_sizes : true,
             collection: prod.collection || ''
           };
       } else {
           const { data } = await supabase.from('client_products').select('*').eq('id', prod.id).single();
           if (data) {
               fullProd = {
                 id: data.id,
                 name: data.name || data.title || 'Unnamed',
                 desc: data.description || data.desc || data.detail || '',
                 img: data.imageurl || data.imgurl || data.image || data.img || data.pic || '',
                 sizesImg: data.sizesimageurl || data.sizeimage || data.sizesimage || data.sizepic || '',
                 sizes: data.sizes || data.size || data.availablesizes || data.available_sizes || data['available sizes'] || data['Available Sizes'] || '',
                 refcode: data.refcode || data.referencecode || data.code || data.refercode || '',
                 price: data.price || data.cost || '',
                 stock: data.stock !== undefined ? data.stock : null,
                 show_sizes: data.show_sizes !== undefined ? data.show_sizes : true,
                 collection: prod.collection || ''
               };
           }
       }
    }
    if (fullProd.stock === undefined && prod.stock !== undefined) fullProd.stock = prod.stock;
    if (fullProd.show_sizes === undefined && prod.show_sizes !== undefined) fullProd.show_sizes = prod.show_sizes;
    if (!fullProd.collection && prod.collection) fullProd.collection = prod.collection;

    setSelectedProduct(fullProd);
    try {
      let history = [];
      const stored = localStorage.getItem('stellara_recently_viewed');
      if (stored) history = JSON.parse(stored);
      history = history.filter(i => i.id !== fullProd.id);
      history.unshift({ ...fullProd });
      if (history.length > 5) history = history.slice(0, 5);
      localStorage.setItem('stellara_recently_viewed', JSON.stringify(history));
      window.dispatchEvent(new Event('recentlyViewedUpdated'));
    } catch(e) {}
  };

  // When product modal closes, remove ?product from URL but keep ?collection
  const handleCloseProduct = () => {
    setSelectedProduct(null);
    if (selectedCollection) {
      updateURL(slugify(selectedCollection.name), null);
    }
  };

  // When going back to collections, clear URL entirely
  const handleBack = () => {
    setSelectedCollection(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  useEffect(() => {
    // Start prefetching data immediately on mount
    prefetchData();

    // Handle #hash anchor on initial load — scroll to section after page renders
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }

    // Sticky Nav & Scroll handling
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Fade-in animations
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              obs.unobserve(entry.target);
          }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      observer.observe(el);
    });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedCollection]);

  return (
      <div className="home-page">
        <main>
        <Navbar 
          onOrderSamples={() => setIsOrderModalOpen(true)} 
          onToggleDrawer={() => setIsDrawerOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        
        <MenuDrawer 
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSelectCollection={setSelectedCollection}
          onOpenProduct={handleOpenProduct}
        />
        
        <div style={{ display: !selectedCollection ? 'block' : 'none' }}>
          <Hero />
          <Collections onSelectCollection={setSelectedCollection} onOpenProduct={handleOpenProduct} />
        </div>
        
        <div style={{ display: selectedCollection ? 'block' : 'none' }}>
          <ProductsView 
            collectionData={selectedCollection} 
            onBack={handleBack}
            onOpenProduct={handleOpenProduct}
            onOpenLightbox={(img) => setLightboxImg(img)}
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

        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={handleCloseProduct}
            onOpenLightbox={(img) => setLightboxImg(img)}
            onOpenSampleForm={() => {
              setSampleProduct(selectedProduct);
              setSelectedProduct(null);
              setIsSampleFormOpen(true);
            }}
          />
        )}

        {lightboxImg && (
          <Lightbox img={lightboxImg} onClose={() => setLightboxImg(null)} />
        )}
        <ScrollToTop />
        <WhatsAppButton />
        </main>
      </div>
  );
};

export default Home;

