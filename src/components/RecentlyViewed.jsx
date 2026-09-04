"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentlyViewed, clearRecentlyViewed } from '../lib/recentlyViewed';
import { slugify } from '../lib/data';

const RecentlyViewed = ({ onOpenProduct }) => {
  const [recent, setRecent] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const handleStorage = () => {
      setRecent(getRecentlyViewed());
    };
    handleStorage();
    window.addEventListener('recentlyViewedUpdated', handleStorage);
    return () => window.removeEventListener('recentlyViewedUpdated', handleStorage);
  }, []);

  if (recent.length === 0) return null;

  const handleClick = (item) => {
    if (onOpenProduct) {
      onOpenProduct(item);
    } else {
      const slug = item.slug || slugify(item.name) || item.id;
      router.push(`/products/${slug}`);
    }
  };

  const getImgUrl = (item) => {
    if (!item) return '';
    if (item.img && typeof item.img === 'string') {
      const trimmed = item.img.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          return (parsed.images && parsed.images[0]) || '';
        } catch (_) {}
      }
      return item.img;
    }
    if (item.defaultImg) return item.defaultImg;
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    return '';
  };

  return (
    <div
      className="drawer-section recently-viewed-section pm-recently-viewed-container"
      style={{
        marginTop: '22px',
        paddingTop: '18px',
        borderTop: '1px solid #eaeaea',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <div
        className="recently-viewed-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <h4
          className="sidebar-title drawer-section-title recently-viewed-title"
          style={{
            margin: 0,
            padding: 0,
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: '#666',
            letterSpacing: '1.5px',
          }}
        >
          <i className="fas fa-history" style={{ color: '#c5a880', fontSize: '0.75rem' }}></i>
          Recently Viewed
        </h4>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            clearRecentlyViewed();
          }}
          className="recently-viewed-clear-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: '0.7rem',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#c5a880')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
          title="Clear recently viewed history"
        >
          Clear
        </button>
      </div>

      <div
        className="pm-recently-viewed-strip recently-viewed-strip"
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '8px',
          paddingTop: '2px',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        {recent.map((item) => {
          const img = getImgUrl(item);
          const price = item.discount_price && Number(item.discount_price) > 0
            ? Number(item.discount_price)
            : Number(item.price || 0);

          return (
            <div
              key={item.id}
              className="pm-recently-viewed-item recently-viewed-item"
              onClick={() => handleClick(item)}
              title={item.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                width: '68px',
                minWidth: '68px',
                maxWidth: '68px',
                flexShrink: 0,
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                const thumb = e.currentTarget.querySelector('.recently-viewed-thumb-box');
                if (thumb) {
                  thumb.style.borderColor = '#c5a880';
                  thumb.style.boxShadow = '0 4px 10px rgba(197, 168, 128, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                const thumb = e.currentTarget.querySelector('.recently-viewed-thumb-box');
                if (thumb) {
                  thumb.style.borderColor = '#ece5da';
                  thumb.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                }
              }}
            >
              {/* Strict bounding box for thumbnail */}
              <div
                className="recently-viewed-thumb-box"
                style={{
                  width: '68px',
                  height: '68px',
                  minWidth: '68px',
                  minHeight: '68px',
                  maxWidth: '68px',
                  maxHeight: '68px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #ece5da',
                  background: '#faf9f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  flexShrink: 0,
                  marginBottom: '5px',
                  position: 'relative',
                }}
              >
                {img ? (
                  <>
                    <img
                      src={img}
                      alt={item.name}
                      className="pm-recently-viewed-thumb recently-viewed-thumb"
                      style={{
                        width: '68px',
                        height: '68px',
                        minWidth: '68px',
                        maxWidth: '68px',
                        minHeight: '68px',
                        maxHeight: '68px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement.querySelector('.recently-viewed-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div
                      className="recently-viewed-fallback"
                      style={{
                        display: 'none',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#faf8f5',
                        color: '#c5a880',
                      }}
                    >
                      <i className="fas fa-gem" style={{ fontSize: '1rem' }}></i>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#faf8f5',
                      color: '#c5a880',
                    }}
                  >
                    <i className="fas fa-gem" style={{ fontSize: '1rem' }}></i>
                  </div>
                )}
              </div>

              {/* Product name */}
              <div
                className="pm-recently-viewed-name recently-viewed-name"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#2a2a2e',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  lineHeight: '1.2',
                }}
              >
                {item.name}
              </div>

              {/* Price */}
              {price > 0 && (
                <div
                  className="recently-viewed-price"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#c5a880',
                    marginTop: '2px',
                    textAlign: 'center',
                  }}
                >
                  Rs. {price.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyViewed;
