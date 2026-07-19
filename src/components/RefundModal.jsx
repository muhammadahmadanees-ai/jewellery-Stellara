"use client";
import React from 'react';

const RefundModal = ({ onClose }) => {
  return (
    <div className="modal show" onClick={onClose} style={{ zIndex: 10000, alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '800px', padding: '2rem', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Refund & Return Policy</h2>
          <button className="close-btn" onClick={onClose} style={{ position: 'static', padding: '0', fontSize: '1.5rem' }}>&times;</button>
        </div>
        <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>
          <p style={{ fontStyle: 'italic', color: '#777', marginBottom: '1.5rem' }}>Last updated: July 19, 2026</p>
          
          <p>At STELLARA, we strive to ensure our high-shine, premium China gold finish jewellery exceeds your expectations. Please review our policy on returns, exchanges, and refunds below.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. Eligibility for Returns & Exchanges</h4>
          <p>We accept requests for returns or exchanges <strong>only</strong> under the following circumstances:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>The item was received broken or damaged during transit.</li>
            <li>The item has a clear manufacturing or craftsmanship defect.</li>
            <li>The item received is incorrect or does not match your ordered order specification.</li>
          </ul>
          <p><strong>Note:</strong> We do not accept returns or exchanges for change of mind.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Timeframe for Claims</h4>
          <p>Any claim regarding broken or defective items must be submitted <strong>within 7 days</strong> of the delivery date. Claims made after this 7-day period will unfortunately not be eligible for replacement or refund.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>3. Required Proof of Damage</h4>
          <p>To process your claim successfully, we require clear proof of the defect or damage. Please provide:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>High-resolution photos of the damaged item.</li>
            <li>A brief unboxing video or clip clearly showing the damage upon receipt.</li>
            <li>Your order/bill number or customer name.</li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>4. Exclusions & Product Care</h4>
          <p>Please note that our policy does not cover damage resulting from misuse, general wear and tear, or improper care. Specifically:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li><strong>Perfumes & Chemicals:</strong> Avoid spraying perfumes, hairsprays, or body lotions directly onto the jewellery. Always apply cosmetics and perfumes first, and allow them to dry fully before putting on your jewellery.</li>
            <li><strong>Water Exposure:</strong> Avoid exposing the jewellery to water, showers, swimming pools, or sweat.</li>
          </ul>
          <p>Discoloration or damage caused by chemical contact or water exposure is not covered under our defect return policy.</p>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>5. Resolution & Refund Process</h4>
          <p>Once your claim is submitted and approved by our support team, we will resolve it through one of the following methods:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li><strong>Replacement:</strong> We will ship a brand-new replacement of the same item to you free of charge.</li>
            <li><strong>Refund:</strong> If the item is out of stock or you prefer a refund:
              <ul style={{ paddingLeft: '20px', marginTop: '0.5rem' }}>
                <li>For Cash on Delivery (COD) orders, the refund will be sent via bank transfer or digital wallet (JazzCash/Easypaisa).</li>
                <li>For online prepaid orders, the refund will be credited back to your original payment method.</li>
              </ul>
              Please allow <strong>5 to 7 working days</strong> for the refunded amount to reflect in your account.
            </li>
          </ul>

          <h4 style={{ color: 'var(--primary-color)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Contact Us</h4>
          <p>To initiate a return, exchange, or refund claim, please contact our support team at:</p>
          <p>
            📧 <a href="mailto:jewellerystellara@gmail.com" style={{ color: 'var(--primary-color)' }}>jewellerystellara@gmail.com</a> | 📞 <a href="tel:03164934759" style={{ color: 'var(--primary-color)' }}>0316-4934759</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
