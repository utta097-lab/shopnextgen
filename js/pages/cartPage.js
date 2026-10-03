/**
 * Shopping Cart Page View
 */

import { store } from '../state/store.js';
import { formatPriceINR } from '../components/productCard.js';
import { showToast } from '../components/toast.js';

export function renderCartPage(container) {
  function render() {
    const allItems = store.getCartItems();
    const activeItems = allItems.filter(i => !i.savedForLater);
    const savedItems = allItems.filter(i => i.savedForLater);
    const summary = store.getCartSummary();
    const user = store.user;
    const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];

    if (activeItems.length === 0 && savedItems.length === 0) {
      container.innerHTML = `
        <div class="snx-container snx-cart-page">
          <div class="snx-empty-state" style="padding: 64px 24px;">
            <div class="snx-empty-icon" style="width: 80px; height: 80px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </div>
            <h2 class="snx-empty-title" style="font-size: 1.5rem;">Your Cart is completely empty!</h2>
            <p class="snx-empty-desc">Explore great deals on smartphones, electronics, fashion, and home appliances today.</p>
            <a href="#/catalog" class="snx-btn snx-btn-primary snx-btn-lg">
              Shop Today's Deals
            </a>
          </div>
        </div>
      `;
      return;
    }

    const itemsHTML = activeItems.map(item => {
      const p = item.product;
      const mainImg = p.images && p.images.length > 0 ? p.images[0] : '';

      return `
        <div class="snx-cart-card" data-cart-item-id="${p.id}">
          <div class="snx-cart-item-top">
            <img src="${mainImg}" alt="${p.name}" class="snx-cart-item-thumb">
            <div class="snx-cart-item-details">
              <h3 class="snx-cart-item-title" data-nav-to="#/product/${p.id}">${p.name}</h3>
              <div class="snx-cart-item-seller">Seller: ${p.seller || 'Shopnex Retail'}</div>
              <div class="snx-cart-item-price-row">
                <span class="snx-cart-current-price">${formatPriceINR(p.price)}</span>
                ${p.originalPrice ? `<span class="snx-cart-orig-price">${formatPriceINR(p.originalPrice)}</span>` : ''}
                ${p.discount ? `<span class="snx-cart-discount-tag">${p.discount}</span>` : ''}
              </div>
            </div>
            <div class="snx-cart-item-delivery">
              Delivery by Tomorrow | <strong style="color: var(--snx-success);">FREE</strong>
            </div>
          </div>

          <div class="snx-cart-item-bottom">
            <div class="snx-qty-stepper">
              <button type="button" class="snx-qty-btn" data-cart-dec="${p.id}">-</button>
              <span class="snx-qty-number">${item.quantity}</span>
              <button type="button" class="snx-qty-btn" data-cart-inc="${p.id}">+</button>
            </div>

            <button type="button" class="snx-cart-action-link" data-save-later="${p.id}">
              Save for Later
            </button>

            <button type="button" class="snx-cart-action-link remove" data-cart-remove="${p.id}">
              Remove
            </button>
          </div>
        </div>
      `;
    }).join('');

    const savedHTML = savedItems.map(item => {
      const p = item.product;
      const mainImg = p.images && p.images.length > 0 ? p.images[0] : '';
      return `
        <div class="snx-cart-card" data-cart-item-id="${p.id}">
          <div class="snx-cart-item-top">
            <img src="${mainImg}" alt="${p.name}" class="snx-cart-item-thumb">
            <div class="snx-cart-item-details">
              <h3 class="snx-cart-item-title" data-nav-to="#/product/${p.id}">${p.name}</h3>
              <div class="snx-cart-item-price-row">
                <span class="snx-cart-current-price">${formatPriceINR(p.price)}</span>
              </div>
            </div>
          </div>
          <div class="snx-cart-item-bottom">
            <button type="button" class="snx-btn snx-btn-primary snx-btn-sm" data-move-to-cart="${p.id}">
              Move to Cart
            </button>
            <button type="button" class="snx-cart-action-link remove" data-cart-remove="${p.id}">
              Remove
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="snx-container snx-cart-page">
        <div class="snx-cart-layout">
          <!-- LEFT: Items List -->
          <div class="snx-cart-items-container">
            <!-- Delivery Pin Bar -->
            <div class="snx-cart-delivery-header">
              <div class="snx-cart-delivery-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Deliver to: <strong>${defaultAddr ? `${defaultAddr.name}, ${defaultAddr.pincode}` : 'Bengaluru - 560100'}</strong></span>
              </div>
              <a href="#/checkout" class="snx-change-addr-btn">Change</a>
            </div>

            <!-- Active Cart Items -->
            ${activeItems.length > 0 ? itemsHTML : `
              <div class="snx-cart-card" style="text-align: center; padding: 32px;">
                <p style="color: var(--snx-text-muted);">No active items in cart.</p>
              </div>
            `}

            <!-- Saved for Later -->
            ${savedItems.length > 0 ? `
              <div style="margin-top: 24px;">
                <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 12px;">Saved for Later (${savedItems.length})</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  ${savedHTML}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- RIGHT: Sticky Price Details Summary -->
          <aside class="snx-price-summary-card" aria-label="Price Details">
            <h3 class="snx-price-card-title">Price Details (${summary.itemCount} items)</h3>

            <div class="snx-price-rows">
              <div class="snx-price-row">
                <span>Total MRP</span>
                <span>${formatPriceINR(summary.originalTotal)}</span>
              </div>

              <div class="snx-price-row discount-row">
                <span>Discount on MRP</span>
                <span>- ${formatPriceINR(summary.discount)}</span>
              </div>

              <div class="snx-price-row">
                <span>Delivery Charges</span>
                <span>${summary.delivery === 0 ? '<strong style="color: var(--snx-success);">FREE</strong>' : formatPriceINR(summary.delivery)}</span>
              </div>

              <div class="snx-price-row">
                <span>Secured Packaging Fee</span>
                <span>${formatPriceINR(summary.packagingFee)}</span>
              </div>

              <div class="snx-price-row total-row">
                <span>Total Amount</span>
                <span>${formatPriceINR(summary.grandTotal)}</span>
              </div>
            </div>

            ${summary.totalSavings > 0 ? `
              <div class="snx-savings-banner">
                <span>🎉</span>
                <span>You will save ${formatPriceINR(summary.totalSavings)} on this order</span>
              </div>
            ` : ''}

            <a href="#/checkout" class="snx-btn snx-checkout-cta-btn ${activeItems.length === 0 ? 'disabled' : ''}">
              PROCEED TO CHECKOUT
            </a>

            <div class="snx-security-badge-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Safe and Secure Payments • 100% Authentic Products</span>
            </div>
          </aside>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Qty Increment
    const incBtns = container.querySelectorAll('[data-cart-inc]');
    incBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cartInc;
        const item = store.cart.find(i => i.productId === id);
        if (item) {
          store.updateCartQuantity(id, item.quantity + 1);
          render();
        }
      });
    });

    // Qty Decrement
    const decBtns = container.querySelectorAll('[data-cart-dec]');
    decBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cartDec;
        const item = store.cart.find(i => i.productId === id);
        if (item) {
          store.updateCartQuantity(id, item.quantity - 1);
          render();
        }
      });
    });

    // Remove from Cart
    const removeBtns = container.querySelectorAll('[data-cart-remove]');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cartRemove;
        store.removeFromCart(id);
        showToast('Item removed from cart', 'info');
        render();
      });
    });

    // Save for Later
    const saveLaterBtns = container.querySelectorAll('[data-save-later]');
    saveLaterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.saveLater;
        store.toggleSaveForLater(id);
        showToast('Moved to Saved For Later', 'info');
        render();
      });
    });

    // Move back to Cart
    const moveToCartBtns = container.querySelectorAll('[data-move-to-cart]');
    moveToCartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.moveToCart;
        store.toggleSaveForLater(id);
        showToast('Moved to active Cart', 'success');
        render();
      });
    });

    // Navigation on title click
    const navTitles = container.querySelectorAll('[data-nav-to]');
    navTitles.forEach(t => {
      t.addEventListener('click', () => {
        window.location.hash = t.dataset.navTo;
      });
    });
  }

  render();
}
