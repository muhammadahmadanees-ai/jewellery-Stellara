"use client";
import React from 'react';
import { useCart } from './CartContext';

const Navbar = ({ onToggleDrawer, onOpenSearch }) => {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <header id="navbar">
      <div className="container nav-container mobile-nav-layout">
        <div className="nav-logo-group">
          <button 
            id="nav-menu-toggle-btn" 
            className="menu-toggle-btn nav-mobile-left" 
            onClick={onToggleDrawer} 
            aria-label="Toggle Menu"
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              marginRight: '15px',
              color: 'var(--text-color)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              transition: 'color 0.2s'
            }}
          >
            <i className="fas fa-bars"></i>
          </button>
          <a href="#" className="logo nav-mobile-center" style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
            <img
              src="https://demctbygmsrlycyaewwy.supabase.co/storage/v1/object/public/images/site/logo.png"
              alt="Stellara Jewellery Logo"
              className="logo-img"
              style={ { height: '40px', width: 'auto', borderRadius: '4px' } }
            />
            <span className="logo-text" style={ { fontFamily: "var(--font-serif)", fontWeight: 'bold', fontSize: '1.4rem', letterSpacing: '2px' } }>
              <span style={{ color: 'var(--brand-gold)' }}>STELLARA</span>
            </span>
          </a>
        </div>
        <nav>
          <ul className="nav-links pc-only-flex">
            <li><a href="#" id="nav-home-btn">Home</a></li>
            <li><a href="#collections">Collections</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <div className="nav-actions nav-mobile-right">
          <button 
            className="cart-icon-btn" 
            onClick={() => setIsCartOpen(true)} 
            aria-label="Cart"
            style={{ 
              background: 'none', border: 'none', fontSize: '1.35rem', cursor: 'pointer', 
              color: 'var(--text-color)', position: 'relative', padding: '4px 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s'
            }}
          >
            <i className="fas fa-shopping-bag"></i>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '0px',
                background: '#8B1A1A', color: '#fff', fontSize: '0.6rem',
                fontWeight: '700', width: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', lineHeight: '1',
                boxShadow: '0 1px 4px rgba(139,26,26,0.4)'
              }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
