"use client";
import React, { useState } from 'react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        {question} <span className="faq-icon">+</span>
      </button>
      <div className="faq-answer">
        <p dangerouslySetInnerHTML={{ __html: answer }}></p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    { 
      question: 'How long does delivery take?', 
      answer: 'Orders are delivered within <strong>4 to 5 working days</strong> from the date of order confirmation.' 
    },
    { 
      question: 'What is your return policy for breakage or defects?', 
      answer: 'If your jewellery arrives broken or with a manufacturing defect, you can request a return or exchange within <strong>7 days</strong> of delivery. Please share clear photos/video of the issue along with your order details so we can process it quickly.' 
    },
    { 
      question: 'Do you accept returns for reasons other than breakage or defects?', 
      answer: 'Returns are only accepted in cases of breakage or defect within 7 days of delivery. Change-of-mind returns are not accepted.' 
    },
    { 
      question: 'What is STELLARA jewellery made of?', 
      answer: 'Our pieces are crafted using <strong>China gold</strong>, known for its durability, shine, and affordability compared to real gold.' 
    },
    { 
      question: 'How do I take care of my jewellery?', 
      answer: 'Avoid applying perfume, lotion, or any chemical sprays directly on the jewellery, as this can affect its shine and coating over time. Apply perfume first, then wear your jewellery.' 
    },
    { 
      question: 'How should I clean and store my pieces?', 
      answer: 'Wipe gently with a soft, dry cloth after each use. Store in a dry place, ideally in a pouch or box, away from moisture and direct sunlight.' 
    },
    { 
      question: 'Can I exchange my order for a different design or size?', 
      answer: 'Exchanges are only applicable in case of breakage or defect within 7 days. For sizing concerns, please reach out to our support team before ordering to confirm measurements.' 
    },
    { 
      question: 'How do I request a return or report a defect?', 
      answer: 'Simply contact us within 7 days of delivery with your order number and photos/video of the issue, and our team will guide you through the process.' 
    }
  ];

  return (
    <section id="faq" className="section bg-dark">
      <div className="container">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know.</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
