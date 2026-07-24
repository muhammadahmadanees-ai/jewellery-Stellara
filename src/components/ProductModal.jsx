"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useCart } from './CartContext';
import { parseProductImages, getColorHex, isLightColor } from './imageHelper';
import './ProductModal.css';

const ShrinkTextModal = ({ text }) => {
  const textRef = useRef(null);
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    
    const resizeText = () => {
      el.style.fontSize = ''; 
      let currentFontSize = parseFloat(window.getComputedStyle(el).fontSize);
      
      while (el.scrollWidth > el.clientWidth && currentFontSize > 10) {
        currentFontSize -= 0.5;
        el.style.fontSize = `${currentFontSize}px`;
      }
    };

    resizeText();
    setTimeout(resizeText, 100);
    
    window.addEventListener('resize', resizeText);
    return () => window.removeEventListener('resize', resizeText);
  }, [text]);
  
  return (
    <h2 ref={textRef} className="pm-title" style={{ width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {text}
    </h2>
  );
};

const PREDEFINED_SIZES = [
  { id: '6', w: 18, h: 18 },
  { id: '7', w: 20, h: 20 },
  { id: '8', w: 22, h: 22 },
  { id: '16"', w: 24, h: 14 },
  { id: '18"', w: 26, h: 14 },
];

const ProductModal = ({ product, onClose, onOpenLightbox, onOpenSampleForm }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const { addToCart } = useCart();

  // Reset states and initialize first color if available when product changes
  useEffect(() => {
    if (!product) return;
    const parsed = parseProductImages(product.img);
    const colors = Object.keys(parsed.colors);
    if (colors.length > 1) {
      setSelectedColor(null);
    } else if (colors.length === 1) {
      setSelectedColor(colors[0]);
    } else {
      setSelectedColor(null);
    }
    setSelectedSize(null);
    setSizeError(false);
    setColorError(false);
    setActiveImage(null);
  }, [product?.id]);

  if (!product) return null;

  const parsedImg = parseProductImages(product.img);
  const colorsList = Object.keys(parsedImg.colors);
  const hasColors = colorsList.length > 0;
  const currentImage = activeImage || (selectedColor && parsedImg.colors[selectedColor]) || parsedImg.defaultImg;

  const selectedColorStock = (selectedColor && parsedImg.colorStock && parsedImg.colorStock[selectedColor] !== undefined)
    ? parsedImg.colorStock[selectedColor]
    : product.stock;

  const isSoldOut = selectedColorStock === 0;
  
  // Only show sizes if there are no colors (as requested: "place that in place of available sizes on public portal")
  const showSizes = !hasColors && product.show_sizes !== false && product.sizes;

  const getDisplayPrice = () => {
    if (!product.price) return "Price on Request";
    const numPrice = parseFloat(product.price);
    if (isNaN(numPrice)) return product.price;
    return `Rs. ${numPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleAddToCart = () => {
    if (isSoldOut) return;
    
    if (hasColors && !selectedColor) {
      setColorError(true);
      return;
    }
    if (showSizes && !selectedSize) {
      setSizeError(true);
      return;
    }
    
    setSizeError(false);
    setColorError(false);

    const variant = selectedColor ? `Color: ${selectedColor}` : selectedSize;
    addToCart(product, variant);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="pm-overlay" onClick={(e) => { if (e.target.classList.contains('pm-overlay')) onClose(); }}>
      <div className="pm-container">
        
        {/* Left Column — Image Panel */}
        <div className="pm-left">
          <div className="pm-image-box">
            <img 
              src={currentImage} 
              alt={product.name} 
              onClick={() => { if(currentImage) onOpenLightbox(currentImage); }}
            />
          </div>

          {/* Thumbnail Strip */}
          {parsedImg.images && parsedImg.images.length > 1 && (
            <div className="pm-thumbnails-row" style={{
              display: 'flex',
              gap: '8px',
              marginTop: '10px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {parsedImg.images.map((imgUrl, idx) => {
                const isActive = currentImage === imgUrl;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '6px',
                      border: isActive ? '2px solid #8B1A1A' : '1px solid #ddd',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: isActive ? '0 0 6px rgba(139,26,26,0.3)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="pm-caption">
            * Premium Zircon Stones · China Gold Metal · Handcrafted Finish.
          </div>
        </div>

        {/* Right Column — Content Panel */}
        <div className="pm-right">
          <div className="pm-header-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 'calc(100% - 30px)', gap: '8px' }}>
              <ShrinkTextModal text={product.name} />
              {product.refcode && <span className="pm-sku" style={{ margin: 0 }}>{product.refcode}</span>}
            </div>
            <span className="pm-close" onClick={onClose}>&times;</span>
          </div>
          
          {/* Price details visible for jewellery customer */}
          {product.price && (
            <div className="pm-price" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {product.discount_price ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9em', fontWeight: 'normal' }}>
                    Rs. {Number(product.price).toLocaleString()}
                  </span>
                  <span style={{ color: '#8B1A1A', fontWeight: 'bold' }}>
                    Rs. {Number(product.discount_price).toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    background: '#fef2f2',
                    color: '#991b1b',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '0.5px solid #fee2e2',
                    fontWeight: '600'
                  }}>
                    {Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)}% OFF
                  </span>
                </>
              ) : (
                getDisplayPrice()
              )}
            </div>
          )}
          
          <div className="pm-desc">
            {(() => {
              const text = (product.desc || product.description || '').trim();
              if (!text) return null;

              const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
              const parsedElements = [];
              let currentHeader = null;

              for (const line of lines) {
                // Header detection: matches emoji prefix or common titles
                const isHeader = /^[\uD800-\uDFFF\u2600-\u27BF]/.test(line) || 
                                 line.toLowerCase().startsWith('available colors') || 
                                 line.toLowerCase().startsWith('what\'s included');

                if (isHeader) {
                  currentHeader = { type: 'header', text: line, items: [] };
                  parsedElements.push(currentHeader);
                } else {
                  // Label match detection: "Label: Value"
                  const labelMatch = line.match(/^([A-Za-z0-9'\s&]{1,30}):\s*(.*)/);
                  
                  if (labelMatch && !currentHeader) {
                    parsedElements.push({
                      type: 'label_value',
                      label: labelMatch[1].trim(),
                      value: labelMatch[2].trim()
                    });
                  } else {
                    if (currentHeader) {
                      currentHeader.items.push(line);
                    } else {
                      // Standalone plain text line
                      parsedElements.push({ type: 'plain', text: line });
                    }
                  }
                }
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {parsedElements.map((el, idx) => {
                    if (el.type === 'label_value') {
                      if (el.label.toLowerCase() === 'availability') {
                        return (
                          <div key={idx} style={{ fontSize: '11.5px', color: '#666', marginBottom: '4px', lineHeight: '1.45' }}>
                            <strong style={{ color: '#1a1a1a', fontWeight: '700' }}>{el.label}:</strong> {el.value}
                          </div>
                        );
                      }
                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          lineHeight: '1.45',
                          fontSize: '11.5px',
                          color: '#444'
                        }}>
                          <span style={{
                            minWidth: '8px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            border: '1.5px solid #8B1A1A',
                            marginTop: '4px',
                            flexShrink: 0,
                            display: 'inline-block'
                          }} />
                          <span>
                            <strong style={{ color: '#1a1a1a', fontWeight: '700' }}>{el.label}:</strong>{' '}
                            {el.value}
                          </span>
                        </div>
                      );
                    }

                    if (el.type === 'header') {
                      return (
                        <div key={idx} style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '6px' }}>
                            {el.text}
                          </div>
                          {el.items && el.items.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                              {el.items.map((item, itemIdx) => (
                                <div key={itemIdx} style={{
                                  display: 'flex',
                                  gap: '10px',
                                  alignItems: 'flex-start',
                                  lineHeight: '1.45',
                                  fontSize: '11.5px',
                                  color: '#444'
                                }}>
                                  <span style={{
                                    minWidth: '8px',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    border: '1.5px solid #8B1A1A',
                                    marginTop: '4px',
                                    flexShrink: 0,
                                    display: 'inline-block'
                                  }} />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={idx} style={{ fontSize: '11.5px', color: '#444', lineHeight: '1.45' }}>
                        {el.text}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          
          {/* Colors Selection — shown when colors exist */}
          {hasColors && (
            <>
              <div className="pm-sizes-label" style={ colorError ? { color: '#dc2626' } : {} }>
                {colorError ? 'PLEASE SELECT A COLOR' : 'SELECT COLOR'}
              </div>
              <div className="pm-colors-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                {colorsList.map(color => {
                  const hex = getColorHex(color);
                  const isSelected = selectedColor === color;
                  return (
                    <div
                      key={color}
                      className={`pm-color-swatch-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedColor(color);
                        setColorError(false);
                        setActiveImage(null);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: '6px'
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: (color.toLowerCase().trim() === 'crystal clear' || color.toLowerCase().trim() === 'crystalclear')
                            ? 'linear-gradient(135deg, #ffffff 0%, #e8f4f8 50%, #cce3eb 100%)'
                            : hex,
                          border: isSelected ? '2.5px solid #8B1A1A' : (isLightColor(color) ? '1px solid #ccc' : '1px solid transparent'),
                          boxShadow: isSelected ? '0 0 6px rgba(139,26,26,0.6)' : 'none',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      />
                      <span style={{ fontSize: '10px', color: isSelected ? '#1a1a1a' : '#777', fontWeight: isSelected ? '600' : 'normal', textTransform: 'capitalize' }}>
                        {color}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Sizes — only shown when show_sizes is true and sizes exist (and no colors) */}
          {showSizes && (
            <>
              <div className="pm-sizes-label" style={ sizeError ? { color: '#dc2626' } : {} }>
                {sizeError ? 'PLEASE SELECT A SIZE' : 'SELECT SIZE'}
              </div>
              <div className="pm-sizes-row">
                {(() => {
                  const availableSizeIds = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
                  const displaySizes = availableSizeIds.length > 0 
                    ? availableSizeIds.map(sizeStr => {
                        const predefined = PREDEFINED_SIZES.find(ps => ps.id.toLowerCase() === sizeStr.toLowerCase());
                        if (predefined) return predefined;
                        
                        let w = 23, h = 23; 
                        const match = sizeStr.match(/(\d+)\s*x\s*(\d+)/i);
                        if (match) {
                            const widthCm = parseInt(match[1]);
                            const heightCm = parseInt(match[2]);
                            w = Math.round(widthCm * 0.5);
                            h = Math.round(heightCm * 0.5);
                        }
                        return { id: sizeStr, w, h };
                      })
                    : PREDEFINED_SIZES;

                  return displaySizes.map(sz => (
                    <div 
                      key={sz.id} 
                      className={`pm-size-item ${selectedSize === sz.id ? 'selected' : ''}`}
                      onClick={() => { setSelectedSize(sz.id); setSizeError(false); }}
                      style={{ width: `${sz.w}px` }}
                    >
                      <div className="pm-size-box" style={{ width: `${sz.w}px`, height: `${sz.h}px` }}></div>
                      <div className="pm-size-label">{sz.id}</div>
                    </div>
                  ));
                })()}
              </div>
            </>
          )}

          <div className="pm-bottom-actions">
            {isSoldOut && (
              <div className="pm-stock-alert sold-out">
                SOLD OUT
              </div>
            )}
            {!isSoldOut && selectedColorStock !== null && selectedColorStock !== undefined && selectedColorStock > 0 && selectedColorStock <= 5 && (
              <div className="pm-stock-alert low-stock">
                ⚡ Only {selectedColorStock} left in stock!
              </div>
            )}

            <div className="pm-buttons-row">
              <button 
                className="pm-btn-inquire" 
                onClick={handleAddToCart} 
                disabled={isSoldOut} 
                style={isSoldOut ? { opacity: 0.4, cursor: 'not-allowed' } : addedToCart ? { background: '#16a34a' } : {}}
              >
                {isSoldOut ? 'SOLD OUT' : addedToCart ? '✓ ADDED!' : (
                  <><i className="fas fa-shopping-bag" style={{ marginRight: '6px' }}></i>ADD TO CART</>
                )}
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductModal;
