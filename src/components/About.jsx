"use client";
import React from 'react';

const About = () => {
  return (
    <section id="about" className="section bg-dark">
      <div className="container about-container">
        <div className="about-text">
          <h2>The Art of Jewellery</h2>
          <p>
            At Stellara Jewellery, we believe in the harmony of fine craftsmanship and elegant designs.
            Our exquisite pieces are crafted to inspire beauty, luxury, and affordability.
          </p>
          <p>We handcraft every design with precision, offering stunning collections for every occasion.</p>

          <div className="about-stats">
            <a href={`https://wa.me/923164934759?text=${encodeURIComponent("Hello Stellara Jewellery! 👋 I visited your website and I'm interested in placing an order. Could you please help me with your jewellery collections, pricing, and availability? Thank you!")}`} target="_blank" rel="noreferrer" className="social-icon whatsapp">
              <i className="fab fa-whatsapp"></i>
            </a>
            <a href="https://www.instagram.com/jewellerystellara" target="_blank" rel="noreferrer" className="social-icon instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href={`https://mail.google.com/mail/?view=cm&to=jewellerystellara@gmail.com&su=${encodeURIComponent("Inquiry about Stellara Jewellery")}&body=${encodeURIComponent("Hello Stellara Jewellery! 👋\n\nI visited your website and I am interested in inquiring about your collections.\n\nThank you!")}`} target="_blank" rel="noreferrer" className="social-icon gmail">
              <i className="fas fa-envelope"></i>
            </a>
          </div>
        </div>
        <div className="about-stats">
          <div className="stat">
            <h3>20+</h3>
            <p>Years of Excellence</p>
          </div>
          <div className="stat">
            <h3>100%</h3>
            <p>Recycled Marble</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
