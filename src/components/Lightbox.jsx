"use client";
import React from 'react';

const Lightbox = ({ img, onClose }) => {
  return (
    <div className="modal show" style={{ zIndex: 3000, alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={onClose}>
      <span className="close-btn" onClick={onClose} style={{ position: 'fixed', top: '20px', right: '30px', fontSize: '40px', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>&times;</span>
      <img src={img} alt="Full screen" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', cursor: 'zoom-out' }} onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

export default Lightbox;
