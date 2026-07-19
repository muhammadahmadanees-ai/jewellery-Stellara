"use client";
import React, { useState } from 'react';
import TermsModal from './TermsModal';
import PrivacyModal from './PrivacyModal';
import RefundModal from './RefundModal';

const Footer = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  return (
    <footer>
      <div className="container footer-content">
        <div className="footer-brand">
          <h3>Stellara Jewellery</h3>
          <p>&copy; 2026 Stellara Jewellery. All rights reserved.</p>
        </div>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }}>Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsRefundOpen(true); }}>Refund Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }}>Terms of Service</a>
          <a href="https://www.instagram.com/jewellerystellara" target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </div>
      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
      {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} />}
      {isRefundOpen && <RefundModal onClose={() => setIsRefundOpen(false)} />}
    </footer>
  );
};

export default Footer;
