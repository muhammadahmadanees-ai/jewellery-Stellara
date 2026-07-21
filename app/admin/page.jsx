"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../src/supabase';
import { parseProductImages, buildProductImgField } from '../../src/components/imageHelper';
import { ReactSortable } from 'react-sortablejs';
import emailjs from '@emailjs/browser';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../../src/admin.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Client-side image compression helper using canvas
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // maintain white background for transparency
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas toBlob returned null'));
            }
            // Create a new File object from the blob, converting format to jpeg
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Admin = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'collections' | 'orders' | 'inventory' | 'billing'
  const [collectionsList, setCollectionsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [allProductsList, setAllProductsList] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState('All');
  const [inventorySort, setInventorySort] = useState('name');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // --- Billing States ---
  const [billItems, setBillItems] = useState([]);
  const [billCustomer, setBillCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [billDiscount, setBillDiscount] = useState(0);
  const [billNote, setBillNote] = useState('Thank you for visiting Stellara!');
  const [billSearch, setBillSearch] = useState('');
  const [billSearchFocused, setBillSearchFocused] = useState(false);
  const [billSaving, setBillSaving] = useState(false);
  const [billSaveMsg, setBillSaveMsg] = useState('');

  // --- Filter States for Orders ---
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');

  // --- CRUD States ---
  const [currentCollection, setCurrentCollection] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [colFormData, setColFormData] = useState({ id: '', name: '', description: '', img: '', order: 0, parentId: '', type: 'collection' });

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodFormData, setProdFormData] = useState({
    id: '',
    name: '',
    price: '',
    base_price: '',
    discount_price: '',
    description: '',
    img: '',
    images: [],
    colorsInput: '',
    colorImageMapping: {},
    sizes: '',
    refcode: '',
    order: 0,
    stock: '',
    show_sizes: true
  });
  const [imageUrlInput, setImageUrlInput] = useState('');

  // --- Custom Modals/Alerts States ---
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', type: '', name: '' });
  const [adminAlert, setAdminAlert] = useState({ open: false, title: '', message: '' });

  // --- Reply Modal States ---
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyData, setReplyData] = useState({ orderId: '', name: '', email: '', phone: '', message: '', replyMsg: '' });
  const [replyStatus, setReplyStatus] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const productDragTimeoutRef = useRef(null);
  const collectionDragTimeoutRef = useRef(null);

  useEffect(() => {
    emailjs.init("N2N-N0773Y_Qq_hzS");

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCollections();
        fetchOrders();
        fetchAllProducts();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCollections();
        fetchOrders();
        fetchAllProducts();
      }
    });
    return () => {
      subscription.unsubscribe();
      if (productDragTimeoutRef.current) clearTimeout(productDragTimeoutRef.current);
      if (collectionDragTimeoutRef.current) clearTimeout(collectionDragTimeoutRef.current);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Invalid email or password');
    else setError('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase.from('collections').select('*').order('order');
      if (error) throw error;
      setCollectionsList(data || []);
      
      // Calculate total products in one fast query
      const { count, error: countError } = await supabase
        .from("products")
        .select('id', { count: 'exact', head: true });
      if (countError) throw countError;
      setTotalProductsCount(count || 0);
    } catch (e) {
      console.warn("fetchCollections failed", e);
      setCollectionsList([]);
    }
  };

  const fetchProducts = async (colId) => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('collection_id', colId).order('order');
      if (error) throw error;
      setProductsList(data || []);
    } catch (e) {
      console.warn("fetchProducts failed", e);
      setProductsList([]);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) {
      setOrdersList(data || []);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      setAllProductsList(data || []);
    } catch (e) {
      console.warn("fetchAllProducts failed", e);
      setAllProductsList([]);
    }
  };

  const handleQuickStockChange = async (productId, newStock) => {
    if (newStock < 0) return;
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      if (error) throw error;
      
      setAllProductsList(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setProductsList(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    } catch (e) {
      console.warn("Failed to update stock", e);
    }
  };

  const handleToggleUnlimitedStock = async (productId, currentStock) => {
    const targetStock = currentStock === null || currentStock === undefined ? 10 : null;
    try {
      const { error } = await supabase.from('products').update({ stock: targetStock }).eq('id', productId);
      if (error) throw error;
      
      setAllProductsList(prev => prev.map(p => p.id === productId ? { ...p, stock: targetStock } : p));
      setProductsList(prev => prev.map(p => p.id === productId ? { ...p, stock: targetStock } : p));
    } catch (e) {
      console.warn("Failed to toggle unlimited stock", e);
    }
  };

  // --- Collection CRUD ---
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    const data = {
      name: colFormData.name,
      description: colFormData.description,
      img: colFormData.img,
      order: Number(colFormData.order) || 0,
      parent_id: colFormData.parentId || null,
      type: colFormData.type || 'collection'
    };
    if (colFormData.id) {
      await supabase.from('collections').update(data).eq('id', colFormData.id);
    } else {
      await supabase.from('collections').insert([data]);
    }
    setIsColModalOpen(false);
    fetchCollections();
  };

  const handleDeleteCollection = (id, name) => {
    setDeleteConfirm({ open: true, id, type: 'collection', name });
  };

  const deleteProductStorageFiles = async (prod) => {
    if (!prod || !prod.img) return;
    try {
      const parsed = parseProductImages(prod.img);
      const imageUrls = parsed.images || [];
      const paths = imageUrls
        .map(url => {
          if (!url) return null;
          const marker = '/public/images/';
          const idx = url.indexOf(marker);
          return idx !== -1 ? url.substring(idx + marker.length) : null;
        })
        .filter(Boolean);

      if (paths.length > 0) {
        const { error } = await supabase.storage.from('images').remove(paths);
        if (error) {
          console.warn("Error deleting product storage files:", error);
        } else {
          console.log("Deleted storage files:", paths);
        }
      }
    } catch (e) {
      console.warn("Failed to delete storage files for product:", e);
    }
  };

  const deleteCollectionStorageFile = async (col) => {
    if (!col || !col.img) return;
    try {
      const url = col.img;
      const marker = '/public/images/';
      const idx = url.indexOf(marker);
      const path = idx !== -1 ? url.substring(idx + marker.length) : null;

      if (path) {
        const { error } = await supabase.storage.from('images').remove([path]);
        if (error) {
          console.warn("Error deleting collection storage file:", error);
        } else {
          console.log("Deleted collection storage file:", path);
        }
      }
    } catch (e) {
      console.warn("Failed to delete storage file for collection:", e);
    }
  };

  const executeDelete = async () => {
    const { id, type } = deleteConfirm;
    setDeleteConfirm({ open: false, id: '', type: '', name: '' });

    if (type === 'collection') {
      try {
        // 1. Fetch all products inside this collection to delete their files
        const { data: relatedProducts } = await supabase.from('products').select('*').eq('collection_id', id);
        if (relatedProducts && relatedProducts.length > 0) {
          for (const prod of relatedProducts) {
            await deleteProductStorageFiles(prod);
          }
          // 2. Delete those products from database
          const { error: prodDelError } = await supabase.from('products').delete().eq('collection_id', id);
          if (prodDelError) throw prodDelError;
        }

        // 3. Find collection to get its cover image
        let collectionToDelete = collectionsList.find(c => c.id === id);
        if (!collectionToDelete) {
          const { data } = await supabase.from('collections').select('*').eq('id', id).single();
          collectionToDelete = data;
        }
        if (collectionToDelete) {
          await deleteCollectionStorageFile(collectionToDelete);
        }

        // 4. Delete the collection itself
        const { error } = await supabase.from('collections').delete().eq('id', id);
        if (error) throw error;

        fetchCollections();
        fetchAllProducts(); // Refresh inventory/products listing
      } catch (error) {
        console.error("Delete collection error:", error);
        setAdminAlert({
          open: true,
          title: "Delete Failed",
          message: "Failed to delete collection and its items. Error: " + error.message
        });
      }
    } else if (type === 'product') {
      try {
        // 1. Find product to delete its storage files
        let productToDelete = allProductsList.find(p => p.id === id);
        if (!productToDelete) {
          const { data } = await supabase.from('products').select('*').eq('id', id).single();
          productToDelete = data;
        }
        if (productToDelete) {
          await deleteProductStorageFiles(productToDelete);
        }

        // 2. Delete product row
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;

        if (currentCollection) {
          fetchProducts(currentCollection.id);
        }
        fetchCollections();
        fetchAllProducts();
      } catch (error) {
        console.error("Delete product error:", error);
        setAdminAlert({
          open: true,
          title: "Delete Failed",
          message: "Failed to delete product. Error: " + error.message
        });
      }
    }
  };

  const handleEditCollection = (col) => {
    setColFormData({ 
      id: col.id, 
      name: col.name || col.title || '', 
      description: col.description || col.desc || '', 
      img: col.img || col.image || '', 
      order: col.order || 0,
      parentId: col.parent_id || col.parentId || '',
      type: col.type || 'collection'
    });
    setIsColModalOpen(true);
  };

  const handleColImageUpload = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;

    try {
      // Compress the image before uploading to reduce egress and storage
      const file = await compressImage(rawFile);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `collections/${fileName}`;

      const { error } = await supabase.storage.from('images').upload(filePath, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setColFormData({ ...colFormData, img: data.publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
    }
  };

  // --- Product CRUD ---
  const handleOpenProducts = (col) => {
    setCurrentCollection(col);
    fetchProducts(col.id);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!currentCollection) return;

    // Filter mapping to only include colors that are in current colorsList
    const colorsList = prodFormData.colorsInput
      ? prodFormData.colorsInput.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    const cleanMapping = {};
    const cleanStockMapping = {};
    colorsList.forEach(color => {
      if (prodFormData.colorImageMapping && prodFormData.colorImageMapping[color]) {
        cleanMapping[color] = prodFormData.colorImageMapping[color];
      }
      if (prodFormData.colorStockMapping && prodFormData.colorStockMapping[color] !== undefined && prodFormData.colorStockMapping[color] !== '') {
        cleanStockMapping[color] = Number(prodFormData.colorStockMapping[color]);
      }
    });

    const finalImg = buildProductImgField(prodFormData.images || [], cleanMapping, cleanStockMapping);

    const data = {
      collection_id: currentCollection.id,
      name: prodFormData.name,
      price: Number(prodFormData.price) || 0,
      base_price: Number(prodFormData.base_price) || 0,
      discount_price: prodFormData.discount_price === '' || prodFormData.discount_price === null ? null : Number(prodFormData.discount_price),
      description: prodFormData.description,
      img: finalImg,
      sizes: prodFormData.show_sizes ? prodFormData.sizes : '',
      refcode: prodFormData.refcode,
      order: Number(prodFormData.order) || 0,
      stock: prodFormData.stock === '' || prodFormData.stock === null ? null : Number(prodFormData.stock),
      show_sizes: prodFormData.show_sizes
    };

    try {
      let res;
      if (prodFormData.id) {
        res = await supabase.from('products').update(data).eq('id', prodFormData.id);
      } else {
        res = await supabase.from('products').insert([data]);
      }

      if (res.error) {
        throw res.error;
      }

      setIsProdModalOpen(false);
      fetchProducts(currentCollection.id);
      fetchCollections(); // Update total count
      fetchAllProducts(); // Update inventory list
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Error saving product: " + (err.message || err.details || JSON.stringify(err)));
    }
  };

  const handleDeleteProduct = (id, name) => {
    setDeleteConfirm({ open: true, id, type: 'product', name });
  };

  const handleEditProduct = (prod) => {
    const parsedImg = parseProductImages(prod.img);
    const colorsList = Object.keys(parsedImg.colors);
    const colorsInput = colorsList.join(', ');

    setProdFormData({
      id: prod.id,
      name: prod.name || '',
      price: prod.price || '',
      base_price: prod.base_price || '',
      discount_price: prod.discount_price !== null && prod.discount_price !== undefined ? prod.discount_price : '',
      description: prod.description || prod.desc || '',
      img: prod.img || '',
      images: parsedImg.images || [],
      colorsInput: colorsInput,
      colorImageMapping: parsedImg.colors || {},
      colorStockMapping: parsedImg.colorStock || {},
      sizes: prod.sizes || '',
      refcode: prod.refcode || '',
      order: prod.order || 0,
      stock: prod.stock !== null && prod.stock !== undefined ? prod.stock : '',
      show_sizes: prod.show_sizes !== undefined ? prod.show_sizes : true
    });
    setIsProdModalOpen(true);
  };

  const handleProdImageUpload = async (e) => {
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    try {
      const uploadedUrls = [];
      for (const rawFile of rawFiles) {
        const file = await compressImage(rawFile);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage.from('images').upload(filePath, file);
        if (error) throw error;
        
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
      setProdFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput) return;
    setProdFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrlInput]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setProdFormData(prev => {
      const newImages = (prev.images || []).filter((_, i) => i !== indexToRemove);
      const newMapping = { ...prev.colorImageMapping };
      Object.keys(newMapping).forEach(color => {
        if (newMapping[color] === prev.images[indexToRemove]) {
          delete newMapping[color];
        }
      });
      return {
        ...prev,
        images: newImages,
        colorImageMapping: newMapping
      };
    });
  };

  // --- Sortable Handlers ---
  const onCollectionsSortEnd = (newList) => {
    const updatedList = newList.map((col, index) => ({ ...col, order: index }));
    setCollectionsList(updatedList);

    if (collectionDragTimeoutRef.current) {
      clearTimeout(collectionDragTimeoutRef.current);
    }

    collectionDragTimeoutRef.current = setTimeout(async () => {
      const promises = updatedList.map(col => 
        supabase.from('collections').update({ order: col.order }).eq('id', col.id)
      );
      const results = await Promise.all(promises);
      const errorResult = results.find(r => r.error);
      if (errorResult) {
        console.error("Failed to update collections order", errorResult.error);
      }
    }, 500);
  };

  const onProductsSortEnd = (newList) => {
    const updatedList = newList.map((prod, index) => ({ ...prod, order: index }));
    setProductsList(updatedList);

    if (productDragTimeoutRef.current) {
      clearTimeout(productDragTimeoutRef.current);
    }

    productDragTimeoutRef.current = setTimeout(async () => {
      const promises = updatedList.map(prod => 
        supabase.from('products').update({ order: prod.order }).eq('id', prod.id)
      );
      const results = await Promise.all(promises);
      const errorResult = results.find(r => r.error);
      if (errorResult) {
        console.error("Failed to update products order", errorResult.error);
      }
    }, 500);
  };

  // --- Orders Logic ---
  const updateOrderStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (newStatus === 'confirmed') {
      const order = ordersList.find(o => o.id === orderId);
      if (order && order.email && order.email !== 'N/A' && order.email.includes('@')) {
        let confirmNum = '';
        if (order.type && order.type.includes('(#')) {
          const match = order.type.match(/\(#([^)]+)\)/);
          if (match) confirmNum = '#' + match[1];
        }
        if (!confirmNum && order.message && order.message.includes('Confirmation: ')) {
          const match = order.message.match(/Confirmation:\s*(#[A-Z0-9]+)/);
          if (match) confirmNum = match[1];
        }
        if (!confirmNum) {
          confirmNum = '#' + (order.id ? (order.id.includes('-') ? order.id.split('-')[0].toUpperCase() : order.id.substring(0, 8).toUpperCase()) : 'N/A');
        }

        let paymentMethodText = 'Cash on Delivery (COD)';
        if (order.message && order.message.includes('Card Payment')) {
          paymentMethodText = 'Card Payment (Paid in Advance)';
        }
        const qty = parseInt(order.quantity) || 1;
        const price = Number(order.selling_price) || 0;
        const totalVal = price * qty;

        const receiptMsg = `Order ID: ${confirmNum}
Status: CONFIRMED

Thank you for your order, ${order.name || 'Customer'}! Your order has been confirmed and is being processed.

--- ORDER SUMMARY ---
• Product: ${order.tile || 'Jewellery Item'}
• Quantity: ${qty}
• Price: Rs. ${price.toLocaleString()}
• Total: Rs. ${totalVal.toLocaleString()}

--- SHIPPING & BILLING ---
• Delivery Address: ${order.address || 'N/A'}, ${order.city || ''}
• Phone: ${order.phone || 'N/A'}
• Email: ${order.email || 'N/A'}
• Payment Method: ${paymentMethodText}

We will notify you once your order is dispatched. Delivery usually takes 4-5 working days.

Regards,
STELLARA`;

        const templateParams = {
          to_name: order.name,
          name: order.name,
          to_email: order.email,
          email: order.email,
          reply_message: receiptMsg,
          message: receiptMsg
        };

        emailjs.send('service_uojcusn', 'template_t8mjzbs', templateParams, 'N2N-N0773Y_Qq_hzS')
          .then(() => {
            console.log(`Confirmation email sent automatically to ${order.email}`);
            alert(`Order status updated to Confirmed! Confirmation email sent to ${order.email}.`);
          })
          .catch(err => {
            console.error('Failed to send auto-confirmation email:', err);
            const errMsg = err && typeof err === 'object' ? (err.text || JSON.stringify(err)) : String(err);
            alert(`Order status updated, but confirmation email failed to send: ${errMsg}`);
          });
      } else {
        alert('Order status updated to Confirmed! (No valid email to notify customer)');
      }
    } else {
      alert(`Order status updated to ${newStatus.toUpperCase()}!`);
    }

    fetchOrders();
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order record?")) {
      await supabase.from('orders').delete().eq('id', orderId);
      fetchOrders();
    }
  };

  const setDateFilter = (daysAgoStart, daysAgoEnd) => {
    if (daysAgoStart === null && daysAgoEnd === null) {
      setOrderDateFrom('');
      setOrderDateTo('');
    } else {
      const now = new Date();
      const start = new Date(now.getTime() - (daysAgoStart * 24 * 60 * 60 * 1000));
      const end = new Date(now.getTime() - (daysAgoEnd * 24 * 60 * 60 * 1000));
      setOrderDateFrom(start.toISOString().split('T')[0]);
      setOrderDateTo(end.toISOString().split('T')[0]);
    }
  };

  const filteredOrders = useMemo(() => {
    let list = [...ordersList];
    
    if (orderSearch) {
      const s = orderSearch.toLowerCase();
      list = list.filter(o => 
        (o.name || '').toLowerCase().includes(s) || 
        (o.email || '').toLowerCase().includes(s) || 
        (o.phone || '').toLowerCase().includes(s) || 
        (o.type || '').toLowerCase().includes(s) || 
        (o.id || '').toLowerCase().includes(s) ||
        (o.message || '').toLowerCase().includes(s)
      );
    }
    
    if (orderStatusFilter !== 'All') {
      list = list.filter(o => (o.status || 'new').toLowerCase() === orderStatusFilter.toLowerCase());
    }

    if (orderDateFrom) {
      const from = new Date(orderDateFrom + 'T00:00:00');
      list = list.filter(o => new Date(o.created_at) >= from);
    }

    if (orderDateTo) {
      const to = new Date(orderDateTo + 'T23:59:59');
      list = list.filter(o => new Date(o.created_at) <= to);
    }

    return list;
  }, [ordersList, orderSearch, orderStatusFilter, orderDateFrom, orderDateTo]);

  // --- Inventory Stats Computation ---
  const inventoryStats = useMemo(() => {
    const orderGroups = {};
    ordersList.forEach(order => {
      if (order.product_id) {
        if (!orderGroups[order.product_id]) {
          orderGroups[order.product_id] = {
            count: 0,
            quantity: 0,
            lastOrdered: null
          };
        }
        const qty = parseInt(order.quantity) || 1;
        orderGroups[order.product_id].count += 1;
        orderGroups[order.product_id].quantity += qty;
        
        const orderDate = order.created_at ? new Date(order.created_at) : null;
        if (orderDate) {
          if (!orderGroups[order.product_id].lastOrdered || orderDate > orderGroups[order.product_id].lastOrdered) {
            orderGroups[order.product_id].lastOrdered = orderDate;
          }
        }
      }
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValuation = 0;

    const list = allProductsList.map(prod => {
      const stats = orderGroups[prod.id] || { count: 0, quantity: 0, lastOrdered: null };
      
      const stockVal = (prod.stock || 0) * (prod.base_price || 0);
      totalStockValuation += stockVal;

      if (prod.stock === 0) {
        outOfStockCount++;
      } else if (prod.stock !== null && prod.stock <= 5) {
        lowStockCount++;
      }

      return {
        ...prod,
        orderCount: stats.count,
        unitsOrdered: stats.quantity,
        lastOrdered: stats.lastOrdered,
        collectionName: collectionsList.find(c => c.id === prod.collection_id)?.name || 'Unknown'
      };
    });

    return {
      list,
      lowStockCount,
      outOfStockCount,
      totalStockValuation
    };
  }, [allProductsList, ordersList, collectionsList]);

  // --- Filter and Sort Inventory ---
  const filteredInventory = useMemo(() => {
    let list = [...inventoryStats.list];

    if (inventorySearch) {
      const s = inventorySearch.toLowerCase();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(s) || 
        (p.refcode || '').toLowerCase().includes(s) ||
        (p.collectionName || '').toLowerCase().includes(s)
      );
    }

    if (inventoryStockFilter === 'Low') {
      list = list.filter(p => p.stock !== null && p.stock > 0 && p.stock <= 5);
    } else if (inventoryStockFilter === 'Out') {
      list = list.filter(p => p.stock === 0);
    } else if (inventoryStockFilter === 'Unlimited') {
      list = list.filter(p => p.stock === null || p.stock === undefined);
    }

    if (inventorySort === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (inventorySort === 'stock-asc') {
      list.sort((a, b) => {
        const valA = a.stock === null ? Infinity : a.stock;
        const valB = b.stock === null ? Infinity : b.stock;
        return valA - valB;
      });
    } else if (inventorySort === 'stock-desc') {
      list.sort((a, b) => {
        const valA = a.stock === null ? -1 : a.stock;
        const valB = b.stock === null ? -1 : b.stock;
        return valB - valA;
      });
    } else if (inventorySort === 'orders-desc') {
      list.sort((a, b) => b.unitsOrdered - a.unitsOrdered);
    }

    return list;
  }, [inventoryStats.list, inventorySearch, inventoryStockFilter, inventorySort]);

  const totalStockQty = useMemo(() => {
    let hasUnlimited = false;
    let total = 0;
    allProductsList.forEach(p => {
      if (p.stock === null || p.stock === undefined) {
        hasUnlimited = true;
      } else {
        total += p.stock;
      }
    });
    return hasUnlimited ? `${total} (+ ∞)` : String(total);
  }, [allProductsList]);


  // --- Billing Logic ---
  const billSearchResults = useMemo(() => {
    if (!billSearch || billSearch.length < 1) return [];
    const s = billSearch.toLowerCase();
    return allProductsList.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.refcode || '').toLowerCase().includes(s)
    ).slice(0, 8);
  }, [billSearch, allProductsList]);

  const handleAddBillItem = (product) => {
    const parsed = parseProductImages(product.img);
    const colorsList = Object.keys(parsed.colors || {});
    const initialColor = colorsList.length === 1 ? colorsList[0] : '';
    const effectivePrice = (product.discount_price !== null && product.discount_price !== undefined && Number(product.discount_price) > 0)
      ? Number(product.discount_price)
      : Number(product.price) || 0;

    const existing = billItems.find(item => item.product.id === product.id && !item.size && !item.color);
    if (existing) {
      setBillItems(prev => prev.map(item =>
        item.product.id === product.id && !item.size && !item.color
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setBillItems(prev => [...prev, {
        product,
        qty: 1,
        color: initialColor,
        size: '',
        unitPrice: effectivePrice
      }]);
    }
    setBillSearch('');
    setBillSearchFocused(false);
  };

  const handleRemoveBillItem = (index) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleBillItemChange = (index, field, value) => {
    setBillItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (field === 'qty') return { ...item, qty: Math.max(1, Number(value) || 1) };
      if (field === 'unitPrice') return { ...item, unitPrice: Number(value) || 0 };
      if (field === 'size') return { ...item, size: value };
      if (field === 'color') return { ...item, color: value };
      return item;
    }));
  };

  const billSubtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  }, [billItems]);

  const billGrandTotal = useMemo(() => {
    return Math.max(0, billSubtotal - (Number(billDiscount) || 0));
  }, [billSubtotal, billDiscount]);

  const generateBillNumber = () => {
    const now = new Date();
    return `STL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const handlePrintBill = () => {
    if (billItems.length === 0) return alert('Add at least one product to the bill.');
    if (!billCustomer.name.trim()) return alert('Please enter the customer name.');

    const billNo = generateBillNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const itemsHtml = billItems.map((item, i) => {
      const variantParts = [];
      if (item.color) variantParts.push(`Color: ${item.color}`);
      if (item.size) variantParts.push(`Size: ${item.size}`);
      const variantStr = variantParts.join(', ');

      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:0.9rem;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:0.9rem;font-weight:500;">
          ${item.product.name}
          ${variantStr ? ` <span style="color:#666;font-size:0.85rem;font-weight:normal;">(${variantStr})</span>` : ''}
          ${item.product.refcode ? `<br><span style="font-size:0.75rem;color:#999;font-weight:normal;">Ref: ${item.product.refcode}</span>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:0.9rem;">${item.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:0.9rem;">Rs. ${item.unitPrice.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:0.9rem;font-weight:600;">Rs. ${(item.unitPrice * item.qty).toLocaleString()}</td>
      </tr>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stellara Bill - ${billNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 30px; max-width: 800px; margin: 0 auto; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none !important; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:25px;padding-bottom:20px;border-bottom:3px solid #8B1A1A;">
          <h1 style="font-size:2rem;color:#8B1A1A;letter-spacing:3px;margin-bottom:4px;">STELLARA</h1>
          <p style="font-size:0.85rem;color:#888;letter-spacing:1px;">Premium Jewelry Collection</p>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:25px;">
          <div>
            <p style="font-size:0.8rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Bill To</p>
            <p style="font-weight:600;font-size:1.1rem;">${billCustomer.name}</p>
            ${billCustomer.phone ? `<p style="color:#555;font-size:0.9rem;">Phone: ${billCustomer.phone}</p>` : ''}
            ${billCustomer.email ? `<p style="color:#555;font-size:0.9rem;">Email: ${billCustomer.email}</p>` : ''}
          </div>
          <div style="text-align:right;">
            <p style="font-size:0.8rem;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Invoice Details</p>
            <p style="font-weight:600;color:#8B1A1A;">${billNo}</p>
            <p style="color:#555;font-size:0.9rem;">${dateStr} at ${timeStr}</p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:25px;">
          <thead>
            <tr style="background:#f9f5f0;">
              <th style="padding:12px;text-align:left;font-size:0.8rem;color:#8B1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #8B1A1A;">#</th>
              <th style="padding:12px;text-align:left;font-size:0.8rem;color:#8B1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #8B1A1A;">Product</th>
              <th style="padding:12px;text-align:center;font-size:0.8rem;color:#8B1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #8B1A1A;">Qty</th>
              <th style="padding:12px;text-align:right;font-size:0.8rem;color:#8B1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #8B1A1A;">Unit Price</th>
              <th style="padding:12px;text-align:right;font-size:0.8rem;color:#8B1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #8B1A1A;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-bottom:25px;">
          <div style="width:280px;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.95rem;">
              <span style="color:#666;">Subtotal</span>
              <span>Rs. ${billSubtotal.toLocaleString()}</span>
            </div>
            ${Number(billDiscount) > 0 ? `
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:0.95rem;color:#dc2626;">
              <span>Discount</span>
              <span>- Rs. ${Number(billDiscount).toLocaleString()}</span>
            </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:1.2rem;font-weight:700;border-top:2px solid #8B1A1A;margin-top:8px;color:#8B1A1A;">
              <span>Grand Total</span>
              <span>Rs. ${billGrandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        ${billNote ? `
        <div style="text-align:center;padding:15px;background:#f9f5f0;border-radius:8px;margin-bottom:20px;">
          <p style="color:#8B1A1A;font-style:italic;font-size:0.95rem;">${billNote}</p>
        </div>
        ` : ''}

        <div style="text-align:center;padding-top:20px;border-top:1px solid #eee;">
          <p style="font-size:0.8rem;color:#aaa;">This is a computer generated invoice.</p>
        </div>

        <div class="no-print" style="text-align:center;margin-top:30px;">
          <button onclick="window.print()" style="padding:12px 40px;background:#8B1A1A;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-family:inherit;">Print Bill</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintParcelReceipt = (order) => {
    let confNum = null;
    if (order.type && order.type.includes('(#')) {
      const match = order.type.match(/\(#([^)]+)\)/);
      if (match) confNum = '#' + match[1];
    }
    if (!confNum && order.message && order.message.includes('Confirmation: ')) {
      const match = order.message.match(/Confirmation:\s*(#[A-Z0-9]+)/);
      if (match) confNum = match[1];
    }

    let orderId = confNum;
    if (!orderId) {
      orderId = '#' + (order.id ? (order.id.includes('-') ? order.id.split('-')[0].toUpperCase() : order.id.substring(0, 8).toUpperCase()) : 'N/A');
    }

    let orderItems = [];
    if (confNum) {
      orderItems = ordersList.filter(o => {
        let oConf = null;
        if (o.type && o.type.includes('(#')) {
          const match = o.type.match(/\(#([^)]+)\)/);
          if (match) oConf = '#' + match[1];
        }
        if (!oConf && o.message && o.message.includes('Confirmation: ')) {
          const match = o.message.match(/Confirmation:\s*(#[A-Z0-9]+)/);
          if (match) oConf = match[1];
        }
        return oConf === confNum;
      });
    }

    if (orderItems.length === 0) {
      orderItems = [order];
    }

    let subtotal = 0;
    orderItems.forEach(item => {
      const qty = parseInt(item.quantity) || 1;
      const price = Number(item.selling_price) || 0;
      subtotal += price * qty;
    });

    let shippingCharge = 200;
    const firstItem = orderItems[0];
    if (firstItem.message) {
      if (firstItem.message.includes('Shipping Charge: Free') || 
          firstItem.message.toLowerCase().includes('shipping charge: 0') || 
          firstItem.message.toLowerCase().includes('free shipping')) {
        shippingCharge = 0;
      } else {
        const match = firstItem.message.match(/Shipping Charge:\s*Rs\.\s*(\d+)/i) || 
                      firstItem.message.match(/Shipping Charge:\s*(\d+)/i);
        if (match) {
          shippingCharge = Number(match[1]);
        }
      }
    }
    const totalAmount = subtotal + shippingCharge;

    const itemsListHtml = orderItems.map((item, idx) => {
      const qty = parseInt(item.quantity) || 1;
      const price = Number(item.selling_price) || 0;
      const lineTotal = price * qty;
      return `
        <div class="item-row">
          <div>
            <span class="item-name">${item.tile || 'Product'}</span>
            <span class="item-qty">× ${qty}</span>
          </div>
          <span style="font-weight: 500;">Rs. ${lineTotal.toLocaleString()}</span>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>STELLARA - Parcel Receipt</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Outfit', sans-serif; color: #1a1a1a; padding: 20px; background: #fff; }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px dashed #8B1A1A;
            border-radius: 12px;
            padding: 30px;
            display: flex;
            gap: 30px;
            position: relative;
            background: #fafafc;
          }
          .left-column {
            flex: 1;
            border-right: 2px dashed #e5e7eb;
            padding-right: 30px;
          }
          .right-column {
            flex: 1.2;
          }
          .brand-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            color: #8B1A1A;
            letter-spacing: 4px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-group {
            margin-bottom: 18px;
          }
          .info-label {
            font-size: 0.78rem;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 3px;
          }
          .info-value {
            font-size: 0.95rem;
            font-weight: 500;
            color: #1a1a1a;
            line-height: 1.5;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.9rem;
          }
          .item-name {
            font-weight: 500;
            text-transform: uppercase;
          }
          .item-qty {
            color: #666;
            margin-left: 6px;
          }
          .pricing-table {
            margin-top: 20px;
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .price-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 0.9rem;
          }
          .price-row.total {
            border-top: 1.5px solid #8B1A1A;
            padding-top: 10px;
            margin-top: 6px;
            font-weight: 700;
            color: #8B1A1A;
            font-size: 1.05rem;
          }
          .formula-box {
            margin-top: 15px;
            background: #fbf6f6;
            border: 1px solid #f3e6e6;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 0.9rem;
            color: #8B1A1A;
            font-weight: 600;
          }
          .no-print-btn {
            display: block;
            margin: 20px auto 0;
            padding: 10px 30px;
            background: #8B1A1A;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-family: inherit;
          }
          @media print {
            body { padding: 0; }
            .receipt-container {
              border: 2px dashed #000;
              background: #fff;
            }
            .no-print-btn { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="left-column">
            <div class="brand-title">STELLARA</div>
            <div class="section-title">Sender Details (From)</div>
            <div class="info-group">
              <div class="info-label">Brand Name</div>
              <div class="info-value">STELLARA</div>
            </div>
            <div class="info-group">
              <div class="info-label">Sender Name</div>
              <div class="info-value">Muhammad Ahmad Anees</div>
            </div>
            <div class="info-group">
              <div class="info-label">Address</div>
              <div class="info-value">107 A NFC MAIN BOULEVARD LAHORE PAHSE1</div>
            </div>
          </div>
          <div class="right-column">
            <div class="section-title">Recipient Details (To)</div>
            <div class="info-group">
              <div class="info-label">Order ID</div>
              <div class="info-value" style="font-weight: 700; color: #8B1A1A;">${orderId}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Customer Name</div>
              <div class="info-value" style="font-weight: 700;">${order.name}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Phone Number</div>
              <div class="info-value">${order.phone || 'N/A'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Delivery Address</div>
              <div class="info-value">${order.address || 'N/A'}, ${order.city || ''}</div>
            </div>
            
            <div class="section-title" style="margin-top: 25px;">Order Details</div>
            ${itemsListHtml}
            
            <div class="pricing-table">
              <div class="price-row">
                <span>Subtotal</span>
                <span>Rs. ${subtotal.toLocaleString()}</span>
              </div>
              <div class="price-row">
                <span>Delivery Charge</span>
                <span>${shippingCharge > 0 ? `Rs. ${shippingCharge.toLocaleString()}` : 'Free'}</span>
              </div>
              <div class="price-row total">
                <span>Total Amount</span>
                <span>Rs. ${totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="formula-box">
              Rs. ${subtotal.toLocaleString()} (Total) + Rs. ${shippingCharge.toLocaleString()} (Delivery Charge) = Rs. ${totalAmount.toLocaleString()} (Total Amount)
            </div>
          </div>
        </div>
        <button class="no-print-btn" onclick="window.print()">Print Parcel Receipt</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintBillingParcelReceipt = () => {
    if (billItems.length === 0) return alert('Add at least one product to the bill.');
    if (!billCustomer.name.trim()) return alert('Please enter the customer name.');

    const deliveryInput = window.prompt("Enter delivery charge (default: 200):", "200");
    if (deliveryInput === null) return;
    const shippingCharge = Number(deliveryInput) || 0;

    const subtotal = billSubtotal;
    const totalAmount = subtotal + shippingCharge;

    const itemsListHtml = billItems.map((item, idx) => {
      const lineTotal = item.unitPrice * item.qty;
      const variantParts = [];
      if (item.color) variantParts.push(item.color);
      if (item.size) variantParts.push(item.size);
      const variantStr = variantParts.join(' / ');

      return `
        <div class="item-row">
          <div>
            <span class="item-name">${item.product.name}</span>
            ${variantStr ? `<span style="color:#888;font-size:0.8rem;"> (${variantStr})</span>` : ''}
            <span class="item-qty">× ${item.qty}</span>
          </div>
          <span style="font-weight: 500;">Rs. ${lineTotal.toLocaleString()}</span>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>STELLARA - Parcel Receipt</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Outfit', sans-serif; color: #1a1a1a; padding: 20px; background: #fff; }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px dashed #8B1A1A;
            border-radius: 12px;
            padding: 30px;
            display: flex;
            gap: 30px;
            position: relative;
            background: #fafafc;
          }
          .left-column {
            flex: 1;
            border-right: 2px dashed #e5e7eb;
            padding-right: 30px;
          }
          .right-column {
            flex: 1.2;
          }
          .brand-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            color: #8B1A1A;
            letter-spacing: 4px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-group {
            margin-bottom: 18px;
          }
          .info-label {
            font-size: 0.78rem;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 3px;
          }
          .info-value {
            font-size: 0.95rem;
            font-weight: 500;
            color: #1a1a1a;
            line-height: 1.5;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.9rem;
          }
          .item-name {
            font-weight: 500;
            text-transform: uppercase;
          }
          .item-qty {
            color: #666;
            margin-left: 6px;
          }
          .pricing-table {
            margin-top: 20px;
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .price-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 0.9rem;
          }
          .price-row.total {
            border-top: 1.5px solid #8B1A1A;
            padding-top: 10px;
            margin-top: 6px;
            font-weight: 700;
            color: #8B1A1A;
            font-size: 1.05rem;
          }
          .formula-box {
            margin-top: 15px;
            background: #fbf6f6;
            border: 1px solid #f3e6e6;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 0.9rem;
            color: #8B1A1A;
            font-weight: 600;
          }
          .no-print-btn {
            display: block;
            margin: 20px auto 0;
            padding: 10px 30px;
            background: #8B1A1A;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-family: inherit;
          }
          @media print {
            body { padding: 0; }
            .receipt-container {
              border: 2px dashed #000;
              background: #fff;
            }
            .no-print-btn { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="left-column">
            <div class="brand-title">STELLARA</div>
            <div class="section-title">Sender Details (From)</div>
            <div class="info-group">
              <div class="info-label">Brand Name</div>
              <div class="info-value">STELLARA</div>
            </div>
            <div class="info-group">
              <div class="info-label">Sender Name</div>
              <div class="info-value">Muhammad Ahmad Anees</div>
            </div>
            <div class="info-group">
              <div class="info-label">Address</div>
              <div class="info-value">107 A NFC MAIN BOULEVARD LAHORE PAHSE1</div>
            </div>
          </div>
          <div class="right-column">
            <div class="section-title">Recipient Details (To)</div>
            <div class="info-group">
              <div class="info-label">Order ID</div>
              <div class="info-value" style="font-weight: 700; color: #8B1A1A;">${billNo}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Customer Name</div>
              <div class="info-value" style="font-weight: 700;">${billCustomer.name}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Phone Number</div>
              <div class="info-value">${billCustomer.phone || 'N/A'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Email Address</div>
              <div class="info-value">${billCustomer.email || 'N/A'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Delivery Address</div>
              <div class="info-value">${billCustomer.address || 'N/A'}</div>
            </div>
            
            <div class="section-title" style="margin-top: 25px;">Order Details</div>
            ${itemsListHtml}
            
            <div class="pricing-table">
              <div class="price-row">
                <span>Subtotal</span>
                <span>Rs. ${subtotal.toLocaleString()}</span>
              </div>
              <div class="price-row">
                <span>Delivery Charge</span>
                <span>${shippingCharge > 0 ? `Rs. ${shippingCharge.toLocaleString()}` : 'Free'}</span>
              </div>
              <div class="price-row total">
                <span>Total Amount</span>
                <span>Rs. ${totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="formula-box">
              Rs. ${subtotal.toLocaleString()} (Total) + Rs. ${shippingCharge.toLocaleString()} (Delivery Charge) = Rs. ${totalAmount.toLocaleString()} (Total Amount)
            </div>
          </div>
        </div>
        <button class="no-print-btn" onclick="window.print()">Print Parcel Receipt</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveBillAsOrder = async () => {
    if (billItems.length === 0) return alert('Add at least one product to the bill.');
    if (!billCustomer.name.trim()) return alert('Please enter the customer name.');

    setBillSaving(true);
    setBillSaveMsg('');
    const billNo = generateBillNumber();

    try {
      const discountPerItem = billItems.length > 0 ? Number(billDiscount) / billItems.length : 0;

      for (const item of billItems) {
        const collectionName = collectionsList.find(c => c.id === item.product.collection_id)?.name || '';
        
        const orderData = {
          type: 'Walk-in Sale',
          name: billCustomer.name.trim(),
          phone: billCustomer.phone.trim() || null,
          email: billCustomer.email.trim() || null,
          product_id: item.product.id,
          collection: collectionName,
          tile: item.product.name,
          quantity: item.qty,
          selling_price: item.unitPrice,
          base_price: Number(item.product.base_price) || 0,
          status: 'closed',
          address: billCustomer.address?.trim() || null,
          message: `Walk-in bill ${billNo}${item.color ? ` | Color: ${item.color}` : ''}${item.size ? ` | Size: ${item.size}` : ''}${discountPerItem > 0 ? ` | Discount: Rs. ${Math.round(discountPerItem)}` : ''}`
        };

        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) throw error;

        // Auto deduct stock
        if (item.product.stock !== null && item.product.stock !== undefined) {
          const newStock = Math.max(0, item.product.stock - item.qty);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
        }
      }

      setBillSaveMsg('Bill saved as order successfully!');
      fetchOrders();
      fetchAllProducts();

      // Clear bill after saving
      setTimeout(() => {
        setBillItems([]);
        setBillCustomer({ name: '', phone: '', email: '', address: '' });
        setBillDiscount(0);
        setBillNote('Thank you for visiting Stellara!');
        setBillSaveMsg('');
      }, 2500);
    } catch (e) {
      console.error('Error saving bill as order:', e);
      setBillSaveMsg('Error saving bill: ' + e.message);
    } finally {
      setBillSaving(false);
    }
  };

  const handleClearBill = () => {
    if (billItems.length > 0 && !window.confirm('Are you sure you want to clear the current bill?')) return;
    setBillItems([]);
    setBillCustomer({ name: '', phone: '', email: '', address: '' });
    setBillDiscount(0);
    setBillNote('Thank you for visiting Stellara!');
    setBillSearch('');
    setBillSaveMsg('');
  };

  // --- Reply Modal ---
  const handleOpenReply = (order) => {
    let detailsStr = '';
    if (order.type === 'Sample Request') {
      detailsStr = `Collection: ${order.collection}<br>Tile: ${order.tile}<br>Qty: ${order.quantity}<br>Address: ${order.address}, ${order.city}`;
    } else {
      detailsStr = order.message || '';
    }

    setReplyData({
      orderId: order.id,
      name: order.name || 'Unknown',
      email: order.email || '',
      phone: order.phone || '',
      message: detailsStr,
      replyMsg: 'Is your order confirmed? Reply with Yes or No.\n\nRegards,\nSTELLARA'
    });
    setReplyStatus('');
    setIsReplyModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = replyData.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }
    if (cleanPhone.startsWith('+0')) {
      cleanPhone = '92' + cleanPhone.slice(2);
    }
    if (!cleanPhone) return alert("No phone number available");
    if (!replyData.replyMsg) return alert("Type a message first");

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyData.replyMsg)}`, '_blank');
    updateOrderStatus(replyData.orderId, 'contacted');
  };

  const handleSendEmail = () => {
    if (!replyData.email || replyData.email === 'N/A') return alert("No email available");
    if (!replyData.replyMsg) return alert("Type a message first");

    setReplyStatus('Sending email...');

    const templateParams = {
        to_name: replyData.name,
        name: replyData.name,
        to_email: replyData.email,
        email: replyData.email,
        reply_message: replyData.replyMsg,
        message: replyData.replyMsg
    };

    emailjs.send('service_uojcusn', 'template_t8mjzbs', templateParams)
        .then(() => {
            setReplyStatus('Email sent successfully!');
            updateOrderStatus(replyData.orderId, 'contacted');
            setTimeout(() => {
              setIsReplyModalOpen(false);
            }, 2000);
        })
        .catch(err => {
            console.error('EmailJS error, falling back to Gmail composer:', err);
            setReplyStatus('Opening Gmail compose tab...');
            window.open(`https://mail.google.com/mail/?view=cm&to=${replyData.email}&su=${encodeURIComponent("Stellara Jewellery - Response to Inquiry")}&body=${encodeURIComponent(replyData.replyMsg)}`, '_blank');
            updateOrderStatus(replyData.orderId, 'contacted');
            setTimeout(() => {
              setIsReplyModalOpen(false);
            }, 2000);
        });
  };

  // --- Dashboard Analytics Logic ---
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    let weekCount = 0;
    let lastWeekCount = 0;
    let monthCount = 0;
    let lastMonthCount = 0;
    let statusCounts = { new: 0, contacted: 0, closed: 0 };
    
    let sampleRequests = 0;
    let generalInquiries = 0;

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    let recentOrderStr = "None yet.";

    if (ordersList.length > 0) {
      const recent = ordersList[0];
      const dateStr = recent.created_at ? new Date(recent.created_at).toLocaleDateString() : '';
      recentOrderStr = `${recent.name || 'Unknown'} - ${recent.type || 'Inquiry'} (${dateStr})`;
    }

    const weeksData = [0, 0, 0, 0];

    ordersList.forEach(order => {
      if (order.created_at) {
        const d = new Date(order.created_at);
        if (d > oneWeekAgo) weekCount++;
        else if (d > twoWeeksAgo) lastWeekCount++;
        
        if (d > oneMonthAgo) monthCount++;
        else if (d > twoMonthsAgo) lastMonthCount++;

        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays < 7) weeksData[3]++;
        else if (diffDays >= 7 && diffDays < 14) weeksData[2]++;
        else if (diffDays >= 14 && diffDays < 21) weeksData[1]++;
        else if (diffDays >= 21 && diffDays < 28) weeksData[0]++;
      }

      if (order.type === 'Sample Request' || order.type === 'Inquiry') sampleRequests++;
      else generalInquiries++;

      const s = (order.status || 'new').toLowerCase();
      if (statusCounts[s] !== undefined) statusCounts[s]++;

      // Price accumulations
      const qty = parseInt(order.quantity) || 1;
      const sellPrice = Number(order.selling_price) || 0;
      const costPrice = Number(order.base_price) || 0;

      totalRevenue += sellPrice * qty;
      totalCost += costPrice * qty;
      totalProfit += (sellPrice - costPrice) * qty;
    });

    let weekDelta = lastWeekCount === 0 ? 100 : Math.round(((weekCount - lastWeekCount) / lastWeekCount) * 100);
    let monthDelta = lastMonthCount === 0 ? 100 : Math.round(((monthCount - lastMonthCount) / lastMonthCount) * 100);

    const labels = [];
    for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        labels.push(d.toLocaleDateString(undefined, {month:'short', day:'numeric'}));
    }

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      weekCount, weekDelta, lastWeekCount,
      monthCount, monthDelta, lastMonthCount,
      statusCounts, recentOrderStr,
      weeksData, labels,
      sampleRequests, generalInquiries,
      totalRevenue, totalCost, totalProfit, profitMargin
    };
  }, [ordersList]);

  // Chart configs
  const barData = {
    labels: dashboardStats.labels,
    datasets: [{
      label: 'Inquiries (Last 4 Weeks)',
      data: dashboardStats.weeksData,
      backgroundColor: 'rgba(163, 26, 30, 0.7)',
      borderRadius: 4
    }]
  };

  const doughnutData = {
    labels: ['Sample Requests', 'General Inquiries'],
    datasets: [{
      data: [dashboardStats.sampleRequests, dashboardStats.generalInquiries],
      backgroundColor: ['rgba(163, 26, 30, 0.8)', 'rgba(60, 60, 60, 0.8)'],
      borderWidth: 0
    }]
  };

  const funnelData = {
    labels: ['New', 'Contacted', 'Closed'],
    datasets: [{
      label: 'Status Funnel',
      data: [dashboardStats.statusCounts.new, dashboardStats.statusCounts.contacted, dashboardStats.statusCounts.closed],
      backgroundColor: ['#f39c12', '#3498db', '#2ecc71'],
      borderRadius: 4
    }]
  };


  if (!user) {
    return (
      <div id="login-container" className="admin-login-wrapper">
        <div className="login-box">
          <h2>Admin Login</h2>
          <p>Please enter your credentials to access the admin panel.</p>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="btn">Login</button>
          </form>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard">
      <header id="admin-navbar">
        <div className="container nav-container" style={{ justifyContent: 'space-between' }}>
          <div className="logo">
            <h2>Stellara Admin</h2>
          </div>
          <div>
            <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid white' }}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container admin-content">

        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => { setActiveTab('collections'); setCurrentCollection(null); }}>Collections</button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
          <button className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')} style={{ background: activeTab === 'billing' ? '#10b981' : 'transparent', color: activeTab === 'billing' ? 'white' : '#666' }}><i className="fas fa-file-invoice" style={{ marginRight: '6px' }}></i>Billing</button>
        </div>

        {activeTab === 'dashboard' && (
          <div id="tab-dashboard" className="tab-content active">
            <div className="header-action">
              <h3>Dashboard Analytics</h3>
            </div>
            <div className="dashboard-grid">
              <div className="stat-card">
                  <h5>TOTAL COLLECTIONS</h5>
                  <p id="dash-tot-collections">{collectionsList.length}</p>
              </div>
              <div className="stat-card">
                  <h5>TOTAL PRODUCTS</h5>
                  <p id="dash-tot-products">{totalProductsCount}</p>
              </div>
              <div className="stat-card">
                  <h5>ORDERS THIS WEEK</h5>
                  <p id="dash-orders-week">{dashboardStats.weekCount}</p>
                  <span id="badge-orders-week" style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.85rem', padding: '4px 10px', borderRadius: '12px', background: dashboardStats.weekDelta >= 0 ? '#e6f4ea' : '#fce8e6', color: dashboardStats.weekDelta >= 0 ? 'green' : 'red' }}>
                    {dashboardStats.lastWeekCount === 0 ? '+100% vs last week' : `${dashboardStats.weekDelta > 0 ? '+' : ''}${dashboardStats.weekDelta}% vs last week`}
                  </span>
              </div>
              <div className="stat-card">
                  <h5>ORDERS BY STATUS</h5>
                  <p id="dash-orders-status" style={{ fontSize: '1rem', lineHeight: '1.5', color: '#444', marginTop: '10px' }}>
                    New: {dashboardStats.statusCounts.new}<br/>
                    Contacted: {dashboardStats.statusCounts.contacted}<br/>
                    Closed: {dashboardStats.statusCounts.closed}
                  </p>
                  <span id="badge-orders-status" style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.85rem', padding: '4px 10px', borderRadius: '12px', background: dashboardStats.monthDelta >= 0 ? '#e6f4ea' : '#fce8e6', color: dashboardStats.monthDelta >= 0 ? 'green' : 'red' }}>
                    {dashboardStats.lastMonthCount === 0 ? '+100% vs last month' : `${dashboardStats.monthDelta > 0 ? '+' : ''}${dashboardStats.monthDelta}% vs last month`}
                  </span>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fef7e0 0%, #fff 100%)' }}>
                  <h5>TOTAL REVENUE</h5>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-dark)', marginTop: '8px' }}>Rs. {dashboardStats.totalRevenue.toLocaleString()}</p>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>From order snapshots</span>
              </div>
              <div className="stat-card">
                  <h5>TOTAL BASE COST</h5>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666', marginTop: '8px' }}>Rs. {dashboardStats.totalCost.toLocaleString()}</p>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>Inventory buying valuation</span>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e6f4ea 0%, #fff 100%)' }}>
                  <h5>ESTIMATED NET PROFIT</h5>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '8px' }}>Rs. {dashboardStats.totalProfit.toLocaleString()}</p>
                  <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.85rem', padding: '4px 10px', borderRadius: '12px', background: '#e6f4ea', color: 'green', fontWeight: 'bold' }}>
                    {dashboardStats.profitMargin.toFixed(1)}% Margin
                  </span>
              </div>
              <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
                  <h5>MOST RECENT ORDER</h5>
                  <p id="dash-recent-order" style={{ fontSize: '1.1rem', color: '#555', marginTop: '10px' }}>{dashboardStats.recentOrderStr}</p>
              </div>
            </div>
            
            <div className="dashboard-chart-container" style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1', height: '200px' }}>
                    <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
                <div style={{ gridColumn: '1 / 2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ marginBottom: '15px', color: '#555' }}>Inquiry Split</h4>
                    <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                      <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%' }} />
                    </div>
                </div>
                <div style={{ gridColumn: '2 / 4', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ marginBottom: '15px', color: '#555' }}>Status Funnel</h4>
                    <div style={{ height: '250px', width: '100%', position: 'relative' }}>
                      <Bar data={funnelData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div id="tab-collections" className="tab-content active">
            
            {!currentCollection ? (
              <>
                <div className="header-action">
                  <h3>Manage Collections <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: '#888', marginLeft: '10px'}}>(Drag to reorder)</span></h3>
                  <button className="btn" onClick={() => { setColFormData({ id: '', name: '', description: '', img: '', order: 0, parentId: '', type: 'collection' }); setIsColModalOpen(true); }}><i className="fas fa-plus"></i> Add Collection</button>
                </div>
                {collectionsList.length === 0 ? <p>No collections found.</p> : (
                  <ReactSortable 
                    list={collectionsList} 
                    setList={onCollectionsSortEnd} 
                    className="admin-grid" 
                    animation={150} 
                    ghostClass="dragging"
                  >
                    {collectionsList.map(col => (
                      <div key={col.id} className="admin-card">
                        <div className="admin-card-img" style={{ backgroundImage: `url(${col.img || col.image || ''})` }}>
                          {!(col.img || col.image) && 'No Image'}
                        </div>
                        <div className="admin-card-content">
                          <h4>{col.name || col.title}</h4>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <span style={{ background: col.type === 'category' ? '#e0f2fe' : '#f0fdf4', color: col.type === 'category' ? '#0369a1' : '#15803d', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {col.type || 'collection'}
                            </span>
                            {col.parent_id && (
                              <span style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>
                                Parent: {collectionsList.find(p => p.id === col.parent_id)?.name || 'Unknown'}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Order: {col.order ?? 0}</p>
                          <div className="admin-actions">
                            {col.type !== 'category' && (
                              <button className="admin-btn admin-btn-view" onClick={() => handleOpenProducts(col)}>Products</button>
                            )}
                            <button className="admin-btn admin-btn-edit" onClick={() => handleEditCollection(col)}><i className="fas fa-edit"></i> Edit</button>
                            <button className="admin-btn admin-btn-delete" onClick={() => handleDeleteCollection(col.id, col.name || col.title)}><i className="fas fa-trash"></i></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ReactSortable>
                )}
              </>
            ) : (
              <>
                <div className="header-action">
                  <div>
                    <button className="btn" style={{ background: 'var(--light-bg)', color: 'var(--text-color)', marginRight: '15px' }} onClick={() => setCurrentCollection(null)}><i className="fas fa-arrow-left"></i> Back</button>
                    <h3 style={{ display: 'inline-block' }}>{currentCollection.name || currentCollection.title} Products</h3>
                  </div>
                  <button className="btn" onClick={() => { setProdFormData({ id: '', name: '', price: '', base_price: '', discount_price: '', description: '', img: '', images: [], colorsInput: '', colorImageMapping: {}, colorStockMapping: {}, sizes: '', refcode: '', order: 0, stock: '', show_sizes: true }); setIsProdModalOpen(true); }}><i className="fas fa-plus"></i> Add Product</button>
                </div>
                {productsList.length === 0 ? <p>No products found in this collection.</p> : (
                  <ReactSortable 
                    list={productsList} 
                    setList={onProductsSortEnd} 
                    className="admin-grid" 
                    animation={150} 
                    ghostClass="dragging"
                  >
                    {productsList.map(prod => {
                      const parsedImg = parseProductImages(prod.img);
                      const displayImg = parsedImg.defaultImg;
                      return (
                      <div key={prod.id} className="collection-card" style={{ opacity: 1, transform: 'translateY(0)', display: 'flex', flexDirection: 'column' }}>
                        <div
                          className="img-placeholder"
                          style={displayImg ? {
                            backgroundImage: `url('${displayImg}'), linear-gradient(#ffffff, #ffffff)`,
                            backgroundSize: 'contain, cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            color: 'transparent',
                            padding: '1.5rem',
                            backgroundOrigin: 'content-box, padding-box',
                            width: '100%'
                          } : { width: '100%' }}
                          title={displayImg ? 'Product Image' : ''}
                        >
                          {!displayImg && <span>Product Image</span>}
                        </div>
                        <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flexGrow: 1 }}>
                          <div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: '0.4rem', marginBottom: '0.5rem' }}>
                              <h3 style={{ margin: '0', fontWeight: 'bold', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textTransform: 'uppercase', fontSize: '1.2rem', color: '#000' }}>{prod.name}</h3>
                              {prod.refcode && <span className="ref-code" style={{ fontWeight: 'normal' }}>{prod.refcode}</span>}
                            </div>
                            <p className="card-desc" style={{ marginTop: '0.4rem', fontSize: '0.9rem', color: '#555' }}>{prod.description || prod.desc || ''}</p>

                            <div style={{ marginTop: '0.8rem', marginBottom: '0.8rem', padding: '8px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #eee', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Selling Price:</span>
                                {prod.discount_price ? (
                                  <div>
                                    <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '6px', fontSize: '0.8rem' }}>Rs. {Number(prod.price || 0).toLocaleString()}</span>
                                    <strong style={{ color: '#8B1A1A' }}>Rs. {Number(prod.discount_price).toLocaleString()}</strong>
                                  </div>
                                ) : (
                                  <strong style={{ color: 'var(--brand-gold)' }}>Rs. {Number(prod.price || 0).toLocaleString()}</strong>
                                )}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#666' }}>Base Cost:</span>
                                <span style={{ color: '#555' }}>Rs. {Number(prod.base_price || 0).toLocaleString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid #eee', fontWeight: 'bold' }}>
                                <span style={{ color: '#444' }}>Est. Unit Profit:</span>
                                {(() => {
                                  const effectivePrice = prod.discount_price !== null && prod.discount_price !== undefined ? prod.discount_price : prod.price;
                                  const profit = Number(effectivePrice || 0) - Number(prod.base_price || 0);
                                  return (
                                    <span style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}>
                                      Rs. {profit.toLocaleString()}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', marginBottom: '15px' }}>
                              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>Order: {prod.order ?? 0}</p>
                              <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: prod.stock === null || prod.stock === undefined ? '#f3f4f6' : prod.stock === 0 ? '#fee2e2' : prod.stock <= 5 ? '#fef3c7' : '#dcfce7',
                                color: prod.stock === null || prod.stock === undefined ? '#6b7280' : prod.stock === 0 ? '#dc2626' : prod.stock <= 5 ? '#d97706' : '#16a34a'
                              }}>
                                {prod.stock === null || prod.stock === undefined ? '∞ Unlimited' : prod.stock === 0 ? 'SOLD OUT' : `${prod.stock} in stock`}
                              </span>
                            </div>
                          </div>
                          <div className="admin-actions" style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <button className="admin-btn admin-btn-edit" style={{ flex: 1, padding: '8px 12px' }} onClick={() => handleEditProduct(prod)}><i className="fas fa-edit"></i> Edit</button>
                            <button className="admin-btn admin-btn-delete" style={{ width: '40px', padding: '8px 12px' }} onClick={() => handleDeleteProduct(prod.id, prod.name)}><i className="fas fa-trash"></i></button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </ReactSortable>
                )}
              </>
            )}

          </div>
        )}

        {activeTab === 'orders' && (
          <div id="tab-orders" className="tab-content active">
            <div className="header-action">
              <h3>Manage Orders & Inquiries</h3>
            </div>

            <div className="order-filters" style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" placeholder="Search by name, email or type..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', flex: '1 1 200px' }} />
                
                <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="All">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                    <option value="closed">Closed</option>
                </select>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.9rem', color: '#666' }}>From:</label>
                    <input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <label style={{ fontSize: '0.9rem', color: '#666' }}>To:</label>
                    <input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn" style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e5e7eb', color: '#374151' }} onClick={() => setDateFilter(0, 0)}>Today</button>
                    <button className="btn" style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e5e7eb', color: '#374151' }} onClick={() => setDateFilter(7, 0)}>7D</button>
                    <button className="btn" style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e5e7eb', color: '#374151' }} onClick={() => setDateFilter(30, 0)}>30D</button>
                    <button className="btn" style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e5e7eb', color: '#374151' }} onClick={() => setDateFilter(null, null)}>All</button>
                </div>
            </div>

            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Email / Phone</th>
                    <th>Type</th>
                    <th>Financials</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan="8">No orders or inquiries found.</td></tr>
                  ) : (
                    filteredOrders.map(order => {
                      let fullDetails = '';
                      if (order.type === 'Sample Request') {
                          fullDetails = `Col: ${order.collection} | Tile: ${order.tile} | Qty: ${order.quantity} | Addr: ${order.address}, ${order.city}`;
                      } else {
                          fullDetails = order.message || '';
                      }

                      const limit = order.type === 'Sample Request' ? 80 : 50;
                      const hasMore = fullDetails.length > limit;
                      const isExpanded = !!expandedOrders[order.id];
                      const detailsStr = hasMore && !isExpanded ? fullDetails.substring(0, limit) + '...' : fullDetails;

                      const qty = parseInt(order.quantity) || 1;
                      const rev = Number(order.selling_price || 0) * qty;
                      const cost = Number(order.base_price || 0) * qty;
                      const profit = rev - cost;

                      return (
                      <tr key={order.id}>
                        <td>
                          {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px', fontWeight: 'bold' }}>
                            ID: #{order.id ? (order.id.includes('-') ? order.id.split('-')[0].toUpperCase() : order.id.substring(0, 8).toUpperCase()) : 'N/A'}
                          </div>
                        </td>
                        <td><strong>{order.name}</strong></td>
                        <td>{order.email}<br/>{order.phone}</td>
                        <td>{order.type}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {rev > 0 ? (
                            <div>
                              <div>Rev: <strong>Rs. {rev.toLocaleString()}</strong></div>
                              <div style={{ color: '#666', fontSize: '0.75rem' }}>Cost: Rs. {cost.toLocaleString()}</div>
                              <div style={{ color: profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '2px' }}>
                                Profit: {profit >= 0 ? '+' : ''}Rs. {profit.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>No snapshot price</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '350px', wordBreak: 'break-word' }}>
                          <span style={{ whiteSpace: 'pre-wrap' }}>{detailsStr}</span>
                          {hasMore && (
                            <button 
                              onClick={() => setExpandedOrders(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                              style={{ 
                                display: 'inline-block', 
                                border: 'none', 
                                background: 'none', 
                                color: '#3b82f6', 
                                cursor: 'pointer', 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                marginLeft: '6px',
                                padding: 0 
                              }}
                            >
                              {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                          {order.message && order.message.includes('Payment Receipt: ') && (
                            <div style={{ marginTop: '8px' }}>
                              <a
                                href={order.message.match(/Payment Receipt:\s*(https?:\/\/[^\s\n]+)/)?.[1]}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  background: '#0d9488',
                                  color: '#fff',
                                  textDecoration: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: '600',
                                  boxShadow: '0 2px 5px rgba(13,148,136,0.25)',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f766e'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0d9488'}
                              >
                                <i className="fas fa-receipt"></i>
                                View SadaPay Receipt
                              </a>
                            </div>
                          )}
                        </td>
                        <td><span className={`status-badge status-${order.status || 'new'}`}>{(order.status || 'new').toUpperCase()}</span></td>
                        <td>
                          <select 
                            value={order.status || 'new'} 
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)} 
                            style={{ padding: '5px', borderRadius: '4px', marginBottom: '5px', display: 'block', width: '100%' }}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="closed">Closed</option>
                          </select>
                          <button className="admin-btn admin-btn-view" style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem', background: '#3b82f6', color: '#fff', marginRight: '5px' }} onClick={() => handlePrintParcelReceipt(order)}><i className="fas fa-box"></i> Parcel Receipt</button>
                          <button className="admin-btn admin-btn-view" style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => handleOpenReply(order)}><i className="fas fa-reply"></i> Reply</button>
                          <button className="admin-btn admin-btn-delete" style={{ display: 'inline-block', width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => deleteOrder(order.id)}><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div id="tab-inventory" className="tab-content active">
            <div className="header-action">
              <h3>Inventory Management</h3>
            </div>

            {/* Overview cards */}
            <div className="dashboard-grid" style={{ marginBottom: '25px' }}>
              <div className="stat-card">
                <h5>TOTAL CATALOG PRODUCTS</h5>
                <p>{allProductsList.length}</p>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e6f4ea 0%, #fff 100%)' }}>
                <h5>TOTAL STOCK VALUATION</h5>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', marginTop: '8px' }}>
                  Rs. {inventoryStats.totalStockValuation.toLocaleString()}
                </p>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>Based on buying cost * stock</span>
              </div>
              <div className="stat-card" style={{ background: inventoryStats.lowStockCount > 0 ? 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)' : '#fff' }}>
                <h5>LOW STOCK ITEMS (≤5)</h5>
                <p style={{ color: inventoryStats.lowStockCount > 0 ? '#d97706' : '#1a1a1a' }}>{inventoryStats.lowStockCount}</p>
              </div>
              <div className="stat-card" style={{ background: inventoryStats.outOfStockCount > 0 ? 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)' : '#fff' }}>
                <h5>OUT OF STOCK (0)</h5>
                <p style={{ color: inventoryStats.outOfStockCount > 0 ? '#dc2626' : '#1a1a1a' }}>{inventoryStats.outOfStockCount}</p>
              </div>
              <div 
                className="stat-card" 
                onClick={() => setIsStockModalOpen(true)}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  border: '1.5px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#16a34a';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <h5>PRODUCT QUANTITY</h5>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{totalStockQty}</p>
                <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', display: 'block' }}>Click to view details</span>
              </div>
            </div>

            {/* Filters panel */}
            <div className="order-filters" style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search products by name, code, collection..." 
                value={inventorySearch} 
                onChange={e => setInventorySearch(e.target.value)} 
                style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', flex: '1 1 250px' }} 
              />
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', color: '#666' }}>Stock Status:</label>
                <select 
                  value={inventoryStockFilter} 
                  onChange={e => setInventoryStockFilter(e.target.value)} 
                  style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
                >
                  <option value="All">All Stock Levels</option>
                  <option value="Low">Low Stock (≤5)</option>
                  <option value="Out">Out of Stock (0)</option>
                  <option value="Unlimited">Unlimited Stock (∞)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', color: '#666' }}>Sort By:</label>
                <select 
                  value={inventorySort} 
                  onChange={e => setInventorySort(e.target.value)} 
                  style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
                >
                  <option value="name">Product Name (A-Z)</option>
                  <option value="stock-asc">Stock (Low to High)</option>
                  <option value="stock-desc">Stock (High to Low)</option>
                  <option value="orders-desc">Times Ordered (Most to Least)</option>
                </select>
              </div>
            </div>

            {/* Inventory table */}
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Collection</th>
                    <th>Cost Breakdown</th>
                    <th>Stock Quantity</th>
                    <th>Order Stats</th>
                    <th>Last Ordered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr><td colSpan="6">No products found in inventory.</td></tr>
                  ) : (
                    filteredInventory.map(prod => {
                      const estProfit = (prod.price || 0) - (prod.base_price || 0);
                      const isLow = prod.stock !== null && prod.stock > 0 && prod.stock <= 5;
                      const isOut = prod.stock === 0;

                      return (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {prod.img ? (
                                <div style={{ width: '48px', height: '48px', borderRadius: '6px', backgroundImage: `url(${prod.img})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #eee' }} />
                              ) : (
                                <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#ccc' }}>No Image</div>
                              )}
                              <div style={{ textAlign: 'left' }}>
                                <strong style={{ fontSize: '0.9rem', color: '#1a1a1a', textTransform: 'uppercase' }}>{prod.name}</strong>
                                {prod.refcode && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Ref: {prod.refcode}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: '#555' }}>{prod.collectionName}</span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            <div>Cost: <span style={{ color: '#666' }}>Rs. {Number(prod.base_price || 0).toLocaleString()}</span></div>
                            <div>Retail: <strong style={{ color: 'var(--brand-gold, #c5a880)' }}>Rs. {Number(prod.price || 0).toLocaleString()}</strong></div>
                            <div style={{ color: estProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: '500', fontSize: '0.75rem', marginTop: '2px' }}>
                              Profit: Rs. {estProfit.toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {prod.stock === null || prod.stock === undefined ? (
                                <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '500' }}>∞ Unlimited</span>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleQuickStockChange(prod.id, prod.stock - 1)} 
                                    disabled={prod.stock <= 0}
                                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                                  >-</button>
                                  <span style={{ 
                                    fontWeight: 'bold', 
                                    width: '32px', 
                                    textAlign: 'center', 
                                    fontSize: '0.9rem',
                                    color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a' 
                                  }}>
                                    {prod.stock}
                                  </span>
                                  <button 
                                    onClick={() => handleQuickStockChange(prod.id, prod.stock + 1)}
                                    style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                                  >+</button>
                                </>
                              )}
                              <button 
                                onClick={() => handleToggleUnlimitedStock(prod.id, prod.stock)}
                                style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid #ccc', background: '#f3f4f6', color: '#4b5563', cursor: 'pointer', marginLeft: '4px', transition: 'all 0.15s ease' }}
                                onMouseOver={e => e.target.style.background = '#e5e7eb'}
                                onMouseOut={e => e.target.style.background = '#f3f4f6'}
                              >
                                {prod.stock === null || prod.stock === undefined ? 'Set Limit' : 'Make ∞'}
                              </button>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            <div>Orders: <strong>{prod.orderCount}</strong></div>
                            <div style={{ color: '#666', fontSize: '0.75rem' }}>Qty Sold: {prod.unitsOrdered} units</div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: '#555' }}>
                            {prod.lastOrdered ? (
                              <div>
                                <div>{new Date(prod.lastOrdered).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(prod.lastOrdered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            ) : (
                              <span style={{ color: '#aaa', fontStyle: 'italic' }}>Never ordered</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div id="tab-billing" className="tab-content active">
            <div className="header-action">
              <h3><i className="fas fa-file-invoice" style={{ marginRight: '10px', color: '#10b981' }}></i>Generate Bill</h3>
              <button className="btn" style={{ background: '#ef4444' }} onClick={handleClearBill}><i className="fas fa-times"></i> Clear Bill</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              {/* Left column: Product search + bill items */}
              <div>
                {/* Product Search */}
                <div className="billing-search-section" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '20px', position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
                    <i className="fas fa-search" style={{ marginRight: '6px', color: '#10b981' }}></i>Search & Add Products
                  </label>
                  <input
                    type="text"
                    placeholder="Type product name or ref code..."
                    value={billSearch}
                    onChange={e => setBillSearch(e.target.value)}
                    onFocus={() => setBillSearchFocused(true)}
                    onBlur={() => setTimeout(() => setBillSearchFocused(false), 200)}
                    style={{ width: '100%', padding: '12px 15px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  />
                  {billSearchFocused && billSearchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: '0', right: '0', background: 'white', borderRadius: '0 0 12px 12px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', borderTop: 'none', zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
                      {billSearchResults.map(prod => {
                        const parsed = parseProductImages(prod.img);
                        const colorsList = Object.keys(parsed.colors || {});
                        const hasDiscount = prod.discount_price !== null && prod.discount_price !== undefined && Number(prod.discount_price) > 0;
                        const effectivePrice = hasDiscount ? Number(prod.discount_price) : Number(prod.price || 0);

                        return (
                          <div
                            key={prod.id}
                            onMouseDown={() => handleAddBillItem(prod)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'}
                            onMouseOut={e => e.currentTarget.style.background = 'white'}
                          >
                            {prod.img ? (
                              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundImage: `url(${parsed.defaultImg || prod.img})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #eee', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#ccc', flexShrink: 0 }}>No Img</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                {prod.refcode || 'No ref code'}
                                {colorsList.length > 0 && <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '6px' }}>({colorsList.length} Color{colorsList.length > 1 ? 's' : ''})</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontWeight: '700', color: '#10b981' }}>
                                Rs. {effectivePrice.toLocaleString()}
                                {hasDiscount && (
                                  <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.75rem', marginLeft: '4px', fontWeight: 'normal' }}>
                                    Rs. {Number(prod.price || 0).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: prod.stock === null ? '#888' : prod.stock === 0 ? '#dc2626' : '#16a34a' }}>
                                {prod.stock === null || prod.stock === undefined ? '∞' : prod.stock === 0 ? 'Sold out' : `${prod.stock} left`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bill Items Table */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', overflow: 'hidden' }}>
                  <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#333' }}><i className="fas fa-shopping-cart" style={{ marginRight: '8px', color: '#10b981' }}></i>Bill Items</h4>
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>{billItems.length} item{billItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  {billItems.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>
                      <i className="fas fa-receipt" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', opacity: 0.3 }}></i>
                      <p>No items added yet. Search for a product above.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Color</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Size</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                          <th style={{ padding: '10px 6px', width: '30px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map((item, idx) => {
                          const parsedImg = parseProductImages(item.product.img);
                          const colorsList = Object.keys(parsedImg.colors || {});
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>{item.product.name}</div>
                                {item.product.refcode && <div style={{ fontSize: '0.7rem', color: '#999' }}>Ref: {item.product.refcode}</div>}
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                {colorsList.length > 0 ? (
                                  <select
                                    value={item.color || ''}
                                    onChange={e => handleBillItemChange(idx, 'color', e.target.value)}
                                    style={{
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      border: item.color ? '1px solid #10b981' : '1px solid #ddd',
                                      fontSize: '0.8rem',
                                      maxWidth: '90px',
                                      background: item.color ? '#f0fdf4' : '#fff',
                                      fontWeight: item.color ? '600' : 'normal',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">Select</option>
                                    {colorsList.map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{ color: '#ccc', fontSize: '0.8rem' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                {item.product.sizes && item.product.show_sizes !== false ? (
                                  <select
                                    value={item.size || ''}
                                    onChange={e => handleBillItemChange(idx, 'size', e.target.value)}
                                    style={{ padding: '4px 6px', borderRadius: '4px', border: item.size ? '1px solid #10b981' : '1px solid #ddd', fontSize: '0.8rem', width: '60px', background: item.size ? '#f0fdf4' : '#fff' }}
                                  >
                                    <option value="">—</option>
                                    {item.product.sizes.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{ color: '#ccc', fontSize: '0.8rem' }}>—</span>
                                )}
                              </td>
                            <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <button
                                  onClick={() => handleBillItemChange(idx, 'qty', item.qty - 1)}
                                  style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}
                                >-</button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={e => handleBillItemChange(idx, 'qty', e.target.value)}
                                  style={{ width: '40px', textAlign: 'center', padding: '3px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                                />
                                <button
                                  onClick={() => handleBillItemChange(idx, 'qty', item.qty + 1)}
                                  style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}
                                >+</button>
                              </div>
                            </td>
                            <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={e => handleBillItemChange(idx, 'unitPrice', e.target.value)}
                                style={{ width: '80px', textAlign: 'right', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#333' }}>
                              Rs. {(item.unitPrice * item.qty).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 6px' }}>
                              <button
                                onClick={() => handleRemoveBillItem(idx)}
                                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', transition: 'all 0.15s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#fca5a5'}
                                onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
                              ><i className="fas fa-times"></i></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right column: Customer info + Summary */}
              <div>
                {/* Customer Info */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#333' }}><i className="fas fa-user" style={{ marginRight: '8px', color: '#10b981' }}></i>Customer Details</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Name *</label>
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={billCustomer.name}
                      onChange={e => setBillCustomer({ ...billCustomer, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Phone</label>
                    <input
                      type="tel"
                      placeholder="Phone number (optional)"
                      value={billCustomer.phone}
                      onChange={e => setBillCustomer({ ...billCustomer, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Email</label>
                    <input
                      type="email"
                      placeholder="Email address (optional)"
                      value={billCustomer.email}
                      onChange={e => setBillCustomer({ ...billCustomer, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Shipping Address</label>
                    <input
                      type="text"
                      placeholder="Shipping address (optional)"
                      value={billCustomer.address || ''}
                      onChange={e => setBillCustomer({ ...billCustomer, address: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#333' }}><i className="fas fa-calculator" style={{ marginRight: '8px', color: '#10b981' }}></i>Summary</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.95rem', color: '#555' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: '500' }}>Rs. {billSubtotal.toLocaleString()}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '0.95rem' }}>
                    <label style={{ color: '#555' }}>Discount</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>Rs.</span>
                      <input
                        type="number"
                        min="0"
                        value={billDiscount}
                        onChange={e => setBillDiscount(e.target.value)}
                        style={{ width: '90px', textAlign: 'right', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 8px', fontSize: '1.3rem', fontWeight: '700', borderTop: '2px solid #10b981', marginTop: '10px', color: '#10b981' }}>
                    <span>Grand Total</span>
                    <span>Rs. {billGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Bill Note */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333' }}><i className="fas fa-sticky-note" style={{ marginRight: '8px', color: '#f59e0b' }}></i>Bill Note</h4>
                  <textarea
                    rows="2"
                    placeholder="Note to print on bill (optional)"
                    value={billNote}
                    onChange={e => setBillNote(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="btn"
                    onClick={handlePrintBill}
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <i className="fas fa-print"></i> Preview & Print Bill
                  </button>
                  <button
                    className="btn"
                    onClick={handlePrintBillingParcelReceipt}
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <i className="fas fa-box"></i> Preview & Print Parcel Receipt
                  </button>
                  <button
                    className="btn"
                    onClick={handleSaveBillAsOrder}
                    disabled={billSaving}
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: billSaving ? 0.6 : 1 }}
                  >
                    <i className="fas fa-save"></i> {billSaving ? 'Saving...' : 'Save Bill as Order'}
                  </button>
                  {billSaveMsg && (
                    <p style={{ textAlign: 'center', fontWeight: '600', padding: '10px', borderRadius: '8px', background: billSaveMsg.includes('Error') ? '#fee2e2' : '#d1fae5', color: billSaveMsg.includes('Error') ? '#dc2626' : '#059669', fontSize: '0.9rem' }}>
                      {billSaveMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isColModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#999' }} onClick={() => setIsColModalOpen(false)}>&times;</span>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>{colFormData.id ? 'Edit Collection' : 'Add Collection'}</h3>
            <form onSubmit={handleSaveCollection}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-color)' }}>Collection Name</label>
                <input type="text" value={colFormData.name} onChange={e => setColFormData({...colFormData, name: e.target.value})} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-color)' }}>Type</label>
                <select 
                  value={colFormData.type || 'collection'} 
                  onChange={e => setColFormData({...colFormData, type: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  <option value="collection">Product Collection (contains products)</option>
                  <option value="category">Category Folder (contains subfolders/collections)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-color)' }}>Parent Category</label>
                <select 
                  value={colFormData.parentId || ''} 
                  onChange={e => setColFormData({...colFormData, parentId: e.target.value})} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  <option value="">None (Root Category)</option>
                  {collectionsList
                    .filter(c => c.type === 'category' && c.id !== colFormData.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.title}</option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-color)' }}>Description</label>
                <textarea rows="3" value={colFormData.description} onChange={e => setColFormData({...colFormData, description: e.target.value})} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}></textarea>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-color)' }}>Cover Image</label>
                <input type="file" accept="image/*" onChange={handleColImageUpload} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px', textAlign: 'center' }}>- OR paste a URL below -</div>
                <input type="url" placeholder="https://..." value={colFormData.img} onChange={e => setColFormData({...colFormData, img: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-color)' }}>Sort Order</label>
                <input type="number" value={colFormData.order} onChange={e => setColFormData({...colFormData, order: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }}>Save Collection</button>
            </form>
          </div>
        </div>
      )}

      {isProdModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <span style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#999' }} onClick={() => setIsProdModalOpen(false)}>&times;</span>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>{prodFormData.id ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Product Name</label>
                <input type="text" value={prodFormData.name} onChange={e => setProdFormData({...prodFormData, name: e.target.value})} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Selling Price (shown to customers)</label>
                <input type="number" value={prodFormData.price} onChange={e => setProdFormData({...prodFormData, price: e.target.value})} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Base Price (Buying Cost, hidden from customers)</label>
                <input type="number" value={prodFormData.base_price} onChange={e => setProdFormData({...prodFormData, base_price: e.target.value})} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Discounted Price <span style={{ fontWeight: '400', color: '#999', fontSize: '0.85rem' }}>(optional – leave empty for no discount)</span></label>
                <input type="number" value={prodFormData.discount_price} onChange={e => setProdFormData({...prodFormData, discount_price: e.target.value})} placeholder="e.g. 2500" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                {prodFormData.discount_price && Number(prodFormData.discount_price) < Number(prodFormData.price) && (
                  <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#10b981' }}>
                    <i className="fas fa-tag" style={{ marginRight: '4px' }}></i>
                    Customers will see: <s style={{ color: '#999' }}>Rs. {Number(prodFormData.price).toLocaleString()}</s> → <strong>Rs. {Number(prodFormData.discount_price).toLocaleString()}</strong>
                    ({Math.round((1 - Number(prodFormData.discount_price) / Number(prodFormData.price)) * 100)}% off)
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                <textarea rows="3" value={prodFormData.description} onChange={e => setProdFormData({...prodFormData, description: e.target.value})} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}></textarea>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem', border: '1px solid #eee', padding: '12px', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--primary-color)' }}>Product Images & Colors</label>
                
                {/* Upload Section */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#666' }}>Upload Images (Can select multiple)</label>
                  <input type="file" accept="image/*" multiple onChange={handleProdImageUpload} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>
                
                {/* Add Image by URL */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                  <input 
                    type="url" 
                    placeholder="Or paste an image URL..." 
                    value={imageUrlInput} 
                    onChange={e => setImageUrlInput(e.target.value)} 
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} 
                  />
                  <button type="button" className="btn" onClick={handleAddImageUrl} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>Add URL</button>
                </div>

                {/* Thumbnails list */}
                {prodFormData.images && prodFormData.images.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                    {prodFormData.images.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                        <img src={url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveImage(idx)} 
                          style={{ position: 'absolute', top: 0, right: 0, background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '0 0 0 4px', cursor: 'pointer', padding: '2px 4px', fontSize: '10px' }}
                        >
                          &times;
                        </button>
                        <span style={{ position: 'absolute', bottom: 0, left: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', padding: '1px 3px', borderTopRightRadius: '4px' }}>
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Colors Option */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#666' }}>Available Colors (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Black, Red, Champagne, White" 
                    value={prodFormData.colorsInput || ''} 
                    onChange={e => setProdFormData({ ...prodFormData, colorsInput: e.target.value })} 
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} 
                  />
                  <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px', display: 'block' }}>Each color will show as a swatch. Mappings are set below.</span>
                </div>

                {/* Color-Image Mapping */}
                {prodFormData.colorsInput && prodFormData.images && prodFormData.images.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#555' }}>Map Colors to Images</label>
                    {prodFormData.colorsInput.split(',').map(c => c.trim()).filter(Boolean).map(color => {
                      const mappedUrl = (prodFormData.colorImageMapping || {})[color] || '';
                      return (
                        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500', width: '120px', textTransform: 'capitalize', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{color}:</span>
                          <select
                            value={mappedUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProdFormData(prev => ({
                                ...prev,
                                colorImageMapping: {
                                  ...prev.colorImageMapping,
                                  [color]: val
                                }
                              }));
                            }}
                            style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                          >
                            <option value="">-- Select Image --</option>
                            {prodFormData.images.map((imgUrl, idx) => (
                              <option key={idx} value={imgUrl}>Image #{idx + 1}</option>
                            ))}
                          </select>
                          {mappedUrl && (
                            <img src={mappedUrl} alt={color} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Color-Stock Mapping */}
                {prodFormData.colorsInput && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#555' }}>Color Variant Stock (Optional)</label>
                    {prodFormData.colorsInput.split(',').map(c => c.trim()).filter(Boolean).map(color => {
                      const stockVal = (prodFormData.colorStockMapping || {})[color] ?? '';
                      return (
                        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500', width: '120px', textTransform: 'capitalize', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{color} Stock:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Leave empty for unlimited"
                            value={stockVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProdFormData(prev => ({
                                ...prev,
                                colorStockMapping: {
                                  ...prev.colorStockMapping,
                                  [color]: val
                                }
                              }));
                            }}
                            style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                          />
                        </div>
                      );
                    })}
                    <span style={{ fontSize: '0.72rem', color: '#999', marginTop: '4px', display: 'block' }}>If set, color-specific stock takes priority. Otherwise, the main stock quantity is used.</span>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="checkbox" checked={prodFormData.show_sizes} onChange={e => setProdFormData({...prodFormData, show_sizes: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#8B1A1A', cursor: 'pointer' }} />
                  This product has size options
                </label>
              </div>
              {prodFormData.show_sizes && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Available Sizes</label>
                  <input type="text" placeholder="e.g. 6, 7, 8 or 16&quot;, 18&quot;" value={prodFormData.sizes} onChange={e => setProdFormData({...prodFormData, sizes: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                  <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px', display: 'block' }}>Comma-separated values. E.g. 6, 7, 8 for rings or 16", 18" for chains.</span>
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reference Code (SKU) <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" value={prodFormData.refcode} onChange={e => setProdFormData({...prodFormData, refcode: e.target.value})} required placeholder="e.g. ZS-01" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                <span style={{ fontSize: '0.72rem', color: '#999', marginTop: '4px', display: 'block' }}>Required. Must be unique for each product.</span>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Stock Quantity</label>
                <input type="number" min="0" placeholder="Leave empty for unlimited" value={prodFormData.stock} onChange={e => setProdFormData({...prodFormData, stock: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                <span style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px', display: 'block' }}>Leave empty = unlimited stock. Set to 0 = sold out.</span>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Sort Order</label>
                <input type="number" value={prodFormData.order} onChange={e => setProdFormData({...prodFormData, order: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }}>Save Product</button>
            </form>
          </div>
        </div>
      )}

      {isReplyModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#999' }} onClick={() => setIsReplyModalOpen(false)}>&times;</span>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Reply to Inquiry</h3>
            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                <p><strong>Name:</strong> {replyData.name}</p>
                <p><strong>Email:</strong> {replyData.email}</p>
                <p><strong>Phone:</strong> {replyData.phone}</p>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                    <strong>Message/Details:</strong>
                    <p style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: replyData.message }}></p>
                </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Your Reply Message</label>
                <textarea 
                  rows="6" 
                  placeholder="Type your response here..." 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit' }}
                  value={replyData.replyMsg}
                  onChange={e => setReplyData({...replyData, replyMsg: e.target.value})}
                ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn" style={{ flex: 1, background: '#25D366', borderColor: '#25D366', color: 'white' }} onClick={handleSendWhatsApp}>
                    <i className="fab fa-whatsapp"></i> Send via WhatsApp
                </button>
                <button className="btn" style={{ flex: 1 }} onClick={handleSendEmail}>
                    <i className="fas fa-envelope"></i> Send Email
                </button>
            </div>
            {replyStatus && <p style={{ marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{replyStatus}</p>}
          </div>
        </div>
      )}

      {isStockModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '95%', maxWidth: '600px', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <span style={{ position: 'absolute', top: '15px', right: '20px', cursor: 'pointer', fontSize: '1.5rem', color: '#999' }} onClick={() => setIsStockModalOpen(false)}>&times;</span>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Product Stock Quantities</h3>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '5px' }}>
              <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'auto' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '10px 5px', background: 'none' }}>Product</th>
                    <th style={{ padding: '10px 5px', background: 'none' }}>Ref Code</th>
                    <th style={{ padding: '10px 5px', textAlign: 'right', background: 'none' }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {allProductsList.length === 0 ? (
                    <tr><td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: '#999' }}>No products in catalog</td></tr>
                  ) : (
                    allProductsList.map(prod => {
                      const isLow = prod.stock !== null && prod.stock > 0 && prod.stock <= 5;
                      const isOut = prod.stock === 0;

                      return (
                        <tr key={prod.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {prod.img ? (
                                <div style={{ width: '36px', height: '36px', borderRadius: '4px', backgroundImage: `url(${prod.img})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #eee' }} />
                              ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#ccc' }}>No Image</div>
                              )}
                              <span style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: '0.85rem' }}>{prod.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 5px', fontSize: '0.85rem', color: '#666' }}>
                            {prod.refcode || <span style={{ color: '#ccc', fontStyle: 'italic' }}>None</span>}
                          </td>
                          <td style={{ padding: '10px 5px', textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: prod.stock === null || prod.stock === undefined ? '#f3f4f6' : isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                              color: prod.stock === null || prod.stock === undefined ? '#6b7280' : isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a'
                            }}>
                              {prod.stock === null || prod.stock === undefined ? '∞ Unlimited' : isOut ? 'SOLD OUT' : `${prod.stock} Units`}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setIsStockModalOpen(false)} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '15px' }}></i>
            <h3 style={{ marginBottom: '10px', color: '#1a1a1a' }}>Confirm Deletion</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to delete the {deleteConfirm.type} <strong>{deleteConfirm.name}</strong>? 
              {deleteConfirm.type === 'collection' && " Note: All products inside this collection must be deleted first."}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6', borderColor: '#d1d5db', color: '#1f2937' }} onClick={() => setDeleteConfirm({ open: false, id: '', type: '', name: '' })}>Cancel</button>
              <button type="button" className="btn" style={{ flex: 1, background: '#dc2626', borderColor: '#dc2626', color: '#fff' }} onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {adminAlert.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#b45309', marginBottom: '15px' }}></i>
            <h3 style={{ marginBottom: '10px', color: '#1a1a1a' }}>{adminAlert.title}</h3>
            <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
              {adminAlert.message}
            </p>
            <button type="button" className="btn" style={{ width: '100%', background: '#8B1A1A' }} onClick={() => setAdminAlert({ open: false, title: '', message: '' })}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
