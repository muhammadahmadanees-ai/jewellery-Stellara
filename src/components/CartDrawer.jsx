"use client";
import React from 'react';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';
import { parseProductImages } from './imageHelper';
import './CartDrawer.css';

const CartDrawer = () => {
  const { cart, removeFromCart, updateQuantity, cartCount, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} 
        onClick={() => setIsCartOpen(false)} 
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h3>Your Cart ({cartCount})</h3>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>&times;</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <i className="fas fa-shopping-bag"></i>
            <h4>Your cart is empty</h4>
            <p>Explore our collections and find something you love.</p>
            <button className="cart-empty-btn" onClick={() => setIsCartOpen(false)}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {cart.map((item, index) => {
                const parsedImg = parseProductImages(item.product.img);
                const selectedColor = item.size && item.size.startsWith('Color:')
                  ? item.size.replace('Color:', '').trim()
                  : null;
                const itemImg = (selectedColor && parsedImg.colors && parsedImg.colors[selectedColor]) || parsedImg.defaultImg;

                return (
                  <div className="cart-item" key={`${item.product.id}-${item.size || 'no-size'}-${index}`}>
                    {itemImg ? (
                      <img src={itemImg} alt={item.product.name} className="cart-item-img" />
                    ) : (
                      <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.7rem' }}>
                        No Image
                      </div>
                    )}
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.name}</div>
                    {item.size && <div className="cart-item-size">{item.size.startsWith('Color:') ? item.size : `Size: ${item.size}`}</div>}
                    <div className="cart-item-price">
                      {item.product.discount_price ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '0.85em' }}>
                            {formatPrice(item.product.price)}
                          </span>
                          <span style={{ color: '#8B1A1A', fontWeight: 'bold' }}>
                            {formatPrice(item.product.discount_price)}
                          </span>
                        </>
                      ) : (
                        formatPrice(item.product.price)
                      )}
                    </div>
                    <div className="cart-item-qty">
                      <button onClick={() => updateQuantity(index, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(index)} title="Remove">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  </div>
                );
              })}
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-total-row">
                <span className="cart-total-label">Subtotal</span>
                <span className="cart-total-amount">{formatPrice(cartTotal)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
