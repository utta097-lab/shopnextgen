/**
 * Authentication Modal (Login, Registration, OTP Verification)
 */

import { store } from '../state/store.js';
import { showToast } from './toast.js';

let authBackdrop = null;

export function openAuthModal(initialTab = 'login') {
  if (!authBackdrop) {
    authBackdrop = document.createElement('div');
    authBackdrop.className = 'snx-modal-backdrop';
    document.body.appendChild(authBackdrop);
  }

  let currentTab = initialTab; // 'login', 'register', 'otp'
  let pendingIdentifier = '';
  let pendingName = '';

  function renderModalContent() {
    let bodyContent = '';

    if (currentTab === 'login') {
      bodyContent = `
        <div class="snx-auth-tabs">
          <button type="button" class="snx-auth-tab-btn active" data-tab="login">Sign In</button>
          <button type="button" class="snx-auth-tab-btn" data-tab="register">New to SHOPNEX?</button>
        </div>

        <form id="snx-login-form">
          <div class="snx-form-group">
            <label class="snx-form-label" for="auth-input-id">Mobile Number or Email</label>
            <input type="text" id="auth-input-id" class="snx-form-input" placeholder="e.g. 9876543210 or user@example.com" value="${store.user.email || ''}" required>
          </div>

          <p style="font-size: 0.75rem; color: var(--snx-text-muted); margin-bottom: 16px;">
            By continuing, you agree to SHOPNEX's <a href="#" style="color: var(--snx-primary-light);">Terms of Use</a> and <a href="#" style="color: var(--snx-primary-light);">Privacy Policy</a>.
          </p>

          <button type="submit" class="snx-btn snx-btn-primary snx-btn-block">
            Continue & Request OTP
          </button>

          <div style="margin-top: 14px; text-align: center;">
            <button type="button" id="snx-quick-demo-login" class="snx-btn snx-btn-secondary snx-btn-sm snx-btn-block" style="border-style: dashed;">
              ⚡ Quick Demo 1-Click Login
            </button>
          </div>
        </form>
      `;
    } else if (currentTab === 'register') {
      bodyContent = `
        <div class="snx-auth-tabs">
          <button type="button" class="snx-auth-tab-btn" data-tab="login">Sign In</button>
          <button type="button" class="snx-auth-tab-btn active" data-tab="register">New to SHOPNEX?</button>
        </div>

        <form id="snx-register-form">
          <div class="snx-form-group">
            <label class="snx-form-label" for="reg-name">Full Name</label>
            <input type="text" id="reg-name" class="snx-form-input" placeholder="e.g. Soham Dutta" required>
          </div>

          <div class="snx-form-group">
            <label class="snx-form-label" for="reg-id">Mobile Number or Email</label>
            <input type="text" id="reg-id" class="snx-form-input" placeholder="e.g. 9876543210 or soham@example.com" required>
          </div>

          <button type="submit" class="snx-btn snx-btn-primary snx-btn-block" style="margin-top: 8px;">
            Create Account & Send OTP
          </button>
        </form>
      `;
    } else if (currentTab === 'otp') {
      bodyContent = `
        <div style="text-align: center; margin-bottom: 16px;">
          <h4 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 4px;">Verify with OTP</h4>
          <p style="font-size: 0.8125rem; color: var(--snx-text-muted);">
            Sent a 4-digit code to <strong>${pendingIdentifier}</strong>
          </p>
        </div>

        <form id="snx-otp-form">
          <div class="snx-otp-box-row">
            <input type="text" maxlength="1" class="snx-otp-digit" data-index="0" value="1" autofocus>
            <input type="text" maxlength="1" class="snx-otp-digit" data-index="1" value="2">
            <input type="text" maxlength="1" class="snx-otp-digit" data-index="2" value="3">
            <input type="text" maxlength="1" class="snx-otp-digit" data-index="3" value="4">
          </div>

          <p style="text-align: center; font-size: 0.8125rem; color: var(--snx-text-muted); margin-bottom: 16px;">
            Demo Mode: Pre-filled with valid code <strong>1234</strong>
          </p>

          <button type="submit" class="snx-btn snx-btn-primary snx-btn-block">
            Verify & Continue
          </button>

          <div style="text-align: center; margin-top: 12px;">
            <button type="button" id="snx-back-to-login" style="font-size: 0.8125rem; color: var(--snx-primary-light); font-weight: 600;">
              Change phone/email
            </button>
          </div>
        </form>
      `;
    }

    authBackdrop.innerHTML = `
      <div class="snx-modal-container" role="dialog" aria-modal="true">
        <div class="snx-modal-header">
          <span class="snx-modal-title">SHOPNEX Account</span>
          <button type="button" class="snx-modal-close-btn" id="snx-auth-close" aria-label="Close modal">✕</button>
        </div>
        <div class="snx-modal-body">
          ${bodyContent}
        </div>
      </div>
    `;

    wireEvents();
  }

  function wireEvents() {
    const closeBtn = document.getElementById('snx-auth-close');
    closeBtn.addEventListener('click', () => authBackdrop.classList.remove('open'));

    // Tab buttons
    const tabBtns = authBackdrop.querySelectorAll('[data-tab]');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        renderModalContent();
      });
    });

    // Quick demo login
    const demoBtn = document.getElementById('snx-quick-demo-login');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        store.login('soham.dutta@shopnex.in', 'Soham Dutta');
        showToast('Logged in successfully as Soham Dutta!', 'success');
        authBackdrop.classList.remove('open');
      });
    }

    // Login submit
    const loginForm = document.getElementById('snx-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idVal = document.getElementById('auth-input-id').value.trim();
        if (idVal) {
          pendingIdentifier = idVal;
          pendingName = "Soham Dutta";
          currentTab = 'otp';
          renderModalContent();
          showToast(`OTP sent to ${idVal}. Use 1234.`, 'info');
        }
      });
    }

    // Register submit
    const regForm = document.getElementById('snx-register-form');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('reg-name').value.trim();
        const idVal = document.getElementById('reg-id').value.trim();
        if (idVal) {
          pendingIdentifier = idVal;
          pendingName = nameVal || "Valued Shopper";
          currentTab = 'otp';
          renderModalContent();
          showToast(`OTP sent to ${idVal}. Use 1234.`, 'info');
        }
      });
    }

    // OTP submit
    const otpForm = document.getElementById('snx-otp-form');
    if (otpForm) {
      otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        store.login(pendingIdentifier || 'soham.dutta@shopnex.in', pendingName || 'Soham Dutta');
        showToast(`Welcome back, ${store.user.name}!`, 'success');
        authBackdrop.classList.remove('open');
      });

      const backBtn = document.getElementById('snx-back-to-login');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          currentTab = 'login';
          renderModalContent();
        });
      }
    }
  }

  authBackdrop.addEventListener('click', (e) => {
    if (e.target === authBackdrop) authBackdrop.classList.remove('open');
  });

  renderModalContent();
  authBackdrop.classList.add('open');
}
