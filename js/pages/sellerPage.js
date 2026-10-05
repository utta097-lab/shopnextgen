/**
 * SHOPNEX Showcase & Content Manager
 * Protected Route: Requires Verified SHOPNEX Administrator
 *
 * Enforces single protected management system:
 * - Unauthenticated visitors: Denied access with clear Admin Access Required notice.
 * - Authenticated admins: Seamlessly handed off to the Real Admin Product & Music Editor.
 */

import { getAdminUser, checkIsAdmin } from '../services/supabaseService.js';
import { renderAdminProductsPage } from './adminProductsPage.js';

export async function renderSellerPage(container) {
  // Show loading skeleton while checking authorization
  container.innerHTML = `
    <div class="snx-container snx-admin-page" style="padding: 40px 20px;">
      <div class="snx-skeleton" style="height: 48px; width: 300px; margin-bottom: 24px;"></div>
      <div class="snx-skeleton" style="height: 380px; width: 100%; border-radius: 12px;"></div>
    </div>
  `;

  let currentUser = null;
  let isAuthorizedAdmin = false;

  try {
    currentUser = await getAdminUser();
    if (currentUser) {
      isAuthorizedAdmin = await checkIsAdmin();
    }
  } catch (err) {
    console.warn('Seller page authorization check:', err);
  }

  // 1. If not authenticated or not authorized as admin: Show Admin Access Required page
  if (!currentUser || !isAuthorizedAdmin) {
    container.innerHTML = `
      <div class="snx-container snx-admin-page" style="max-width: 540px; padding: 60px 20px; text-align: center;">
        <nav class="snx-breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <span class="current">Admin Access Required</span>
        </nav>
        <div class="snx-admin-auth-card" style="padding: 40px 30px; text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 16px;">🔒</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--snx-text-main); margin-bottom: 8px;">
            Admin Access Required
          </h2>
          <p style="color: var(--snx-text-muted); font-size: 0.9375rem; line-height: 1.6; margin-bottom: 24px;">
            The Product & Content Manager is strictly restricted to verified SHOPNEX administrators.
            Public visitors cannot create, edit, or delete showcase products or upload shared music.
          </p>
          <a href="#/admin/login" class="snx-btn snx-btn-primary snx-btn-block" style="padding: 12px; font-weight: 700; text-decoration: none;">
            Sign In to Admin Portal →
          </a>
        </div>
      </div>
    `;
    return () => {};
  }

  // 2. If authenticated as an authorized SHOPNEX admin:
  // Render the Real Admin Product & Shared Music Editor (single source of truth)
  return renderAdminProductsPage(container);
}
