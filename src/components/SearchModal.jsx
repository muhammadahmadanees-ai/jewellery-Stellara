import React, { useState, useEffect, useRef } from 'react';
import { supabase, getAllProductsFromCache } from '../supabase';

const SearchModal = ({ onClose, onOpenProduct }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);

      const allProds = getAllProductsFromCache();
      if (allProds) {
        const lowerQuery = query.toLowerCase();
        const localResults = allProds.filter(p => 
          (p.name || '').toLowerCase().includes(lowerQuery) || 
          (p.refcode || '').toLowerCase().includes(lowerQuery)
        );
        setResults(localResults);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('client_products')
          .select('*')
          .or(`name.ilike.%${query}%,refcode.ilike.%${query}%`);
          
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (rawData) => {
    const data = {};
    for (let key in rawData) {
      const cleanKey = key.toLowerCase().replace(/[\s_]+/g, '');
      data[cleanKey] = rawData[key];
    }
    const product = {
      ...rawData,
      id: rawData.id,
      name: data.name || data.title || 'Unnamed',
      desc: data.description || data.desc || data.detail || '',
      img: data.imageurl || data.imgurl || data.image || data.img || data.pic || '',
      sizesImg: data.sizesimageurl || data.sizeimage || data.sizesimage || data.sizepic || '',
      sizes: data.sizes || data.size || data.availablesizes || data.available_sizes || '',
      refcode: data.refcode || data.referencecode || data.code || data.refercode || '',
      price: data.price || data.cost || '',
      discount_price: rawData.discount_price !== undefined ? rawData.discount_price : data.discountprice || null
    };
    onClose();
    onOpenProduct(product);
  };

  return (
    <div className="modal show" onClick={onClose} style={{ zIndex: 10000, alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Search Products</h3>
          <button className="close-btn" onClick={onClose} style={{ position: 'static', padding: '0' }}>&times;</button>
        </div>
        <div style={{ position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search by name or code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
          />
        </div>
        <div style={{ marginTop: '1rem', maxHeight: '50vh', overflowY: 'auto' }}>
          {loading && <p style={{ textAlign: 'center', color: '#888', padding: '1rem 0' }}>Searching...</p>}
          {!loading && query.trim() && results.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', padding: '1rem 0' }}>No products found for "{query}"</p>
          )}
          {!loading && results.map(item => (
            <div 
              key={item.id} 
              onClick={() => handleResultClick(item)}
              style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {(() => {
                const getDisplayImg = (imgField) => {
                  if (!imgField) return '';
                  if (imgField.trim().startsWith('{')) {
                    try {
                      const parsed = JSON.parse(imgField);
                      return (parsed.images && parsed.images[0]) || '';
                    } catch (e) {}
                  }
                  return imgField;
                };
                const displayImg = getDisplayImg(item.img);
                return displayImg ? (
                  <img src={displayImg} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '15px' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', backgroundColor: '#eee', borderRadius: '4px', marginRight: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-image" style={{ color: '#ccc' }}></i>
                  </div>
                );
              })()}
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{item.name}</h4>
                {item.refcode && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888' }}>Code: {item.refcode}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
