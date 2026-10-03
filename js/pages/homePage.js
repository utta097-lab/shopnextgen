/**
 * Custom Showcase Homepage View
 * Data-driven display of user's custom categories and products
 */

import { store } from '../state/store.js';
import { CUSTOM_CATEGORIES } from '../data/categories.js';
import { renderProductCardHTML, attachCardEventListeners, formatPriceINR } from '../components/productCard.js';
import { openQuickViewModal } from '../components/quickViewModal.js';

export function renderHomePage(container) {
  const allProducts = store.getAllProducts();
  const featuredProducts = allProducts.filter(p => p.featured);
  const heroProduct = featuredProducts[0] || allProducts[0];

  // Group products by the 6 designated categories
  const categoryProductsMap = {};
  CUSTOM_CATEGORIES.forEach(cat => {
    categoryProductsMap[cat.name] = allProducts.filter(p => p.category === cat.name);
  });

  // Hero section HTML
  const heroHTML = heroProduct ? `
    <section class="snx-hero-section snx-container" aria-label="Featured Custom Showcase">
      <div class="snx-hero-showcase-card">
        <div class="snx-hero-content">
          <span class="snx-badge snx-badge-deal">${heroProduct.badge || 'FEATURED SHOWCASE'}</span>
          <div style="font-size: 0.8125rem; font-weight: 700; color: #93c5fd; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.05em;">
            ${heroProduct.category}
          </div>
          <h1 class="snx-hero-title" style="margin-top: 6px;">${heroProduct.name}</h1>
          <p class="snx-hero-subtitle">${heroProduct.shortDescription || heroProduct.description || ''}</p>
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
            <div style="background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: var(--snx-radius-sm); font-size: 1.25rem; font-weight: 800; color: #ffffff;">
              ${formatPriceINR(heroProduct.price)}
            </div>
            <div style="display: flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.2); color: #fde047; padding: 6px 12px; border-radius: var(--snx-radius-sm); font-weight: 700;">
              ★ ${heroProduct.rating} Rating
            </div>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="#/product/${heroProduct.id}" class="snx-btn snx-btn-primary snx-btn-lg">
              View Product Details →
            </a>
            <button type="button" class="snx-btn snx-btn-secondary snx-btn-lg" data-add-to-cart="${heroProduct.id}" style="background: rgba(255,255,255,0.9); color: #0f172a;">
              Add to Cart
            </button>
          </div>
        </div>

        <div class="snx-hero-showcase-media" data-navigate="#/product/${heroProduct.id}">
          ${((heroProduct.images && heroProduct.images[0]) || heroProduct.thumbnail || heroProduct.image) ? `
            <img src="${(heroProduct.images && heroProduct.images[0]) || heroProduct.thumbnail || heroProduct.image}" alt="${heroProduct.name}">
          ` : `
            <div class="snx-card-avatar-initial" style="width: 100px; height: 100px; font-size: 3rem;">${(heroProduct.name || 'P').charAt(0).toUpperCase()}</div>
          `}
        </div>
      </div>
    </section>
  ` : '';

  // Visual Category Cards Grid
  const categoryCardsHTML = CUSTOM_CATEGORIES.map(cat => {
    const prods = categoryProductsMap[cat.name] || [];
    const countText = prods.length === 1 ? '1 Product' : `${prods.length} Products`;
    return `
      <a href="#/catalog?category=${encodeURIComponent(cat.slug)}" class="snx-custom-cat-card">
        <div class="snx-custom-cat-icon-box">
          ${cat.icon}
        </div>
        <div class="snx-custom-cat-info">
          <div class="snx-custom-cat-badge">${cat.badge}</div>
          <h3 class="snx-custom-cat-name">${cat.name}</h3>
          <p class="snx-custom-cat-tagline">${cat.tagline}</p>
          <span class="snx-custom-cat-count">${countText}</span>
        </div>
      </a>
    `;
  }).join('');

  // Category Sections (ONLY displayed if products exist in that category)
  const categorySectionsHTML = CUSTOM_CATEGORIES.map(cat => {
    const prods = categoryProductsMap[cat.name] || [];
    if (prods.length === 0) return ''; // Do not display empty category sections

    return `
      <section class="snx-home-section" style="margin-top: 40px;" aria-label="${cat.name}">
        <div class="snx-section-header">
          <div class="snx-section-title-wrap">
            <h2 class="snx-section-title">${cat.name}</h2>
            <span class="snx-badge snx-badge-trending">${prods.length} Listed</span>
          </div>
          <a href="#/catalog?category=${encodeURIComponent(cat.slug)}" class="snx-section-view-all">View All →</a>
        </div>

        <div class="snx-catalog-grid">
          ${prods.map(p => renderProductCardHTML(p)).join('')}
        </div>
      </section>
    `;
  }).filter(Boolean).join('');

  container.innerHTML = `
    <!-- Hero Showcase Section -->
    ${heroHTML}

    <div class="snx-container">
      <!-- Custom Category Cards Showcase -->
      <section style="margin-top: 32px;" aria-label="Explore Categories">
        <div class="snx-section-header" style="margin-bottom: 20px;">
          <div>
            <h2 class="snx-section-title">Explore Custom Collections</h2>
            <p style="font-size: 0.875rem; color: var(--snx-text-muted);">Select any category to explore its products</p>
          </div>
        </div>

        <div class="snx-custom-cat-grid">
          ${categoryCardsHTML}
        </div>
      </section>

      <!-- Category Sections (Rendered only for categories with products) -->
      ${categorySectionsHTML}
    </div>
  `;

  injectShowcaseStyles();
  attachCardEventListeners(container, (id) => openQuickViewModal(id));
}

function injectShowcaseStyles() {
  if (document.getElementById('snx-showcase-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'snx-showcase-custom-styles';
  style.textContent = `
    .snx-hero-showcase-card {
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #312e81 100%);
      border-radius: var(--snx-radius-lg);
      padding: 44px;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 36px;
      align-items: center;
      color: #ffffff;
      box-shadow: var(--snx-shadow-lg);
      margin-top: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .snx-hero-showcase-media {
      width: 100%;
      height: 380px;
      background: #000000;
      border-radius: var(--snx-radius-md);
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .snx-hero-showcase-media img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.4s ease;
    }
    .snx-hero-showcase-media:hover img {
      transform: scale(1.05);
    }
    .snx-custom-cat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .snx-custom-cat-card {
      background: #ffffff;
      border: 1.5px solid var(--snx-border);
      border-radius: var(--snx-radius-md);
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      transition: all var(--snx-transition-normal);
      box-shadow: var(--snx-shadow-xs);
    }
    .snx-custom-cat-card:hover {
      border-color: var(--snx-primary-light);
      box-shadow: var(--snx-shadow-md);
      transform: translateY(-4px);
    }
    .snx-custom-cat-icon-box {
      width: 52px;
      height: 52px;
      border-radius: var(--snx-radius-md);
      background: var(--snx-primary-subtle);
      color: var(--snx-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform var(--snx-transition-fast);
    }
    .snx-custom-cat-card:hover .snx-custom-cat-icon-box {
      transform: scale(1.1);
      background: var(--snx-primary-light);
      color: #ffffff;
    }
    .snx-custom-cat-badge {
      font-size: 0.6875rem;
      font-weight: 800;
      color: var(--snx-primary-light);
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .snx-custom-cat-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--snx-text-main);
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .snx-custom-cat-tagline {
      font-size: 0.8125rem;
      color: var(--snx-text-muted);
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .snx-custom-cat-count {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--snx-text-light);
    }
    @media (max-width: 900px) {
      .snx-hero-showcase-card {
        grid-template-columns: 1fr;
        padding: 28px 20px;
      }
      .snx-hero-showcase-media {
        height: 280px;
      }
      .snx-custom-cat-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 600px) {
      .snx-custom-cat-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}
