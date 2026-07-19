"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import RecentlyViewed from './RecentlyViewed';

const MenuDrawer = ({ isOpen, onClose, onSelectCollection, onOpenProduct }) => {
  const [collections, setCollections] = useState([]);
  const [treeRoots, setTreeRoots] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Collections
        const { data: querySnapshot, error } = await supabase.from('collections').select('*').order('order');
        if (error) throw error;
        
        const cols = [];
        querySnapshot.forEach((rawData) => {
          const data = {};
          for (let key in rawData) {
              const cleanKey = key.toLowerCase().replace(/[\s_]+/g, '');
              data[cleanKey] = rawData[key];
          }
          cols.push({
            id: rawData.id,
            name: data.name || data.title || 'Unnamed',
            desc: data.description || data.desc || data.detail || '',
            img: data.img || data.imageurl || data.imgurl || data.image || data.pic || '',
            parentId: data.parentid || '',
            type: data.type || 'collection',
            order: data.order !== undefined ? Number(data.order) : 0
          });
        });

        setCollections(cols);
        const roots = buildTree(cols);
        setTreeRoots(roots);

        // Auto-expand top levels
        const initialExpanded = {};
        roots.forEach(r => {
          initialExpanded[r.id] = true;
          if (r.children) {
            r.children.forEach(c => {
              initialExpanded[c.id] = true;
            });
          }
        });
        setExpandedNodes(initialExpanded);

        // 2. Fetch all products from all collections for search indexing
        const productsIndex = [];
        for (const col of cols) {
          if (col.type === 'category') continue; // only leaf collections hold products
          try {
            const { data: pSnapshot, error: pError } = await supabase.from('client_products').select('*').eq('collection_id', col.id).order('order');
            if (pError) throw pError;
            
            pSnapshot.forEach((rawData) => {
              const pData = {};
              for (let key in rawData) {
                  const cleanKey = key.toLowerCase().replace(/[\s_]+/g, '');
                  pData[cleanKey] = rawData[key];
              }
              productsIndex.push({
                id: rawData.id,
                name: pData.name || pData.title || 'Unnamed',
                desc: pData.description || pData.desc || pData.detail || '',
                img: pData.img || pData.imageurl || pData.imgurl || pData.image || pData.pic || '',
                price: pData.price || pData.cost || '',
                discount_price: rawData.discount_price !== undefined ? rawData.discount_price : pData.discountprice || null,
                refcode: pData.refcode || pData.referencecode || pData.code || '',
                sizes: pData.sizes || pData.size || pData.availablesizes || pData.available_sizes || '',
                collectionId: col.id,
                collectionName: col.name
              });
            });
          } catch (pe) {
            console.warn(`Could not index products for collection ${col.name}:`, pe);
          }
        }
        setAllProducts(productsIndex);

      } catch (err) {
        console.error("Error fetching data for menu drawer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isOpen]);

  // Handle Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const queryLower = searchQuery.toLowerCase().trim();
    const filtered = allProducts.filter(p => {
      const matchName = p.name.toLowerCase().includes(queryLower);
      const matchCode = p.refcode && p.refcode.toLowerCase().includes(queryLower);
      return matchName || matchCode;
    });

    setSearchResults(filtered);
  }, [searchQuery, allProducts]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const buildTree = (items) => {
    const itemMap = {};
    const roots = [];

    items.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });

    items.forEach(item => {
      const mapped = itemMap[item.id];
      if (mapped.parentId && itemMap[mapped.parentId]) {
        itemMap[mapped.parentId].children.push(mapped);
      } else {
        roots.push(mapped);
      }
    });

    const sortTree = (node) => {
      if (node.children) {
        node.children.sort((a, b) => (a.order || 0) - (b.order || 0));
        node.children.forEach(sortTree);
      }
    };
    roots.forEach(sortTree);
    roots.sort((a, b) => (a.order || 0) - (b.order || 0));
    return roots;
  };

  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Render Category tree recursively inside the drawer
  const renderTreeNodes = (nodes) => {
    return (
      <ul className="drawer-tree-list">
        {nodes.map(node => {
          const isCategory = node.type === 'category';
          const isExpanded = !!expandedNodes[node.id];
          const hasChildren = node.children && node.children.length > 0;

          return (
            <li key={node.id} className="drawer-tree-node">
              <div 
                className={`drawer-tree-node-header ${isCategory && isExpanded ? 'expanded' : ''}`}
                onClick={() => {
                  if (isCategory) {
                    setExpandedNodes(prev => ({ ...prev, [node.id]: !prev[node.id] }));
                  } else {
                    onSelectCollection(node);
                    onClose();
                  }
                }}
              >
                {isCategory ? (
                  <span className="drawer-tree-toggle" onClick={(e) => { e.stopPropagation(); toggleExpand(node.id, e); }}>
                    <i className={`fas ${isExpanded ? 'fa-minus' : 'fa-plus'} toggle-icon`}></i>
                  </span>
                ) : (
                  <span className="drawer-tree-indent-dot"><i className="far fa-circle"></i></span>
                )}
                <i className={`fas ${isCategory ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-layer-group'} node-icon`}></i>
                <span className="node-name">{node.name}</span>
              </div>
              
              {isCategory && hasChildren && (
                <div className={`drawer-tree-subnodes-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="drawer-tree-subnodes-inner">
                    <div className="drawer-tree-subnodes">
                      {renderTreeNodes(node.children)}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'show' : ''}`} 
        onClick={onClose}
      />

      {/* Main Drawer Panel */}
      <aside 
        ref={drawerRef}
        className={`menu-drawer ${isOpen ? 'open' : ''}`}
      >
        {/* Header / Close button */}
        <div className="drawer-header">
          <h3>Menu</h3>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close Menu">
            &times;
          </button>
        </div>

        <div className="drawer-body">
          {/* 1. Global Product Search Bar */}
          <div className="drawer-search-wrap">
            <div className="search-input-container">
              <i className="fas fa-search search-bar-icon"></i>
              <input 
                type="text" 
                placeholder="Search products by name or ref..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="drawer-search-input"
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  &times;
                </button>
              )}
            </div>

            {/* Live Search Results */}
            {searchQuery && (
              <div className="drawer-search-results">
                {searchResults.length === 0 ? (
                  <p className="no-search-results">No products match your search.</p>
                ) : (
                  <div className="search-results-list">
                     {searchResults.map(prod => {
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
                      const displayImg = getDisplayImg(prod.img);
                      return (
                      <div 
                        key={prod.id} 
                        className="search-result-item"
                        onClick={() => {
                          onOpenProduct(prod);
                          onClose();
                          setSearchQuery('');
                        }}
                      >
                        <div 
                          className="search-result-thumb" 
                          style={displayImg ? { backgroundImage: `url('${displayImg}')` } : {}}
                        />
                        <div className="search-result-info">
                          <div className="search-result-name-row">
                            <span className="search-result-name">{prod.name}</span>
                            {prod.refcode && <span className="ref-code search-ref-code">{prod.refcode}</span>}
                          </div>
                          <span className="search-result-collection">{prod.collectionName}</span>
                          {prod.price && (
                            <span className="search-result-price">
                              {prod.discount_price ? (
                                <>
                                  <s style={{ color: '#999', marginRight: '6px', fontSize: '0.85em' }}>
                                    Rs. {Number(prod.price).toLocaleString()}
                                  </s>
                                  <strong style={{ color: '#8B1A1A' }}>
                                    Rs. {Number(prod.discount_price).toLocaleString()}
                                  </strong>
                                </>
                              ) : (
                                `Rs. ${Number(prod.price).toLocaleString()}`
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Navigation Links */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Navigation</h4>
            <ul className="drawer-nav-links">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onClose(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <i className="fas fa-home section-link-icon"></i> Home
                </a>
              </li>
              <li>
                <a href="#collections" onClick={() => onClose()}>
                  <i className="fas fa-cubes section-link-icon"></i> Collections
                </a>
              </li>

              <li>
                <a href="#faq" onClick={() => onClose()}>
                  <i className="fas fa-question-circle section-link-icon"></i> FAQ
                </a>
              </li>
              <li>
                <a href="#contact" onClick={() => onClose()}>
                  <i className="fas fa-envelope section-link-icon"></i> Contact
                </a>
              </li>
            </ul>
          </div>

          {/* 3. Collapsible Category Tree */}
          <div className="drawer-section">
            <h4 className="drawer-section-title">Collections Catalog</h4>
            {loading ? (
              <p style={{ fontSize: '0.85rem', color: '#888', padding: '10px 0' }}>Loading catalog...</p>
            ) : (
              <div className="drawer-tree-container">
                {renderTreeNodes(treeRoots)}
              </div>
            )}
          </div>

          <RecentlyViewed onOpenProduct={(prod) => {
            onOpenProduct(prod);
            onClose();
          }} />
        </div>
      </aside>
    </>
  );
};

export default MenuDrawer;
