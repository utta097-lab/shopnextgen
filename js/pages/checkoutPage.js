/**
 * Multi-Step Checkout & Order Success Page View
 */

import { store } from '../state/store.js';
import { formatPriceINR } from '../components/productCard.js';
import { showToast } from '../components/toast.js';

export function renderCheckoutPage(container) {
  let activeStep = 1; // 1: Delivery Address, 2: Order Summary, 3: Payment, 4: Success
  let selectedAddressId = store.user.addresses[0]?.id || 'addr-1';
  let selectedPaymentMethod = 'UPI (Google Pay)';
  let placedOrder = null;

  function render() {
    const cartItems = store.getCartItems().filter(i => !i.savedForLater);
    const summary = store.getCartSummary();
    const user = store.user;

    // Check if cart is empty and no order just placed
    if (cartItems.length === 0 && activeStep !== 4) {
      container.innerHTML = `
        <div class="snx-container snx-checkout-page" style="text-align: center; padding: 60px 20px;">
          <h2>Your checkout cart is empty</h2>
          <p style="color: var(--snx-text-muted); margin: 12px 0 24px;">Add items to your cart before proceeding to checkout.</p>
          <a href="#/catalog" class="snx-btn snx-btn-primary">Explore Products</a>
        </div>
      `;
      return;
    }

    if (activeStep === 4 && placedOrder) {
      // Order Success Page
      container.innerHTML = `
        <div class="snx-container snx-checkout-page">
          <div class="snx-order-success-view">
            <div class="snx-success-check-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <h1 class="snx-success-title">Order Placed Successfully!</h1>
            <p class="snx-success-sub">Thank you for shopping with SHOPNEX. Confirmation email & SMS have been sent.</p>

            <div class="snx-order-receipt-box">
              <div class="snx-receipt-row">
                <span>Order Reference ID:</span>
                <strong>${placedOrder.id}</strong>
              </div>
              <div class="snx-receipt-row">
                <span>Order Date:</span>
                <span>${placedOrder.date}</span>
              </div>
              <div class="snx-receipt-row">
                <span>Payment Mode:</span>
                <span>${placedOrder.paymentMethod}</span>
              </div>
              <div class="snx-receipt-row">
                <span>Delivering To:</span>
                <span>${placedOrder.shippingAddress.name} (${placedOrder.shippingAddress.pincode})</span>
              </div>
              <div class="snx-receipt-row" style="border-top: 1px dashed var(--snx-border-strong); margin-top: 8px; padding-top: 8px;">
                <span>Total Amount Paid:</span>
                <strong style="font-size: 1.125rem; color: var(--snx-primary-light);">${formatPriceINR(placedOrder.totalAmount)}</strong>
              </div>
            </div>

            <!-- Ordered Items Preview -->
            <div style="text-align: left; margin-bottom: 24px;">
              <h4 style="font-size: 0.9375rem; margin-bottom: 12px;">Items in this Shipment:</h4>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${placedOrder.items.map(it => `
                  <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f8fafc; border-radius: var(--snx-radius-sm);">
                    <img src="${it.image}" alt="${it.title}" style="width: 44px; height: 44px; object-fit: contain;">
                    <div style="flex: 1; font-size: 0.875rem;">
                      <div style="font-weight: 600;">${it.title}</div>
                      <div style="color: var(--snx-text-muted);">Qty: ${it.quantity} • ${formatPriceINR(it.price * it.quantity)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="snx-success-actions">
              <a href="#/account?tab=orders" class="snx-btn snx-btn-primary snx-btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
                Track Order Status
              </a>
              <button type="button" class="snx-btn snx-btn-secondary snx-btn-lg" id="snx-print-invoice">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                Print / Download Invoice
              </button>
              <a href="#/" class="snx-btn snx-btn-secondary snx-btn-lg">
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      `;

      const printBtn = container.querySelector('#snx-print-invoice');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          window.print();
        });
      }
      return;
    }

    // Step 1 to 3 View
    container.innerHTML = `
      <div class="snx-container snx-checkout-page">
        <!-- 3-Step Progress Wizard -->
        <div class="snx-checkout-stepper">
          <div class="snx-step-item ${activeStep === 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}">
            <span class="snx-step-number">${activeStep > 1 ? '✓' : '1'}</span>
            <span>Delivery Address</span>
          </div>
          <div class="snx-step-item ${activeStep === 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}">
            <span class="snx-step-number">${activeStep > 2 ? '✓' : '2'}</span>
            <span>Order Summary</span>
          </div>
          <div class="snx-step-item ${activeStep === 3 ? 'active' : ''}">
            <span class="snx-step-number">3</span>
            <span>Payment Options</span>
          </div>
        </div>

        <div class="snx-checkout-layout">
          <!-- LEFT: Step Accordions / Cards -->
          <div class="snx-checkout-steps-container">

            <!-- STEP 1: DELIVERY ADDRESS -->
            <div class="snx-checkout-card">
              <div class="snx-checkout-card-header">
                <span class="snx-checkout-card-title">
                  <span class="snx-step-number" style="width: 22px; height: 22px; font-size: 0.75rem;">1</span>
                  Delivery Address
                </span>
                ${activeStep > 1 ? `<button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" id="snx-step1-change">Change</button>` : ''}
              </div>

              ${activeStep === 1 ? `
                <div class="snx-checkout-card-body">
                  <div class="snx-addresses-grid">
                    ${user.addresses.map(addr => `
                      <label class="snx-address-card-choice ${selectedAddressId === addr.id ? 'selected' : ''}">
                        <input type="radio" name="checkout-addr" value="${addr.id}" ${selectedAddressId === addr.id ? 'checked' : ''}>
                        <div class="snx-address-text-group">
                          <div class="snx-address-header-line">
                            <span class="snx-address-user-name">${addr.name}</span>
                            <span class="snx-address-type-tag">${addr.type}</span>
                            <span style="font-size: 0.8125rem; font-weight: 700;">${addr.phone}</span>
                          </div>
                          <div class="snx-address-body-text">
                            ${addr.address}, ${addr.locality}, ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
                          </div>
                          ${selectedAddressId === addr.id ? `
                            <button type="button" class="snx-btn snx-deliver-here-btn" id="snx-step1-confirm">
                              DELIVER HERE
                            </button>
                          ` : ''}
                        </div>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : `
                <div style="padding: 12px 20px; font-size: 0.875rem; color: var(--snx-text-body);">
                  Delivering to: <strong>${user.addresses.find(a => a.id === selectedAddressId)?.name}</strong>, ${user.addresses.find(a => a.id === selectedAddressId)?.address}, ${user.addresses.find(a => a.id === selectedAddressId)?.pincode}
                </div>
              `}
            </div>

            <!-- STEP 2: ORDER SUMMARY -->
            <div class="snx-checkout-card">
              <div class="snx-checkout-card-header">
                <span class="snx-checkout-card-title">
                  <span class="snx-step-number" style="width: 22px; height: 22px; font-size: 0.75rem;">2</span>
                  Order Summary (${cartItems.length} items)
                </span>
                ${activeStep > 2 ? `<button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" id="snx-step2-change">Change</button>` : ''}
              </div>

              ${activeStep === 2 ? `
                <div class="snx-checkout-card-body">
                  ${cartItems.map(item => `
                    <div class="snx-summary-item-row">
                      <img src="${item.product.images[0]}" alt="${item.product.name}" class="snx-summary-item-thumb">
                      <div class="snx-summary-item-info">
                        <div class="snx-summary-item-title">${item.product.name}</div>
                        <div class="snx-summary-item-qty">Quantity: ${item.quantity} • Delivery in 24 Hours</div>
                      </div>
                      <div class="snx-summary-item-price">${formatPriceINR(item.product.price * item.quantity)}</div>
                    </div>
                  `).join('')}

                  <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                    <button type="button" class="snx-btn snx-btn-warning snx-btn-lg" id="snx-step2-confirm">
                      CONTINUE TO PAYMENT →
                    </button>
                  </div>
                </div>
              ` : activeStep > 2 ? `
                <div style="padding: 12px 20px; font-size: 0.875rem; color: var(--snx-text-muted);">
                  ${cartItems.length} items confirmed for express dispatch.
                </div>
              ` : ''}
            </div>

            <!-- STEP 3: PAYMENT METHOD -->
            <div class="snx-checkout-card">
              <div class="snx-checkout-card-header">
                <span class="snx-checkout-card-title">
                  <span class="snx-step-number" style="width: 22px; height: 22px; font-size: 0.75rem;">3</span>
                  Payment Options
                </span>
              </div>

              ${activeStep === 3 ? `
                <div class="snx-checkout-card-body">
                  <div class="snx-payment-options">

                    <!-- Option 1: UPI -->
                    <div class="snx-payment-method-item ${selectedPaymentMethod.startsWith('UPI') ? 'selected' : ''}">
                      <label class="snx-payment-header">
                        <input type="radio" name="payment-method" value="UPI (Google Pay)" ${selectedPaymentMethod.startsWith('UPI') ? 'checked' : ''}>
                        <span>UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                      </label>
                      <div class="snx-payment-content">
                        <div class="snx-upi-apps-row">
                          <button type="button" class="snx-upi-app-btn active" data-upi-app="Google Pay">Google Pay</button>
                          <button type="button" class="snx-upi-app-btn" data-upi-app="PhonePe">PhonePe</button>
                          <button type="button" class="snx-upi-app-btn" data-upi-app="Paytm">Paytm</button>
                        </div>
                        <div class="snx-form-group">
                          <label class="snx-form-label" for="upi-vpa-in">Or Enter UPI ID / VPA</label>
                          <input type="text" id="upi-vpa-in" class="snx-form-input" placeholder="e.g. yourname@oksbi" value="soham@okaxis">
                        </div>
                      </div>
                    </div>

                    <!-- Option 2: Credit / Debit Cards -->
                    <div class="snx-payment-method-item ${selectedPaymentMethod.startsWith('Credit') ? 'selected' : ''}">
                      <label class="snx-payment-header">
                        <input type="radio" name="payment-method" value="Credit / Debit Card (Visa/Mastercard/RuPay)" ${selectedPaymentMethod.startsWith('Credit') ? 'checked' : ''}>
                        <span>Credit / Debit / ATM Card</span>
                      </label>
                      <div class="snx-payment-content">
                        <div class="snx-form-group">
                          <label class="snx-form-label">Card Number</label>
                          <input type="text" class="snx-form-input" placeholder="XXXX XXXX XXXX XXXX" value="4532 •••• •••• 8921" maxlength="19">
                        </div>
                        <div class="snx-card-inputs-row">
                          <div class="snx-form-group">
                            <label class="snx-form-label">Valid Thru</label>
                            <input type="text" class="snx-form-input" placeholder="MM/YY" value="08/29">
                          </div>
                          <div class="snx-form-group">
                            <label class="snx-form-label">CVV</label>
                            <input type="password" class="snx-form-input" placeholder="123" value="789" maxlength="3">
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Option 3: Net Banking -->
                    <div class="snx-payment-method-item ${selectedPaymentMethod.startsWith('Net Banking') ? 'selected' : ''}">
                      <label class="snx-payment-header">
                        <input type="radio" name="payment-method" value="Net Banking (HDFC Bank)" ${selectedPaymentMethod.startsWith('Net Banking') ? 'checked' : ''}>
                        <span>Net Banking (All Indian Banks)</span>
                      </label>
                      <div class="snx-payment-content">
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm" style="font-weight: 700;">HDFC Bank</button>
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm">ICICI Bank</button>
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm">SBI</button>
                          <button type="button" class="snx-btn snx-btn-secondary snx-btn-sm">Axis Bank</button>
                        </div>
                      </div>
                    </div>

                    <!-- Option 4: Cash on Delivery -->
                    <div class="snx-payment-method-item ${selectedPaymentMethod.startsWith('Cash') ? 'selected' : ''}">
                      <label class="snx-payment-header">
                        <input type="radio" name="payment-method" value="Cash on Delivery (COD)" ${selectedPaymentMethod.startsWith('Cash') ? 'checked' : ''}>
                        <span>Cash on Delivery (COD)</span>
                      </label>
                      <div class="snx-payment-content">
                        <p style="font-size: 0.8125rem; color: var(--snx-text-muted);">
                          Pay via cash or UPI to delivery agent at your doorstep upon receiving package.
                        </p>
                      </div>
                    </div>

                  </div>

                  <div style="margin-top: 24px;">
                    <button type="button" class="snx-btn snx-btn-accent snx-btn-lg snx-btn-block" id="snx-place-order-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      PAY ${formatPriceINR(summary.grandTotal)} & PLACE ORDER
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>

          </div>

          <!-- RIGHT: Order Total Sticky Card -->
          <aside class="snx-price-summary-card">
            <h3 class="snx-price-card-title">Order Price Summary</h3>
            <div class="snx-price-rows">
              <div class="snx-price-row">
                <span>Items Total (${summary.itemCount} items)</span>
                <span>${formatPriceINR(summary.originalTotal)}</span>
              </div>
              <div class="snx-price-row discount-row">
                <span>Instant Discount</span>
                <span>- ${formatPriceINR(summary.discount)}</span>
              </div>
              <div class="snx-price-row">
                <span>Delivery</span>
                <span>${summary.delivery === 0 ? '<strong style="color: var(--snx-success);">FREE</strong>' : formatPriceINR(summary.delivery)}</span>
              </div>
              <div class="snx-price-row">
                <span>Packaging Fee</span>
                <span>${formatPriceINR(summary.packagingFee)}</span>
              </div>
              <div class="snx-price-row total-row">
                <span>Grand Total</span>
                <span>${formatPriceINR(summary.grandTotal)}</span>
              </div>
            </div>

            <div class="snx-savings-banner">
              <span>🛡️</span>
              <span>100% Buyer Protection & Money Back Guarantee</span>
            </div>
          </aside>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Address Radio changes
    const addrRadios = container.querySelectorAll('input[name="checkout-addr"]');
    addrRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedAddressId = radio.value;
        render();
      });
    });

    // Step 1 confirm
    const step1Btn = container.querySelector('#snx-step1-confirm');
    if (step1Btn) {
      step1Btn.addEventListener('click', () => {
        activeStep = 2;
        render();
      });
    }

    // Step 1 Change
    const step1Change = container.querySelector('#snx-step1-change');
    if (step1Change) {
      step1Change.addEventListener('click', () => {
        activeStep = 1;
        render();
      });
    }

    // Step 2 confirm
    const step2Btn = container.querySelector('#snx-step2-confirm');
    if (step2Btn) {
      step2Btn.addEventListener('click', () => {
        activeStep = 3;
        render();
      });
    }

    // Step 2 Change
    const step2Change = container.querySelector('#snx-step2-change');
    if (step2Change) {
      step2Change.addEventListener('click', () => {
        activeStep = 2;
        render();
      });
    }

    // Payment radios
    const payRadios = container.querySelectorAll('input[name="payment-method"]');
    payRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedPaymentMethod = radio.value;
        render();
      });
    });

    // Place Order button
    const placeOrderBtn = container.querySelector('#snx-place-order-btn');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', () => {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = `
          <svg class="snx-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Processing Secure Payment...
        `;

        const activeItems = store.getCartItems().filter(i => !i.savedForLater);
        const shippingAddress = store.user.addresses.find(a => a.id === selectedAddressId) || store.user.addresses[0];
        const summary = store.getCartSummary();

        setTimeout(() => {
          placedOrder = store.createOrder({
            items: activeItems,
            shippingAddress,
            paymentMethod: selectedPaymentMethod,
            totalAmount: summary.grandTotal
          });

          activeStep = 4;
          showToast(`Order ${placedOrder.id} placed successfully!`, 'success');
          render();
        }, 1200);
      });
    }
  }

  render();
}
