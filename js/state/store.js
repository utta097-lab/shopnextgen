/**
 * SHOPNEX State Store
 * Reactive state management with localStorage persistence and pub/sub events.
 */

import { PRODUCTS } from '../data/products.js';
import { fetchRemoteProducts, saveRemoteProduct, deleteRemoteProduct } from '../services/supabaseService.js';
import { getSupabaseConfig } from '../config/supabaseConfig.js';

const STORAGE_KEYS = {
  CART: 'shopnex_custom_cart_v2',
  WISHLIST: 'shopnex_custom_wishlist_v2',
  ORDERS: 'shopnex_custom_orders_v2',
  RECENTLY_VIEWED: 'shopnex_custom_recently_viewed_v2',
  USER: 'shopnex_user_v2',
  SELLER_PRODUCTS: 'shopnex_seller_products_v2'
};

const DEFAULT_USER = {
  isLoggedIn: true,
  name: "Mr Modon Pal",
  email: "modon.pal@shopnex.in",
  phone: "+91 98765 43210",
  gender: "Male",
  addresses: [
    {
      id: "addr-1",
      name: "Mr Modon Pal",
      phone: "+91 98765 43210",
      pincode: "560100",
      locality: "Electronic City Phase 1",
      address: "Flat 402, Prestige Cyber Towers, Neeladri Road",
      city: "Bengaluru",
      state: "Karnataka",
      landmark: "Near Wipro Gate 5",
      type: "Home",
      isDefault: true
    }
  ]
};

class Store {
  constructor() {
    this.subscribers = [];
    this.cart = this.loadFromStorage(STORAGE_KEYS.CART, []);
    this.wishlist = this.loadFromStorage(STORAGE_KEYS.WISHLIST, []);
    this.orders = this.loadFromStorage(STORAGE_KEYS.ORDERS, []);
    this.recentlyViewed = this.loadFromStorage(STORAGE_KEYS.RECENTLY_VIEWED, ["product-001"]);
    this.user = this.loadFromStorage(STORAGE_KEYS.USER, DEFAULT_USER);
    this.sellerProducts = this.loadFromStorage(STORAGE_KEYS.SELLER_PRODUCTS, []);
    this.remoteProducts = [];
    this.initRemoteProducts();

    // Filter and catalog dynamic states
    this.catalogFilters = {
      search: "",
      category: "",
      rating: 0,
      priceRange: [0, 100000],
      sortBy: "relevance"
    };
  }

  loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      // Automatically migrate any legacy cached name to Mr Modon Pal
      if (key === STORAGE_KEYS.USER && parsed) {
        if (parsed.name === "Soham Dutta") parsed.name = "Mr Modon Pal";
        if (parsed.email === "soham.dutta@shopnex.in") parsed.email = "modon.pal@shopnex.in";
        if (Array.isArray(parsed.addresses)) {
          parsed.addresses.forEach(a => {
            if (a.name === "Soham Dutta") a.name = "Mr Modon Pal";
          });
        }
        localStorage.setItem(key, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.warn("Storage load error", e);
      return fallback;
    }
  }

  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage save error", e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify(eventType, payload) {
    this.subscribers.forEach(cb => {
      try {
        cb(eventType, payload);
      } catch (err) {
        console.error("Subscriber notification error:", err);
      }
    });
  }

  // --- PRODUCT ACCESS (SHARED MULTI-VISITOR DATABASE & LOCAL FALLBACK) ---
  async initRemoteProducts() {
    try {
      const remote = await fetchRemoteProducts();
      if (Array.isArray(remote) && remote.length > 0) {
        this.remoteProducts = remote;
        this.notify('products_updated', { products: this.getAllProducts() });
      }
    } catch (err) {
      console.warn('Could not load remote products from Supabase:', err);
    }
  }

  getAllProducts() {
    // Map of id -> product
    const productMap = new Map();

    // 1. Put base products first with musicUrl defaults
    PRODUCTS.forEach(p => productMap.set(p.id, {
      ...p,
      musicUrl: p.musicUrl || p.audio || p.song || null,
      audio: p.musicUrl || p.audio || p.song || null,
      song: p.musicUrl || p.audio || p.song || null
    }));

    // 2. Overlay remote products from central Supabase database (SHARED across all visitors!)
    if (Array.isArray(this.remoteProducts)) {
      this.remoteProducts.forEach(p => {
        const existing = productMap.get(p.id) || {};
        const merged = { ...existing, ...p };
        if (!p.image && existing.image) merged.image = existing.image;
        if (!p.thumbnail && existing.thumbnail) merged.thumbnail = existing.thumbnail;
        if ((!p.images || p.images.length === 0) && existing.images && existing.images.length > 0) {
          merged.images = existing.images;
        }
        merged.musicUrl = p.musicUrl || p.audio || p.song || existing.musicUrl || null;
        merged.audio = merged.musicUrl;
        merged.song = merged.musicUrl;
        productMap.set(p.id, merged);
      });
    }

    // 3. Overlay any locally cached seller products if not overridden
    this.sellerProducts.forEach(p => {
      if (!this.remoteProducts.some(rp => rp.id === p.id)) {
        const existing = productMap.get(p.id) || {};
        const merged = { ...existing, ...p };
        if (!p.image && existing.image) merged.image = existing.image;
        if (!p.thumbnail && existing.thumbnail) merged.thumbnail = existing.thumbnail;
        if ((!p.images || p.images.length === 0) && existing.images && existing.images.length > 0) {
          merged.images = existing.images;
        }
        merged.musicUrl = p.musicUrl || p.audio || p.song || existing.musicUrl || null;
        merged.audio = merged.musicUrl;
        merged.song = merged.musicUrl;
        productMap.set(p.id, merged);
      }
    });

    return Array.from(productMap.values());
  }

  getProductById(id) {
    if (!id) return null;
    return this.getAllProducts().find(p => p.id === id);
  }

  /**
   * Save product to central Supabase database and local store
   */
  async saveProduct(productData) {
    let savedRemote = null;
    const config = getSupabaseConfig();

    if (config.isConfigured) {
      try {
        savedRemote = await saveRemoteProduct(productData);
        if (savedRemote) {
          const idx = this.remoteProducts.findIndex(p => p.id === savedRemote.id);
          if (idx !== -1) {
            this.remoteProducts[idx] = savedRemote;
          } else {
            this.remoteProducts.push(savedRemote);
          }
        }
      } catch (err) {
        console.error('Central database save error:', err);
        // Propagate error to caller (e.g. permission denied) so UI presents feedback to user
        throw err;
      }
    }

    // Also update local store
    const existing = this.findProductByName(productData.name) || this.getProductById(productData.id);
    let finalProduct;
    if (existing) {
      finalProduct = this.updateProduct(existing.id, productData);
    } else {
      finalProduct = this.addSellerProduct(productData);
    }

    if (savedRemote) {
      finalProduct = { ...finalProduct, ...savedRemote };
    }

    this.notify('products_updated', { product: finalProduct, products: this.getAllProducts() });
    return finalProduct;
  }

  /**
   * Delete product from central database and local store
   */
  async deleteProduct(productId) {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      try {
        await deleteRemoteProduct(productId);
        this.remoteProducts = this.remoteProducts.filter(p => p.id !== productId);
      } catch (err) {
        console.error('Central database delete error:', err);
        throw err;
      }
    }

    this.deleteSellerProduct(productId);
    this.notify('products_updated', { deletedId: productId, products: this.getAllProducts() });
  }

  // --- CART OPERATIONS ---
  getCartItems() {
    return this.cart.map(item => {
      const product = this.getProductById(item.productId);
      return {
        ...item,
        product: product || {
          id: item.productId,
          name: "Product unavailable",
          price: 0,
          originalPrice: 0,
          images: [],
          thumbnail: ""
        }
      };
    });
  }

  getCartCount() {
    return this.cart
      .filter(item => !item.savedForLater)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartSummary() {
    const activeItems = this.getCartItems().filter(i => !i.savedForLater);
    let originalTotal = 0;
    let finalTotal = 0;

    activeItems.forEach(item => {
      const qty = item.quantity;
      const prod = item.product;
      const pOrig = prod.originalPrice !== undefined && prod.originalPrice !== null ? prod.originalPrice : prod.price;
      originalTotal += pOrig * qty;
      finalTotal += (prod.price || 0) * qty;
    });

    const discount = originalTotal > finalTotal ? originalTotal - finalTotal : 0;
    const delivery = 0; // Free delivery
    const packagingFee = 0;
    const grandTotal = finalTotal + delivery + packagingFee;

    return {
      itemCount: activeItems.length,
      originalTotal: Number(originalTotal.toFixed(5)),
      finalTotal: Number(finalTotal.toFixed(5)),
      discount: Number(discount.toFixed(5)),
      delivery,
      packagingFee,
      grandTotal: Number(grandTotal.toFixed(5)),
      totalSavings: Number(discount.toFixed(5))
    };
  }

  addToCart(productId, quantity = 1) {
    const existing = this.cart.find(i => i.productId === productId);
    if (existing) {
      if (existing.savedForLater) {
        existing.savedForLater = false;
      }
      existing.quantity += quantity;
    } else {
      this.cart.push({ productId, quantity, savedForLater: false });
    }
    this.saveToStorage(STORAGE_KEYS.CART, this.cart);
    this.notify('cart_updated', { cart: this.cart, addedId: productId });
  }

  updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
      this.saveToStorage(STORAGE_KEYS.CART, this.cart);
      this.notify('cart_updated', { cart: this.cart });
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.productId !== productId);
    this.saveToStorage(STORAGE_KEYS.CART, this.cart);
    this.notify('cart_updated', { cart: this.cart, removedId: productId });
  }

  toggleSaveForLater(productId) {
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      item.savedForLater = !item.savedForLater;
      this.saveToStorage(STORAGE_KEYS.CART, this.cart);
      this.notify('cart_updated', { cart: this.cart });
    }
  }

  clearActiveCart() {
    this.cart = this.cart.filter(i => i.savedForLater);
    this.saveToStorage(STORAGE_KEYS.CART, this.cart);
    this.notify('cart_updated', { cart: this.cart });
  }

  // --- WISHLIST OPERATIONS ---
  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  }

  toggleWishlist(productId) {
    if (this.isInWishlist(productId)) {
      this.wishlist = this.wishlist.filter(id => id !== productId);
      this.saveToStorage(STORAGE_KEYS.WISHLIST, this.wishlist);
      this.notify('wishlist_updated', { wishlist: this.wishlist, action: 'removed', productId });
      return false;
    } else {
      this.wishlist.push(productId);
      this.saveToStorage(STORAGE_KEYS.WISHLIST, this.wishlist);
      this.notify('wishlist_updated', { wishlist: this.wishlist, action: 'added', productId });
      return true;
    }
  }

  getWishlistCount() {
    return this.wishlist.length;
  }

  getWishlistProducts() {
    return this.wishlist
      .map(id => this.getProductById(id))
      .filter(Boolean);
  }

  // --- RECENTLY VIEWED ---
  recordRecentlyViewed(productId) {
    this.recentlyViewed = [productId, ...this.recentlyViewed.filter(id => id !== productId)].slice(0, 10);
    this.saveToStorage(STORAGE_KEYS.RECENTLY_VIEWED, this.recentlyViewed);
    this.notify('recently_viewed_updated', { recentlyViewed: this.recentlyViewed });
  }

  getRecentlyViewedProducts() {
    return this.recentlyViewed
      .map(id => this.getProductById(id))
      .filter(Boolean);
  }

  // --- ORDER CREATION & MANAGEMENT ---
  createOrder({ items, shippingAddress, paymentMethod, totalAmount }) {
    const orderId = `SNX-${Math.floor(10000 + Math.random() * 90000)}-IN`;
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: orderId,
      date: dateStr,
      status: "Ordered",
      stepIndex: 0,
      paymentMethod,
      totalAmount,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.product.price,
        title: i.product.name,
        image: (i.product.images && i.product.images[0]) || i.product.thumbnail || ""
      })),
      timeline: [
        { status: "Order Placed", date: `${dateStr}, ${timeStr}`, completed: true },
        { status: "Packed & Verified", date: "Expected Tomorrow", completed: false },
        { status: "Shipped via Express Logistics", date: "Pending", completed: false },
        { status: "Out for Delivery", date: "Pending", completed: false },
        { status: "Delivered", date: "Pending", completed: false }
      ],
      shippingAddress: shippingAddress || this.user.addresses[0]
    };

    this.orders.unshift(newOrder);
    this.saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.clearActiveCart();
    this.notify('order_created', { order: newOrder });
    return newOrder;
  }

  getOrders() {
    return this.orders;
  }

  // --- SELLER / CUSTOM PRODUCT CREATION & DEDUPLICATION ---
  findProductByName(name) {
    if (!name) return null;
    const cleanName = name.trim().toLowerCase();
    return this.getAllProducts().find(p => p.name && p.name.trim().toLowerCase() === cleanName);
  }

  /**
   * Match an existing person/product using:
   * 1. Exact Name
   * 2. Category
   * 3. Filename as a secondary matching clue (e.g. Rahul_song.mp3, Malay_audio.wav)
   */
  findProductByMatch({ name, category, filename }) {
    const allProds = this.getAllProducts();

    // 1. Exact Name match
    if (name) {
      const cleanName = name.trim().toLowerCase();
      const byName = allProds.find(p => p.name && p.name.trim().toLowerCase() === cleanName);
      if (byName) return byName;
    }

    // 2. Exact Category match (if unambiguous or specified)
    if (category) {
      const cleanCat = category.trim().toLowerCase();
      const byCat = allProds.filter(p => p.category && p.category.trim().toLowerCase() === cleanCat);
      if (byCat.length === 1) return byCat[0];
    }

    // 3. Filename as secondary matching clue
    if (filename) {
      const cleanFn = filename.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      // Check which existing product name is contained in the filename
      const byFilename = allProds.find(p => {
        if (!p.name) return false;
        const pNameLower = p.name.trim().toLowerCase();
        // check word boundary or inclusion
        return cleanFn.includes(pNameLower);
      });
      if (byFilename) return byFilename;
    }

    return null;
  }

  /**
   * Connect an audio track to an existing product/person without creating duplicates
   */
  attachAudioToProduct({ personId, name, category, filename, audioSource }) {
    let target = null;
    if (personId) {
      target = this.getProductById(personId);
    }
    if (!target) {
      target = this.findProductByMatch({ name, category, filename });
    }
    if (!target) {
      return null;
    }

    return this.updateProduct(target.id, {
      audio: audioSource,
      song: audioSource
    });
  }

  addSellerProduct(productData) {
    // Check if product with this name already exists
    const existing = this.findProductByName(productData.name);
    if (existing) {
      // UPDATE existing product instead of creating duplicate
      return this.updateProduct(existing.id, productData);
    }

    const id = `product-${String(this.getAllProducts().length + 1).padStart(3, '0')}`;
    const newProduct = {
      id,
      name: productData.name,
      category: productData.category || "WOH ALAG HI LEVEL KA BANDA THA",
      price: productData.price !== undefined ? Number(productData.price) : null,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      discount: productData.discount || null,
      image: productData.image || productData.thumbnail || productData.imageUrl || "",
      images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : (productData.thumbnail || productData.imageUrl ? [productData.thumbnail || productData.imageUrl] : []),
      thumbnail: productData.thumbnail || productData.imageUrl || (productData.images && productData.images[0]) || "",
      video: productData.video || null,
      audio: productData.audio || productData.song || null,
      shortDescription: productData.shortDescription || productData.description || "",
      description: productData.description || "",
      rating: productData.rating !== undefined ? Number(productData.rating) : 5.0,
      reviewCount: productData.reviewCount !== undefined ? productData.reviewCount : null,
      highlights: productData.highlights || [],
      specifications: productData.specifications || {},
      availability: productData.availability !== false,
      featured: productData.featured || false,
      badge: productData.badge || productData.category || "NEW"
    };

    this.sellerProducts.unshift(newProduct);
    this.saveToStorage(STORAGE_KEYS.SELLER_PRODUCTS, this.sellerProducts);
    this.notify('seller_product_added', { product: newProduct });
    return newProduct;
  }

  updateProduct(id, updatedData) {
    // Check if it's in sellerProducts
    const idx = this.sellerProducts.findIndex(p => p.id === id);
    if (idx !== -1) {
      const existing = this.sellerProducts[idx];
      const merged = {
        ...existing,
        ...updatedData,
        // Preserve or merge images array without losing previous media if not provided
        images: (Array.isArray(updatedData.images) && updatedData.images.length > 0)
          ? updatedData.images
          : (updatedData.thumbnail ? [updatedData.thumbnail] : existing.images),
        thumbnail: updatedData.thumbnail || existing.thumbnail,
        video: updatedData.video !== undefined ? updatedData.video : existing.video,
        audio: (updatedData.audio || updatedData.song) !== undefined ? (updatedData.audio || updatedData.song) : existing.audio
      };
      this.sellerProducts[idx] = merged;
      this.saveToStorage(STORAGE_KEYS.SELLER_PRODUCTS, this.sellerProducts);
      this.notify('product_updated', { product: merged });
      return merged;
    }

    // Check if it's in PRODUCTS array
    const baseProd = PRODUCTS.find(p => p.id === id);
    if (baseProd) {
      const merged = {
        ...baseProd,
        ...updatedData,
        images: (Array.isArray(updatedData.images) && updatedData.images.length > 0)
          ? updatedData.images
          : (updatedData.thumbnail ? [updatedData.thumbnail] : baseProd.images),
        thumbnail: updatedData.thumbnail || baseProd.thumbnail,
        video: updatedData.video !== undefined ? updatedData.video : baseProd.video,
        audio: (updatedData.audio || updatedData.song) !== undefined ? (updatedData.audio || updatedData.song) : baseProd.audio,
        song: (updatedData.audio || updatedData.song) !== undefined ? (updatedData.audio || updatedData.song) : baseProd.song
      };
      // Check if already in sellerProducts
      const sIdx = this.sellerProducts.findIndex(p => p.id === id);
      if (sIdx !== -1) {
        this.sellerProducts[sIdx] = merged;
      } else {
        this.sellerProducts.unshift(merged);
      }
      this.saveToStorage(STORAGE_KEYS.SELLER_PRODUCTS, this.sellerProducts);
      this.notify('product_updated', { product: merged });
      return merged;
    }

    return null;
  }

  deleteSellerProduct(id) {
    this.sellerProducts = this.sellerProducts.filter(p => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.SELLER_PRODUCTS, this.sellerProducts);
    this.notify('seller_product_deleted', { id });
  }

  // --- USER PROFILE & ADDRESSES ---
  updateUserProfile(updatedData) {
    this.user = { ...this.user, ...updatedData };
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.notify('user_updated', { user: this.user });
  }

  addAddress(address) {
    const newAddr = {
      ...address,
      id: `addr-${Date.now()}`,
      isDefault: this.user.addresses.length === 0
    };
    this.user.addresses.push(newAddr);
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.notify('user_updated', { user: this.user });
    return newAddr;
  }

  deleteAddress(addressId) {
    this.user.addresses = this.user.addresses.filter(a => a.id !== addressId);
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.notify('user_updated', { user: this.user });
  }

  // --- AUTH MOCK ---
  login(emailOrPhone, name = "Mr Modon Pal") {
    this.user.isLoggedIn = true;
    this.user.name = name;
    this.user.email = emailOrPhone.includes('@') ? emailOrPhone : this.user.email;
    this.user.phone = !emailOrPhone.includes('@') ? emailOrPhone : this.user.phone;
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.notify('auth_changed', { user: this.user });
  }

  logout() {
    this.user.isLoggedIn = false;
    this.saveToStorage(STORAGE_KEYS.USER, this.user);
    this.notify('auth_changed', { user: this.user });
  }
}

export const store = new Store();
