/**
 * Wishlist Page View
 */

import { store } from '../state/store.js';
import { renderProductCardHTML, attachCardEventListeners } from '../components/productCard.js';
import { openQuickViewModal } from '../components/quickViewModal.js';

export function renderWishlistPage(container) {
  function render() {
    const products = store.getWishlistProducts();

    if (products.length === 0) {
      container.innerHTML = `
        <div class="snx-container" style="padding: 60px 20px; text-align: center;">
          <div class="snx-empty-state" style="padding: 60px 20px;">
            <div class="snx-empty-icon" style="width: 80px; height: 80px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <h2 class="snx-empty-title">Your Wishlist is Empty</h2>
            <p class="snx-empty-desc">Explore products, tap the heart icon on any card, and save items for later.</p>
            <a href="#/catalog" class="snx-btn snx-btn-primary snx-btn-lg">
              Explore Products Now
            </a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="snx-container" style="padding-top: 24px; padding-bottom: 60px;">
        <nav class="snx-breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <span class="current">My Wishlist (${products.length})</span>
        </nav>

        <div class="snx-section-header" style="margin-bottom: 24px;">
          <div>
            <h1 class="snx-section-title">My Saved Wishlist</h1>
            <p style="font-size: 0.875rem; color: var(--snx-text-muted);">${products.length} items saved</p>
          </div>
        </div>

        <div class="snx-catalog-grid" id="snx-wishlist-grid">
          ${products.map(p => renderProductCardHTML(p)).join('')}
        </div>
      </div>
    `;

    attachCardEventListeners(container, (id) => openQuickViewModal(id));
  }

  // Subscribe to wishlist updates to re-render if items are removed
  const unsubscribe = store.subscribe((event) => {
    if (event === 'wishlist_updated') {
      render();
    }
  });

  render();
  return unsubscribe;
}
