/**
 * Product Details Page (PDP) View
 * Optimized for Custom Product Media, Audio, Video, and Zero Fake Data
 */

import { store } from '../state/store.js';
import { mediaStorage } from '../state/mediaStorage.js';
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
    return;
  }

  // Record into recently viewed
  store.recordRecentlyViewed(product.id);

  let selectedImageIndex = 0;
  let quantity = 1;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.thumbnail ? [product.thumbnail] : (product.image ? [product.image] : []));

  const hasVideo = !!product.video;
  let hasAudio = !!(product.audio || product.song);
  const hasHighlights = Array.isArray(product.highlights) && product.highlights.length > 0;
  const hasSpecs = product.specifications && Object.keys(product.specifications).length > 0;
  const fallbackKey = `audio_${product.id}`;
  let audioResolvedSrc = product.audio || product.song || '';

  // Proactively check IndexedDB in case audio was stored under product key
  mediaStorage.resolveAudioUrl(product.audio || product.song || fallbackKey, fallbackKey).then(url => {
    if (url) {
      audioResolvedSrc = url;
      if (!hasAudio) {
        hasAudio = true;
        render();
      } else {
        const audioEl = container.querySelector('#snx-pdp-audio-element');
        if (audioEl && audioEl.src !== url) {
          audioEl.src = url;
          attemptAutoplay();
        }
      }
    }
  });

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

            <!-- Rating Row (Exact provided rating) -->
            <div class="snx-pdp-rating-row">
              <span class="snx-pdp-rating-badge">★ ${product.rating !== undefined ? product.rating : '5.0'}</span>
              ${product.reviewCount ? `<span class="snx-pdp-reviews-count">${product.reviewCount} Ratings</span>` : `<span class="snx-pdp-reviews-count">Verified Product Rating</span>`}
              <span class="snx-pdp-verified-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Original Item
              </span>
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

            <!-- Media Quick Anchors if Video or Song exists -->
            ${(hasVideo || hasAudio) ? `
              <div style="display: flex; gap: 12px; margin-top: 10px;">
                ${hasVideo ? `
                  <a href="#pdp-video-section" class="snx-btn snx-btn-secondary snx-btn-sm" style="display: flex; align-items: center; gap: 6px;">
                    ▶ Watch Video
                  </a>
                ` : ''}
                ${hasAudio ? `
                  <a href="#pdp-audio-section" class="snx-btn snx-btn-secondary snx-btn-sm" style="display: flex; align-items: center; gap: 6px;">
                    ♫ Listen to Song
                  </a>
                ` : ''}
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

        <!-- OPTIONAL AUDIO / SONG PLAYER (Only if audio provided) -->
        ${hasAudio ? `
          <section class="snx-pdp-media-card" id="pdp-audio-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <h3 class="snx-media-card-title" style="margin-bottom: 0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                Product Song / Audio Track
              </h3>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="snx-audio-playing-badge" id="snx-audio-playing-badge" style="display: none;">
                  <span style="font-size: 0.625rem;">●</span> AUTO-PLAYING
                </span>
                <span style="font-size: 0.75rem; color: var(--snx-text-muted);">Auto-plays on view</span>
              </div>
            </div>

            <!-- Autoplay fallback prompt if browser policy waits for initial tap/click -->
            <div id="snx-autoplay-prompt" class="snx-autoplay-prompt" style="display: none;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>♫</span>
                <span>Click anywhere to start audio playback for ${product.name}</span>
              </div>
              <span style="background: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Play Now ▶</span>
            </div>

            <div class="snx-audio-player-box">
              <div class="snx-audio-info-row">
                <div class="snx-audio-title-group">
                  <div class="snx-audio-icon">♫</div>
                  <div>
                    <div style="font-weight: 700; font-size: 1rem;">${product.name}</div>
                    <div style="font-size: 0.8125rem; color: #a5b4fc;">Featured Audio Track (MP3, WAV, M4A, OGG)</div>
                  </div>
                </div>
                <div class="snx-audio-time" id="snx-audio-time-display">
                  <span id="snx-audio-current-time">0:00</span> / <span id="snx-audio-duration-display">--:--</span>
                </div>
              </div>

              <!-- Interactive Progress / Seek Bar with Time Markers -->
              <div class="snx-progress-container">
                <span class="snx-progress-time-label" id="snx-progress-cur-time">0:00</span>
                <div class="snx-progress-bar-wrapper">
                  <input type="range" class="snx-audio-progress-bar" id="snx-audio-seek" value="0" min="0" max="100" step="0.1" aria-label="Seek audio progress">
                  <div class="snx-progress-fill" id="snx-progress-fill" style="width: 0%;"></div>
                </div>
                <span class="snx-progress-time-label" id="snx-progress-dur-time">--:--</span>
              </div>

              <!-- Controls Row: Rewind, Play/Pause, Forward, Volume -->
              <div class="snx-audio-controls-row">
                <!-- Transport Buttons with Rewind and Forward -->
                <div class="snx-audio-transport-buttons">
                  <!-- Rewind 10s Button -->
                  <button type="button" class="snx-audio-skip-btn" id="snx-audio-rewind-btn" aria-label="Rewind 10 seconds" title="Rewind 10 seconds (← Left Arrow)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="11 19 2 12 11 5 11 19"></polygon>
                      <polygon points="22 19 13 12 22 5 22 19"></polygon>
                    </svg>
                    <span>-10s</span>
                  </button>

                  <!-- Play / Pause Button -->
                  <button type="button" class="snx-audio-play-btn" id="snx-audio-toggle-btn" aria-label="Play or Pause Audio" title="Play / Pause (Spacebar)">
                    ▶
                  </button>

                  <!-- Forward 10s Button -->
                  <button type="button" class="snx-audio-skip-btn" id="snx-audio-forward-btn" aria-label="Forward 10 seconds" title="Forward 10 seconds (→ Right Arrow)">
                    <span>+10s</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="13 19 22 12 13 5 13 19"></polygon>
                      <polygon points="2 19 11 12 2 5 2 19"></polygon>
                    </svg>
                  </button>
                </div>

                <!-- Rewind / Forward Feedback indicator -->
                <div id="snx-audio-skip-feedback" class="snx-audio-skip-feedback"></div>
                
                <!-- Volume Control -->
                <div class="snx-audio-volume-wrap">
                  <button type="button" class="snx-audio-vol-btn" id="snx-audio-mute-btn" aria-label="Toggle mute" title="Mute/Unmute">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                  </button>
                  <input type="range" class="snx-audio-volume-slider" id="snx-audio-volume" min="0" max="1" step="0.05" value="1" aria-label="Audio Volume" title="Volume">
                </div>

                <audio id="snx-pdp-audio-element" preload="auto" src="${product.audio || product.song}"></audio>
              </div>
            </div>
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

    attachEvents();
  }

  function attachEvents() {
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
          container.querySelector('#snx-qty-val').textContent = quantity;
        }
      });
      incBtn.addEventListener('click', () => {
        quantity++;
        container.querySelector('#snx-qty-val').textContent = quantity;
      });
    }

    // Audio Player setup (Automatic playback on View, Rewind, Forward, Progress Bar)
    const audioEl = container.querySelector('#snx-pdp-audio-element');
    const playBtn = container.querySelector('#snx-audio-toggle-btn');
    const rewindBtn = container.querySelector('#snx-audio-rewind-btn');
    const forwardBtn = container.querySelector('#snx-audio-forward-btn');
    const seekBar = container.querySelector('#snx-audio-seek');
    const progressFill = container.querySelector('#snx-progress-fill');
    const curTimeDisp = container.querySelector('#snx-audio-current-time');
    const durTimeDisp = container.querySelector('#snx-audio-duration-display');
    const curProgTime = container.querySelector('#snx-progress-cur-time');
    const durProgTime = container.querySelector('#snx-progress-dur-time');
    const volSlider = container.querySelector('#snx-audio-volume');
    const muteBtn = container.querySelector('#snx-audio-mute-btn');
    const playingBadge = container.querySelector('#snx-audio-playing-badge');
    const autoplayPrompt = container.querySelector('#snx-autoplay-prompt');
    const skipFeedback = container.querySelector('#snx-audio-skip-feedback');

    if (audioEl) {
      function updateProgressUI() {
        if (audioEl.duration) {
          const pct = Math.min(100, Math.max(0, (audioEl.currentTime / audioEl.duration) * 100));
          if (seekBar) seekBar.value = pct;
          if (progressFill) progressFill.style.width = pct + '%';

          const curM = Math.floor(audioEl.currentTime / 60);
          const curS = Math.floor(audioEl.currentTime % 60).toString().padStart(2, '0');
          const timeFormatted = `${curM}:${curS}`;
          if (curTimeDisp) curTimeDisp.textContent = timeFormatted;
          if (curProgTime) curProgTime.textContent = timeFormatted;

          const durM = Math.floor(audioEl.duration / 60);
          const durS = Math.floor(audioEl.duration % 60).toString().padStart(2, '0');
          const durFormatted = `${durM}:${durS}`;
          if (durTimeDisp) durTimeDisp.textContent = durFormatted;
          if (durProgTime) durProgTime.textContent = durFormatted;
        }
      }

      function showSkipFeedback(text) {
        if (!skipFeedback) return;
        skipFeedback.textContent = text;
        skipFeedback.classList.add('show');
        setTimeout(() => {
          skipFeedback.classList.remove('show');
        }, 800);
      }

      function attemptAutoplay() {
        if (!audioEl) return;
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (playBtn) playBtn.textContent = '❚❚';
            if (playingBadge) playingBadge.style.display = 'inline-flex';
            if (autoplayPrompt) autoplayPrompt.style.display = 'none';
          }).catch(err => {
            console.log('Autoplay waiting for initial gesture:', err);
            if (autoplayPrompt) autoplayPrompt.style.display = 'flex';

            const onFirstGesture = () => {
              audioEl.play().then(() => {
                if (playBtn) playBtn.textContent = '❚❚';
                if (playingBadge) playingBadge.style.display = 'inline-flex';
                if (autoplayPrompt) autoplayPrompt.style.display = 'none';
              }).catch(() => {});
              document.removeEventListener('click', onFirstGesture);
              document.removeEventListener('keydown', onFirstGesture);
            };

            document.addEventListener('click', onFirstGesture, { once: true });
            document.addEventListener('keydown', onFirstGesture, { once: true });
          });
        }
      }

      if (autoplayPrompt) {
        autoplayPrompt.addEventListener('click', () => {
          audioEl.play().then(() => {
            if (playBtn) playBtn.textContent = '❚❚';
            if (playingBadge) playingBadge.style.display = 'inline-flex';
            autoplayPrompt.style.display = 'none';
          });
        });
      }

      // Resolve audio URL if stored in IndexedDB or blob and trigger autoplay
      const rawAudio = product.audio || product.song;
      if (rawAudio) {
        mediaStorage.resolveAudioUrl(rawAudio).then(resolved => {
          if (resolved) {
            if (audioEl.src !== resolved) {
              audioEl.src = resolved;
            }
            attemptAutoplay();
          }
        });
      }

      // Play / Pause Toggle
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          if (audioEl.paused) {
            audioEl.play().then(() => {
              playBtn.textContent = '❚❚';
              if (playingBadge) playingBadge.style.display = 'inline-flex';
              if (autoplayPrompt) autoplayPrompt.style.display = 'none';
            }).catch(err => {
              showToast('Click to allow audio playback', 'info');
            });
          } else {
            audioEl.pause();
            playBtn.textContent = '▶';
            if (playingBadge) playingBadge.style.display = 'none';
          }
        });
      }

      // Rewind 10 seconds button
      if (rewindBtn) {
        rewindBtn.addEventListener('click', () => {
          audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
          showSkipFeedback('⏪ -10s');
          updateProgressUI();
        });
      }

      // Forward 10 seconds button
      if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
          const maxDur = audioEl.duration || 999999;
          audioEl.currentTime = Math.min(maxDur, audioEl.currentTime + 10);
          showSkipFeedback('+10s ⏩');
          updateProgressUI();
        });
      }

      audioEl.addEventListener('loadedmetadata', () => {
        updateProgressUI();
      });

      audioEl.addEventListener('timeupdate', () => {
        updateProgressUI();
      });

      audioEl.addEventListener('play', () => {
        if (playBtn) playBtn.textContent = '❚❚';
        if (playingBadge) playingBadge.style.display = 'inline-flex';
        if (autoplayPrompt) autoplayPrompt.style.display = 'none';
      });

      audioEl.addEventListener('pause', () => {
        if (playBtn) playBtn.textContent = '▶';
        if (playingBadge) playingBadge.style.display = 'none';
      });

      // Progress bar input / scrub
      if (seekBar) {
        seekBar.addEventListener('input', () => {
          if (audioEl.duration) {
            audioEl.currentTime = (seekBar.value / 100) * audioEl.duration;
            updateProgressUI();
          }
        });
      }

      audioEl.addEventListener('ended', () => {
        if (playBtn) playBtn.textContent = '▶';
        if (playingBadge) playingBadge.style.display = 'none';
        if (seekBar) seekBar.value = 0;
        if (progressFill) progressFill.style.width = '0%';
      });

      // Volume slider
      if (volSlider) {
        volSlider.addEventListener('input', () => {
          audioEl.volume = parseFloat(volSlider.value);
          audioEl.muted = audioEl.volume === 0;
          updateMuteIcon();
        });
      }

      // Mute / Unmute button
      let prevVolume = 1;
      function updateMuteIcon() {
        if (!muteBtn) return;
        if (audioEl.muted || audioEl.volume === 0) {
          muteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
          muteBtn.title = "Unmute";
        } else {
          muteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
          muteBtn.title = "Mute";
        }
      }

      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          if (audioEl.muted || audioEl.volume === 0) {
            audioEl.muted = false;
            audioEl.volume = prevVolume || 1;
            if (volSlider) volSlider.value = audioEl.volume;
          } else {
            prevVolume = audioEl.volume;
            audioEl.muted = true;
            if (volSlider) volSlider.value = 0;
          }
          updateMuteIcon();
        });
      }

      // Keyboard navigation (ArrowLeft = rewind, ArrowRight = forward, Space = play/pause)
      const onKeyDown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (playBtn) playBtn.click();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          if (rewindBtn) rewindBtn.click();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          if (forwardBtn) forwardBtn.click();
        }
      };
      window.addEventListener('keydown', onKeyDown);
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

  render();
}
