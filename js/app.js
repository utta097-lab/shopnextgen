/**
 * SHOPNEX Main Application Entry Point
 */

import { renderHeaderHTML, initHeaderEvents } from './components/header.js';
import { Router } from './router.js';
import { showToast } from './components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mount Header & Category Bar
  const headerMount = document.getElementById('snx-header-mount');
  if (headerMount) {
    headerMount.innerHTML = renderHeaderHTML();
    initHeaderEvents();
  }

  // 2. Initialize Router
  const appContainer = document.getElementById('snx-app-mount');
  if (appContainer) {
    const router = new Router(appContainer);
    router.init();
  }

  // 3. Newsletter form subscription
  const newsletterForm = document.getElementById('snx-newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inVal = document.getElementById('snx-newsletter-email').value;
      if (inVal) {
        showToast(`Thank you! You're subscribed to SHOPNEX Insider Deals.`, 'success');
        newsletterForm.reset();
      }
    });
  }
});
