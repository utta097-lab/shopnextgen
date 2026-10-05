/**
 * SHOPNEX Real Admin Product Editor & Shared Music Management Hub
 * Route: #/admin, #/admin/products, #/admin/login
 *
 * Provides:
 * - Real Admin Authentication (Supabase Auth)
 * - Central Product CRUD (Supabase Database + Local Store sync)
 * - Shared Online Music Uploads (Supabase Storage 'product-music' bucket)
 * - Music Preview, Replacement, and Removal
 * - 1-Click Base Products Sync to Supabase
 * - Backend & Storage Configuration Manager
 */

import { store } from '../state/store.js';
import { CUSTOM_CATEGORIES } from '../data/categories.js';
import { PRODUCTS } from '../data/products.js';
import { formatPriceINR } from '../components/productCard.js';
import { showToast } from '../components/toast.js';
import {
  getSupabase,
  signInAdmin,
  signOutAdmin,
  getAdminUser,
  testConnection,
  saveRemoteProduct,
  deleteRemoteProduct,
  syncBaseProductsToSupabase,
  uploadProductMusic,
  deleteProductMusic
} from '../services/supabaseService.js';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../config/supabaseConfig.js';

let activeEditorProduct = null;
let activePreviewAudio = null;

export function renderAdminProductsPage(container, queryParams = {}) {
  let activeTab = queryParams.tab || 'products'; // 'products', 'login', 'settings'
  let currentUser = null;
  let connectionInfo = { connected: false, message: 'Checking connection...' };
  let isCheckingAuth = true;

  // Initialize and check current admin session
  async function init() {
    isCheckingAuth = true;
    renderSkeleton();

    try {
      currentUser = await getAdminUser();
      const testRes = await testConnection();
      connectionInfo = testRes;
    } catch (err) {
      console.warn('Admin init check:', err);
    } finally {
      isCheckingAuth = false;
      render();
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div class="snx-container snx-admin-page" style="padding: 40px 20px;">
        <div class="snx-skeleton" style="height: 48px; width: 300px; margin-bottom: 24px;"></div>
        <div class="snx-skeleton" style="height: 380px; width: 100%; border-radius: 12px;"></div>
      </div>
    `;
  }

  function render() {
    const config = getSupabaseConfig();
    const allProducts = store.getAllProducts();

    // 1. If not logged in and Supabase is configured: show Admin Login
    // (Or if tab === 'login')
    if (!currentUser && (activeTab === 'login' || config.isConfigured)) {
      renderLoginForm();
      return;
    }

    // 2. If Supabase is not yet configured and no user: show Quick Setup / Onboarding
    if (!config.isConfigured && !currentUser) {
      renderSetupAndLoginForm();
      return;
    }

    // 3. Otherwise show Full Authenticated Admin Dashboard
    renderDashboard(allProducts, config);
  }

  // ==========================================================================
  // VIEW: ADMIN LOGIN FORM
  // ==========================================================================
  function renderLoginForm() {
    container.innerHTML = `
      <div class="snx-container snx-admin-page" style="max-width: 520px; padding: 60px 20px;">
        <nav class="snx-breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <span class="current">Admin Login</span>
        </nav>

        <div class="snx-admin-auth-card">
          <div class="snx-admin-auth-header">
            <div class="snx-admin-lock-icon">🔒</div>
            <h2>ShopNex Admin Portal</h2>
            <p>Sign in to manage products, prices, and upload shared theme music.</p>
          </div>

          <form id="snx-admin-login-form" class="snx-admin-form">
            <div class="snx-form-group">
              <label class="snx-form-label" for="snx-admin-email">Admin Email *</label>
              <input type="email" id="snx-admin-email" class="snx-form-input" placeholder="admin@shopnex.in" required autocomplete="email">
            </div>

            <div class="snx-form-group">
              <label class="snx-form-label" for="snx-admin-password">Password *</label>
              <input type="password" id="snx-admin-password" class="snx-form-input" placeholder="••••••••" required autocomplete="current-password">
            </div>

            <div id="snx-admin-login-error" class="snx-alert-box error" style="display: none;"></div>

            <button type="submit" class="snx-btn snx-btn-primary snx-btn-block" id="snx-admin-submit-btn" style="padding: 12px;">
              Sign In to Admin Dashboard →
            </button>
          </form>

          <div class="snx-admin-auth-footer">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8125rem; color: var(--snx-text-muted);">
                Backend: ${connectionInfo.connected ? '🟢 Supabase Online' : '🟡 Offline / Pending Setup'}
              </span>
              <button type="button" class="snx-btn-link" id="snx-open-settings-tab" style="font-size: 0.8125rem;">
                ⚙️ Backend Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    attachLoginFormEvents();
  }

  // ==========================================================================
  // VIEW: SETUP & CREDENTIALS ONBOARDING FORM
  // ==========================================================================
  function renderSetupAndLoginForm() {
    const config = getSupabaseConfig();
    container.innerHTML = `
      <div class="snx-container snx-admin-page" style="max-width: 680px; padding: 40px 20px;">
        <nav class="snx-breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <span class="current">Admin Setup & Backend Configuration</span>
        </nav>

        <div class="snx-admin-auth-card">
          <div class="snx-admin-auth-header">
            <div class="snx-admin-lock-icon">⚡</div>
            <h2>Connect Central Storage & Database</h2>
            <p>
              To ensure product music is uploaded to <strong>shared online storage</strong> and heard by <strong>every visitor</strong>,
              connect your free Supabase project below.
            </p>
          </div>

          <div class="snx-alert-box info" style="margin-bottom: 20px;">
            <strong>Step 1:</strong> In your Supabase Project (<a href="https://supabase.com" target="_blank" rel="noopener" style="text-decoration: underline; font-weight: 700;">supabase.com</a>), run the script in <code>supabase_schema.sql</code> in the SQL Editor.<br>
            <strong>Step 2:</strong> Copy your <strong>Project URL</strong> and <strong>anon (public) key</strong> from <em>Project Settings → API</em>.
          </div>

          <form id="snx-backend-config-form" class="snx-admin-form">
            <div class="snx-form-group">
              <label class="snx-form-label" for="snx-cfg-url">Supabase Project URL *</label>
              <input type="url" id="snx-cfg-url" class="snx-form-input" placeholder="https://xyzproject.supabase.co" value="${config.url !== 'https://your-project.supabase.co' ? config.url : ''}" required>
            </div>

            <div class="snx-form-group">
              <label class="snx-form-label" for="snx-cfg-key">Supabase Anon Key (Public) *</label>
              <input type="text" id="snx-cfg-key" class="snx-form-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5..." value="${!config.anonKey.includes('your-anon-key') ? config.anonKey : ''}" required>
              <div style="font-size: 0.75rem; color: var(--snx-text-muted); margin-top: 4px;">
                Safe for client-side use. Protected by Supabase Row Level Security. Never enter service_role key.
              </div>
            </div>

            <div class="snx-form-group">
              <label class="snx-form-label" for="snx-cfg-bucket">Storage Bucket Name</label>
              <input type="text" id="snx-cfg-bucket" class="snx-form-input" value="${config.storageBucket || 'product-music'}" required>
            </div>

            <div id="snx-config-status-box" style="margin-bottom: 16px;"></div>

            <div style="display: flex; gap: 12px;">
              <button type="submit" class="snx-btn snx-btn-primary" style="flex: 2; padding: 12px;">
                Save Configuration & Test Connection
              </button>
              <button type="button" class="snx-btn snx-btn-secondary" id="snx-demo-bypass-btn" style="flex: 1;" title="Proceed in local admin mode">
                Local Admin Mode →
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    attachSetupEvents();
  }

  // ==========================================================================
  // VIEW: FULL AUTHENTICATED ADMIN DASHBOARD
  // ==========================================================================
  function renderDashboard(allProducts, config) {
    const productsWithMusic = allProducts.filter(p => !!(p.musicUrl || p.audio || p.song));

    container.innerHTML = `
      <div class="snx-container snx-admin-page">
        <!-- Breadcrumb -->
        <nav class="snx-breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <span class="current">Admin Product Editor</span>
        </nav>

        <!-- Admin Top Navigation Bar -->
        <div class="snx-admin-top-bar">
          <div class="snx-admin-title-group">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h1 class="snx-admin-title">Admin Product & Music Editor</h1>
              <span class="snx-badge snx-badge-deal" style="font-size: 0.75rem;">ADMIN SECURE</span>
            </div>
            <p class="snx-admin-subtitle">
              Manage products, prices, and upload shared theme songs stored centrally for all visitors.
            </p>
          </div>

          <div class="snx-admin-header-actions">
            <button type="button" class="snx-btn snx-btn-primary" id="snx-admin-create-prod-btn">
              + Create Product
            </button>
            <button type="button" class="snx-btn snx-btn-secondary" id="snx-admin-sync-btn" title="Sync all default base products into Supabase table">
              🔄 Sync to Database
            </button>
            <button type="button" class="snx-btn snx-btn-secondary" id="snx-admin-config-btn" title="Storage and backend credentials">
              ⚙️ Backend Settings
            </button>
            <button type="button" class="snx-btn snx-btn-secondary" id="snx-admin-logout-btn" style="color: var(--snx-accent);">
              Sign Out 🚪
            </button>
          </div>
        </div>

        <!-- Metric Badges Strip -->
        <div class="snx-metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
          <div class="snx-metric-card">
            <div class="snx-metric-icon prods">📦</div>
            <div>
              <div class="snx-metric-val">${allProducts.length}</div>
              <div class="snx-metric-label">Active Products</div>
            </div>
          </div>

          <div class="snx-metric-card">
            <div class="snx-metric-icon" style="background: #ede9fe; color: #7c3aed;">🎵</div>
            <div>
              <div class="snx-metric-val">${productsWithMusic.length}</div>
              <div class="snx-metric-label">Products With Shared Music</div>
            </div>
          </div>

          <div class="snx-metric-card">
            <div class="snx-metric-icon orders">📂</div>
            <div>
              <div class="snx-metric-val">6</div>
              <div class="snx-metric-label">Designated Categories</div>
            </div>
          </div>

          <div class="snx-metric-card">
            <div class="snx-metric-icon" style="background: ${connectionInfo.connected ? '#ecfdf5' : '#fef3c7'}; color: ${connectionInfo.connected ? '#059669' : '#d97706'};">
              ${connectionInfo.connected ? '☁️' : '⚠️'}
            </div>
            <div>
              <div class="snx-metric-val" style="font-size: 1rem; font-weight: 800;">
                ${connectionInfo.connected ? 'Online (Supabase)' : 'Local Storage Mode'}
              </div>
              <div class="snx-metric-label" style="font-size: 0.75rem;">
                ${connectionInfo.connected ? 'Storage & DB Connected' : 'Click ⚙️ to configure shared storage'}
              </div>
            </div>
          </div>
        </div>

        <!-- Product Management Table -->
        <div class="snx-seller-table-card">
          <div class="snx-table-header-row" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--snx-border); flex-wrap: wrap; gap: 12px;">
            <div style="font-size: 1.125rem; font-weight: 800; color: var(--snx-text-main);">
              Product Inventory & Theme Music Directory
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <input type="text" id="snx-admin-table-search" class="snx-form-input" placeholder="Search by name or category..." style="width: 260px; padding: 8px 12px; font-size: 0.875rem;">
            </div>
          </div>

          <div class="snx-table-responsive">
            <table class="snx-seller-table">
              <thead>
                <tr>
                  <th style="width: 70px;">Image</th>
                  <th>Product Name & ID</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th style="min-width: 220px;">Assigned Music (Shared)</th>
                  <th style="text-align: right; width: 220px;">Actions</th>
                </tr>
              </thead>
              <tbody id="snx-admin-table-tbody">
                ${allProducts.map(p => {
                  const thumb = p.thumbnail || p.image || (p.images && p.images[0]) || '';
                  const music = p.musicUrl || p.audio || p.song || null;
                  const musicFileName = music ? music.split('/').pop().split('?')[0] : '';

                  return `
                    <tr data-product-row="${p.id}">
                      <td>
                        <div class="snx-seller-thumb-box" style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center;">
                          ${thumb ? `<img src="${thumb}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-weight: 800; color: #94a3b8;">${p.name.charAt(0).toUpperCase()}</span>`}
                        </div>
                      </td>
                      <td>
                        <div style="font-weight: 700; color: var(--snx-text-main); font-size: 0.9375rem;">${p.name}</div>
                        <div style="font-size: 0.75rem; color: var(--snx-text-muted);">ID: <code>${p.id}</code></div>
                      </td>
                      <td>
                        <span class="snx-badge" style="background: #eff6ff; color: #1d4ed8; font-size: 0.75rem;">${p.category}</span>
                      </td>
                      <td>
                        <strong>${p.price ? formatPriceINR(p.price) : '—'}</strong>
                      </td>
                      <td>
                        <span class="snx-rating-pill" style="font-size: 0.75rem;">★ ${p.rating}</span>
                      </td>
                      <td>
                        ${music ? `
                          <div class="snx-admin-music-badge assigned" title="${music}">
                            <button type="button" class="snx-mini-play-btn" data-preview-music="${music}" aria-label="Preview song">
                              ▶
                            </button>
                            <div class="snx-admin-music-info">
                              <span class="snx-music-name-text">${musicFileName}</span>
                              <span class="snx-music-tag">Shared Online</span>
                            </div>
                          </div>
                        ` : `
                          <span class="snx-admin-music-badge none">
                            ⚪ No Music Assigned
                          </span>
                        `}
                      </td>
                      <td style="text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-edit-prod="${p.id}" title="Edit Product & Music">
                            ✏️ Edit
                          </button>
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-quick-music="${p.id}" style="color: #6366f1; border-color: #c7d2fe;" title="Upload or Replace Music">
                            🎵 Music
                          </button>
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-delete-prod="${p.id}" style="color: var(--snx-accent);" title="Delete product">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Mount Modal Backdrop Container -->
      <div id="snx-admin-modal-mount"></div>
    `;

    attachDashboardEvents();
  }

  // ==========================================================================
  // EVENT HANDLERS: LOGIN & SETUP
  // ==========================================================================
  function attachLoginFormEvents() {
    const loginForm = container.querySelector('#snx-admin-login-form');
    const errBox = container.querySelector('#snx-admin-login-error');
    const submitBtn = container.querySelector('#snx-admin-submit-btn');
    const settingsBtn = container.querySelector('#snx-open-settings-tab');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        renderSetupAndLoginForm();
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';

        const email = container.querySelector('#snx-admin-email').value;
        const password = container.querySelector('#snx-admin-password').value;

        try {
          const authData = await signInAdmin(email, password);
          currentUser = authData.user || { email };
          showToast('Admin sign-in successful!', 'success');
          render();
        } catch (err) {
          errBox.textContent = `Login failed: ${err.message}`;
          errBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In to Admin Dashboard →';
        }
      });
    }
  }

  function attachSetupEvents() {
    const cfgForm = container.querySelector('#snx-backend-config-form');
    const statusBox = container.querySelector('#snx-config-status-box');
    const bypassBtn = container.querySelector('#snx-demo-bypass-btn');

    if (bypassBtn) {
      bypassBtn.addEventListener('click', () => {
        currentUser = { email: 'admin@local' };
        showToast('Running in local admin mode. (Remember to configure Supabase for shared multi-visitor storage)', 'info');
        render();
      });
    }

    if (cfgForm) {
      cfgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = container.querySelector('#snx-cfg-url').value;
        const anonKey = container.querySelector('#snx-cfg-key').value;
        const bucket = container.querySelector('#snx-cfg-bucket').value;

        saveSupabaseConfig({ url, anonKey, storageBucket: bucket });
        statusBox.innerHTML = `<div class="snx-alert-box info">Testing connection to ${url}...</div>`;

        const res = await testConnection();
        connectionInfo = res;

        if (res.connected) {
          statusBox.innerHTML = `<div class="snx-alert-box success">${res.message}</div>`;
          showToast('Supabase Connected Successfully!', 'success');
          setTimeout(() => {
            render();
          }, 1000);
        } else {
          statusBox.innerHTML = `<div class="snx-alert-box error">${res.message}</div>`;
        }
      });
    }
  }

  // ==========================================================================
  // EVENT HANDLERS: DASHBOARD & TABLE
  // ==========================================================================
  function attachDashboardEvents() {
    // 1. Create Product button
    const createBtn = container.querySelector('#snx-admin-create-prod-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openProductEditorModal(null, () => render());
      });
    }

    // 2. Sync to Database button
    const syncBtn = container.querySelector('#snx-admin-sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = 'Syncing...';
        try {
          await syncBaseProductsToSupabase(store.getAllProducts());
          showToast('Base products synced to central Supabase database!', 'success');
        } catch (err) {
          showToast(`Sync failed: ${err.message}`, 'error');
        } finally {
          syncBtn.disabled = false;
          syncBtn.textContent = '🔄 Sync to Database';
        }
      });
    }

    // 3. Backend Settings button
    const configBtn = container.querySelector('#snx-admin-config-btn');
    if (configBtn) {
      configBtn.addEventListener('click', () => {
        renderSetupAndLoginForm();
      });
    }

    // 4. Logout button
    const logoutBtn = container.querySelector('#snx-admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await signOutAdmin();
        currentUser = null;
        showToast('Signed out of Admin.', 'info');
        render();
      });
    }

    // 5. Table Search
    const searchIn = container.querySelector('#snx-admin-table-search');
    const tbody = container.querySelector('#snx-admin-table-tbody');
    if (searchIn && tbody) {
      searchIn.addEventListener('input', () => {
        const q = searchIn.value.toLowerCase().trim();
        tbody.querySelectorAll('tr').forEach(tr => {
          tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    // 6. Action Delegations: Edit, Music, Delete, Mini-Play
    if (tbody) {
      tbody.addEventListener('click', async (e) => {
        // Mini preview play
        const playBtn = e.target.closest('[data-preview-music]');
        if (playBtn) {
          const url = playBtn.dataset.previewMusic;
          handleMiniPreview(url, playBtn);
          return;
        }

        // Edit
        const editBtn = e.target.closest('[data-edit-prod]');
        if (editBtn) {
          const id = editBtn.dataset.editProd;
          const prod = store.getProductById(id);
          if (prod) openProductEditorModal(prod, () => render());
          return;
        }

        // Quick Music
        const musicBtn = e.target.closest('[data-quick-music]');
        if (musicBtn) {
          const id = musicBtn.dataset.quickMusic;
          const prod = store.getProductById(id);
          if (prod) openProductEditorModal(prod, () => render(), 'music-focus');
          return;
        }

        // Delete
        const deleteBtn = e.target.closest('[data-delete-prod]');
        if (deleteBtn) {
          const id = deleteBtn.dataset.deleteProd;
          const prod = store.getProductById(id);
          const name = prod ? prod.name : id;
          if (confirm(`Are you sure you want to delete "${name}" from the product database?`)) {
            await store.deleteProduct(id);
            showToast(`Deleted ${name}`, 'info');
            render();
          }
          return;
        }
      });
    }
  }

  function handleMiniPreview(url, btn) {
    if (activePreviewAudio && activePreviewAudio.src === url && !activePreviewAudio.paused) {
      activePreviewAudio.pause();
      btn.textContent = '▶';
      return;
    }

    if (activePreviewAudio) {
      activePreviewAudio.pause();
      container.querySelectorAll('[data-preview-music]').forEach(b => b.textContent = '▶');
    }

    activePreviewAudio = new Audio(url);
    activePreviewAudio.play().then(() => {
      btn.textContent = '❚❚';
    }).catch(err => {
      showToast('Could not play audio preview', 'error');
    });

    activePreviewAudio.onended = () => {
      btn.textContent = '▶';
    };
  }

  // ==========================================================================
  // MODAL: PRODUCT & SHARED MUSIC EDITOR
  // ==========================================================================
  function openProductEditorModal(productToEdit, onSaved, focusMode = null) {
    const isNew = !productToEdit;
    const prod = productToEdit ? { ...productToEdit } : {
      id: `product-${String(store.getAllProducts().length + 1).padStart(3, '0')}`,
      name: '',
      category: 'ভদ্র ছেলে',
      price: 150,
      originalPrice: null,
      discount: null,
      rating: 5.0,
      image: '',
      images: [],
      thumbnail: '',
      musicUrl: null,
      audio: null,
      shortDescription: '',
      description: '',
      highlights: [],
      specifications: {},
      availability: true,
      featured: false,
      badge: ''
    };

    activeEditorProduct = prod;

    const modalMount = container.querySelector('#snx-admin-modal-mount');
    if (!modalMount) return;

    modalMount.innerHTML = `
      <div class="snx-modal-backdrop open" id="snx-editor-modal-backdrop">
        <div class="snx-modal-container wide" role="dialog" aria-modal="true">
          <div class="snx-modal-header">
            <div>
              <span class="snx-modal-title">${isNew ? '+ Create New Product' : `Edit Product: ${prod.name}`}</span>
              <div style="font-size: 0.75rem; color: var(--snx-text-muted);">
                Central Database ID: <code>${prod.id}</code>
              </div>
            </div>
            <button type="button" class="snx-modal-close-btn" id="snx-editor-modal-close" aria-label="Close">✕</button>
          </div>

          <div class="snx-modal-body">
            <form id="snx-product-editor-form">
              <!-- Basic Info -->
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
                <div class="snx-form-group">
                  <label class="snx-form-label" for="ed-name">Product Name *</label>
                  <input type="text" id="ed-name" class="snx-form-input" value="${prod.name || ''}" placeholder="e.g. Black Hoodie, kundan, Adam" required>
                </div>

                <div class="snx-form-group">
                  <label class="snx-form-label" for="ed-cat">Category *</label>
                  <select id="ed-cat" class="snx-form-input" required>
                    ${CUSTOM_CATEGORIES.map(c => `
                      <option value="${c.name}" ${prod.category === c.name ? 'selected' : ''}>${c.name}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Price & Rating -->
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                <div class="snx-form-group">
                  <label class="snx-form-label" for="ed-price">Price (₹) *</label>
                  <input type="number" id="ed-price" class="snx-form-input" value="${prod.price !== null && prod.price !== undefined ? prod.price : ''}" placeholder="150" step="0.00001" required>
                </div>

                <div class="snx-form-group">
                  <label class="snx-form-label" for="ed-mrp">Original MRP (₹)</label>
                  <input type="number" id="ed-mrp" class="snx-form-input" value="${prod.originalPrice || ''}" placeholder="Optional" step="0.00001">
                </div>

                <div class="snx-form-group">
                  <label class="snx-form-label" for="ed-rating">Rating (0.1 to 100+) *</label>
                  <input type="number" id="ed-rating" class="snx-form-input" value="${prod.rating !== undefined ? prod.rating : 5.0}" placeholder="4.5" step="0.1" min="0.1" max="1000" required>
                </div>
              </div>

              <!-- Image Configuration -->
              <div class="snx-form-group">
                <label class="snx-form-label" for="ed-image">Product Image URL or Project Path *</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="text" id="ed-image" class="snx-form-input" value="${prod.image || prod.thumbnail || ''}" placeholder="e.g. products/kundan/thumbnail.jpg or https://..." required>
                  <div id="ed-img-preview" style="width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: #e2e8f0; flex-shrink: 0;">
                    ${(prod.image || prod.thumbnail) ? `<img src="${prod.image || prod.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                  </div>
                </div>
              </div>

              <!-- ============================================================== -->
              <!-- SHARED PRODUCT MUSIC UPLOAD & MANAGEMENT SECTION (REQUIREMENT) -->
              <!-- ============================================================== -->
              <div class="snx-editor-music-box" id="snx-editor-music-section">
                <div class="snx-music-box-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="snx-music-box-badge">🎵 Product Theme Music</span>
                    <strong style="color: var(--snx-text-main); font-size: 0.9375rem;">Shared Central Audio</strong>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--snx-text-muted);">
                    Uploaded once → Automatically played for EVERY visitor
                  </span>
                </div>

                <!-- Current Music Status Card -->
                <div class="snx-music-current-card" id="snx-music-current-display">
                  ${prod.musicUrl ? `
                    <div class="snx-music-status-active">
                      <div class="snx-music-icon-wrap">♫</div>
                      <div class="snx-music-details-wrap">
                        <div class="snx-music-title-line">
                          <strong>Active Theme Song:</strong>
                          <span id="snx-music-active-filename">${prod.musicUrl.split('/').pop().split('?')[0]}</span>
                        </div>
                        <div class="snx-music-url-line">
                          <code id="snx-music-active-url">${prod.musicUrl}</code>
                        </div>
                      </div>
                      <div class="snx-music-actions-right">
                        <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" id="snx-test-active-music-btn">
                          ▶ Preview
                        </button>
                        <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" id="snx-remove-music-btn" style="color: var(--snx-accent);">
                          ✕ Remove Music
                        </button>
                      </div>
                    </div>
                  ` : `
                    <div class="snx-music-status-empty">
                      <span>⚪ No theme music assigned to this product yet.</span>
                    </div>
                  `}
                </div>

                <!-- Upload Music Button & Dropzone -->
                <div class="snx-music-upload-zone" style="margin-top: 12px;">
                  <input type="file" id="snx-music-file-picker" accept=".mp3,.wav,.ogg,.m4a,audio/*" style="display: none;">
                  
                  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="snx-btn snx-btn-primary" id="snx-trigger-music-upload-btn" style="display: flex; align-items: center; gap: 6px;">
                      <span>🎵</span>
                      <span>${prod.musicUrl ? 'Replace Theme Music' : 'Upload Product Music'}</span>
                    </button>
                    <span style="font-size: 0.75rem; color: var(--snx-text-muted);">
                      Supported formats: <strong>MP3, WAV, OGG, M4A</strong> (Max 50MB)
                    </span>
                  </div>

                  <!-- Upload Progress Bar (Hidden by default) -->
                  <div id="snx-music-progress-wrap" class="snx-upload-progress-wrap" style="display: none; margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 700; margin-bottom: 4px;">
                      <span id="snx-upload-status-label">Uploading to shared storage...</span>
                      <span id="snx-upload-percent-label">0%</span>
                    </div>
                    <div class="snx-progress-bar-track">
                      <div class="snx-progress-bar-fill" id="snx-music-progress-fill" style="width: 0%;"></div>
                    </div>
                  </div>

                  <!-- Upload Feedback Alert -->
                  <div id="snx-music-alert-box" style="margin-top: 10px; display: none;"></div>
                </div>
              </div>

              <!-- Descriptions -->
              <div class="snx-form-group" style="margin-top: 16px;">
                <label class="snx-form-label" for="ed-short-desc">Short Tagline / Summary</label>
                <input type="text" id="ed-short-desc" class="snx-form-input" value="${prod.shortDescription || ''}" placeholder="Brief highlight displayed on product card">
              </div>

              <div class="snx-form-group">
                <label class="snx-form-label" for="ed-desc">Full Product Description</label>
                <textarea id="ed-desc" class="snx-form-input" rows="4" placeholder="Detailed product description...">${prod.description || ''}</textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--snx-border);">
                <button type="button" class="snx-btn snx-btn-secondary" id="snx-editor-cancel-btn">
                  Cancel
                </button>
                <button type="submit" class="snx-btn snx-btn-primary snx-btn-lg" id="snx-editor-save-btn">
                  💾 Save Product Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    attachEditorEvents(isNew, onSaved);
  }

  function attachEditorEvents(isNew, onSaved) {
    const backdrop = container.querySelector('#snx-editor-modal-backdrop');
    const closeBtn = container.querySelector('#snx-editor-modal-close');
    const cancelBtn = container.querySelector('#snx-editor-cancel-btn');
    const form = container.querySelector('#snx-product-editor-form');

    const filePicker = container.querySelector('#snx-music-file-picker');
    const uploadBtn = container.querySelector('#snx-trigger-music-upload-btn');
    const progressWrap = container.querySelector('#snx-music-progress-wrap');
    const progressFill = container.querySelector('#snx-music-progress-fill');
    const percentLabel = container.querySelector('#snx-upload-percent-label');
    const statusLabel = container.querySelector('#snx-upload-status-label');
    const alertBox = container.querySelector('#snx-music-alert-box');
    const currentMusicDisplay = container.querySelector('#snx-music-current-display');

    const closeModal = () => {
      if (activePreviewAudio) {
        activePreviewAudio.pause();
        activePreviewAudio = null;
      }
      backdrop.classList.remove('open');
      setTimeout(() => {
        backdrop.remove();
      }, 200);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Dynamic Image Preview
    const imgInput = container.querySelector('#ed-image');
    const imgPreview = container.querySelector('#ed-img-preview');
    if (imgInput && imgPreview) {
      imgInput.addEventListener('input', () => {
        const val = imgInput.value.trim();
        imgPreview.innerHTML = val ? `<img src="${val}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
      });
    }

    // Music Upload Trigger
    if (uploadBtn && filePicker) {
      uploadBtn.addEventListener('click', () => {
        filePicker.click();
      });

      filePicker.addEventListener('change', async () => {
        const file = filePicker.files[0];
        if (!file) return;

        progressWrap.style.display = 'block';
        alertBox.style.display = 'none';
        uploadBtn.disabled = true;

        try {
          const result = await uploadProductMusic(file, activeEditorProduct.id, (pct) => {
            progressFill.style.width = `${pct}%`;
            percentLabel.textContent = `${pct}%`;
          });

          // Successfully uploaded!
          activeEditorProduct.musicUrl = result.publicUrl;
          activeEditorProduct.audio = result.publicUrl;
          activeEditorProduct.song = result.publicUrl;

          statusLabel.textContent = 'Upload Complete!';
          percentLabel.textContent = '100%';
          progressFill.style.width = '100%';

          alertBox.className = 'snx-alert-box success';
          alertBox.textContent = `✓ Uploaded "${result.fileName}" to shared storage! Accessible to all visitors.`;
          alertBox.style.display = 'block';

          // Update current music card display
          currentMusicDisplay.innerHTML = `
            <div class="snx-music-status-active">
              <div class="snx-music-icon-wrap">♫</div>
              <div class="snx-music-details-wrap">
                <div class="snx-music-title-line">
                  <strong>Active Theme Song:</strong>
                  <span id="snx-music-active-filename">${result.fileName}</span>
                </div>
                <div class="snx-music-url-line">
                  <code id="snx-music-active-url">${result.publicUrl}</code>
                </div>
              </div>
              <div class="snx-music-actions-right">
                <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" id="snx-test-active-music-btn">
                  ▶ Preview
                </button>
                <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" id="snx-remove-music-btn" style="color: var(--snx-accent);">
                  ✕ Remove Music
                </button>
              </div>
            </div>
          `;

          attachCurrentMusicButtons();
          uploadBtn.textContent = 'Replace Theme Music';
        } catch (err) {
          alertBox.className = 'snx-alert-box error';
          alertBox.textContent = `Upload failed: ${err.message}`;
          alertBox.style.display = 'block';
        } finally {
          uploadBtn.disabled = false;
          filePicker.value = '';
        }
      });
    }

    function attachCurrentMusicButtons() {
      // Test preview
      const testBtn = container.querySelector('#snx-test-active-music-btn');
      if (testBtn) {
        testBtn.addEventListener('click', () => {
          if (!activeEditorProduct.musicUrl) return;
          if (activePreviewAudio && !activePreviewAudio.paused) {
            activePreviewAudio.pause();
            testBtn.textContent = '▶ Preview';
          } else {
            activePreviewAudio = new Audio(activeEditorProduct.musicUrl);
            activePreviewAudio.play().then(() => {
              testBtn.textContent = '❚❚ Pause';
            }).catch(e => showToast('Could not play audio preview', 'error'));
            activePreviewAudio.onended = () => testBtn.textContent = '▶ Preview';
          }
        });
      }

      // Remove music
      const removeBtn = container.querySelector('#snx-remove-music-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
          if (confirm('Remove assigned theme music from this product?')) {
            const oldUrl = activeEditorProduct.musicUrl;
            activeEditorProduct.musicUrl = null;
            activeEditorProduct.audio = null;
            activeEditorProduct.song = null;

            if (activePreviewAudio) {
              activePreviewAudio.pause();
              activePreviewAudio = null;
            }

            // Optionally remove from storage in background
            deleteProductMusic(oldUrl);

            currentMusicDisplay.innerHTML = `
              <div class="snx-music-status-empty">
                <span>⚪ No theme music assigned to this product yet.</span>
              </div>
            `;
            showToast('Product music removed.', 'info');
            uploadBtn.textContent = 'Upload Product Music';
          }
        });
      }
    }

    attachCurrentMusicButtons();

    // Form Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = container.querySelector('#snx-editor-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const updated = {
        ...activeEditorProduct,
        name: container.querySelector('#ed-name').value.trim(),
        category: container.querySelector('#ed-cat').value,
        price: Number(container.querySelector('#ed-price').value),
        originalPrice: container.querySelector('#ed-mrp').value ? Number(container.querySelector('#ed-mrp').value) : null,
        rating: Number(container.querySelector('#ed-rating').value),
        image: container.querySelector('#ed-image').value.trim(),
        thumbnail: container.querySelector('#ed-image').value.trim(),
        images: activeEditorProduct.images && activeEditorProduct.images.length > 0
          ? activeEditorProduct.images
          : [container.querySelector('#ed-image').value.trim()],
        shortDescription: container.querySelector('#ed-short-desc').value.trim(),
        description: container.querySelector('#ed-desc').value.trim()
      };

      try {
        await store.saveProduct(updated);
        showToast(`Product "${updated.name}" saved successfully!`, 'success');
        closeModal();
        if (typeof onSaved === 'function') onSaved();
      } catch (err) {
        showToast(`Failed to save: ${err.message}`, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Product Changes';
      }
    });
  }

  // Kick off initialization
  init();

  // Return router cleanup
  return () => {
    if (activePreviewAudio) {
      activePreviewAudio.pause();
      activePreviewAudio = null;
    }
  };
}
