"use client";
import React from 'react';

const TermsModal = ({ onClose }) => {
  return (
    <div className="modal show" onClick={onClose} style={{ zIndex: 10000, alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', padding: '2rem', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Terms of Service</h2>
          <button className="close-btn" onClick={onClose} style={{ position: 'static', padding: '0', fontSize: '1.5rem' }}>&times;</button>
        </div>
        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
          <p style={{ fontStyle: 'italic', color: '#777', marginBottom: '1.5rem' }}>Last updated: July 17, 2026</p>
          
          <p>By accessing our website or placing an order with STELLARA, you agree to the following Terms of Service. Please read them carefully.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>About Our Products</h4>
          <p>STELLARA jewellery is crafted with a <strong>premium China gold finish</strong> — a durable, high-shine gold-polish alloy that captures the timeless elegance of gold, without the weight, upkeep, or cost of solid gold. Each piece is finished with care, so slight variations in colour and shine are completely natural, and actual tones may appear marginally different from website images due to screen display and lighting.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Pricing & Payment</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>All prices are listed in PKR and are subject to change without prior notice</li>
            <li>We accept Cash on Delivery (COD) and online card/bank payment</li>
            <li>Orders are confirmed only after successful payment or COD order verification</li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Order Processing & Delivery</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>Orders are processed and dispatched after confirmation</li>
            <li>Standard delivery takes <strong>4 to 5 working days</strong> from the date of order confirmation</li>
            <li>Delivery timelines may occasionally vary due to courier delays, weather, or public holidays, which are outside our control</li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Cancellations</h4>
          <p>Orders can be cancelled free of charge before they are dispatched. Once an order has been dispatched for delivery, it can no longer be cancelled.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Returns, Exchanges & Refunds</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>We accept returns or exchanges <strong>only</strong> for items received broken or with a manufacturing defect</li>
            <li>Requests must be made <strong>within 7 days of delivery</strong>, along with clear photos or a video of the issue</li>
            <li>Change-of-mind returns are not accepted</li>
            <li>Approved claims will be resolved via replacement or refund</li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Product Care & Warranty Disclaimer</h4>
          <p>To keep your jewellery looking its best, avoid applying perfume, lotion, or other chemical sprays directly onto it — apply perfume first, then wear your jewellery. Damage caused by direct perfume/chemical contact, water exposure, or improper care is considered misuse and is <strong>not covered</strong> under our breakage/defect return policy.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Limitation of Liability</h4>
          <p>STELLARA is not liable for indirect damages, delivery delays caused by third-party couriers, or damage resulting from misuse of the product after delivery.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Intellectual Property</h4>
          <p>All content on this website — including images, product designs, logos, and text — is owned by STELLARA and may not be copied or used without our written permission.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Governing Law</h4>
          <p>These Terms are governed by the laws of Pakistan.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Changes to These Terms</h4>
          <p>We may update these Terms of Service at any time. Continued use of our website after changes are posted constitutes your acceptance of the updated terms.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Contact Us</h4>
          <p>For any questions regarding these Terms, contact us at:</p>
          <p>
            📧 <a href="mailto:jewellerystellara@gmail.com" style={{ color: 'var(--primary-color)' }}>jewellerystellara@gmail.com</a> | 📞 <a href="tel:03164934759" style={{ color: 'var(--primary-color)' }}>0316-4934759</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
