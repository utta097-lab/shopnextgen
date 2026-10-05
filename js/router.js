/**
 * SHOPNEX Client Router
 * Lightweight SPA Hash Router with query params support and lifecycle management
 */

import { renderHomePage } from './pages/homePage.js';
import { renderCatalogPage } from './pages/catalogPage.js';
import { renderProductDetailPage } from './pages/productDetailPage.js';
import { renderCartPage } from './pages/cartPage.js';
import { renderCheckoutPage } from './pages/checkoutPage.js';
import { renderAccountPage } from './pages/accountPage.js';
import { renderWishlistPage } from './pages/wishlistPage.js';
import { renderSellerPage } from './pages/sellerPage.js';
import { renderAdminProductsPage } from './pages/adminProductsPage.js';

export class Router {
  constructor(appContainer) {
    this.container = appContainer;
    this.currentCleanup = null;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  parseHash() {
    const rawHash = window.location.hash.slice(1) || '/';
    const [pathPart, queryPart] = rawHash.split('?');

    const params = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }

    return {
      path: pathPart.startsWith('/') ? pathPart : '/' + pathPart,
      params
    };
  }

  handleRoute() {
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Execute previous page cleanup if any
    if (typeof this.currentCleanup === 'function') {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    const { path, params } = this.parseHash();

    // Update active state in mobile bottom nav
    this.updateBottomNavActive(path);

    // Route matching
    if (path === '/' || path === '') {
      this.currentCleanup = renderHomePage(this.container);
      return;
    }

    if (path === '/catalog') {
      this.currentCleanup = renderCatalogPage(this.container, params);
      return;
    }

    if (path.startsWith('/product/')) {
      const productId = path.replace('/product/', '');
      this.currentCleanup = renderProductDetailPage(this.container, productId);
      return;
    }

    if (path === '/cart') {
      this.currentCleanup = renderCartPage(this.container);
      return;
    }

    if (path === '/checkout') {
      this.currentCleanup = renderCheckoutPage(this.container);
      return;
    }

    if (path === '/account') {
      this.currentCleanup = renderAccountPage(this.container, params.tab || 'orders');
      return;
    }

    if (path === '/wishlist') {
      this.currentCleanup = renderWishlistPage(this.container);
      return;
    }

    if (path === '/seller' || path === '/seller-hub') {
      this.currentCleanup = renderAdminProductsPage(this.container, params);
      return;
    }

    if (path === '/admin' || path === '/admin/products') {
      this.currentCleanup = renderAdminProductsPage(this.container, params);
      return;
    }

    if (path === '/admin/login') {
      this.currentCleanup = renderAdminProductsPage(this.container, { ...params, tab: 'login' });
      return;
    }

    if (path === '/admin/settings') {
      this.currentCleanup = renderAdminProductsPage(this.container, { ...params, tab: 'settings' });
      return;
    }

    // Default Fallback: Home
    this.currentCleanup = renderHomePage(this.container);
  }

  updateBottomNavActive(path) {
    const items = document.querySelectorAll('.snx-mobile-nav-item');
    items.forEach(it => {
      const route = it.dataset.route;
      if (route === '' && (path === '/' || path === '')) {
        it.classList.add('active');
      } else if (route && path.startsWith('/' + route)) {
        it.classList.add('active');
      } else {
        it.classList.remove('active');
      }
    });
  }

  init() {
    this.handleRoute();
  }
}
