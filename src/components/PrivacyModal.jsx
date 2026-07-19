"use client";
import React from 'react';

const PrivacyModal = ({ onClose }) => {
  return (
    <div className="modal show" onClick={onClose} style={{ zIndex: 10000, alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', padding: '2rem', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Privacy Policy</h2>
          <button className="close-btn" onClick={onClose} style={{ position: 'static', padding: '0', fontSize: '1.5rem' }}>&times;</button>
        </div>
        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
          <p style={{ fontStyle: 'italic', color: '#777', marginBottom: '1.5rem' }}>Last updated: July 17, 2026</p>
          
          <p>STELLARA (&quot;STELLARA,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and your rights, when you visit our website or place an order.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Information We Collect</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li><strong>Personal details:</strong> name, phone number, email address, and delivery address</li>
            <li><strong>Order details:</strong> items purchased, order value, and payment method selected</li>
            <li><strong>Payment information:</strong> processed securely through our payment partner; STELLARA does not store your full card or banking details</li>
            <li><strong>Technical data:</strong> IP address, browser type, and device information collected automatically when you browse our website</li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>How We Use Your Information</h4>
          <p>We use your information to:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>Process, confirm, and deliver your orders</li>
            <li>Send order updates and delivery notifications</li>
            <li>Respond to your questions and customer service requests</li>
            <li>Improve our website, products, and overall shopping experience</li>
            <li>Share promotions or offers, only if you've opted in to receive them</li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Sharing of Information</h4>
          <p>We share your information only where necessary to fulfill your order:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>With our courier/delivery partners, to deliver your order to you</li>
            <li>With our payment gateway provider, to process payments securely</li>
          </ul>
          <p>We do not sell, rent, or trade your personal information to third parties.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Data Security</h4>
          <p>We take reasonable measures to protect your personal information from unauthorized access or disclosure. However, no method of online transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Your Rights</h4>
          <p>You may contact us at any time to request access to, correction of, or deletion of your personal information held by us.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Changes to This Policy</h4>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page along with the updated date.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Contact Us</h4>
          <p>If you have questions about this Privacy Policy, reach out to us at:</p>
          <p>
            📧 <a href="mailto:jewellerystellara@gmail.com" style={{ color: 'var(--primary-color)' }}>jewellerystellara@gmail.com</a> | 📞 <a href="tel:03164934759" style={{ color: 'var(--primary-color)' }}>0316-4934759</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
