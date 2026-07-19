"use client";
import React, { useEffect, useRef } from 'react';

const Hero = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }, []);

  return (
    <section className="hero" style={{ minHeight: '100vh', overflow: 'hidden', paddingTop: '90px', paddingBottom: '30px' }}>
      <div className="hero-overlay"></div>
      <div className="container hero-split-container" style={{ minHeight: 'calc(100vh - 150px)', alignItems: 'stretch' }}>
        <div className="hero-content" style={{ paddingRight: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h1 className="fade-in-up hero-title" style={{
            fontFamily: "var(--font-serif)",
            letterSpacing: '1px',
            fontSize: '2.5rem',
            lineHeight: '1.2',
            fontWeight: '800',
            textTransform: 'uppercase',
            marginBottom: '0.8rem',
            background: 'none',
            WebkitTextFillColor: 'initial',
            backgroundClip: 'unset'
          }}>
            <span style={{ color: 'var(--brand-gold)', whiteSpace: 'nowrap' }}>Stellar Jewellery,</span>
            <br />
            <span style={{ color: '#1a1a1c', whiteSpace: 'nowrap' }}>Starry Nights.</span>
          </h1>
          <div className="hero-text-body fade-in-up delay-1" style={{ fontSize: '0.9rem', lineHeight: '1.55', color: '#444', fontFamily: "var(--font-primary)", marginBottom: '1.2rem', textAlign: 'left' }}>
            <p style={{ marginBottom: '0.6rem' }}>
              <strong>Stellar jewellery, starry nights</strong> — the feeling behind every piece we offer. In a world where gold jewellery feels increasingly out of reach, we believe elegance shouldn't be reserved for the few.
            </p>
            <p style={{ marginBottom: '0.6rem' }}>
              <strong>STELLARA</strong> began with a simple belief: that the shine of gold, the joy of wearing something beautiful, shouldn't come locked behind a price or upkeep few can justify for everyday wear. Real gold asks you to be careful — with money, with maintenance, with where you dare to wear it.
            </p>
            <p style={{ marginBottom: '0.6rem' }}>
              Today, most jewellery is bought once, worn cautiously, and kept away in boxes — saved for &quot;special occasions&quot; instead of everyday joy.
            </p>
            <p style={{ marginBottom: '0' }}>
              <strong>STELLARA</strong> exists to change that. Through premium China gold — crafted with the same shine and weight of elegance, at a fraction of the cost — we create pieces made to be worn, not just kept. Jewellery for your everyday, and your starriest nights alike.
            </p>
          </div>
          <div className="hero-ctas fade-in-up delay-2" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#collections" className="btn btn-primary" style={{ padding: '0.7rem 1.8rem', fontSize: '0.85rem', fontWeight: '600' }}>Explore Collections</a>
          </div>
        </div>
        <div className="hero-video-wrapper" style={{ height: 'auto', alignSelf: 'stretch', display: 'flex' }}>
          <img src="https://demctbygmsrlycyaewwy.supabase.co/storage/v1/object/public/images/site/hero.png" alt="Stellara Showcase" style={ { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' } } />
        </div>
      </div>
    </section>
  );
};

export default Hero;
