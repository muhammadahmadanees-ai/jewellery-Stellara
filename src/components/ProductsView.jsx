"use client";
import React, { useEffect, useState } from 'react';
import { supabase, fetchProductsCached, getProductsCache } from '../supabase';
import { useCart } from './CartContext';
import { parseProductImages, getColorHex, isLightColor } from './imageHelper';

const PRODUCTS_PER_PAGE = 15;

const ShrinkText = ({ text }) => {
  return (
    <h3 style={{
      margin: '0',
      fontWeight: 'bold',
      width: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '1.2rem',
      textAlign: 'left',
      lineHeight: '1.2'
    }}>
      {text}
    </h3>
  );
};

const ProductsView = ({ collectionData, onBack, onOpenProduct, onOpenLightbox }) => {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState({});
  const [hoveredImages, setHoveredImages] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const processProducts = (rawProducts) => {
    const prods = [];
    rawProducts.forEach((rawData) => {
      const data = {};
      for (let key in rawData) {
          const cleanKey = key.toLowerCase().replace(/[\s_]+/g, '');
          data[cleanKey] = rawData[key];
      }
      prods.push({
        id: rawData.id,
        collection: collectionData.name,
        name: data.name || data.title || 'Unnamed',
        desc: data.description || data.desc || data.detail || '',
        img: data.imageurl || data.imgurl || data.image || data.img || data.pic || '',
        sizesImg: data.sizesimageurl || data.sizeimage || data.sizesimage || data.sizepic || '',
        sizes: data.sizes || data.size || data.availablesizes || data.available_sizes || '',
        refcode: data.refcode || data.referencecode || data.code || data.refercode || '',
        price: data.price || data.cost || '',
        discount_price: rawData.discount_price !== undefined ? rawData.discount_price : data.discountprice || null,
        stock: rawData.stock !== undefined ? rawData.stock : null,
        show_sizes: rawData.show_sizes !== undefined ? rawData.show_sizes : true
      });
    });
    return prods;
  };

  const cachedSnapshot = collectionData ? getProductsCache(collectionData.id) : null;
  const initialProducts = cachedSnapshot ? processProducts(cachedSnapshot) : [];

  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(!cachedSnapshot);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentPage(1); // reset to page 1 on collection change
    if (!collectionData) return;
    
    // Check if we already have cache for this specific collection to avoid loading state flicker when collectionData changes
    const currentCache = getProductsCache(collectionData.id);
    if (currentCache) {
      setProducts(processProducts(currentCache));
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const rawProducts = await fetchProductsCached(collectionData.id);
        setProducts(processProducts(rawProducts));
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [collectionData]);

  const handleQuickAddToCart = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (prod.stock === 0) return;

    // Parse image field to see if it has colors
    const parsedImg = parseProductImages(prod.img);
    const colorsList = Object.keys(parsedImg.colors || {});

    // If product has multiple colors (more than 1), open product modal for color selection
    if (colorsList.length > 1) {
      onOpenProduct(prod);
      return;
    }

    // If product has sizes, open product modal for size selection
    if (prod.show_sizes !== false && prod.sizes) {
      onOpenProduct(prod);
      return;
    }

    // No sizes or multiple colors needed — add directly
    // If it has exactly 1 color, pass that color variant
    const variant = colorsList.length === 1 ? `Color: ${colorsList[0]}` : null;
    addToCart(prod, variant);
    setAddedIds(prev => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  if (!collectionData) return null;

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const el = document.getElementById('products-view');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="products-view" className="section">
      <div className="container">
        <div className="section-header">
          <button id="back-to-collections" className="btn btn-outline" style={{ marginBottom: 'var(--spacing-md)' }} onClick={onBack}>
            &larr; Back to Collections
          </button>
          <h2 id="products-view-title" style={{ fontWeight: 'bold' }}>{collectionData.name}</h2>
          <p>
            Select a product to view detailed specifications.
            {!loading && products.length > 0 && (
              <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '8px' }}>
                ({products.length} product{products.length !== 1 ? 's' : ''}{totalPages > 1 ? ` — Page ${currentPage} of ${totalPages}` : ''})
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No products found in this collection.</p>
        ) : (
          <div className="grid" id="products-container">
            {paginatedProducts.map(prod => {
              const parsedImg = parseProductImages(prod.img);
              const displayImg = hoveredImages[prod.id] || parsedImg.defaultImg;
              const hasColors = Object.keys(parsedImg.colors).length > 0;
              
              const handleColorHover = (colorUrl) => {
                if (colorUrl) {
                  setHoveredImages(prev => ({ ...prev, [prod.id]: colorUrl }));
                }
              };
              
              const handleColorLeave = () => {
                setHoveredImages(prev => ({ ...prev, [prod.id]: null }));
              };

              return (
              <div className="collection-card fade-in-up" key={prod.id} style={{ opacity: prod.stock === 0 ? 0.6 : 1, transform: 'translateY(0)', position: 'relative' }}>
                {prod.stock === 0 && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                    background: '#dc2626', color: '#fff', fontWeight: 'bold',
                    padding: '5px 14px', borderRadius: '4px', fontSize: '0.8rem',
                    letterSpacing: '1px', boxShadow: '0 2px 8px rgba(220,38,38,0.3)'
                  }}>SOLD OUT</div>
                )}
                {prod.stock !== null && prod.stock > 0 && prod.stock <= 5 && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                    background: '#f59e0b', color: '#fff', fontWeight: 'bold',
                    padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}>Only {prod.stock} left!</div>
                )}
                <div
                  className="img-placeholder"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: displayImg ? 'zoom-in' : 'default',
                    backgroundColor: '#ffffff'
                  }}
                  title={displayImg ? 'Click to view full image' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayImg && onOpenLightbox) {
                      onOpenLightbox(displayImg);
                    }
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
                        filter: prod.stock === 0 ? 'grayscale(50%)' : 'none'
                      }}
                    />
                  ) : (
                    <span>Product Image</span>
                  )}
                </div>
                <div 
                  className="card-content"
                  onClick={(e) => {
                    if (e.target.closest('button') || e.target.closest('.color-swatch-dot')) {
                      return;
                    }
                    onOpenProduct(prod);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: '0.4rem' }}>
                    <ShrinkText text={prod.name} />
                    {prod.refcode && <span className="ref-code" style={{ fontWeight: 'normal' }}>{prod.refcode}</span>}
                  </div>
                  <p className="card-desc" style={{ marginTop: '0.4rem' }}>{prod.desc}</p>
                  
                  {/* Color variants dot previews */}
                  {hasColors && (
                    <div style={{ display: 'flex', gap: '6px', margin: '8px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>Colors:</span>
                      {Object.keys(parsedImg.colors).map(color => {
                        const colorUrl = parsedImg.colors[color];
                        const hex = getColorHex(color);
                        const isSelected = displayImg === colorUrl;
                        return (
                          <span
                            key={color}
                            className="color-swatch-dot"
                            onMouseEnter={() => handleColorHover(colorUrl)}
                            onMouseLeave={handleColorLeave}
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: hex,
                              display: 'inline-block',
                              cursor: 'pointer',
                              border: isSelected ? '1.5px solid #8B1A1A' : (isLightColor(color) ? '1px solid #ccc' : 'none'),
                              boxShadow: isSelected ? '0 0 3px rgba(139,26,26,0.5)' : 'none',
                              transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                              transition: 'all 0.15s ease'
                            }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  )}

                  {prod.price && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      {prod.discount_price ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', fontWeight: 'normal' }}>
                            Rs. {parseFloat(prod.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span style={{ fontWeight: '600', color: '#8B1A1A', fontSize: '0.95rem' }}>
                            Rs. {parseFloat(prod.discount_price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontWeight: '600', color: '#8B1A1A', fontSize: '0.95rem' }}>
                          Rs. {parseFloat(prod.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href="#" className="link view-details-btn" onClick={(e) => { e.preventDefault(); onOpenProduct(prod); }}>
                      View Details <span className="arrow-icon">&rarr;</span>
                    </a>
                    <button
                      onClick={(e) => handleQuickAddToCart(e, prod)}
                      disabled={prod.stock === 0}
                      style={{
                        background: prod.stock === 0 ? '#e5e7eb' : addedIds[prod.id] ? '#16a34a' : '#1a1a1a',
                        color: prod.stock === 0 ? '#999' : '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        cursor: prod.stock === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {prod.stock === 0 ? 'Sold Out' : addedIds[prod.id] ? '✓ Added' : (
                        <><i className="fas fa-shopping-bag" style={{ fontSize: '0.7rem' }}></i> Add to Cart</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '3rem',
            flexWrap: 'wrap',
          }}>
            {/* Prev button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: '1.5px solid #8B1A1A',
                background: currentPage === 1 ? '#f5f5f5' : '#8B1A1A',
                color: currentPage === 1 ? '#bbb' : '#fff',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              ← Prev
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '6px',
                  border: '1.5px solid #8B1A1A',
                  background: page === currentPage ? '#8B1A1A' : 'transparent',
                  color: page === currentPage ? '#fff' : '#8B1A1A',
                  fontWeight: page === currentPage ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: page === currentPage ? '0 2px 8px rgba(139,26,26,0.25)' : 'none',
                  transform: page === currentPage ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {page}
              </button>
            ))}

            {/* Next button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: '1.5px solid #8B1A1A',
                background: currentPage === totalPages ? '#f5f5f5' : '#8B1A1A',
                color: currentPage === totalPages ? '#bbb' : '#fff',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsView;
