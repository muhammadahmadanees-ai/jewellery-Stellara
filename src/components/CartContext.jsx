"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stellara_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load cart from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('stellara_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cart, isLoaded]);

  const addToCart = (product, size = null) => {
    let quantityExceeded = false;
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size
      );
      const currentQty = existingIndex >= 0 ? prev[existingIndex].quantity : 0;
      const targetQty = currentQty + 1;

      if (product.stock !== null && product.stock !== undefined) {
        if (targetQty > product.stock) {
          const excess = targetQty - product.stock;
          alert(`You have selected ${excess} more than what we have.`);
          quantityExceeded = true;
          return prev;
        }
      }

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: targetQty
        };
        return updated;
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    if (!quantityExceeded) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, qty) => {
    if (qty < 1) return removeFromCart(index);
    setCart(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const item = prev[index];
      const product = item.product;

      if (product.stock !== null && product.stock !== undefined) {
        if (qty > product.stock) {
          const excess = qty - product.stock;
          alert(`You have selected ${excess} more than what we have.`);
          return prev;
        }
      }

      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce((sum, item) => {
    const effectivePrice = item.product.discount_price !== null && item.product.discount_price !== undefined ? item.product.discount_price : item.product.price;
    const price = parseFloat(effectivePrice) || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
