/**
 * Product Listing & Simple Filter System (Catalog Page)
 * Focused strictly on custom categories, simple useful filters, and zero fake products
 */

import { store } from '../state/store.js';
import { CUSTOM_CATEGORIES } from '../data/categories.js';
import { renderProductCardHTML, attachCardEventListeners, formatPriceINR } from '../components/productCard.js';
import { openQuickViewModal } from '../components/quickViewModal.js';

export function renderCatalogPage(container, queryParams = {}) {
  // Extract initial filters from URL params
  let activeSearch = queryParams.search ? decodeURIComponent(queryParams.search) : '';
  let rawCategory = queryParams.category ? decodeURIComponent(queryParams.category) : '';
  
  // Handle alias "FESTIVAL OFFER" -> "FESTIVAL DHAMAKA"
  if (rawCategory.toUpperCase() === 'FESTIVAL OFFER') {
    rawCategory = 'FESTIVAL DHAMAKA';
  }
  let activeCategory = rawCategory;

  let activeSort = queryParams.sort || 'relevance';
  let minRating = 0;
  let maxPrice = 100000;
  let minPrice = 0;
  let activePricePreset = 'all';

  function getFilteredProducts() {
    let prods = store.getAllProducts();

    // 1. Text Search across name, description, category
    if (activeSearch) {
      const q = activeSearch.toLowerCase().trim();
      prods = prods.filter(p => {
        return (p.name && p.name.toLowerCase().includes(q)) ||
               (p.description && p.description.toLowerCase().includes(q)) ||
               (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
               (p.category && p.category.toLowerCase().includes(q));
      });
    }

    // 2. Category Filter (Exact match or alias match)
    if (activeCategory) {
      prods = prods.filter(p => {
        const cat = p.category ? p.category.trim() : '';
        return cat.toLowerCase() === activeCategory.toLowerCase();
      });
    }

    // 3. Price Filter
    if (activePricePreset === 'under-1') {
      prods = prods.filter(p => p.price < 1);
    } else if (activePricePreset === 'under-100') {
      prods = prods.filter(p => p.price <= 100);
    } else if (activePricePreset === 'under-500') {
      prods = prods.filter(p => p.price <= 500);
    } else if (activePricePreset === 'over-500') {
      prods = prods.filter(p => p.price > 500);
    } else if (activePricePreset === 'custom') {
      prods = prods.filter(p => p.price >= minPrice && p.price <= maxPrice);
    }

    // 4. Rating Filter
    if (minRating > 0) {
      prods = prods.filter(p => (p.rating || 0) >= minRating);
    }

    // 5. Sorting
    if (activeSort === 'price-asc') {
      prods.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price-desc') {
      prods.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'rating') {
      prods.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeSort === 'newest') {
      prods.reverse();
    }

    return prods;
  }

  function render() {
    const filteredProducts = getFilteredProducts();

    // Active filter chips
    const filterChips = [];
    if (activeSearch) filterChips.push({ label: `Search: "${activeSearch}"`, type: 'search' });
    if (activeCategory) filterChips.push({ label: `Category: ${activeCategory}`, type: 'category' });
    if (activePricePreset !== 'all') {
      let pLabel = 'Price Filter';
      if (activePricePreset === 'under-1') pLabel = 'Under ₹1';
      if (activePricePreset === 'under-100') pLabel = 'Under ₹100';
      if (activePricePreset === 'under-500') pLabel = 'Under ₹500';
      if (activePricePreset === 'over-500') pLabel = 'Over ₹500';
      if (activePricePreset === 'custom') pLabel = `₹${minPrice} - ₹${maxPrice}`;
      filterChips.push({ label: pLabel, type: 'price' });
    }
    if (minRating > 0) filterChips.push({ label: `Rating: ${minRating}★ & above`, type: 'rating' });

    const titleText = activeSearch
      ? `Search results for "${activeSearch}"`
      : activeCategory
        ? activeCategory
        : 'All Products';

    container.innerHTML = `
      <div class="snx-catalog-page snx-container">
        <!-- Breadcrumb -->
        <nav class="snx-breadcrumb" aria-label="Breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <a href="#/catalog">Showcase</a>
          <span>/</span>
          <span class="current">${titleText}</span>
        </nav>

        <div class="snx-catalog-layout">
          <!-- LEFT SIDEBAR FILTERS (Simple, useful filters only) -->
          <aside class="snx-filter-sidebar" id="snx-filter-sidebar" aria-label="Filters">
            <div class="snx-filter-header">
              <h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filters
              </h2>
              ${filterChips.length > 0 ? `<button type="button" class="snx-filter-clear-btn" id="snx-clear-all-filters">Clear All</button>` : ''}
            </div>

            <!-- Active Chips -->
            ${filterChips.length > 0 ? `
              <div class="snx-active-filters-wrap">
                ${filterChips.map(c => `
                  <span class="snx-active-filter-chip">
                    ${c.label}
                    <button type="button" data-remove-filter="${c.type}" aria-label="Remove filter">✕</button>
                  </span>
                `).join('')}
              </div>
            ` : ''}

            <!-- 1. Custom Categories -->
            <div class="snx-filter-group">
              <div class="snx-filter-group-title">
                <span>Categories</span>
              </div>
              <div class="snx-filter-options-list">
                <label class="snx-filter-label">
                  <input type="radio" name="cat-filter" value="" ${!activeCategory ? 'checked' : ''}>
                  <span>All Categories</span>
                </label>
                ${CUSTOM_CATEGORIES.map(c => `
                  <label class="snx-filter-label">
                    <input type="radio" name="cat-filter" value="${c.name}" ${activeCategory.toLowerCase() === c.name.toLowerCase() ? 'checked' : ''}>
                    <span>${c.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- 2. Price Range Filter -->
            <div class="snx-filter-group">
              <div class="snx-filter-group-title">
                <span>Price</span>
              </div>
              <div class="snx-filter-options-list">
                <label class="snx-filter-label">
                  <input type="radio" name="price-bracket" value="all" ${activePricePreset === 'all' ? 'checked' : ''}>
                  <span>All Prices</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="price-bracket" value="under-1" ${activePricePreset === 'under-1' ? 'checked' : ''}>
                  <span>Under ₹1</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="price-bracket" value="under-100" ${activePricePreset === 'under-100' ? 'checked' : ''}>
                  <span>Under ₹100</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="price-bracket" value="under-500" ${activePricePreset === 'under-500' ? 'checked' : ''}>
                  <span>Under ₹500</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="price-bracket" value="over-500" ${activePricePreset === 'over-500' ? 'checked' : ''}>
                  <span>₹500 and Above</span>
                </label>
              </div>

              <!-- Custom Min/Max Inputs -->
              <div class="snx-price-inputs-row">
                <input type="number" id="snx-min-price-in" class="snx-price-input" placeholder="Min" step="0.1" value="${minPrice > 0 ? minPrice : ''}">
                <span>-</span>
                <input type="number" id="snx-max-price-in" class="snx-price-input" placeholder="Max" step="0.1" value="${maxPrice < 100000 ? maxPrice : ''}">
                <button type="button" class="snx-price-go-btn" id="snx-price-go-btn">Go</button>
              </div>
            </div>

            <!-- 3. Rating Filter -->
            <div class="snx-filter-group">
              <div class="snx-filter-group-title">
                <span>Rating</span>
              </div>
              <div class="snx-filter-options-list">
                <label class="snx-filter-label">
                  <input type="radio" name="rating-filter" value="0" ${minRating === 0 ? 'checked' : ''}>
                  <span>All Ratings</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="rating-filter" value="4" ${minRating === 4 ? 'checked' : ''}>
                  <span>4★ & above</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="rating-filter" value="3" ${minRating === 3 ? 'checked' : ''}>
                  <span>3★ & above</span>
                </label>
                <label class="snx-filter-label">
                  <input type="radio" name="rating-filter" value="1" ${minRating === 1 ? 'checked' : ''}>
                  <span>1★ & above</span>
                </label>
              </div>
            </div>
          </aside>

          <!-- MAIN CONTENT -->
          <main class="snx-catalog-main">
            <!-- Top Toolbar -->
            <div class="snx-catalog-toolbar">
              <div class="snx-catalog-heading-wrap">
                <h1 class="snx-catalog-title">${titleText}</h1>
                <span class="snx-catalog-count">(${filteredProducts.length} items)</span>
              </div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <button type="button" class="snx-mobile-filter-trigger" id="snx-mobile-filter-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filters
                </button>

                <div class="snx-catalog-sort-wrap">
                  <label for="snx-sort-select">Sort:</label>
                  <select id="snx-sort-select" class="snx-sort-select">
                    <option value="relevance" ${activeSort === 'relevance' ? 'selected' : ''}>Relevance</option>
                    <option value="price-asc" ${activeSort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                    <option value="price-desc" ${activeSort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
                    <option value="rating" ${activeSort === 'rating' ? 'selected' : ''}>Rating</option>
                    <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Products Grid or Empty State -->
            ${filteredProducts.length > 0 ? `
              <div class="snx-catalog-grid" id="snx-catalog-grid">
                ${filteredProducts.map(p => renderProductCardHTML(p)).join('')}
              </div>
            ` : `
              <div class="snx-empty-state">
                <div class="snx-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <h3 class="snx-empty-title">No products found</h3>
                <p class="snx-empty-desc">
                  Try another search or select a different category.
                </p>
                <button type="button" class="snx-btn snx-btn-primary" id="snx-empty-reset-btn">
                  Clear All Filters
                </button>
              </div>
            `}
          </main>
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    attachCardEventListeners(container, (id) => openQuickViewModal(id));

    const clearBtn = container.querySelector('#snx-clear-all-filters');
    const resetBtn = container.querySelector('#snx-empty-reset-btn');
    const resetAll = () => {
      activeSearch = '';
      activeCategory = '';
      activePricePreset = 'all';
      minRating = 0;
      minPrice = 0;
      maxPrice = 100000;
      render();
    };

    if (clearBtn) clearBtn.addEventListener('click', resetAll);
    if (resetBtn) resetBtn.addEventListener('click', resetAll);

    // Active chip remove buttons
    const removeChipBtns = container.querySelectorAll('[data-remove-filter]');
    removeChipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.removeFilter;
        if (type === 'search') activeSearch = '';
        if (type === 'category') activeCategory = '';
        if (type === 'price') activePricePreset = 'all';
        if (type === 'rating') minRating = 0;
        render();
      });
    });

    // Category radios
    const catRadios = container.querySelectorAll('input[name="cat-filter"]');
    catRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        activeCategory = radio.value;
        render();
      });
    });

    // Price bracket radios
    const priceRadios = container.querySelectorAll('input[name="price-bracket"]');
    priceRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        activePricePreset = radio.value;
        render();
      });
    });

    // Custom price Go button
    const priceGoBtn = container.querySelector('#snx-price-go-btn');
    if (priceGoBtn) {
      priceGoBtn.addEventListener('click', () => {
        const minVal = parseFloat(container.querySelector('#snx-min-price-in').value);
        const maxVal = parseFloat(container.querySelector('#snx-max-price-in').value);
        minPrice = isNaN(minVal) ? 0 : minVal;
        maxPrice = isNaN(maxVal) ? 100000 : maxVal;
        activePricePreset = 'custom';
        render();
      });
    }

    // Rating radios
    const ratingRadios = container.querySelectorAll('input[name="rating-filter"]');
    ratingRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        minRating = parseFloat(radio.value);
        render();
      });
    });

    // Sort select
    const sortSelect = container.querySelector('#snx-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        activeSort = sortSelect.value;
        render();
      });
    }

    // Mobile filter toggle
    const mobFilterBtn = container.querySelector('#snx-mobile-filter-btn');
    const sidebar = container.querySelector('#snx-filter-sidebar');
    if (mobFilterBtn && sidebar) {
      mobFilterBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  render();
}
