/* ============================================================
   toast.js — Lightweight toast notification system
   ============================================================ */

const Toast = (() => {
  function show(message, type = 'success', duration = 2800) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'ti-check', error: 'ti-alert-circle', info: 'ti-info-circle' };
    const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue)' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="ti ${icons[type] || icons.info}" style="color:${colors[type]};font-size:16px;flex-shrink:0"></i>
      <span style="flex:1">${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove
    const timer = setTimeout(() => dismiss(toast), duration);
    toast.addEventListener('click', () => { clearTimeout(timer); dismiss(toast); });
  }

  function dismiss(toast) {
    toast.style.animation = 'toastOut 0.22s ease forwards';
    setTimeout(() => toast.remove(), 230);
  }

  return { show };
})();
