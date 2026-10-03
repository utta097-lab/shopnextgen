/**
 * Main Header, Search Autocomplete & Category Navigation Component
 */

import { store } from '../state/store.js';
import { CATEGORIES } from '../data/categories.js';
import { openAuthModal } from './authModal.js';
import { formatPriceINR } from './productCard.js';

export function renderHeaderHTML() {
  const cartCount = store.getCartCount();
  const wishlistCount = store.getWishlistCount();
  const user = store.user;

  // Categories list
  const catItemsHTML = CATEGORIES.map(cat => `
    <a href="#/catalog?category=${encodeURIComponent(cat.slug)}" class="snx-cat-item" data-category="${cat.slug}">
      ${cat.icon}
      <span>${cat.name}</span>
    </a>
  `).join('');

  return `
    <header class="snx-header">
      <div class="snx-container">
        <div class="snx-header-top">
          <!-- Logo -->
          <a href="#/" class="snx-logo-link" aria-label="SHOPNEX Home">
            <div class="snx-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div class="snx-logo-text-group">
              <div class="snx-logo-title">SHOPNEX<span>.in</span></div>
              <div class="snx-logo-sub">Custom Showcase Marketplace</div>
            </div>
          </a>

          <!-- Search Bar -->
          <div class="snx-search-container" id="snx-search-container">
            <form class="snx-search-form" id="snx-search-form" action="#/catalog" method="GET">
              <div class="snx-search-icon-prefix">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <input
                type="text"
                id="snx-search-input"
                class="snx-search-input"
                placeholder="Search products, descriptions, categories..."
                autocomplete="off"
                aria-label="Search"
              />
              <button type="button" class="snx-search-clear" id="snx-search-clear" aria-label="Clear Search">✕</button>
              <button type="submit" class="snx-search-btn" aria-label="Search Submit">
                <span>Search</span>
              </button>
            </form>

            <!-- Search Suggestions Dropdown -->
            <div class="snx-search-suggestions" id="snx-search-suggestions">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Header Actions -->
          <div class="snx-header-actions">
            <!-- Become a Seller -->
            <a href="#/seller" class="snx-seller-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Seller Hub</span>
            </a>

            <!-- User Account / Login Dropdown -->
            <div class="snx-account-dropdown-wrapper" id="snx-account-wrapper">
              <button type="button" class="snx-header-btn" id="snx-account-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span id="snx-account-btn-label">${user.isLoggedIn ? user.name.split(' ')[0] : 'Sign In'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              <div class="snx-account-dropdown" id="snx-account-menu">
                ${user.isLoggedIn ? `
                  <div class="snx-account-header-box">
                    <div class="snx-account-user-name">${user.name}</div>
                    <div class="snx-account-user-email">${user.email || user.phone}</div>
                  </div>
                  <a href="#/account?tab=profile" class="snx-dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    My Profile
                  </a>
                  <a href="#/account?tab=orders" class="snx-dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    My Orders
                  </a>
                  <a href="#/wishlist" class="snx-dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    Wishlist (${wishlistCount})
                  </a>
                  <a href="#/seller" class="snx-dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    Seller Hub
                  </a>
                  <div class="snx-dropdown-divider"></div>
                  <button type="button" class="snx-dropdown-item" id="snx-logout-btn" style="color: var(--snx-accent); width: 100%;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    Logout
                  </button>
                ` : `
                  <div class="snx-account-header-box">
                    <div class="snx-account-user-name">Welcome to SHOPNEX</div>
                    <div class="snx-account-user-email">To access wishlist & track orders</div>
                  </div>
                  <div style="padding: 12px 16px;">
                    <button type="button" class="snx-btn snx-btn-primary snx-btn-block" id="snx-dropdown-login-btn">
                      Sign In / Sign Up
                    </button>
                  </div>
                `}
              </div>
            </div>

            <!-- Wishlist Button -->
            <a href="#/wishlist" class="snx-header-btn" title="Wishlist" aria-label="Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>Wishlist</span>
              ${wishlistCount > 0 ? `<span class="snx-badge-count" id="snx-wishlist-count">${wishlistCount}</span>` : `<span class="snx-badge-count" id="snx-wishlist-count" style="display:none">0</span>`}
            </a>

            <!-- Cart Button -->
            <a href="#/cart" class="snx-header-btn snx-cart-btn" title="Cart" aria-label="Shopping Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <span>Cart</span>
              ${cartCount > 0 ? `<span class="snx-badge-count" id="snx-cart-count">${cartCount}</span>` : `<span class="snx-badge-count" id="snx-cart-count" style="display:none">0</span>`}
            </a>
          </div>
        </div>
      </div>

      <!-- Horizontal Category Navigation Bar -->
      <div class="snx-catbar-container">
        <div class="snx-container">
          <nav class="snx-catbar" id="snx-catbar" aria-label="Category Navigation">
            ${catItemsHTML}
          </nav>
        </div>
      </div>
    </header>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="snx-mobile-bottom-nav" aria-label="Mobile Navigation">
      <a href="#/" class="snx-mobile-nav-item" data-route="">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Home</span>
      </a>
      <a href="#/catalog" class="snx-mobile-nav-item" data-route="catalog">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
        <span>Categories</span>
      </a>
      <a href="#/wishlist" class="snx-mobile-nav-item" data-route="wishlist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        <span>Wishlist</span>
        ${wishlistCount > 0 ? `<span class="snx-badge-count" id="snx-mob-wishlist-count">${wishlistCount}</span>` : ''}
      </a>
      <a href="#/cart" class="snx-mobile-nav-item" data-route="cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        <span>Cart</span>
        ${cartCount > 0 ? `<span class="snx-badge-count" id="snx-mob-cart-count">${cartCount}</span>` : ''}
      </a>
      <a href="#/account" class="snx-mobile-nav-item" data-route="account">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Account</span>
      </a>
    </nav>
  `;
}

export function initHeaderEvents() {
  const searchInput = document.getElementById('snx-search-input');
  const searchForm = document.getElementById('snx-search-form');
  const searchClear = document.getElementById('snx-search-clear');
  const searchSuggestions = document.getElementById('snx-search-suggestions');
  const accountBtn = document.getElementById('snx-account-btn');
  const accountMenu = document.getElementById('snx-account-menu');
  const dropdownLoginBtn = document.getElementById('snx-dropdown-login-btn');
  const logoutBtn = document.getElementById('snx-logout-btn');

  // Account dropdown toggle
  if (accountBtn && accountMenu) {
    accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      accountMenu.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      accountMenu.classList.remove('open');
    });

    accountMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  if (dropdownLoginBtn) {
    dropdownLoginBtn.addEventListener('click', () => {
      accountMenu.classList.remove('open');
      openAuthModal('login');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      store.logout();
      window.location.reload();
    });
  }

  // Search logic & dynamic autocomplete
  if (searchInput && searchSuggestions) {
    const popularQueries = [
      "Laden",
      "WOH ALAG HI LEVEL KA BANDA THA",
      "FESTIVAL DHAMAKA",
      "পাগল",
      "ভদ্র ছেলে",
      "বিশেষ জন্তু জানোয়ার"
    ];

    function renderSuggestions(query) {
      const q = query.trim().toLowerCase();

      if (!q) {
        // Show popular searches and custom categories
        searchSuggestions.innerHTML = `
          <div class="snx-suggest-section-title">Explore Collections & Products</div>
          <div style="padding: 6px 12px 12px;">
            ${popularQueries.map(item => `
              <span class="snx-suggest-tag" data-search-term="${item}">
                🔍 ${item}
              </span>
            `).join('')}
          </div>
        `;
        searchSuggestions.classList.add('active');
        return;
      }

      // Filter matching products from actual data
      const matches = store.getAllProducts().filter(p => {
        return (p.name && p.name.toLowerCase().includes(q)) ||
               (p.category && p.category.toLowerCase().includes(q)) ||
               (p.description && p.description.toLowerCase().includes(q));
      }).slice(0, 6);

      if (matches.length === 0) {
        searchSuggestions.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--snx-text-muted); font-size: 0.875rem;">
            No products found matching "<strong>${query}</strong>". Try another search.
          </div>
        `;
        searchSuggestions.classList.add('active');
        return;
      }

      const itemsHTML = matches.map(p => `
        <div class="snx-suggest-item" data-goto-product="${p.id}">
          <img src="${(p.images && p.images[0]) || p.thumbnail || ''}" alt="${p.name}" class="snx-suggest-thumb">
          <div class="snx-suggest-info">
            <div class="snx-suggest-title">${p.name}</div>
            <div class="snx-suggest-meta">
              <span>${p.category}</span>
              <span>•</span>
              <span class="snx-suggest-price">${formatPriceINR(p.price)}</span>
            </div>
          </div>
        </div>
      `).join('');

      searchSuggestions.innerHTML = `
        <div class="snx-suggest-section-title">Matching Products</div>
        ${itemsHTML}
        <div style="padding: 8px 16px; background: #f8fafc; text-align: center; border-top: 1px solid var(--snx-border-light);">
          <button type="button" id="snx-suggest-view-all" style="font-size: 0.8125rem; font-weight: 700; color: var(--snx-primary-light);">
            View all results for "${query}" →
          </button>
        </div>
      `;
      searchSuggestions.classList.add('active');
    }

    searchInput.addEventListener('focus', () => {
      renderSuggestions(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
      if (searchInput.value.length > 0) {
        searchClear.classList.add('visible');
      } else {
        searchClear.classList.remove('visible');
      }
      renderSuggestions(searchInput.value);
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        renderSuggestions('');
        searchInput.focus();
      });
    }

    // Click outside hides suggestions
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#snx-search-container')) {
        searchSuggestions.classList.remove('active');
      }
    });

    // Delegate clicks in suggestions
    searchSuggestions.addEventListener('click', (e) => {
      const tag = e.target.closest('[data-search-term]');
      if (tag) {
        const term = tag.dataset.searchTerm;
        searchInput.value = term;
        searchSuggestions.classList.remove('active');
        window.location.hash = `#/catalog?search=${encodeURIComponent(term)}`;
        return;
      }

      const prodItem = e.target.closest('[data-goto-product]');
      if (prodItem) {
        const id = prodItem.dataset.gotoProduct;
        searchSuggestions.classList.remove('active');
        window.location.hash = `#/product/${id}`;
        return;
      }

      const viewAllBtn = e.target.closest('#snx-suggest-view-all');
      if (viewAllBtn) {
        searchSuggestions.classList.remove('active');
        window.location.hash = `#/catalog?search=${encodeURIComponent(searchInput.value.trim())}`;
        return;
      }
    });

    // Search submit
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const term = searchInput.value.trim();
        searchSuggestions.classList.remove('active');
        window.location.hash = `#/catalog?search=${encodeURIComponent(term)}`;
      });
    }
  }

  // Reactive badge updates
  store.subscribe((event) => {
    if (event === 'cart_updated') {
      const count = store.getCartCount();
      const cartBadges = document.querySelectorAll('#snx-cart-count, #snx-mob-cart-count');
      cartBadges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'flex' : 'none';
      });
    }

    if (event === 'wishlist_updated') {
      const count = store.getWishlistCount();
      const wishBadges = document.querySelectorAll('#snx-wishlist-count, #snx-mob-wishlist-count');
      wishBadges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'flex' : 'none';
      });
    }

    if (event === 'auth_changed') {
      const user = store.user;
      const label = document.getElementById('snx-account-btn-label');
      if (label) {
        label.textContent = user.isLoggedIn ? user.name.split(' ')[0] : 'Sign In';
      }
    }
  });
}
