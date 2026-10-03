/**
 * Hero Banner Carousel & Countdown Timer Component
 */

import { HERO_BANNERS } from '../data/categories.js';

export function renderHeroHTML() {
  const slidesHTML = HERO_BANNERS.map((banner, index) => `
    <div class="snx-hero-slide ${banner.theme}" data-slide-index="${index}">
      <div class="snx-hero-content">
        <span class="snx-hero-badge">${banner.badge}</span>
        <h2 class="snx-hero-title">${banner.title}</h2>
        <p class="snx-hero-subtitle">${banner.subtitle}</p>
        <div class="snx-hero-offer-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          ${banner.bankOffer}
        </div>
        <div>
          <a href="#/catalog?category=${encodeURIComponent(banner.categoryFilter)}" class="snx-hero-cta-btn">
            ${banner.ctaText}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
      </div>
      <div class="snx-hero-image-wrap">
        <img src="${banner.image}" alt="${banner.title}" class="snx-hero-image" loading="eager">
      </div>
    </div>
  `).join('');

  const dotsHTML = HERO_BANNERS.map((_, i) => `
    <span class="snx-hero-dot ${i === 0 ? 'active' : ''}" data-dot-index="${i}"></span>
  `).join('');

  return `
    <section class="snx-hero-section snx-container" aria-label="Featured Promotions">
      <div class="snx-hero-carousel" id="snx-hero-carousel">
        <div class="snx-hero-slides-wrapper" id="snx-hero-slides-wrapper">
          ${slidesHTML}
        </div>
        <button type="button" class="snx-hero-arrow prev" id="snx-hero-prev" aria-label="Previous Slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button type="button" class="snx-hero-arrow next" id="snx-hero-next" aria-label="Next Slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="snx-hero-dots" id="snx-hero-dots">
          ${dotsHTML}
        </div>
      </div>

      <!-- Perks Strip -->
      <div class="snx-perks-bar">
        <div class="snx-perk-item">
          <div class="snx-perk-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div class="snx-perk-title">100% Genuine Products</div>
            <div class="snx-perk-desc">Sourced directly from verified brands</div>
          </div>
        </div>

        <div class="snx-perk-item">
          <div class="snx-perk-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <div class="snx-perk-title">Superfast Delivery</div>
            <div class="snx-perk-desc">Next day delivery in 200+ cities</div>
          </div>
        </div>

        <div class="snx-perk-item">
          <div class="snx-perk-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </div>
          <div>
            <div class="snx-perk-title">7-Day Easy Returns</div>
            <div class="snx-perk-desc">Hassle-free replacement guarantee</div>
          </div>
        </div>

        <div class="snx-perk-item">
          <div class="snx-perk-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <div class="snx-perk-title">Secure Payments</div>
            <div class="snx-perk-desc">UPI, Cards, NetBanking & COD</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initHeroCarousel() {
  const carousel = document.getElementById('snx-hero-carousel');
  const wrapper = document.getElementById('snx-hero-slides-wrapper');
  const prevBtn = document.getElementById('snx-hero-prev');
  const nextBtn = document.getElementById('snx-hero-next');
  const dots = document.querySelectorAll('.snx-hero-dot');

  if (!carousel || !wrapper) return () => {};

  let currentIndex = 0;
  const totalSlides = HERO_BANNERS.length;
  let autoplayTimer = null;

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5500);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
      startAutoplay();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.dotIndex, 10);
      goToSlide(idx);
      startAutoplay();
    });
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  startAutoplay();

  // Return cleanup function
  return () => {
    stopAutoplay();
  };
}

export function startCountdownTimer(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return () => {};

  // Target: 8 hours, 34 mins from now
  let secondsRemaining = 8 * 3600 + 34 * 60 + 20;

  function update() {
    if (secondsRemaining <= 0) {
      secondsRemaining = 24 * 3600; // Reset
    }
    const h = Math.floor(secondsRemaining / 3600).toString().padStart(2, '0');
    const m = Math.floor((secondsRemaining % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(secondsRemaining % 60).toString().padStart(2, '0');

    el.textContent = `${h}h : ${m}m : ${s}s`;
    secondsRemaining--;
  }

  update();
  const timer = setInterval(update, 1000);
  return () => clearInterval(timer);
}
