"use client";
import React from 'react';
import { supabase } from '../supabase';

const Contact = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.style.opacity = '0.8';

    const formData = new FormData(form);
    formData.append("access_key", "c4577e68-950f-4baf-970c-f2149c69a47a");
    formData.append("subject", "New General Inquiry - STELLARA");

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      const json = await response.json();

      // Save to Supabase Orders Table (Non-blocking)
      try {
        await supabase.from('orders').insert([{
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          type: 'General Inquiry',
          status: 'new'
        }]);
      } catch (dbError) {
        console.warn("Database logging failed:", dbError);
      }

      if (response.status === 200) {
        btn.textContent = 'Sent Successfully!';
        btn.style.backgroundColor = '#4caf50';
        btn.style.color = 'white';
        form.reset();
        setTimeout(() => {
          btn.textContent = 'Send Inquiry';
          btn.style.backgroundColor = '';
          btn.style.color = '';
          btn.style.opacity = '1';
        }, 3000);
      } else {
        alert(json.message);
        btn.textContent = 'Send Inquiry';
        btn.style.opacity = '1';
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
      btn.textContent = 'Send Inquiry';
      btn.style.opacity = '1';
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container contact-container">
        <div className="contact-info">
          <h2>Contact Us</h2>
          <ul className="contact-details">
            <li><strong>Email:</strong> jewellerystellara@gmail.com</li>
            <li><strong>Phone:</strong> 03164934759</li>
          </ul>
          <div className="about-stats" style={{ marginTop: '20px', justifyContent: 'flex-start' }}>
            <a href={`https://wa.me/923164934759?text=${encodeURIComponent("Hello Stellara Jewellery! 👋 I visited your website and I'm interested in placing an order. Could you please help me with your jewellery collections, pricing, and availability? Thank you!")}`} target="_blank" rel="noreferrer" className="social-icon whatsapp">
              <i className="fab fa-whatsapp"></i>
            </a>
            <a href="https://www.instagram.com/jewellerystellara" target="_blank" rel="noreferrer" className="social-icon instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href={`https://mail.google.com/mail/?view=cm&to=jewellerystellara@gmail.com&su=${encodeURIComponent("Inquiry about Stellara Jewellery")}&body=${encodeURIComponent("Hello Stellara Jewellery! 👋\n\nI visited your website and I am interested in inquiring about your jewellery collections, pricing, and availability.\n\nThank you!")}`} target="_blank" rel="noreferrer" className="social-icon gmail">
              <i className="fas fa-envelope"></i>
            </a>
          </div>
        </div>
        <div className="contact-form">
          <form id="inquiry-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Your Name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Your Email" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows="4" placeholder="How can we help you?" required></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-block">Send Inquiry</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
