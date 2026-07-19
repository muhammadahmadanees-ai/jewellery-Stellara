"use client";
import React, { useEffect, useState } from 'react';
import { supabase, fetchCollectionsCached, getCollectionsCache } from '../supabase';
import RecentlyViewed from './RecentlyViewed';

const Collections = ({ onSelectCollection, onOpenProduct }) => {
  // Construct hierarchy dynamically
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

  const processCollectionsData = (querySnapshot) => {
    const cols = [];
    querySnapshot.forEach((rawData) => {
      const data = {};
      for (let key in rawData) {
          const cleanKey = key.toLowerCase().replace(/[\s_]+/g, '');
          data[cleanKey] = rawData[key];
      }
      const catName = data.name || data.title || 'Unnamed';
      let imgUrl = data.img || data.imageurl || data.imgurl || data.image || data.pic || '';
      cols.push({
        id: rawData.id,
        name: catName,
        desc: data.description || data.desc || data.detail || '',
        img: imgUrl,
        parentId: data.parentid || '',
        type: data.type || 'collection', // default to collection
        order: data.order !== undefined ? Number(data.order) : 0
      });
    });

    const roots = buildTree(cols);
    const initialExpanded = {};
    roots.forEach(r => {
      initialExpanded[r.id] = true;
      if (r.children) {
        r.children.forEach(c => {
          initialExpanded[c.id] = true;
        });
      }
    });
    return { cols, roots, initialExpanded };
  };

  // Sync initialization to avoid flicker
  const cachedSnapshot = getCollectionsCache();
  const initialData = cachedSnapshot ? processCollectionsData(cachedSnapshot) : null;

  const [collections, setCollections] = useState(initialData ? initialData.cols : []);
  const [treeRoots, setTreeRoots] = useState(initialData ? initialData.roots : []);
  const [loading, setLoading] = useState(!cachedSnapshot);
  
  // Navigation states
  const [activeNode, setActiveNode] = useState(null); // Selected category node in tree
  const [expandedNodes, setExpandedNodes] = useState(initialData ? initialData.initialExpanded : {});

  useEffect(() => {
    if (cachedSnapshot) return; // Skip if loaded from cache

    const fetchCollections = async () => {
      try {
        const querySnapshot = await fetchCollectionsCached();
        const { cols, roots, initialExpanded } = processCollectionsData(querySnapshot);

        setCollections(cols);
        setTreeRoots(roots);
        setExpandedNodes(initialExpanded);
      } catch (err) {
        console.error("Error fetching collections", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [cachedSnapshot]);



  // Toggle tree node expansion
  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Select node in the explorer
  const selectNode = (node) => {
    if (node === null) {
      setActiveNode(null);
    } else if (node.type === 'collection') {
      onSelectCollection(node);
    } else {
      setActiveNode(node);
    }
  };

  // Get active directory content
  const getActiveContent = () => {
    if (!activeNode) {
      return treeRoots;
    }
    return activeNode.children || [];
  };

  // Get breadcrumbs path list
  const getBreadcrumbs = () => {
    const crumbs = [];
    let current = activeNode;
    while (current) {
      crumbs.unshift(current);
      current = collections.find(c => c.id === current.parentId);
    }
    return crumbs;
  };

  // Recursively render Left Sidebar Tree List
  const renderTreeNodes = (nodes) => {
    return (
      <ul className="tree-list">
        {nodes.map(node => {
          const isCategory = node.type === 'category';
          const isExpanded = !!expandedNodes[node.id];
          const isActive = activeNode?.id === node.id;
          const hasChildren = node.children && node.children.length > 0;

          return (
            <li key={node.id} className={`tree-node ${isActive ? 'active' : ''}`}>
              <div 
                className="tree-node-header" 
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  if (isCategory) {
                    toggleExpand(node.id, e);
                  }
                  selectNode(node);
                }}
              >
                {isCategory ? (
                  <span className="tree-toggle" onClick={(e) => { e.stopPropagation(); toggleExpand(node.id, e); }}>
                    <i className={`fas ${isExpanded ? 'fa-minus' : 'fa-plus'} toggle-icon`}></i>
                  </span>
                ) : (
                  <span className="tree-indent-dot"><i className="far fa-circle"></i></span>
                )}
                <i className={`fas ${isCategory ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-layer-group'} node-icon`}></i>
                <span className="node-name" style={{ fontWeight: 'bold' }}>{node.name}</span>
              </div>
              
              {isCategory && hasChildren && (
                <div className={`tree-subnodes-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="tree-subnodes-inner">
                    <div className="tree-subnodes">
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

  const activeContent = getActiveContent();
  const breadcrumbs = getBreadcrumbs();

  return (
    <section id="collections" className="section bg-dark">
      <div className="container">
        <div className="section-header">
          <h2>Our Collections</h2>
          <p>Discover our premium range of luxury jewellery, including custom rings, necklaces, and earrings, organized in an elegant catalog.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem 0' }}>Loading collections catalog...</p>
        ) : (
          <div className="category-explorer-layout">
            
            {/* Left Column: Interactive Tree Navigation */}
            <aside className="explorer-sidebar">
              <h4 className="sidebar-title">Catalog Explorer</h4>
              <div className="tree-container">
                <div 
                  className={`tree-node-header root-header ${!activeNode ? 'active' : ''}`}
                  onClick={() => selectNode(null)}
                >
                  <i className="fas fa-database node-icon"></i>
                  <span className="node-name" style={{ fontWeight: 'bold' }}>All Collections</span>
                </div>
                {renderTreeNodes(treeRoots)}
              </div>
              <RecentlyViewed onOpenProduct={onOpenProduct} />
            </aside>

            {/* Right Column: Active Category Content */}
            <main className="explorer-main">
              {/* Breadcrumb Navigation Trail */}
              <nav className="explorer-breadcrumbs">
                <span className="breadcrumb-item" onClick={() => selectNode(null)}>
                  <i className="fas fa-home" style={{ marginRight: '4px' }}></i> Collections
                </span>
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb.id} className="breadcrumb-path">
                    <span className="breadcrumb-sep">&gt;</span>
                    <span 
                      className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                      onClick={() => selectNode(crumb)}
                    >
                      {crumb.name}
                    </span>
                  </span>
                ))}
              </nav>

              {/* Title & Description of Current Category */}
              <div className="category-info-panel">
                <h3 style={{ fontWeight: 'bold' }}>{activeNode ? activeNode.name : 'Collections Home'}</h3>
                <p>{activeNode ? activeNode.desc : 'Browse our premium jewellery collections, designed to capture starlight and luxury.'}</p>
              </div>

              {/* Grid content */}
              {activeContent.length === 0 ? (
                <div className="empty-category-message">
                  <i className="fas fa-folder-open empty-icon"></i>
                  <p>No subcategories or collections in this folder.</p>
                </div>
              ) : (
                <div className="grid collections-grid" id="collections-container">
                  {activeContent.map((item) => {
                    const isCategory = item.type === 'category';
                    return (
                      <div 
                        className={`collection-card fade-in-up explorer-card ${isCategory ? 'category-folder-card' : ''}`} 
                        key={item.id} 
                        onClick={() => selectNode(item)}
                      >
                        <div
                          className="img-placeholder explorer-card-img"
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          {item.img ? (
                            <img 
                              src={item.img} 
                              alt={item.name} 
                              loading="lazy" 
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                padding: '1.5rem',
                                boxSizing: 'border-box'
                              }}
                            />
                          ) : (
                            <i className={`fas ${isCategory ? 'fa-folder fa-4x' : 'fa-layer-group fa-4x'}`} style={{ color: '#ccc' }}></i>
                          )}
                        </div>
                        <div className="card-content">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <i className={`fas ${isCategory ? 'fa-folder' : 'fa-layer-group'}`} style={{ color: 'var(--accent-color)' }}></i>
                            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
                              {isCategory ? 'Category' : 'Collection'}
                            </span>
                          </div>
                          <h3 style={{ fontWeight: 'bold' }}>{item.name}</h3>
                          <p className="card-desc">{item.desc}</p>
                          <a href="#" className="link view-products-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); selectNode(item); }}>
                            {isCategory ? 'Open Folder' : 'View Products'} <span className="arrow-icon">&rarr;</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>

          </div>
        )}
      </div>
    </section>
  );
};

export default Collections;

