/**
 * Product Details Page (PDP) View
 * Optimized for Custom Product Media, Shared Central Music System, and Clean Lifecycle.
 */

import { store } from '../state/store.js';
import { formatPriceINR } from '../components/productCard.js';
import { showToast } from '../components/toast.js';

export function renderProductDetailPage(container, productId) {
  const product = store.getProductById(productId);

  if (!product) {
    container.innerHTML = `
      <div class="snx-container" style="padding: 60px 20px; text-align: center;">
        <h2>Product not found</h2>
        <p style="color: var(--snx-text-muted); margin: 12px 0 24px;">The requested product could not be located in the catalog.</p>
        <a href="#/catalog" class="snx-btn snx-btn-primary">Browse Catalog</a>
      </div>
    `;
    return () => {};
  }

  // Record into recently viewed
  store.recordRecentlyViewed(product.id);

  let selectedImageIndex = 0;
  let quantity = 1;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.thumbnail ? [product.thumbnail] : (product.image ? [product.image] : []));

  const hasVideo = !!product.video;
  // Shared central music URL
  const musicUrl = product.musicUrl || product.audio || product.song || null;
  const hasMusic = !!musicUrl;
  const hasHighlights = Array.isArray(product.highlights) && product.highlights.length > 0;
  const hasSpecs = product.specifications && Object.keys(product.specifications).length > 0;

  // Active audio state
  let audio = null;
  let isAutoplayBlocked = false;

  function render() {
    const isWishlisted = store.isInWishlist(product.id);
    const priceFormatted = formatPriceINR(product.price);
    const origPriceFormatted = formatPriceINR(product.originalPrice);

    container.innerHTML = `
      <div class="snx-pdp-page snx-container">
        <!-- Breadcrumb -->
        <nav class="snx-breadcrumb" aria-label="Breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <a href="#/catalog?category=${encodeURIComponent(product.category)}">${product.category}</a>
          <span>/</span>
          <span class="current">${product.name}</span>
        </nav>

        <!-- Main Purchase Card: Gallery + Meta -->
        <section class="snx-pdp-main-card">
          <!-- Left: Gallery -->
          <div class="snx-gallery-section">
            <div class="snx-main-img-wrap" id="snx-pdp-main-img-wrap">
              ${images.length > 0 ? `
                <img src="${images[selectedImageIndex] || ''}" alt="${product.name}" class="snx-main-img" id="snx-pdp-main-img">
                <button type="button" class="snx-gallery-expand-btn" id="snx-expand-lightbox" title="View Fullscreen" aria-label="View Fullscreen">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
                </button>
              ` : `
                <div class="snx-main-img-empty">
                  <div class="snx-empty-avatar">${(product.name || 'P').charAt(0).toUpperCase()}</div>
                  <span class="snx-empty-avatar-text">No photo uploaded yet</span>
                </div>
              `}
            </div>

            <!-- Thumbnails (Only show if multiple images exist) -->
            ${images.length > 1 ? `
              <div class="snx-gallery-thumbnails">
                ${images.map((imgUrl, idx) => `
                  <button type="button" class="snx-thumb-btn ${idx === selectedImageIndex ? 'active' : ''}" data-thumb-idx="${idx}">
                    <img src="${imgUrl}" alt="Thumbnail ${idx + 1}">
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <!-- Buttons below Gallery -->
            <div class="snx-pdp-actions-row">
              <button type="button" class="snx-pdp-add-cart-btn" id="snx-pdp-add-cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                ADD TO CART
              </button>
              <button type="button" class="snx-pdp-buy-now-btn" id="snx-pdp-buy-now">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                BUY NOW
              </button>
            </div>
          </div>

          <!-- Right: Product Information -->
          <div class="snx-pdp-info-section">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <a href="#/catalog?category=${encodeURIComponent(product.category)}" class="snx-pdp-brand">${product.category}</a>
                <h1 class="snx-pdp-title">${product.name}</h1>
              </div>
              <button type="button" class="snx-wishlist-btn ${isWishlisted ? 'active' : ''}" id="snx-pdp-wishlist-btn" title="Add to Wishlist" aria-label="Toggle Wishlist" style="margin-top: 4px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>
            </div>

            <!-- Rating & Music Badges Row -->
            <div class="snx-pdp-rating-row" style="flex-wrap: wrap; gap: 8px;">
              <span class="snx-pdp-rating-badge">★ ${product.rating !== undefined ? product.rating : '5.0'}</span>
              ${product.reviewCount ? `<span class="snx-pdp-reviews-count">${product.reviewCount} Ratings</span>` : `<span class="snx-pdp-reviews-count">Verified Product Rating</span>`}
              <span class="snx-pdp-verified-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Original Item
              </span>

              ${hasMusic ? `
                <span class="snx-pdp-music-badge" title="This product has an assigned theme song that automatically plays">
                  <span class="snx-music-dot"></span>
                  ♫ Theme Music Assigned
                </span>
              ` : ''}
            </div>

            <!-- Price Card (if provided) -->
            ${priceFormatted ? `
              <div class="snx-pdp-price-card">
                <div class="snx-pdp-price-row">
                  <span class="snx-pdp-final-price">${priceFormatted}</span>
                  ${origPriceFormatted ? `<span class="snx-pdp-orig-price">${origPriceFormatted}</span>` : ''}
                  ${product.discount ? `<span class="snx-pdp-discount-pill">${product.discount}% OFF</span>` : ''}
                </div>
                <div class="snx-pdp-tax-note">Inclusive of all applicable taxes.</div>
              </div>
            ` : ''}

            <!-- Short Description -->
            ${product.shortDescription ? `
              <div style="font-size: 0.9375rem; color: var(--snx-text-body); line-height: 1.6; margin-bottom: 20px; white-space: pre-line;">
                ${product.shortDescription}
              </div>
            ` : ''}

            <!-- Stock & Quantity Row -->
            <div class="snx-pdp-stock-row">
              <div class="snx-stock-indicator">
                <span class="snx-stock-dot"></span>
                <span>${product.availability !== false ? 'Available' : 'Unavailable'}</span>
              </div>

              <div class="snx-qty-select-wrap">
                <span>Quantity:</span>
                <div class="snx-qty-stepper">
                  <button type="button" class="snx-qty-btn" id="snx-qty-dec">-</button>
                  <span class="snx-qty-number" id="snx-qty-val">${quantity}</span>
                  <button type="button" class="snx-qty-btn" id="snx-qty-inc">+</button>
                </div>
              </div>
            </div>

            <!-- Optional Video Anchor -->
            ${hasVideo ? `
              <div style="display: flex; gap: 12px; margin-top: 10px;">
                <a href="#pdp-video-section" class="snx-btn snx-btn-secondary snx-btn-sm" style="display: flex; align-items: center; gap: 6px;">
                  ▶ Watch Video
                </a>
              </div>
            ` : ''}
          </div>
        </section>

        <!-- OPTIONAL VIDEO PLAYER (Only if video provided) -->
        ${hasVideo ? `
          <section class="snx-pdp-media-card" id="pdp-video-section">
            <h3 class="snx-media-card-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2" ry="2"/></svg>
              Product Video
            </h3>
            <video class="snx-pdp-video-player" controls preload="metadata" poster="${images[0] || ''}">
              <source src="${product.video}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </section>
        ` : ''}

        <!-- PRODUCT DESCRIPTION -->
        <section class="snx-pdp-media-card">
          <h3 class="snx-media-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Product Description
          </h3>
          <div style="font-size: 1rem; line-height: 1.8; color: var(--snx-text-body); white-space: pre-line;">
            ${product.description || 'No description provided.'}
          </div>
        </section>

        <!-- HIGHLIGHTS (Only if provided) -->
        ${hasHighlights ? `
          <section class="snx-pdp-media-card">
            <h3 class="snx-media-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
              Highlights
            </h3>
            <ul class="snx-highlights-list">
              ${product.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </section>
        ` : ''}

        <!-- SPECIFICATIONS (Only if provided) -->
        ${hasSpecs ? `
          <section class="snx-pdp-media-card">
            <h3 class="snx-media-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
              Specifications
            </h3>
            <table class="snx-specs-table">
              <tbody>
                ${Object.entries(product.specifications).map(([k, v]) => `
                  <tr>
                    <td class="snx-specs-key">${k}</td>
                    <td class="snx-specs-val">${v}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
        ` : ''}
      </div>
    `;

    attachStandardEvents();
  }

  function attachStandardEvents() {
    // Thumbnails click
    const thumbBtns = container.querySelectorAll('[data-thumb-idx]');
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedImageIndex = parseInt(btn.dataset.thumbIdx, 10);
        render();
      });
    });

    // Lightbox Fullscreen Viewer
    const expandBtn = container.querySelector('#snx-expand-lightbox');
    if (expandBtn && images.length > 0) {
      expandBtn.addEventListener('click', () => {
        openLightbox(images[selectedImageIndex]);
      });
    }

    // Wishlist button
    const wishBtn = container.querySelector('#snx-pdp-wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        const added = store.toggleWishlist(product.id);
        if (added) {
          wishBtn.classList.add('active');
          wishBtn.querySelector('svg').setAttribute('fill', 'currentColor');
          showToast(`Added ${product.name} to Wishlist!`, 'success');
        } else {
          wishBtn.classList.remove('active');
          wishBtn.querySelector('svg').setAttribute('fill', 'none');
          showToast(`Removed from Wishlist`, 'info');
        }
      });
    }

    // Add to Cart
    const addCartBtn = container.querySelector('#snx-pdp-add-cart');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        store.addToCart(product.id, quantity);
        showToast(`${quantity} x ${product.name} added to Cart!`, 'success');
      });
    }

    // Buy Now
    const buyNowBtn = container.querySelector('#snx-pdp-buy-now');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        store.addToCart(product.id, quantity);
        window.location.hash = '#/checkout';
      });
    }

    // Qty stepper
    const decBtn = container.querySelector('#snx-qty-dec');
    const incBtn = container.querySelector('#snx-qty-inc');
    if (decBtn && incBtn) {
      decBtn.addEventListener('click', () => {
        if (quantity > 1) {
          quantity--;
          const valEl = container.querySelector('#snx-qty-val');
          if (valEl) valEl.textContent = quantity;
        }
      });
      incBtn.addEventListener('click', () => {
        quantity++;
        const valEl = container.querySelector('#snx-qty-val');
        if (valEl) valEl.textContent = quantity;
      });
    }
  }

  function openLightbox(imgSrc) {
    const backdrop = document.createElement('div');
    backdrop.className = 'snx-lightbox-backdrop';
    backdrop.innerHTML = `
      <button type="button" class="snx-lightbox-close" aria-label="Close">✕</button>
      <img src="${imgSrc}" class="snx-lightbox-img" alt="Fullscreen Image">
    `;
    document.body.appendChild(backdrop);

    const close = () => {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    };

    backdrop.querySelector('.snx-lightbox-close').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
  }

  // ==========================================================================
  // SHARED CENTRAL MUSIC SYSTEM & UNOBTRUSIVE FLOATING CONTROL
  // ==========================================================================
  let firstTouchHandler = null;

  function initProductMusicSystem() {
    if (!hasMusic) return;

    // 1. Mount small, unobtrusive floating music pill
    let widget = document.getElementById('snx-pdp-music-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'snx-pdp-music-widget';
      widget.className = 'snx-pdp-music-widget';
      widget.innerHTML = `
        <div class="snx-music-visualizer" id="snx-music-visualizer">
          <span></span><span></span><span></span>
        </div>
        <div class="snx-music-meta">
          <span class="snx-music-label">Product Music</span>
          <span class="snx-music-status" id="snx-music-status-text">Loading ♫</span>
        </div>
        <button type="button" class="snx-music-btn" id="snx-music-btn-play" title="Play / Pause" aria-label="Toggle music playback">
          ▶
        </button>
        <button type="button" class="snx-music-btn" id="snx-music-btn-mute" title="Mute / Unmute" aria-label="Toggle mute">
          🔊
        </button>
      `;
      document.body.appendChild(widget);
    }

    const visualizer = widget.querySelector('#snx-music-visualizer');
    const statusText = widget.querySelector('#snx-music-status-text');
    const playBtn = widget.querySelector('#snx-music-btn-play');
    const muteBtn = widget.querySelector('#snx-music-btn-mute');

    function updateWidgetUI(isPlaying, isMuted) {
      if (visualizer) {
        if (isPlaying) {
          visualizer.classList.add('playing');
        } else {
          visualizer.classList.remove('playing');
        }
      }

      if (playBtn) {
        playBtn.textContent = isPlaying ? '❚❚' : '▶';
        playBtn.title = isPlaying ? 'Pause Music' : 'Play Music';
      }

      if (statusText) {
        if (isAutoplayBlocked && !isPlaying) {
          statusText.textContent = 'Tap to Play ♫';
        } else {
          statusText.textContent = isPlaying ? 'Playing ♫' : 'Paused';
        }
      }

      if (muteBtn) {
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.title = isMuted ? 'Unmute' : 'Mute';
      }
    }

    // 2. Initialize native audio instance with looping
    audio = new Audio();
    audio.src = musicUrl;
    audio.loop = true; // Loop song while visitor remains on page
    audio.volume = 0.8;

    // 3. Attempt automatic playback respecting browser policy
    function attemptAutoplay() {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isAutoplayBlocked = false;
          updateWidgetUI(true, audio.muted);
        }).catch(err => {
          // Autoplay blocked by browser policy without user gesture
          isAutoplayBlocked = true;
          updateWidgetUI(false, audio.muted);

          // One-time gesture listener on document to smoothly start audio on first click/touch
          firstTouchHandler = () => {
            if (audio && audio.paused) {
              audio.play().then(() => {
                isAutoplayBlocked = false;
                updateWidgetUI(true, audio.muted);
              }).catch(() => {});
            }
          };

          window.addEventListener('click', firstTouchHandler, { once: true });
          window.addEventListener('touchstart', firstTouchHandler, { once: true });
        });
      }
    }

    attemptAutoplay();

    // 4. Attach widget button listeners
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      if (audio.paused) {
        audio.play().then(() => {
          isAutoplayBlocked = false;
          updateWidgetUI(true, audio.muted);
        }).catch(() => {});
      } else {
        audio.pause();
        updateWidgetUI(false, audio.muted);
      }
    });

    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio) return;
      audio.muted = !audio.muted;
      updateWidgetUI(!audio.paused, audio.muted);
    });

    audio.addEventListener('play', () => updateWidgetUI(true, audio.muted));
    audio.addEventListener('pause', () => updateWidgetUI(false, audio.muted));
  }

  // Initial render
  render();

  // Initialize central music
  initProductMusicSystem();

  // ==========================================================================
  // ROUTER CLEANUP LIFECYCLE (REQUIREMENTS 8 & 9)
  // Stops current product music immediately when customer leaves this product page
  // ==========================================================================
  return () => {
    // 1. Immediately pause and unmount audio instance
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio = null;
    }

    // 2. Remove floating music pill widget
    const widget = document.getElementById('snx-pdp-music-widget');
    if (widget) {
      widget.remove();
    }

    // 3. Remove one-time gesture listener if pending
    if (firstTouchHandler) {
      window.removeEventListener('click', firstTouchHandler);
      window.removeEventListener('touchstart', firstTouchHandler);
      firstTouchHandler = null;
    }
  };
}
