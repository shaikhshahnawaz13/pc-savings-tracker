/* ============================================================
   modals.js — Modal open/close helpers
   ============================================================ */

const Modals = (() => {

  function openAdd(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('addModal').classList.add('open');
  }

  function closeAdd() {
    document.getElementById('addModal').classList.remove('open');
    document.getElementById('modalBody').innerHTML = '';
  }

  function openGoal(bodyHTML) {
    document.getElementById('goalModalBody').innerHTML = bodyHTML;
    document.getElementById('goalModal').classList.add('open');
  }

  function closeGoal() {
    document.getElementById('goalModal').classList.remove('open');
    document.getElementById('goalModalBody').innerHTML = '';
  }

  // Close modals on backdrop click
  document.getElementById('addModal').addEventListener('click', function(e) {
    if (e.target === this) closeAdd();
  });
  document.getElementById('goalModal').addEventListener('click', function(e) {
    if (e.target === this) closeGoal();
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAdd(); closeGoal(); }
  });

  return { openAdd, closeAdd, openGoal, closeGoal };
})();
