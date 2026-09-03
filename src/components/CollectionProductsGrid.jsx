"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { getColorHex, isLightColor } from './imageHelper';

export default function CollectionProductsGrid({ products = [] }) {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState({});
  const [hoveredImages, setHoveredImages] = useState({});

  const handleQuickAddToCart = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (prod.stock === 0) return;

    // Direct add
    addToCart(
      {
        id: prod.id,
        name: prod.name,
        price: prod.price,
        discount_price: prod.discountPrice,
        img: prod.img,
        stock: prod.stock,
        sizes: prod.sizes,
        refcode: prod.refcode,
        collection: prod.collectionName,
      },
      null
    );

    setAddedIds((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>No products found in this collection.</p>
      </div>
    );
  }

  return (
    <div className="grid" id="products-container" style={{ margin: '2rem 0' }}>
      {products.map((prod) => {
        const displayImg = hoveredImages[prod.id] || prod.defaultImg;
        const hasColors = prod.colors && Object.keys(prod.colors).length > 0;
        const effectivePrice = prod.discountPrice || prod.price;
        const hasDiscount = prod.discountPrice && prod.discountPrice < prod.price;

        return (
          <div
            className="collection-card fade-in-up"
            key={prod.id}
            style={{
              opacity: prod.stock === 0 ? 0.65 : 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {prod.stock === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '5px 14px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  letterSpacing: '1px',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
                }}
              >
                SOLD OUT
              </div>
            )}
            {prod.stock !== null && prod.stock > 0 && prod.stock <= 5 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                Only {prod.stock} left!
              </div>
            )}

            {/* Product Image Link */}
            <Link
              href={`/products/${prod.slug}`}
              style={{
                textDecoration: 'none',
                display: 'block',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                height: '280px',
              }}
            >
              {displayImg ? (
                <img
                  src={displayImg}
                  alt={prod.name}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                    transition: 'transform 0.3s ease',
                  }}
                />
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ccc',
                  }}
                >
                  <i className="fas fa-gem fa-3x"></i>
                </div>
              )}
            </Link>

            {/* Product Card Content */}
            <div className="card-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: '0.3rem' }}>
                <Link
                  href={`/products/${prod.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    fontWeight: '700',
                    fontSize: '1.15rem',
                    lineHeight: '1.3',
                  }}
                >
                  {prod.name}
                </Link>
                {prod.refcode && (
                  <span className="ref-code" style={{ fontSize: '0.75rem', color: '#888' }}>
                    {prod.refcode}
                  </span>
                )}
              </div>

              {prod.desc && (
                <p
                  className="card-desc"
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                  }}
                >
                  {prod.desc}
                </p>
              )}

              {/* Color swatches */}
              {hasColors && (
                <div style={{ display: 'flex', gap: '6px', margin: '8px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Colors:</span>
                  {Object.keys(prod.colors).map((color) => {
                    const colorUrl = prod.colors[color];
                    const hex = getColorHex(color);
                    const isSelected = displayImg === colorUrl;
                    return (
                      <span
                        key={color}
                        className="color-swatch-dot"
                        onMouseEnter={() => colorUrl && setHoveredImages((prev) => ({ ...prev, [prod.id]: colorUrl }))}
                        onMouseLeave={() => setHoveredImages((prev) => ({ ...prev, [prod.id]: null }))}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: hex,
                          display: 'inline-block',
                          cursor: 'pointer',
                          border: isSelected ? '1.5px solid #8B1A1A' : isLightColor(color) ? '1px solid #ccc' : 'none',
                          boxShadow: isSelected ? '0 0 3px rgba(139,26,26,0.5)' : 'none',
                          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                        title={color}
                      />
                    );
                  })}
                </div>
              )}

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.6rem 0', flexWrap: 'wrap', marginTop: 'auto' }}>
                {hasDiscount ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                      Rs. {prod.price.toLocaleString()}
                    </span>
                    <span style={{ fontWeight: '700', color: '#8B1A1A', fontSize: '1.05rem' }}>
                      Rs. {prod.discountPrice.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: '#fef2f2',
                        color: '#991b1b',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '0.5px solid #fee2e2',
                        fontWeight: '600',
                      }}
                    >
                      {Math.round((1 - prod.discountPrice / prod.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span style={{ fontWeight: '700', color: '#8B1A1A', fontSize: '1.05rem' }}>
                    Rs. {effectivePrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '0.4rem' }}>
                <Link
                  href={`/products/${prod.slug}`}
                  className="link view-details-btn"
                  style={{
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  View Details &rarr;
                </Link>
                <button
                  onClick={(e) => handleQuickAddToCart(e, prod)}
                  disabled={prod.stock === 0}
                  style={{
                    marginLeft: 'auto',
                    background: prod.stock === 0 ? '#e5e7eb' : addedIds[prod.id] ? '#16a34a' : '#1a1a1a',
                    color: prod.stock === 0 ? '#999' : '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    cursor: prod.stock === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {prod.stock === 0 ? 'Sold Out' : addedIds[prod.id] ? '✓ Added' : (
                    <><i className="fas fa-shopping-bag" style={{ fontSize: '0.7rem' }}></i> Add</>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
