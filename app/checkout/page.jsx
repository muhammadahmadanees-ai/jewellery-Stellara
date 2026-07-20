"use client";
import React, { useState } from 'react';
import { useCart } from '../../src/components/CartContext';
import { supabase } from '../../src/supabase';
import { useRouter } from 'next/navigation';
import { parseProductImages } from '../../src/components/imageHelper';

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod | card
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');

  const handleReceiptChange = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Store order info for confirmation page
  const [orderInfo, setOrderInfo] = useState(null);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setStatus('sending');

    const shippingCharge = paymentMethod === 'cod' ? 200 : 0;
    const finalTotal = cartTotal + shippingCharge;

    // Generate a confirmation number
    const confirmationNum = `#${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Upload receipt screenshot if payment method is advance card/SadaPay payment
    let receiptUrl = '';
    if (paymentMethod === 'card') {
      if (!receiptFile) {
        alert("Please upload your payment receipt screenshot to complete advance payment!");
        setStatus('idle');
        return;
      }

      try {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}_receipt.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, receiptFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        receiptUrl = data.publicUrl;
      } catch (err) {
        console.error("Storage upload failed:", err);
        alert("Failed to upload screenshot. Please try again.");
        setStatus('error');
        return;
      }
    }

    // Save order info before clearing cart
    const savedOrderInfo = {
      confirmationNum,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      notes: formData.notes,
      paymentMethod,
      shippingCharge,
      subtotal: cartTotal,
      total: finalTotal,
      items: cart.map(item => ({
        name: item.product.name,
        img: item.product.img,
        size: item.size,
        quantity: item.quantity,
        price: parseFloat(item.product.price || 0),
        lineTotal: parseFloat(item.product.price || 0) * item.quantity
      })),
      date: new Date()
    };

    try {
      // Insert each cart item as a separate order row
      const orderRows = cart.map(item => ({
        product_id: item.product.id || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        collection: item.product.collection || '',
        tile: `${item.product.name}${item.size ? ` (Size: ${item.size})` : ''}`,
        quantity: String(item.quantity),
        address: formData.address,
        city: formData.city,
        message: `Confirmation: ${confirmationNum}\nPayment Method: ${paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'SadaPay / Bank Transfer'}\n${receiptUrl ? `Payment Receipt: ${receiptUrl}\n` : ''}Shipping Charge: ${shippingCharge > 0 ? `Rs. ${shippingCharge}` : 'Free'}\nNotes: ${formData.notes || 'None'}`,
        type: `Cart Order (${confirmationNum})`,
        status: 'new'
      }));

      const { error: dbError } = await supabase.from('orders').insert(orderRows);
      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Send email notification via Web3Forms
      try {
        const itemsSummary = cart.map(item =>
          `• ${item.product.name}${item.size ? ` (Size: ${item.size})` : ''} × ${item.quantity} — ${formatPrice(parseFloat(item.product.price || 0) * item.quantity)}`
        ).join('\n');

        const emailData = new FormData();
        emailData.append("access_key", "c4577e68-950f-4baf-970c-f2149c69a47a");
        emailData.append("subject", `New Cart Order - ${formData.name}`);
        emailData.append("name", formData.name);
        emailData.append("email", formData.email);
        emailData.append("phone", formData.phone || 'N/A');
        emailData.append("address", `${formData.address}, ${formData.city}`);
        emailData.append("message", `ORDER ITEMS:\n${itemsSummary}\n\nPAYMENT METHOD: ${paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'SadaPay / Bank Transfer'}\n${receiptUrl ? `PAYMENT RECEIPT: ${receiptUrl}\n` : ''}SHIPPING: ${shippingCharge > 0 ? `Rs. ${shippingCharge}` : 'Free'}\nTOTAL: ${formatPrice(finalTotal)}\n\nNOTES: ${formData.notes || 'None'}`);

        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: emailData
        });
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr);
      }

      setOrderInfo(savedOrderInfo);
      setStatus('success');
      clearCart();
    } catch (error) {
      console.error('Order placement failed:', error);
      setStatus('error');
    }
  };

  if (status === 'success' && orderInfo) {
    const dateStr = orderInfo.date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = orderInfo.date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    const firstName = orderInfo.name.split(' ')[0];

    return (
      <div style={{
        minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Outfit', sans-serif",
        paddingTop: '0', paddingBottom: '60px'
      }}>
        {/* Top Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #8B1A1A 0%, #a52525 50%, #8B1A1A 100%)',
          padding: '24px 0', textAlign: 'center', marginBottom: '0'
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: '1.6rem',
            letterSpacing: '3px', margin: 0, fontWeight: '400'
          }}>STELLARA</h1>
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>

          {/* Confirmation Header */}
          <div style={{
            background: '#fff', padding: '32px 28px', borderBottom: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#16a34a', fontSize: '1.4rem', flexShrink: 0
              }}>✓</div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 2px 0' }}>
                  Confirmation {orderInfo.confirmationNum}
                </p>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
                  fontWeight: '600', color: '#1a1a1a', margin: 0
                }}>
                  Thank you, {firstName}!
                </h2>
              </div>
            </div>
          </div>

          {/* Confirmation Call / Payment Message */}
          {orderInfo.paymentMethod === 'cod' ? (
            <div style={{
              background: '#fff', padding: '24px 28px',
              borderBottom: '1px solid #eee'
            }}>
              <div style={{
                border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '22px 24px'
              }}>
                <h3 style={{
                  fontSize: '1.05rem', fontWeight: '700', color: '#1a1a1a',
                  marginBottom: '10px', margin: '0 0 10px 0'
                }}>
                  Please Confirm Your Order
                </h3>
                <p style={{ color: '#555', fontSize: '0.92rem', lineHeight: '1.7', margin: 0 }}>
                  Dear customer, we will send you an order confirmation message on your WhatsApp number.
                  Kindly reply with <strong>Yes</strong> to confirm your order and get faster delivery.
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fff', padding: '24px 28px',
              borderBottom: '1px solid #eee'
            }}>
              <div style={{
                border: '1.5px solid #c5a880', borderRadius: '10px', padding: '22px 24px',
                background: 'rgba(197, 168, 128, 0.03)'
              }}>
                <h3 style={{
                  fontSize: '1.05rem', fontWeight: '700', color: '#8B1A1A',
                  marginBottom: '10px', margin: '0 0 10px 0'
                }}>
                  <i className="fas fa-receipt" style={{ marginRight: '8px', color: '#c5a880' }}></i>
                  Advance Payment Receipt Received
                </h3>
                <p style={{ color: '#555', fontSize: '0.92rem', lineHeight: '1.7', margin: 0 }}>
                  Dear customer, we have received your payment receipt screenshot.
                  Our team will verify the transfer in our SadaPay account shortly.
                  Once verified, your order status will be updated to <strong>Confirmed</strong>, and you will receive a confirmation email.
                  Thank you for your patience!
                </p>
              </div>
            </div>
          )}

          {/* Order Confirmed / Updates */}
          <div style={{ background: '#fff', padding: '0 28px', borderBottom: '1px solid #eee' }}>
            <div style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' }}>
                {orderInfo.paymentMethod === 'cod' ? 'Your order is being processed' : 'Your order is pending payment'}
              </h4>
              <p style={{ color: '#666', fontSize: '0.88rem', margin: 0 }}>
                {orderInfo.paymentMethod === 'cod'
                  ? 'You will receive a confirmation text soon'
                  : 'Complete payment to get your order confirmed'}
              </p>
            </div>
            <div style={{ padding: '20px 0' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px 0' }}>
                Order updates
              </h4>
              <p style={{ color: '#666', fontSize: '0.88rem', margin: 0 }}>
                You'll get shipping and delivery updates by email.
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div style={{
            background: '#fff', padding: '28px',
            borderBottom: '1px solid #eee'
          }}>
            <h3 style={{
              fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a',
              margin: '0 0 20px 0'
            }}>
              Order details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Contact info */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Contact information
                </h4>
                <p style={{ color: '#555', fontSize: '0.88rem', margin: '0 0 2px 0' }}>{orderInfo.phone}</p>
                {orderInfo.email && <p style={{ color: '#555', fontSize: '0.88rem', margin: 0 }}>{orderInfo.email}</p>}
              </div>

              {/* Payment method */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Payment method
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {orderInfo.paymentMethod === 'cod' ? (
                    <>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', color: '#16a34a'
                      }}>
                        <i className="fas fa-money-bill-wave"></i>
                      </div>
                      <span style={{ color: '#555', fontSize: '0.88rem' }}>
                        Cash on Delivery (COD) · {formatPrice(orderInfo.total)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: '#e0f2fe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', color: '#0284c7'
                      }}>
                        <i className="far fa-credit-card"></i>
                      </div>
                      <span style={{ color: '#555', fontSize: '0.88rem' }}>
                        Card Payment · {formatPrice(orderInfo.total)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Shipping address */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Shipping address
                </h4>
                <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                  {orderInfo.name}<br />
                  {orderInfo.address}<br />
                  {orderInfo.city}<br />
                  Pakistan<br />
                  {orderInfo.phone}
                </p>
              </div>

              {/* Billing address */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                  Billing address
                </h4>
                <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                  {orderInfo.name}<br />
                  {orderInfo.address}<br />
                  {orderInfo.city}<br />
                  Pakistan<br />
                  {orderInfo.phone}
                </p>
              </div>
            </div>

            {/* Shipping method */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
                Shipping method
              </h4>
              <p style={{ color: '#555', fontSize: '0.88rem', margin: 0 }}>
                {orderInfo.paymentMethod === 'cod'
                  ? 'Standard Delivery · Rs. 200'
                  : 'Standard Delivery · Free'}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{
            background: '#fff', padding: '28px',
            borderBottom: '1px solid #eee'
          }}>
            <h3 style={{
              fontSize: '1rem', fontWeight: '700', color: '#1a1a1a',
              margin: '0 0 20px 0', paddingBottom: '14px', borderBottom: '1px solid #f0f0f0'
            }}>
              Order Summary
            </h3>
            {orderInfo.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center'
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {item.img ? (
                    <img src={item.img} alt={item.name} style={{
                      width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover',
                      border: '1px solid #eee'
                    }} />
                  ) : (
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '8px', background: '#f5f5f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', color: '#ccc'
                    }}>No Img</div>
                  )}
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#888', color: '#fff', width: '20px', height: '20px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: '700'
                  }}>{item.quantity}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600', fontSize: '0.88rem', color: '#1a1a1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{item.name}</div>
                  {item.size && <div style={{ fontSize: '0.75rem', color: '#888' }}>Size: {item.size}</div>}
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                  {formatPrice(item.lineTotal)}
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Subtotal</span>
                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{formatPrice(orderInfo.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Shipping</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: orderInfo.shippingCharge > 0 ? '#1a1a1a' : '#16a34a' }}>
                  {orderInfo.shippingCharge > 0 ? formatPrice(orderInfo.shippingCharge) : 'Free'}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', paddingTop: '14px',
                borderTop: '1px solid #eee', marginTop: '8px'
              }}>
                <span style={{ fontWeight: '700', fontSize: '1.15rem', color: '#1a1a1a' }}>Total</span>
                <span style={{ fontWeight: '700', fontSize: '1.15rem', color: '#8B1A1A' }}>
                  {formatPrice(orderInfo.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Continue Shopping Button */}
          <div style={{ padding: '28px', background: '#fff', borderRadius: '0 0 0 0' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%', padding: '16px', background: '#8B1A1A', color: '#fff',
                border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700',
                letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#6d1414'}
              onMouseOut={(e) => e.target.style.background = '#8B1A1A'}
            >
              Continue Shopping
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '24px 20px' }}>
            <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
              Need help? <a href="/#contact" style={{ color: '#8B1A1A', textDecoration: 'none', fontWeight: '500' }}>Contact us</a>
            </p>
          </div>
        </div>

        {/* Responsive */}
        <style jsx>{`
          @media (max-width: 600px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#fafafc', fontFamily: "'Outfit', sans-serif",
      paddingTop: '40px', paddingBottom: '60px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none', border: '1px solid #ddd', borderRadius: '8px',
              padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#555',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: '600',
            color: '#1a1a1a', margin: 0
          }}>
            Checkout
          </h1>
        </div>

        {cart.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px', background: '#fff',
            borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
          }}>
            <i className="fas fa-shopping-bag" style={{ fontSize: '3rem', color: '#ddd', marginBottom: '20px', display: 'block' }}></i>
            <h3 style={{ color: '#555', marginBottom: '12px' }}>Your cart is empty</h3>
            <p style={{ color: '#999' }}>Add some items before checking out.</p>
            <button
              onClick={() => router.push('/')}
              style={{
                marginTop: '16px', padding: '12px 28px', background: '#1a1a1a', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500',
                letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem'
              }}
            >
              Browse Collections
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

            {/* Left — Customer Form */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '36px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
                marginBottom: '24px', color: '#1a1a1a', fontWeight: '600'
              }}>
                Customer Details
              </h3>
              <form onSubmit={handlePlaceOrder}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name *</label>
                    <input
                      type="text" name="name" required value={formData.name} onChange={handleChange}
                      placeholder="Your full name"
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email *</label>
                    <input
                      type="email" name="email" required value={formData.email} onChange={handleChange}
                      placeholder="your@email.com"
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone / WhatsApp *</label>
                    <input
                      type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      placeholder="+92 ..."
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City *</label>
                    <input
                      type="text" name="city" required value={formData.city} onChange={handleChange}
                      placeholder="Your city"
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipping Address *</label>
                  <input
                    type="text" name="address" required value={formData.address} onChange={handleChange}
                    placeholder="Full street address"
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none' }}
                    onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                 <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Card Payment Option */}
                    <div
                      onClick={() => setPaymentMethod('card')}
                      style={{
                        padding: '16px',
                        border: `2px solid ${paymentMethod === 'card' ? '#c5a880' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        backgroundColor: paymentMethod === 'card' ? 'rgba(197, 168, 128, 0.05)' : '#fff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', color: paymentMethod === 'card' ? '#1a1a1a' : '#555' }}>
                        <i className="far fa-credit-card" style={{ fontSize: '1.1rem', color: paymentMethod === 'card' ? '#c5a880' : '#888' }}></i>
                        SadaPay / Bank Transfer
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '500' }}>Free Delivery (Advance)</span>
                    </div>

                    {/* Cash on Delivery Option */}
                    <div
                      onClick={() => setPaymentMethod('cod')}
                      style={{
                        padding: '16px',
                        border: `2px solid ${paymentMethod === 'cod' ? '#c5a880' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        backgroundColor: paymentMethod === 'cod' ? 'rgba(197, 168, 128, 0.05)' : '#fff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', color: paymentMethod === 'cod' ? '#1a1a1a' : '#555' }}>
                        <i className="fas fa-truck-loading" style={{ fontSize: '1.1rem', color: paymentMethod === 'cod' ? '#c5a880' : '#888' }}></i>
                        Cash on Delivery
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>Delivery: Rs. 200</span>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      border: '1px dashed #c5a880',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(197, 168, 128, 0.02)',
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a' }}>
                        Advance Payment via SadaPay
                      </h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#555', lineHeight: '1.6' }}>
                        Please transfer the total amount of <strong>{formatPrice(cartTotal)}</strong> to our SadaPay account below, and upload the screenshot of the receipt:
                      </p>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '20px',
                        background: '#fff',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #eee'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: '600' }}>Bank Name</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1a1a1a' }}>SadaPay</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: '600' }}>Account Title</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1a1a1a' }}>Muhammad Ahmad Anees</div>
                        </div>
                        <div style={{ gridColumn: '1 / span 2', borderTop: '1px solid #f5f5f5', paddingTop: '10px' }}>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: '600' }}>Account Number / Phone</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#8B1A1A', letterSpacing: '1px' }}>03164934759</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('03164934759');
                                alert('Account number copied to clipboard!');
                              }}
                              style={{
                                padding: '4px 8px', fontSize: '0.75rem', background: '#f5f5f5', border: '1px solid #ddd',
                                borderRadius: '4px', cursor: 'pointer', color: '#555'
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* File Uploader */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Upload Receipt Screenshot *
                        </label>
                        <div style={{
                          border: '2px dashed #ddd',
                          borderRadius: '10px',
                          padding: '20px',
                          textAlign: 'center',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'border-color 0.2s'
                        }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              handleReceiptChange(file);
                            }
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file) handleReceiptChange(file);
                            }}
                            style={{
                              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                              opacity: 0, cursor: 'pointer'
                            }}
                          />
                          {!receiptPreview ? (
                            <div>
                              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.8rem', color: '#aaa', marginBottom: '8px' }}></i>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                Drag & drop or <strong>click to upload</strong> screenshot
                              </p>
                              <span style={{ fontSize: '0.75rem', color: '#999' }}>PNG, JPG, JPEG, WEBP up to 5MB</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                              <img
                                src={receiptPreview}
                                alt="Receipt Preview"
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                              />
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#333', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {receiptFile?.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                  {(receiptFile?.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setReceiptFile(null);
                                  setReceiptPreview('');
                                }}
                                style={{
                                  background: '#fee2e2', border: 'none', borderRadius: '6px',
                                  padding: '6px 10px', color: '#dc2626', fontSize: '0.75rem',
                                  fontWeight: '600', cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Notes</label>
                  <textarea
                    name="notes" rows="3" value={formData.notes} onChange={handleChange}
                    placeholder="Any special requests or notes..."
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', transition: 'border-color 0.2s', outline: 'none' }}
                    onFocus={(e) => e.target.style.borderColor = '#c5a880'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending' || (paymentMethod === 'card' && !receiptFile)}
                  style={{
                    width: '100%', padding: '16px', background: '#8B1A1A', color: '#fff',
                    border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700',
                    letterSpacing: '2px', textTransform: 'uppercase', cursor: (status === 'sending' || (paymentMethod === 'card' && !receiptFile)) ? 'not-allowed' : 'pointer',
                    opacity: (status === 'sending' || (paymentMethod === 'card' && !receiptFile)) ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  {status === 'sending' ? 'Placing Order...' : (paymentMethod === 'card' && !receiptFile) ? 'Upload Receipt to Place Order' : status === 'error' ? 'Try Again' : 'Place Order'}
                </button>
                {status === 'error' && (
                  <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center' }}>
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            </div>

            {/* Right — Order Summary */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '28px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: '20px'
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: '1.2rem',
                marginBottom: '20px', color: '#1a1a1a', fontWeight: '600',
                paddingBottom: '14px', borderBottom: '1px solid #f0f0f0'
              }}>
                Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </h3>

              <div style={{ maxHeight: '340px', overflowY: 'auto', marginBottom: '20px' }}>
                {cart.map((item, index) => {
                  const parsedImg = parseProductImages(item.product.img);
                  const selectedColor = item.size && item.size.startsWith('Color:')
                    ? item.size.replace('Color:', '').trim()
                    : null;
                  const itemImg = (selectedColor && parsedImg.colors && parsedImg.colors[selectedColor]) || parsedImg.defaultImg;

                  return (
                    <div key={index} style={{
                      display: 'flex', gap: '12px', marginBottom: '16px',
                      paddingBottom: '16px', borderBottom: '1px solid #f5f5f5'
                    }}>
                      {itemImg ? (
                        <img
                          src={itemImg} alt={item.product.name}
                          style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }}
                        />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.65rem' }}>
                          No Image
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product.name}
                        </div>
                        {item.size && (
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>Size: {item.size}</div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#8B1A1A', whiteSpace: 'nowrap' }}>
                        {formatPrice(parseFloat(item.product.price || 0) * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>Subtotal</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{formatPrice(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>Shipping</span>
                  {paymentMethod === 'cod' ? (
                    <span style={{ fontSize: '0.85rem', color: '#1a1a1a', fontWeight: '600' }}>Rs. 200</span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '600' }}>Free</span>
                  )}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', paddingTop: '12px',
                  borderTop: '1px solid #eee', marginTop: '8px'
                }}>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1a1a1a' }}>Total</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#8B1A1A' }}>
                    {formatPrice(cartTotal + (paymentMethod === 'cod' ? 200 : 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
