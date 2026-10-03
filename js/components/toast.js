/**
 * Non-blocking animated toast notification system
 */

export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('snx-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'snx-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `snx-toast ${type}`;

  let icon = `✓`;
  if (type === 'error') icon = `✕`;
  if (type === 'info') icon = `ℹ`;

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.1rem;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'snxToastFadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}
