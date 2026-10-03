/**
 * User Account Dashboard & Orders View
 */

import { store } from '../state/store.js';
import { formatPriceINR, renderProductCardHTML, attachCardEventListeners } from '../components/productCard.js';
import { showToast } from '../components/toast.js';
import { openQuickViewModal } from '../components/quickViewModal.js';

export function renderAccountPage(container, initialTab = 'orders') {
  let activeTab = initialTab; // 'orders', 'profile', 'addresses', 'payments', 'notifications', 'help'

  function render() {
    const user = store.user;
    const orders = store.getOrders();
    const wishlistProducts = store.getWishlistProducts();

    container.innerHTML = `
      <div class="snx-container snx-account-page">
        <div class="snx-account-layout">
          <!-- LEFT SIDEBAR -->
          <aside class="snx-account-nav-card">
            <div class="snx-account-user-banner">
              <div class="snx-user-avatar">${user.name.charAt(0)}</div>
              <div>
                <div class="snx-user-nav-name">${user.name}</div>
                <div class="snx-user-nav-sub">${user.phone}</div>
              </div>
            </div>

            <nav class="snx-account-nav-list" aria-label="Account Navigation">
              <button type="button" class="snx-account-nav-btn ${activeTab === 'orders' ? 'active' : ''}" data-acc-tab="orders">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>My Orders (${orders.length})</span>
              </button>

              <button type="button" class="snx-account-nav-btn ${activeTab === 'profile' ? 'active' : ''}" data-acc-tab="profile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Profile Information</span>
              </button>

              <button type="button" class="snx-account-nav-btn ${activeTab === 'addresses' ? 'active' : ''}" data-acc-tab="addresses">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Manage Addresses (${user.addresses.length})</span>
              </button>

              <button type="button" class="snx-account-nav-btn ${activeTab === 'payments' ? 'active' : ''}" data-acc-tab="payments">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                <span>Saved Payment Methods</span>
              </button>

              <button type="button" class="snx-account-nav-btn ${activeTab === 'help' ? 'active' : ''}" data-acc-tab="help">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                <span>Help & Customer Care</span>
              </button>

              <a href="#/wishlist" class="snx-account-nav-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span>My Wishlist (${wishlistProducts.length})</span>
              </a>

              <a href="#/seller" class="snx-account-nav-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>Seller Dashboard</span>
              </a>
            </nav>
          </aside>

          <!-- MAIN PANEL -->
          <div class="snx-account-content-card">
            ${renderMainPanel()}
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderMainPanel() {
    const user = store.user;
    const orders = store.getOrders();

    if (activeTab === 'orders') {
      return `
        <div class="snx-panel-title">
          <span>My Orders</span>
          <span style="font-size: 0.875rem; color: var(--snx-text-muted); font-weight: normal;">Showing ${orders.length} orders</span>
        </div>

        ${orders.length > 0 ? `
          <div class="snx-orders-list">
            ${orders.map(order => `
              <div class="snx-order-card">
                <div class="snx-order-header">
                  <div class="snx-order-id-group">
                    <span class="snx-order-id-text">Order #${order.id}</span>
                    <span class="snx-order-date">Placed on ${order.date}</span>
                  </div>
                  <span class="snx-order-status-badge ${order.status.toLowerCase()}">${order.status}</span>
                </div>

                ${order.items.map(it => `
                  <div class="snx-order-item-wrap">
                    <img src="${it.image}" alt="${it.title}" class="snx-order-item-img">
                    <div class="snx-order-item-info">
                      <div class="snx-order-item-title">${it.title}</div>
                      <div style="font-size: 0.8125rem; color: var(--snx-text-muted); margin-bottom: 4px;">
                        Quantity: ${it.quantity} • Payment: ${order.paymentMethod}
                      </div>
                      <div class="snx-order-item-price">${formatPriceINR(it.price * it.quantity)}</div>
                    </div>
                  </div>
                `).join('')}

                <!-- Visual Tracking Progress Timeline -->
                <div class="snx-tracking-timeline">
                  <div class="snx-timeline-title">Delivery Progress Timeline</div>
                  <div class="snx-timeline-steps">
                    ${order.timeline.map((st, idx) => `
                      <div class="snx-timeline-step ${st.completed ? 'completed' : ''}">
                        <div class="snx-timeline-node"></div>
                        <span class="snx-timeline-label">${st.status}</span>
                        <span class="snx-timeline-date">${st.date}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div class="snx-order-footer">
                  <div style="font-size: 0.8125rem; color: var(--snx-text-muted);">
                    Shipping Address: ${order.shippingAddress.name}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" onclick="window.print()">
                      Download Invoice
                    </button>
                    <button type="button" class="snx-btn snx-btn-primary snx-btn-sm" onclick="alert('Our logistics partner has received your order details. Tracking number: BLUEDART-749219')">
                      Track Package
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 48px;">
            <p style="color: var(--snx-text-muted); margin-bottom: 16px;">You haven't placed any orders yet.</p>
            <a href="#/catalog" class="snx-btn snx-btn-primary">Start Shopping</a>
          </div>
        `}
      `;
    }

    if (activeTab === 'profile') {
      return `
        <div class="snx-panel-title">
          <span>Personal Information</span>
        </div>

        <form id="snx-profile-form" style="max-width: 520px;">
          <div class="snx-form-group">
            <label class="snx-form-label" for="prof-name">Full Name</label>
            <input type="text" id="prof-name" class="snx-form-input" value="${user.name}" required>
          </div>

          <div class="snx-form-group">
            <label class="snx-form-label" for="prof-email">Email Address</label>
            <input type="email" id="prof-email" class="snx-form-input" value="${user.email}" required>
          </div>

          <div class="snx-form-group">
            <label class="snx-form-label" for="prof-phone">Mobile Number</label>
            <input type="tel" id="prof-phone" class="snx-form-input" value="${user.phone}" required>
          </div>

          <div class="snx-form-group">
            <label class="snx-form-label">Gender</label>
            <div style="display: flex; gap: 20px; margin-top: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.875rem;">
                <input type="radio" name="gender" value="Male" ${user.gender === 'Male' ? 'checked' : ''}> Male
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.875rem;">
                <input type="radio" name="gender" value="Female" ${user.gender === 'Female' ? 'checked' : ''}> Female
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.875rem;">
                <input type="radio" name="gender" value="Other" ${user.gender === 'Other' ? 'checked' : ''}> Other
              </label>
            </div>
          </div>

          <button type="submit" class="snx-btn snx-btn-primary" style="margin-top: 16px;">
            Save Profile Changes
          </button>
        </form>
      `;
    }

    if (activeTab === 'addresses') {
      return `
        <div class="snx-panel-title">
          <span>Manage Addresses</span>
          <button type="button" class="snx-btn snx-btn-primary snx-btn-sm" id="snx-add-addr-btn">
            + Add New Address
          </button>
        </div>

        <div class="snx-addresses-container">
          ${user.addresses.map(addr => `
            <div class="snx-addr-card ${addr.isDefault ? 'default' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 700; font-size: 0.9375rem;">${addr.name}</span>
                <span class="snx-badge ${addr.isDefault ? 'snx-badge-deal' : ''}">${addr.type} ${addr.isDefault ? '• DEFAULT' : ''}</span>
              </div>
              <div style="font-size: 0.875rem; color: var(--snx-text-body); margin-bottom: 4px;">
                ${addr.address}, ${addr.locality}
              </div>
              <div style="font-size: 0.875rem; color: var(--snx-text-body); margin-bottom: 6px;">
                ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
              </div>
              <div style="font-size: 0.8125rem; color: var(--snx-text-muted);">
                Phone: ${addr.phone}
              </div>

              <div class="snx-addr-actions">
                ${!addr.isDefault ? `<button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-set-default="${addr.id}">Make Default</button>` : ''}
                <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" data-delete-addr="${addr.id}" style="color: var(--snx-accent);">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (activeTab === 'payments') {
      return `
        <div class="snx-panel-title">
          <span>Saved Payment Methods</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 520px;">
          <div style="border: 1px solid var(--snx-border); padding: 16px; border-radius: var(--snx-radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; font-size: 0.9375rem;">Google Pay UPI</div>
              <div style="font-size: 0.8125rem; color: var(--snx-text-muted);">soham@okaxis • Primary</div>
            </div>
            <span class="snx-badge snx-badge-discount">Verified</span>
          </div>

          <div style="border: 1px solid var(--snx-border); padding: 16px; border-radius: var(--snx-radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; font-size: 0.9375rem;">HDFC Bank Millennia Credit Card</div>
              <div style="font-size: 0.8125rem; color: var(--snx-text-muted);">•••• •••• •••• 4892 (Expires 08/29)</div>
            </div>
            <span class="snx-badge snx-badge-trending">Active</span>
          </div>
        </div>
      `;
    }

    if (activeTab === 'help') {
      return `
        <div class="snx-panel-title">
          <span>Help & Customer Support</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <details style="border: 1px solid var(--snx-border); padding: 14px; border-radius: var(--snx-radius-sm); cursor: pointer;">
            <summary style="font-weight: 700; color: var(--snx-text-main);">How do I track my SHOPNEX shipment?</summary>
            <p style="margin-top: 8px; font-size: 0.875rem; color: var(--snx-text-body);">
              Navigate to "My Orders" tab and select your order to view live milestone tracking. SMS updates are also sent to your registered mobile number.
            </p>
          </details>

          <details style="border: 1px solid var(--snx-border); padding: 14px; border-radius: var(--snx-radius-sm); cursor: pointer;">
            <summary style="font-weight: 700; color: var(--snx-text-main);">What is the SHOPNEX 7-Day Replacement Policy?</summary>
            <p style="margin-top: 8px; font-size: 0.875rem; color: var(--snx-text-body);">
              All items marked "Shopnex Assured" can be returned or replaced within 7 days of delivery for defective or damaged goods with zero hassle.
            </p>
          </details>

          <details style="border: 1px solid var(--snx-border); padding: 14px; border-radius: var(--snx-radius-sm); cursor: pointer;">
            <summary style="font-weight: 700; color: var(--snx-text-main);">Which payment methods are eligible for No-Cost EMI?</summary>
            <p style="margin-top: 8px; font-size: 0.875rem; color: var(--snx-text-body);">
              No-Cost EMI is supported on HDFC, ICICI, SBI, Axis, and Kotak credit cards for orders above ₹3,000.
            </p>
          </details>

          <div style="margin-top: 24px; padding: 20px; background: var(--snx-primary-subtle); border-radius: var(--snx-radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h4 style="font-size: 1rem; color: var(--snx-primary); font-weight: 700;">Need immediate assistance?</h4>
              <p style="font-size: 0.8125rem; color: var(--snx-text-muted);">Our customer care executive is available 24x7</p>
            </div>
            <button type="button" class="snx-btn snx-btn-primary" onclick="alert('Connecting to SHOPNEX 24x7 Support Executive Soham Dutta... Toll Free: 1800-420-7467')">
              Call Support: 1800-420-SHOP
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  function attachEvents() {
    // Nav tabs click
    const navBtns = container.querySelectorAll('[data-acc-tab]');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.accTab;
        render();
      });
    });

    // Profile form submit
    const profForm = container.querySelector('#snx-profile-form');
    if (profForm) {
      profForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#prof-name').value;
        const email = container.querySelector('#prof-email').value;
        const phone = container.querySelector('#prof-phone').value;
        const gender = container.querySelector('input[name="gender"]:checked')?.value || 'Male';

        store.updateUserProfile({ name, email, phone, gender });
        showToast('Profile updated successfully!', 'success');
      });
    }

    // Add Address prompt
    const addAddrBtn = container.querySelector('#snx-add-addr-btn');
    if (addAddrBtn) {
      addAddrBtn.addEventListener('click', () => {
        const city = prompt("Enter City (e.g. Mumbai, Delhi, Kolkata, Bengaluru):", "Bengaluru");
        if (city) {
          const pincode = prompt("Enter 6-digit Pincode:", "560001");
          const address = prompt("Enter Flat/House/Street Address:", "Flat 101, Palm Meadows");
          store.addAddress({
            name: store.user.name,
            phone: store.user.phone,
            pincode: pincode || "560001",
            locality: "Central Suburb",
            address: address || "Flat 101, Palm Meadows",
            city: city,
            state: "Karnataka",
            landmark: "Main Road",
            type: "Home"
          });
          showToast('New address saved!', 'success');
          render();
        }
      });
    }

    // Set Default Address
    const setDefBtns = container.querySelectorAll('[data-set-default]');
    setDefBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.setDefault;
        store.user.addresses.forEach(a => a.isDefault = (a.id === id));
        store.saveToStorage('shopnex_user_v1', store.user);
        showToast('Default address updated', 'info');
        render();
      });
    });

    // Delete Address
    const delBtns = container.querySelectorAll('[data-delete-addr]');
    delBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteAddr;
        store.deleteAddress(id);
        showToast('Address removed', 'info');
        render();
      });
    });
  }

  render();
}
