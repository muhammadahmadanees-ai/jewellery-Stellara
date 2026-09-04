"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { getColorHex, isLightColor } from './imageHelper';
import Lightbox from './Lightbox';
import SampleFormModal from './SampleFormModal';
import WhatsAppButton from './WhatsAppButton';
import ScrollToTop from './ScrollToTop';
import { recordRecentlyViewed } from '../lib/recentlyViewed';

export default function ProductDetailClient({ product, relatedProducts = [] }) {
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    if (product && product.id) {
      recordRecentlyViewed(product);
    }
  }, [product]);

  const [selectedImage, setSelectedImage] = useState(product.defaultImg || (product.images && product.images[0]) || '');
  const [selectedColor, setSelectedColor] = useState(() => {
    const colorKeys = Object.keys(product.colors || {});
    return colorKeys.length > 0 ? colorKeys[0] : '';
  });
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isSampleFormOpen, setIsSampleFormOpen] = useState(false);

  // Accordion open states
  const [openSection, setOpenSection] = useState('description');

  const effectivePrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const isSoldOut = product.stock === 0;

  const parsedSizes = (product.sizes || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleColorClick = (colorName, imgUrl) => {
    setSelectedColor(colorName);
    if (imgUrl) {
      setSelectedImage(imgUrl);
    }
  };

  const handleAddToCart = () => {
    if (isSoldOut) return;

    let variantText = '';
    if (selectedColor && Object.keys(product.colors || {}).length > 0) {
      variantText += `Color: ${selectedColor}`;
    }
    if (selectedSize) {
      variantText += variantText ? ` | Size: ${selectedSize}` : `Size: ${selectedSize}`;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        discount_price: product.discountPrice,
        img: product.img,
        stock: product.stock,
        sizes: product.sizes,
        refcode: product.refcode,
        collection: product.collectionName,
      },
      variantText || null,
      qty
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    setIsCartOpen(true);
  };

  const generateWhatsAppUrl = () => {
    let msg = `Hello Stellara Jewellery! 👋 I would like to order:\n\n*Product:* ${product.name}`;
    if (product.refcode) msg += `\n*Ref Code:* ${product.refcode}`;
    if (selectedColor) msg += `\n*Color:* ${selectedColor}`;
    if (selectedSize) msg += `\n*Size:* ${selectedSize}`;
    msg += `\n*Quantity:* ${qty}`;
    msg += `\n*Price:* Rs. ${(effectivePrice * qty).toLocaleString()}`;
    msg += `\n*Link:* https://www.jewellerystellara.com/products/${product.slug}`;
    msg += `\n\nPlease confirm availability and payment details. Thank you!`;
    return `https://wa.me/923164934759?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="product-detail-layout" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'start',
          marginBottom: '4rem',
        }}
      >
        {/* Left Column: Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              border: '1px solid #f0ebe3',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              cursor: 'zoom-in',
              height: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setLightboxImg(selectedImage)}
            title="Click to zoom image"
          >
            {isSoldOut && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  zIndex: 10,
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  letterSpacing: '1px',
                }}
              >
                SOLD OUT
              </div>
            )}
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '2rem',
                }}
              />
            ) : (
              <i className="fas fa-gem fa-4x" style={{ color: '#ccc' }}></i>
            )}
            <span
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className="fas fa-search-plus"></i> Click to Zoom
            </span>
          </div>

          {/* Thumbnail row */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {product.images.map((imgUrl, idx) => {
                const isCurrent = selectedImage === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: isCurrent ? '2px solid #8B1A1A' : '1px solid #e5e5e5',
                      padding: '4px',
                      background: '#fff',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              {product.collectionName && (
                <Link
                  href={`/collections/${product.collectionSlug}`}
                  style={{
                    fontSize: '0.8rem',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: '#8B1A1A',
                    fontWeight: '700',
                    textDecoration: 'none',
                  }}
                >
                  {product.collectionName}
                </Link>
              )}
              {product.refcode && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: '#f3f4f6',
                    color: '#666',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '600',
                  }}
                >
                  SKU: {product.refcode}
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.2rem',
                fontWeight: '700',
                color: '#1a1a1c',
                lineHeight: '1.25',
                margin: '0 0 0.8rem 0',
              }}
            >
              {product.name}
            </h1>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {hasDiscount ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.2rem' }}>
                    Rs. {product.price.toLocaleString()}
                  </span>
                  <span style={{ fontWeight: '700', color: '#8B1A1A', fontSize: '1.8rem' }}>
                    Rs. {product.discountPrice.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      background: '#fef2f2',
                      color: '#991b1b',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: '1px solid #fee2e2',
                      fontWeight: '700',
                    }}
                  >
                    {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
                  </span>
                </>
              ) : (
                <span style={{ fontWeight: '700', color: '#8B1A1A', fontSize: '1.8rem' }}>
                  Rs. {effectivePrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock badge */}
            <div style={{ marginTop: '0.8rem' }}>
              {isSoldOut ? (
                <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.9rem' }}>
                  <i className="fas fa-times-circle" style={{ marginRight: '5px' }}></i> Currently Sold Out
                </span>
              ) : product.stock !== null && product.stock <= 5 ? (
                <span style={{ color: '#d97706', fontWeight: '600', fontSize: '0.9rem' }}>
                  <i className="fas fa-fire" style={{ marginRight: '5px' }}></i> Only {product.stock} items left in stock!
                </span>
              ) : (
                <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.9rem' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: '5px' }}></i> In Stock & Ready to Ship (4-5 Days Delivery)
                </span>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />

          {/* Color Selection */}
          {product.colors && Object.keys(product.colors).length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Color: <span style={{ color: '#8B1A1A' }}>{selectedColor || 'Select a color'}</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.keys(product.colors).map((colorName) => {
                  const colorUrl = product.colors[colorName];
                  const hex = getColorHex(colorName);
                  const isSelected = selectedColor.toLowerCase() === colorName.toLowerCase();
                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => handleColorClick(colorName, colorUrl)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSelected ? '2px solid #8B1A1A' : '1px solid #d1d5db',
                        background: isSelected ? '#faf4f4' : '#fff',
                        cursor: 'pointer',
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: hex,
                          border: isLightColor(colorName) ? '1px solid #ccc' : 'none',
                        }}
                      />
                      {colorName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.showSizes && parsedSizes.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Size: <span style={{ color: '#8B1A1A' }}>{selectedSize || 'Select a size'}</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {parsedSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #8B1A1A' : '1px solid #d1d5db',
                        background: isSelected ? '#8B1A1A' : '#fff',
                        color: isSelected ? '#fff' : '#1a1a1c',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Quantity:</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    padding: '8px 14px',
                    background: '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  -
                </button>
                <span style={{ padding: '8px 16px', fontWeight: '700', fontSize: '0.95rem' }}>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  style={{
                    padding: '8px 14px',
                    background: '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSoldOut}
                style={{
                  flex: '1 1 200px',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  background: isSoldOut ? '#e5e7eb' : isAdded ? '#16a34a' : '#8B1A1A',
                  color: isSoldOut ? '#999' : '#fff',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(139,26,26,0.25)',
                }}
              >
                {isSoldOut ? (
                  'Sold Out'
                ) : isAdded ? (
                  '✓ Added to Cart!'
                ) : (
                  <>
                    <i className="fas fa-shopping-bag"></i> Add to Cart
                  </>
                )}
              </button>

              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: '1 1 200px',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  background: '#25D366',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37,211,102,0.25)',
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.2rem' }}></i> Order via WhatsApp
              </a>
            </div>
          </div>

          {/* Collapsible Info Tabs */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee' }}>
            {/* Description Tab */}
            <div style={{ borderBottom: '1px solid #eee' }}>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'description' ? '' : 'description')}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: '700',
                  fontSize: '1rem',
                  color: '#1a1a1c',
                  cursor: 'pointer',
                }}
              >
                <span>Description & Specifications</span>
                <i className={`fas ${openSection === 'description' ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
              {openSection === 'description' && (
                <div style={{ paddingBottom: '14px', color: '#555', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {product.desc || 'Crafted with premium China gold and brilliant fire zircons for lasting shine.'}
                </div>
              )}
            </div>

            {/* Care Guide Tab */}
            <div style={{ borderBottom: '1px solid #eee' }}>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'care' ? '' : 'care')}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: '700',
                  fontSize: '1rem',
                  color: '#1a1a1c',
                  cursor: 'pointer',
                }}
              >
                <span>Jewellery Care Guide</span>
                <i className={`fas ${openSection === 'care' ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
              {openSection === 'care' && (
                <div style={{ paddingBottom: '14px', color: '#555', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    <li>Avoid direct contact with perfumes, deodorants, water, and hairsprays.</li>
                    <li>Always put your jewellery on last when getting dressed.</li>
                    <li>Wipe gently with a soft dry cloth after each use before storing.</li>
                    <li>Store separately in an airtight box or pouch away from sunlight.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Delivery & Returns Tab */}
            <div style={{ borderBottom: '1px solid #eee' }}>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'shipping' ? '' : 'shipping')}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: '700',
                  fontSize: '1rem',
                  color: '#1a1a1c',
                  cursor: 'pointer',
                }}
              >
                <span>Delivery & Return Policy</span>
                <i className={`fas ${openSection === 'shipping' ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
              {openSection === 'shipping' && (
                <div style={{ paddingBottom: '14px', color: '#555', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    <strong>Delivery:</strong> Orders are delivered across Pakistan within 4 to 5 working days from order confirmation.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>7-Day Defect Warranty:</strong> If your jewellery arrives broken or with a defect, contact us on WhatsApp (+92 316 4934759) with photos/video within 7 days for an exchange.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div style={{ borderTop: '1px solid #e8e0d5', paddingTop: '3rem', marginTop: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={{ color: '#8B1A1A', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>
              Complete Your Look
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '700', margin: '4px 0 0 0' }}>
              More from {product.collectionName || 'Stellara'}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {relatedProducts.slice(0, 4).map((rel) => {
              const relEffectivePrice = rel.discountPrice || rel.price;
              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
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
                      height: '200px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {rel.defaultImg ? (
                      <img
                        src={rel.defaultImg}
                        alt={rel.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
                      />
                    ) : (
                      <i className="fas fa-gem" style={{ fontSize: '2rem', color: '#ccc' }}></i>
                    )}
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 4px 0', lineHeight: '1.3' }}>
                      {rel.name}
                    </h3>
                    <p style={{ margin: 'auto 0 0 0', fontWeight: '700', color: '#8B1A1A', fontSize: '0.95rem' }}>
                      Rs. {relEffectivePrice.toLocaleString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {lightboxImg && (
        <Lightbox
          img={lightboxImg}
          images={product.images || [lightboxImg]}
          onClose={() => setLightboxImg(null)}
        />
      )}

      {isSampleFormOpen && (
        <SampleFormModal
          onClose={() => setIsSampleFormOpen(false)}
          initialProduct={product}
        />
      )}

      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
}
