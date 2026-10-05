/**
 * Quick View Product Modal Component
 * Customized for User's Media and Product Specs
 */

import { store } from '../state/store.js';
import { formatPriceINR } from './productCard.js';
import { showToast } from './toast.js';

let modalBackdrop = null;

export function openQuickViewModal(productId) {
  const product = store.getProductById(productId);
  if (!product) return;

  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'snx-modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  const mainImage = product.thumbnail || product.image ||
    (product.images && product.images.length > 0 ? product.images[0] : '');

  const priceFormatted = formatPriceINR(product.price);
  const origPriceFormatted = formatPriceINR(product.originalPrice);
  const hasHighlights = Array.isArray(product.highlights) && product.highlights.length > 0;

  modalBackdrop.innerHTML = `
    <div class="snx-modal-container wide" role="dialog" aria-modal="true" aria-labelledby="qv-title">
      <div class="snx-modal-header">
        <span class="snx-modal-title">Product Preview</span>
        <button type="button" class="snx-modal-close-btn" id="snx-qv-close" aria-label="Close modal">✕</button>
      </div>

      <div class="snx-modal-body">
        <div class="snx-quick-view-grid">
          <div class="snx-qv-img-wrap">
            ${mainImage ? `
              <img src="${mainImage}" alt="${product.name}" class="snx-qv-img">
            ` : `
              <div class="snx-card-placeholder-box" style="position: relative; width: 100%; height: 100%; border-radius: var(--snx-radius-md);">
                <div class="snx-card-avatar-initial">${(product.name || 'P').charAt(0).toUpperCase()}</div>
                <span class="snx-card-placeholder-label">No Image</span>
              </div>
            `}
          </div>

          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="snx-card-brand">${product.category}</span>
              ${product.musicUrl || product.audio || product.song ? `<span class="snx-card-badge snx-badge-song" style="font-size: 0.6875rem;">♫ SONG AVAILABLE</span>` : ''}
              ${product.video ? `<span class="snx-card-badge snx-badge-video" style="font-size: 0.6875rem;">▶ VIDEO</span>` : ''}
            </div>
            <h3 id="qv-title" style="font-size: 1.35rem; margin-bottom: 8px;">${product.name}</h3>

            <div class="snx-card-rating-wrap" style="margin-bottom: 12px;">
              <span class="snx-rating-pill">★ ${product.rating !== undefined ? product.rating : '5.0'}</span>
              ${product.reviewCount ? `<span class="snx-rating-count">(${product.reviewCount})</span>` : ''}
            </div>

            ${priceFormatted ? `
              <div class="snx-card-price-wrap" style="margin-bottom: 14px;">
                <span class="snx-card-current-price" style="font-size: 1.5rem;">${priceFormatted}</span>
                ${origPriceFormatted ? `<span class="snx-card-original-price" style="font-size: 1rem;">${origPriceFormatted}</span>` : ''}
                ${product.discount ? `<span class="snx-card-discount-tag">${product.discount}% OFF</span>` : ''}
              </div>
            ` : ''}

            <p style="font-size: 0.875rem; color: var(--snx-text-body); margin-bottom: 14px; white-space: pre-line;">
              ${product.shortDescription || product.description || ''}
            </p>

            ${hasHighlights ? `
              <ul class="snx-highlights-list" style="margin-bottom: 20px;">
                ${product.highlights.slice(0, 3).map(h => `<li>${h}</li>`).join('')}
              </ul>
            ` : ''}

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
              <button type="button" class="snx-btn snx-btn-primary" id="snx-qv-add-cart" style="flex: 1;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                Add to Cart
              </button>
              <a href="#/product/${product.id}" class="snx-btn snx-btn-secondary" id="snx-qv-view-full" style="flex: 1;">
                Full Details →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  modalBackdrop.classList.add('open');

  const closeBtn = document.getElementById('snx-qv-close');
  const addCartBtn = document.getElementById('snx-qv-add-cart');
  const viewFullLink = document.getElementById('snx-qv-view-full');

  function closeModal() {
    modalBackdrop.classList.remove('open');
  }

  closeBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  if (viewFullLink) {
    viewFullLink.addEventListener('click', closeModal);
  }

  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      store.addToCart(product.id, 1);
      showToast(`${product.name} added to cart!`, 'success');
      closeModal();
    });
  }
}
