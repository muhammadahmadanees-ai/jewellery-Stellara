"use client";
import React from 'react';

const OrderModal = ({ onClose, onOpenSampleForm }) => {
  return (
    <div className="modal show" onClick={(e) => { if(e.target.classList.contains('modal')) onClose(); }}>
      <div className="modal-content order-modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <div style={{ textAlign: 'center', padding: '2.5rem 2rem 1rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Order Samples</h2>
          <div id="order-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="order-option-btn" style={{ background: 'var(--accent-color)', color: '#000', fontSize: '1.1rem', padding: '1.2rem' }} onClick={onOpenSampleForm}>
              <i className="fas fa-file-alt"></i> Fill Sample Request Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
