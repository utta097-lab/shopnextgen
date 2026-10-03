/**
 * Custom Showcase ProductCard Component
 * Focused heavily on user media, custom ratings, and direct actions
 */

import { store } from '../state/store.js';
import { showToast } from './toast.js';

export function formatPriceINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  const num = Number(amount);
  if (Number.isInteger(num)) {
    return '₹' + num.toLocaleString('en-IN');
  }
  // Fractional rupee
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 5 });
}

export function renderProductCardHTML(product) {
  const isWishlisted = store.isInWishlist(product.id);
  const cartItem = store.cart.find(i => i.productId === product.id && !i.savedForLater);
  const inCart = !!cartItem;

  const mainImage = product.thumbnail || product.image ||
    (product.images && product.images.length > 0 ? product.images[0] : '');

  const hasVideo = !!product.video;
  const hasAudio = !!(product.audio || product.song);

  const priceFormatted = formatPriceINR(product.price);
  const origPriceFormatted = formatPriceINR(product.originalPrice);

  return `
    <article class="snx-product-card" data-product-id="${product.id}">
      <div class="snx-card-top-row">
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          ${product.badge ? `<span class="snx-card-badge">${product.badge}</span>` : ''}
          ${hasVideo ? `<span class="snx-card-badge snx-badge-video">▶ VIDEO</span>` : ''}
          ${hasAudio ? `<span class="snx-card-badge snx-badge-song">♫ SONG</span>` : ''}
        </div>

        <button type="button" class="snx-wishlist-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="Toggle Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
      </div>

      <div class="snx-card-img-wrap" data-navigate="#/product/${product.id}">
        ${mainImage ? `
          <img src="${mainImage}" alt="${product.name}" class="snx-card-img" loading="lazy">
        ` : `
          <div class="snx-card-placeholder-box">
            <div class="snx-card-avatar-initial">${(product.name || 'P').charAt(0).toUpperCase()}</div>
            <span class="snx-card-placeholder-label">No Image</span>
          </div>
        `}
        <div class="snx-card-quick-overlay">
          <button type="button" class="snx-quick-view-btn" data-quickview-id="${product.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            Quick View
          </button>
        </div>
      </div>

      <div class="snx-card-body">
        <span class="snx-card-brand">${product.category}</span>
        <h3 class="snx-card-title" data-navigate="#/product/${product.id}" title="${product.name}">${product.name}</h3>

        ${product.shortDescription ? `
          <p class="snx-card-short-desc">${product.shortDescription}</p>
        ` : ''}

        <div class="snx-card-rating-wrap">
          <span class="snx-rating-pill">
            ★ ${product.rating !== undefined ? product.rating : '5.0'}
          </span>
          ${product.reviewCount ? `<span class="snx-rating-count">(${product.reviewCount})</span>` : ''}
        </div>

        ${priceFormatted ? `
          <div class="snx-card-price-wrap">
            <span class="snx-card-current-price">${priceFormatted}</span>
            ${origPriceFormatted ? `<span class="snx-card-original-price">${origPriceFormatted}</span>` : ''}
            ${product.discount ? `<span class="snx-card-discount-tag">${product.discount}% OFF</span>` : ''}
          </div>
        ` : ''}

        <div class="snx-card-btn-wrap" style="display: flex; gap: 8px; margin-top: auto;">
          <a href="#/product/${product.id}" class="snx-btn snx-btn-secondary snx-btn-sm" style="flex: 1; font-size: 0.75rem;">
            VIEW PRODUCT
          </a>
          <button type="button" class="snx-card-add-btn ${inCart ? 'in-cart' : ''}" data-add-to-cart="${product.id}" style="flex: 1; font-size: 0.75rem; padding: 6px 8px;">
            ${inCart ? `In Cart (${cartItem.quantity})` : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </article>
  `;
}

export function attachCardEventListeners(container, onQuickView) {
  if (!container) return;

  container.addEventListener('click', (e) => {
    // 1. Wishlist toggle
    const wishlistBtn = e.target.closest('[data-wishlist-id]');
    if (wishlistBtn) {
      e.stopPropagation();
      const id = wishlistBtn.dataset.wishlistId;
      const added = store.toggleWishlist(id);
      const prod = store.getProductById(id);
      const name = prod ? prod.name : 'Product';

      if (added) {
        wishlistBtn.classList.add('active');
        showToast(`Added ${name} to Wishlist!`, 'success');
      } else {
        wishlistBtn.classList.remove('active');
        showToast(`Removed from Wishlist`, 'info');
      }
      return;
    }

    // 2. Add to Cart
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      e.stopPropagation();
      const id = addBtn.dataset.addToCart;
      store.addToCart(id, 1);
      const prod = store.getProductById(id);
      showToast(`${prod ? prod.name : 'Item'} added to cart!`, 'success');

      const updatedItem = store.cart.find(i => i.productId === id);
      if (updatedItem) {
        addBtn.classList.add('in-cart');
        addBtn.textContent = `In Cart (${updatedItem.quantity})`;
      }
      return;
    }

    // 3. Quick View
    const qvBtn = e.target.closest('[data-quickview-id]');
    if (qvBtn) {
      e.stopPropagation();
      const id = qvBtn.dataset.quickviewId;
      if (typeof onQuickView === 'function') {
        onQuickView(id);
      }
      return;
    }

    // 4. Product detail navigation
    const navElem = e.target.closest('[data-navigate]');
    if (navElem) {
      const targetHash = navElem.dataset.navigate;
      window.location.hash = targetHash;
      return;
    }
  });
}
