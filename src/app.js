/* ============================================================
   app.js — Application bootstrap, router, navigation
   Entry point — loaded last after all modules
   ============================================================ */

const App = (() => {

  let currentPage = 'dashboard';

  /* ── Page renderers map ───────────────────────────────────── */
  const renderers = {
    dashboard : () => Dashboard.render(),
    add       : () => AddEntry.render(),
    history   : () => History.render(),
    goals     : () => Goals.render(),
    import    : () => ImportData.render(),
    export    : () => ExportData.render(),
    analytics : () => Analytics.render(),
  };

  /* ── Navigate to a page ───────────────────────────────────── */
  function navigate(page, navEl) {
    if (!renderers[page]) return;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (navEl) {
      navEl.classList.add('active');
    } else {
      // Find matching nav item by data-page
      const match = document.querySelector(`.nav-item[data-page="${page}"]`);
      if (match) match.classList.add('active');
    }

    // Update topbar title
    const titleEl = document.getElementById('topbarTitle');
    if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

    currentPage = page;

    // Render page content
    renderers[page]();

    // Close sidebar on mobile
    closeSidebar();
  }

  /* ── Sidebar ──────────────────────────────────────────────── */
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('backdrop').classList.toggle('open');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('backdrop').classList.remove('open');
  }

  /* ── Modal shortcuts (called from inline HTML) ────────────── */
  function closeModal()     { Modals.closeAdd(); }
  function closeGoalModal() { Modals.closeGoal(); }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    // Render initial page
    navigate('dashboard', document.querySelector('.nav-item[data-page="dashboard"]'));

    // Register service worker for PWA (if supported)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // Silently fail if SW not available
      });
    }
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    navigate, toggleSidebar, closeSidebar,
    closeModal, closeGoalModal,
    getCurrentPage: () => currentPage,
  };
})();
