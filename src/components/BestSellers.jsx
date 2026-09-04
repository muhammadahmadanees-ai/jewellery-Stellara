import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { parseProductImages } from './imageHelper';
import { slugify } from '../lib/data';
import './BestSellers.css';

const BestSellers = ({ products, onOpenProduct }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="bestsellers-section fade-in-up active">
      <div className="bestsellers-header">
        <span className="bestsellers-subtitle">Top Favorites</span>
        <h2 className="bestsellers-title">Our Best Sellers</h2>
      </div>

      <div className={`bestsellers-grid ${products.length <= 2 ? 'few-items' : ''}`}>
        {products.map(prod => {
          // Parse image field to get first image
          const parsedImg = parseProductImages(prod.img);
          const displayImg = parsedImg.images && parsedImg.images.length > 0 ? parsedImg.images[0] : '';
          
          // Format prices
          const hasDiscount = prod.discount_price !== null && prod.discount_price !== undefined && Number(prod.discount_price) > 0;
          const displayPrice = hasDiscount ? Number(prod.discount_price) : Number(prod.price);
          const originalPrice = Number(prod.price);
          const productHref = `/products/${prod.slug || slugify(prod.name) || prod.id}`;

          // Calculate discount percentage
          const discountPct = hasDiscount ? Math.round((1 - (displayPrice / originalPrice)) * 100) : 0;

          return (
            <div 
              key={prod.id} 
              className="bestseller-card"
              onClick={() => onOpenProduct && onOpenProduct(prod)}
            >
              {/* Badge */}
              <div className="bestseller-badge">
                <i className="fas fa-crown"></i> Best Seller
              </div>

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="bestseller-discount-badge">
                  {discountPct}% OFF
                </div>
              )}

              {/* Image */}
              <Link
                href={productHref}
                onClick={(e) => {
                  if (onOpenProduct) {
                    e.preventDefault();
                    onOpenProduct(prod);
                  }
                }}
                className="bestseller-img-container"
                style={{ display: 'block', cursor: 'pointer' }}
              >
                {displayImg ? (
                  <div 
                    className="bestseller-img-zoom"
                    style={{ backgroundImage: `url(${displayImg})` }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f3f4f6',
                    color: '#9ca3af'
                  }}>
                    <i className="fas fa-image" style={{ fontSize: '2rem' }}></i>
                  </div>
                )}
              </Link>

              {/* Card details */}
              <div className="bestseller-details">
                <Link
                  href={productHref}
                  onClick={(e) => {
                    if (onOpenProduct) {
                      e.preventDefault();
                      onOpenProduct(prod);
                    }
                  }}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h3 className="bestseller-name" style={{ cursor: 'pointer' }}>{prod.name}</h3>
                </Link>
                <p className="bestseller-desc">{prod.description || prod.desc || 'Premium hand-crafted jewellery piece.'}</p>
                
                <div className="bestseller-price-row">
                  {hasDiscount ? (
                    <span className="bestseller-price">
                      <span className="bestseller-original-price">
                        Rs. {originalPrice.toLocaleString()}
                      </span>
                      <span className="bestseller-sale-price">
                        Rs. {displayPrice.toLocaleString()}
                      </span>
                    </span>
                  ) : (
                    <span className="bestseller-price">
                      Rs. {displayPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <button 
                  className="bestseller-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProduct && onOpenProduct(prod);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BestSellers;
