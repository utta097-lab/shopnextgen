/**
 * Custom Showcase Product Management Hub & Dashboard
 * Includes full Audio/Song upload, deduplication, and media connection
 */

import { store } from '../state/store.js';
import { CUSTOM_CATEGORIES } from '../data/categories.js';
import { formatPriceINR } from '../components/productCard.js';
import { showToast } from '../components/toast.js';
import { mediaStorage } from '../state/mediaStorage.js';

let addProductModalBackdrop = null;

export function renderSellerPage(container) {
  let preselectedPersonId = null;

  function render() {
    const allProds = store.getAllProducts();
    const customSellerProds = store.sellerProducts;

    container.innerHTML = `
      <div class="snx-container snx-seller-page">
        <!-- Breadcrumb -->
        <nav class="snx-breadcrumb">
          <a href="#/">Home</a>
          <span>/</span>
          <span class="current">Showcase Manager</span>
        </nav>

        <div class="snx-seller-header">
          <div>
            <h1 class="snx-seller-title">Product & Content Manager</h1>
            <p class="snx-seller-subtitle">Upload media files, connect songs/audios, and manage showcase products.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/admin/products" class="snx-btn snx-btn-secondary snx-btn-lg" style="color: #6366f1; border-color: #c7d2fe;">
              🔒 Real Admin Editor
            </a>
            <button type="button" class="snx-btn snx-btn-primary snx-btn-lg" id="snx-open-add-prod-btn">
              + Add New Custom Product
            </button>
          </div>
        </div>

        <!-- 3 Metric Cards -->
        <div class="snx-metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="snx-metric-card">
            <div class="snx-metric-icon prods">🏷️</div>
            <div>
              <div class="snx-metric-val">${allProds.length}</div>
              <div class="snx-metric-label">Total Showcase Products</div>
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
            <div class="snx-metric-icon rating">⭐</div>
            <div>
              <div class="snx-metric-val">0.1 - 5.0</div>
              <div class="snx-metric-label">Custom Rating Support</div>
            </div>
          </div>
        </div>

        <!-- SONG / AUDIO UPLOADER & CONNECTOR CARD -->
        <section class="snx-audio-uploader-card" id="snx-audio-manager-card" aria-label="Audio Manager">
          <div class="snx-audio-card-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="snx-audio-card-badge">♫ Song / Audio Upload Option</span>
                <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e1b4b; margin: 0;">Upload & Connect Audio to Person</h2>
              </div>
              <p style="font-size: 0.875rem; color: var(--snx-text-muted); margin-top: 4px;">
                Upload an audio file to connect it directly to an existing person without creating duplicates.
              </p>
            </div>
            <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
              <span style="font-size: 0.75rem; color: var(--snx-text-muted); font-weight: 600;">Supported Formats:</span>
              <span class="snx-format-pill">MP3</span>
              <span class="snx-format-pill">WAV</span>
              <span class="snx-format-pill">M4A</span>
              <span class="snx-format-pill">OGG</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
            <div>
              <div class="snx-form-group">
                <label class="snx-form-label" for="snx-quick-audio-person">
                  <strong>1. Target Person / Product *</strong>
                </label>
                <select id="snx-quick-audio-person" class="snx-form-input" style="padding: 10px; font-weight: 600;">
                  <option value="">-- Select Person (or upload file to auto-match) --</option>
                  ${allProds.map(p => `
                    <option value="${p.id}" ${preselectedPersonId === p.id ? 'selected' : ''}>
                      ${p.name} — [${p.category}] ${p.audio || p.song ? '(Has song ♫)' : '(No song yet)'}
                    </option>
                  `).join('')}
                </select>
                <div style="font-size: 0.75rem; color: var(--snx-text-muted); margin-top: 4px;">
                  Automatic matching clues: Exact Name, Category, or Filename (e.g. <code>Malay_song.mp3</code>).
                </div>
              </div>

              <!-- Auto-match Notification Banner -->
              <div id="snx-audio-match-banner" style="display: none; padding: 10px 14px; background: #ede9fe; color: #5b21b6; border-radius: var(--snx-radius-sm); font-size: 0.8125rem; font-weight: 700; margin-bottom: 14px; border: 1px solid #c4b5fd;">
              </div>

              <div class="snx-form-group">
                <label class="snx-form-label" for="snx-quick-audio-path">
                  Or Enter Audio File Path / URL
                </label>
                <input type="text" id="snx-quick-audio-path" class="snx-form-input" placeholder="e.g. products/malay/song.mp3 or https://...">
              </div>
            </div>

            <div>
              <div class="snx-form-group">
                <label class="snx-form-label" for="snx-quick-audio-file">
                  <strong>2. Select Audio File to Upload *</strong>
                  <span style="font-size: 0.75rem; color: #4338ca; font-weight: normal;">(MP3, WAV, M4A, OGG)</span>
                </label>
                <input type="file" id="snx-quick-audio-file" accept=".mp3,.wav,.m4a,.ogg,audio/*" class="snx-form-input" style="padding: 8px; background: #ffffff; cursor: pointer;">
                <div style="font-size: 0.75rem; color: var(--snx-text-muted); margin-top: 4px;">
                  Direct binary upload with persistent storage.
                </div>
              </div>

              <!-- Audio Preview Player -->
              <div id="snx-audio-preview-wrap" style="display: none; background: #0f172a; padding: 14px; border-radius: var(--snx-radius-sm); margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 0.75rem; font-weight: 700; color: #a5b4fc;" id="snx-audio-preview-name">Audio Preview</span>
                  <span style="font-size: 0.6875rem; color: #94a3b8;" id="snx-audio-preview-size"></span>
                </div>
                <audio id="snx-quick-audio-preview" controls style="width: 100%; height: 38px;"></audio>
              </div>

              <div style="margin-top: 16px;">
                <button type="button" class="snx-btn snx-btn-primary" id="snx-btn-connect-audio" style="width: 100%; background: #4f46e5; padding: 10px 16px; font-weight: 700;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  Save & Connect Song to Person
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Product Inventory Management Table -->
        <div class="snx-inventory-card">
          <div class="snx-card-header-actions">
            <div>
              <h3 style="font-size: 1.125rem; font-weight: 700;">Showcase Inventory</h3>
              <p style="font-size: 0.8125rem; color: var(--snx-text-muted);">All active products currently listed across your custom categories</p>
            </div>
            <div>
              <input type="text" id="snx-inventory-search" placeholder="Search by name or category..." class="snx-form-input" style="padding: 6px 12px; font-size: 0.8125rem; width: 240px;">
            </div>
          </div>

          <div class="snx-table-responsive">
            <table class="snx-seller-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Media</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="snx-inventory-tbody">
                ${allProds.map(p => {
                  const isCustom = customSellerProds.some(cp => cp.id === p.id);
                  const hasVideo = !!p.video;
                  const hasAudio = !!(p.audio || p.song);
                  const thumb = p.thumbnail || p.image || (p.images && p.images[0]) || '';

                  return `
                    <tr data-prod-id="${p.id}">
                      <td>
                        <div class="snx-prod-cell">
                          ${thumb ? `<img src="${thumb}" alt="${p.name}" class="snx-prod-thumb">` : `<div class="snx-prod-thumb snx-prod-thumb-empty">${(p.name || 'P').charAt(0).toUpperCase()}</div>`}
                          <div>
                            <div class="snx-prod-name">${p.name}</div>
                            <span style="font-size: 0.6875rem; color: var(--snx-text-muted);">ID: ${p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style="font-size: 0.8125rem; font-weight: 600;">${p.category}</span>
                      </td>
                      <td><strong>${p.price ? formatPriceINR(p.price) : '—'}</strong></td>
                      <td>
                        <span class="snx-rating-pill" style="font-size: 0.75rem;">★ ${p.rating}</span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 4px; font-size: 0.6875rem; flex-wrap: wrap;">
                          <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">📷 ${p.images && p.images.length > 0 ? p.images.length : (thumb ? 1 : 0)}</span>
                          ${hasVideo ? `<span style="background: #f0fdf4; color: #15803d; padding: 2px 6px; border-radius: 4px;">▶ Video</span>` : ''}
                          ${hasAudio ? `<span style="background: #faf5ff; color: #7e22ce; padding: 2px 6px; border-radius: 4px; font-weight: 700;">♫ Song</span>` : '<span style="background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px;">No Audio</span>'}
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          <a href="#/product/${p.id}" class="snx-btn snx-btn-secondary snx-btn-sm" title="View in Showcase">
                            View
                          </a>
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-select-person-song="${p.id}" style="color: #4f46e5; border-color: #c7d2fe;" title="Upload or connect audio for ${p.name}">
                            ♫ Song
                          </button>
                          ${isCustom ? `
                            <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-delete-custom="${p.id}" style="color: var(--snx-accent);">
                              Delete
                            </button>
                          ` : ''}
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
    `;

    attachEvents();
  }

  function attachEvents() {
    const addBtn = container.querySelector('#snx-open-add-prod-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openAddProductModal(() => render());
      });
    }

    // Audio upload state in card
    const audioFileInput = container.querySelector('#snx-quick-audio-file');
    const personSelect = container.querySelector('#snx-quick-audio-person');
    const audioPathInput = container.querySelector('#snx-quick-audio-path');
    const previewWrap = container.querySelector('#snx-audio-preview-wrap');
    const previewEl = container.querySelector('#snx-quick-audio-preview');
    const previewName = container.querySelector('#snx-audio-preview-name');
    const previewSize = container.querySelector('#snx-audio-preview-size');
    const matchBanner = container.querySelector('#snx-audio-match-banner');
    const connectBtn = container.querySelector('#snx-btn-connect-audio');

    let currentSelectedAudioFile = null;

    if (audioFileInput) {
      audioFileInput.addEventListener('change', () => {
        const file = audioFileInput.files[0];
        if (!file) return;

        // Verify format
        const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg'];
        const lowerName = file.name.toLowerCase();
        const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext)) || file.type.startsWith('audio/');

        if (!hasValidExt) {
          showToast('Please select a supported audio file (MP3, WAV, M4A, OGG)', 'warning');
          audioFileInput.value = '';
          return;
        }

        currentSelectedAudioFile = file;

        // Auto-match person from filename if not manually chosen
        const matched = store.findProductByMatch({ filename: file.name });
        if (matched) {
          personSelect.value = matched.id;
          if (matchBanner) {
            matchBanner.style.display = 'block';
            matchBanner.textContent = `✓ Auto-matched to: ${matched.name} (${matched.category}) from filename "${file.name}"`;
          }
        }

        // Preview player
        if (previewWrap && previewEl) {
          const objUrl = URL.createObjectURL(file);
          previewEl.src = objUrl;
          if (previewName) previewName.textContent = file.name;
          if (previewSize) previewSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
          previewWrap.style.display = 'block';
        }
      });
    }

    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        const personId = personSelect.value;
        const manualPath = audioPathInput.value.trim();

        let targetPerson = null;
        if (personId) {
          targetPerson = store.getProductById(personId);
        } else if (currentSelectedAudioFile) {
          targetPerson = store.findProductByMatch({ filename: currentSelectedAudioFile.name });
        }

        if (!targetPerson) {
          showToast('Please select or match an existing person first', 'error');
          personSelect.focus();
          return;
        }

        if (!currentSelectedAudioFile && !manualPath) {
          showToast('Please choose an audio file or enter a file path', 'warning');
          return;
        }

        connectBtn.disabled = true;
        connectBtn.textContent = 'Saving audio...';

        try {
          let audioSource = manualPath;

          if (currentSelectedAudioFile) {
            const key = `audio_${targetPerson.id}`;
            audioSource = await mediaStorage.saveFile(key, currentSelectedAudioFile, {
              name: currentSelectedAudioFile.name,
              type: currentSelectedAudioFile.type
            });
          }

          // Update existing product without creating duplicate
          store.attachAudioToProduct({
            personId: targetPerson.id,
            audioSource
          });

          showToast(`Song connected to ${targetPerson.name} (${targetPerson.category})!`, 'success');
          preselectedPersonId = targetPerson.id;
          render();
        } catch (err) {
          console.error('Audio save error:', err);
          showToast('Failed to save audio: ' + err.message, 'error');
        } finally {
          connectBtn.disabled = false;
          connectBtn.textContent = 'Save & Connect Song to Person';
        }
      });
    }

    // Attach song button per table row
    const songBtns = container.querySelectorAll('[data-select-person-song]');
    songBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.selectPersonSong;
        preselectedPersonId = id;
        if (personSelect) personSelect.value = id;
        const uploaderCard = container.querySelector('#snx-audio-manager-card');
        if (uploaderCard) {
          uploaderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          uploaderCard.style.outline = '3px solid #6366f1';
          setTimeout(() => { uploaderCard.style.outline = 'none'; }, 2000);
        }
      });
    });

    const delBtns = container.querySelectorAll('[data-delete-custom]');
    delBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteCustom;
        if (confirm("Remove this product from the custom showcase?")) {
          store.deleteSellerProduct(id);
          showToast('Product removed', 'info');
          render();
        }
      });
    });

    const searchIn = container.querySelector('#snx-inventory-search');
    const tbody = container.querySelector('#snx-inventory-tbody');
    if (searchIn && tbody) {
      searchIn.addEventListener('input', () => {
        const q = searchIn.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(r => {
          const text = r.textContent.toLowerCase();
          r.style.display = text.includes(q) ? '' : 'none';
        });
      });
    }
  }

  render();
}

/**
 * Modal for creating or updating a custom product listing
 * Fully displays IMAGE, VIDEO, and SONG / AUDIO upload options side-by-side
 */
function openAddProductModal(onSuccess) {
  if (!addProductModalBackdrop) {
    addProductModalBackdrop = document.createElement('div');
    addProductModalBackdrop.className = 'snx-modal-backdrop';
    document.body.appendChild(addProductModalBackdrop);
  }

  addProductModalBackdrop.innerHTML = `
    <div class="snx-modal-container wide" role="dialog" aria-modal="true">
      <div class="snx-modal-header">
        <span class="snx-modal-title">Product / Person Content Manager</span>
        <button type="button" class="snx-modal-close-btn" id="snx-add-prod-close" aria-label="Close modal">✕</button>
      </div>

      <div class="snx-modal-body">
        <form id="snx-add-product-form">
          <div class="snx-form-group">
            <label class="snx-form-label" for="new-prod-name">Product / Person Name *</label>
            <input type="text" id="new-prod-name" class="snx-form-input" placeholder="e.g. Rahul, Malay, Supe" required>
            <div style="font-size: 0.75rem; color: var(--snx-text-muted); margin-top: 2px;">
              If this name already exists, the entry will be updated rather than duplicated.
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="snx-form-group">
              <label class="snx-form-label" for="new-prod-cat">Designated Category *</label>
              <select id="new-prod-cat" class="snx-form-input" style="padding: 10px;" required>
                ${CUSTOM_CATEGORIES.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="snx-form-group">
              <label class="snx-form-label" for="new-prod-rating">Rating (0.1 to 100+) *</label>
              <input type="number" id="new-prod-rating" class="snx-form-input" placeholder="0.1" step="0.1" min="0.1" max="1000" value="5.0" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="snx-form-group">
              <label class="snx-form-label" for="new-prod-price">Price (₹) (Optional)</label>
              <input type="number" id="new-prod-price" class="snx-form-input" placeholder="Optional price" step="0.00001">
            </div>

            <div class="snx-form-group">
              <label class="snx-form-label" for="new-prod-mrp">Original MRP (₹) (Optional)</label>
              <input type="number" id="new-prod-mrp" class="snx-form-input" placeholder="Optional MRP" step="0.00001">
            </div>
          </div>

          <!-- MEDIA UPLOAD OPTIONS SECTION: IMAGE, VIDEO, SONG/AUDIO -->
          <div class="snx-media-options-box">
            <div style="font-weight: 800; font-size: 0.9375rem; margin-bottom: 12px; color: var(--snx-text-main);">
              Media Upload Options (Image, Video & Song/Audio)
            </div>

            <!-- 1. IMAGE OPTION -->
            <div class="snx-media-option-item">
              <label class="snx-form-label" for="new-prod-img-file">
                <strong>1. IMAGE OPTION</strong>
                <span style="font-size: 0.75rem; color: var(--snx-text-muted); font-weight: normal;">(Upload or Path)</span>
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <input type="file" id="new-prod-img-file" accept="image/*" class="snx-form-input" style="padding: 6px;">
                <input type="text" id="new-prod-img" class="snx-form-input" placeholder="Or enter image path / URL">
              </div>
            </div>

            <!-- 2. VIDEO OPTION -->
            <div class="snx-media-option-item">
              <label class="snx-form-label" for="new-prod-video-file">
                <strong>2. VIDEO OPTION</strong>
                <span style="font-size: 0.75rem; color: var(--snx-text-muted); font-weight: normal;">(Upload or Path)</span>
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <input type="file" id="new-prod-video-file" accept="video/mp4,video/*" class="snx-form-input" style="padding: 6px;">
                <input type="text" id="new-prod-video" class="snx-form-input" placeholder="Or enter video path / URL">
              </div>
            </div>

            <!-- 3. SONG / AUDIO OPTION -->
            <div class="snx-media-option-item">
              <label class="snx-form-label" for="new-prod-audio-file">
                <strong>3. SONG / AUDIO OPTION</strong>
                <span class="snx-format-pill">MP3</span><span class="snx-format-pill">WAV</span><span class="snx-format-pill">M4A</span><span class="snx-format-pill">OGG</span>
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <input type="file" id="new-prod-audio-file" accept=".mp3,.wav,.m4a,.ogg,audio/*" class="snx-form-input" style="padding: 6px;">
                <input type="text" id="new-prod-audio" class="snx-form-input" placeholder="Or enter audio path / URL (e.g. products/malay/song.mp3)">
              </div>
              <div id="modal-audio-preview-wrap" style="display: none; margin-top: 8px; background: #0f172a; padding: 10px; border-radius: var(--snx-radius-sm);">
                <div style="font-size: 0.75rem; color: #a5b4fc; margin-bottom: 4px;">Audio Preview:</div>
                <audio id="modal-audio-preview" controls style="width: 100%; height: 32px;"></audio>
              </div>
            </div>
          </div>

          <div class="snx-form-group">
            <label class="snx-form-label" for="new-prod-desc">Product / Person Description</label>
            <textarea id="new-prod-desc" class="snx-form-input" rows="3" placeholder="Enter exact description..."></textarea>
          </div>

          <div class="snx-form-group">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.875rem; cursor: pointer;">
              <input type="checkbox" id="new-prod-featured" style="width: 16px; height: 16px; accent-color: var(--snx-primary-light);">
              <span>Feature on Hero Showcase</span>
            </label>
          </div>

          <div class="snx-modal-footer" style="padding: 16px 0 0; background: none;">
            <button type="button" class="snx-btn snx-btn-secondary" id="snx-add-prod-cancel">Cancel</button>
            <button type="submit" class="snx-btn snx-btn-primary" id="snx-add-prod-submit">Save Product / Content</button>
          </div>
        </form>
      </div>
    </div>
  `;

  addProductModalBackdrop.classList.add('open');

  const closeBtn = document.getElementById('snx-add-prod-close');
  const cancelBtn = document.getElementById('snx-add-prod-cancel');
  const form = document.getElementById('snx-add-product-form');
  const submitBtn = document.getElementById('snx-add-prod-submit');

  const audioFileInput = document.getElementById('new-prod-audio-file');
  const audioPathInput = document.getElementById('new-prod-audio');
  const audioPreviewWrap = document.getElementById('modal-audio-preview-wrap');
  const audioPreviewEl = document.getElementById('modal-audio-preview');

  let modalSelectedAudioFile = null;

  if (audioFileInput) {
    audioFileInput.addEventListener('change', () => {
      const file = audioFileInput.files[0];
      if (!file) return;

      const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg'];
      const lowerName = file.name.toLowerCase();
      const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext)) || file.type.startsWith('audio/');

      if (!hasValidExt) {
        showToast('Please select a supported audio file (MP3, WAV, M4A, OGG)', 'warning');
        audioFileInput.value = '';
        return;
      }

      modalSelectedAudioFile = file;
      if (audioPreviewWrap && audioPreviewEl) {
        audioPreviewEl.src = URL.createObjectURL(file);
        audioPreviewWrap.style.display = 'block';
      }
    });
  }

  function closeModal() {
    addProductModalBackdrop.classList.remove('open');
  }

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value.trim();
    const category = document.getElementById('new-prod-cat').value;
    const rating = parseFloat(document.getElementById('new-prod-rating').value);
    const priceRaw = document.getElementById('new-prod-price').value;
    const price = priceRaw ? parseFloat(priceRaw) : null;
    const mrpRaw = document.getElementById('new-prod-mrp').value;
    const originalPrice = mrpRaw ? parseFloat(mrpRaw) : null;

    const imgFileInput = document.getElementById('new-prod-img-file');
    const imagePath = document.getElementById('new-prod-img').value.trim();
    let imageUrl = imagePath;
    if (imgFileInput && imgFileInput.files[0]) {
      imageUrl = URL.createObjectURL(imgFileInput.files[0]);
    }

    const videoFileInput = document.getElementById('new-prod-video-file');
    const videoPath = document.getElementById('new-prod-video').value.trim();
    let videoUrl = videoPath || null;
    if (videoFileInput && videoFileInput.files[0]) {
      videoUrl = URL.createObjectURL(videoFileInput.files[0]);
    }

    let audioUrl = audioPathInput.value.trim() || null;
    if (modalSelectedAudioFile) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Media...';
      const cleanKey = `audio_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      audioUrl = await mediaStorage.saveFile(cleanKey, modalSelectedAudioFile, {
        name: modalSelectedAudioFile.name,
        type: modalSelectedAudioFile.type
      });
    }

    const description = document.getElementById('new-prod-desc').value.trim();
    const featured = document.getElementById('new-prod-featured').checked;

    const savedProduct = store.addSellerProduct({
      name,
      category,
      rating,
      price,
      originalPrice,
      image: imageUrl,
      images: imageUrl ? [imageUrl] : [],
      thumbnail: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      song: audioUrl,
      description,
      shortDescription: description,
      featured,
      badge: featured ? "FEATURED" : category
    });

    closeModal();
    showToast(`"${name}" saved successfully!`, 'success');
    if (typeof onSuccess === 'function') onSuccess(savedProduct);
  });
}
