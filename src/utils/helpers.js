/* ============================================================
   helpers.js — Formatting, date utilities, DOM helpers
   ============================================================ */

const Helpers = (() => {

  /* ── Currency ─────────────────────────────────────────────── */
  function fmt(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  // Compact form for chart labels: ₹1.2L instead of ₹1,20,000
  function fmtShort(value) {
    const n = Number(value) || 0;
    if (n >= 10_00_000) return '₹' + (n / 10_00_000).toFixed(1) + 'Cr';
    if (n >= 1_00_000)  return '₹' + (n / 1_00_000).toFixed(1) + 'L';
    if (n >= 1_000)     return '₹' + (n / 1_000).toFixed(1) + 'k';
    return '₹' + Math.round(n);
  }

  /* ── Dates ────────────────────────────────────────────────── */
  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function currentTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) return '—';
    try {
      return new Date(isoDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return isoDate; }
  }

  // Format date + time together for history/dashboard display
  function formatDateTime(date, time) {
    const datePart = formatDisplayDate(date);
    if (!time) return datePart;
    // Convert 24h "HH:MM" to 12h "H:MM AM/PM"
    try {
      const [h, m] = time.split(':').map(Number);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${datePart}, ${h12}:${String(m).padStart(2, '0')} ${suffix}`;
    } catch {
      return datePart;
    }
  }

  function monthLabel(isoMonth) {
    // isoMonth = "2024-03"
    const [y, m] = isoMonth.split('-');
    return MONTH_NAMES[Number(m) - 1] + " '" + String(y).slice(2);
  }

  function monthFull(isoMonth) {
    const [y, m] = isoMonth.split('-');
    return MONTH_NAMES[Number(m) - 1] + ' ' + y;
  }

  /* ── DOM helpers ──────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function html(id, markup) {
    const node = el(id);
    if (node) node.innerHTML = markup;
  }

  function setProgress(id, pct) {
    const node = el(id);
    if (node) {
      // Trigger reflow so transition fires from 0
      node.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.style.width = Math.min(100, Math.max(0, pct)) + '%';
        });
      });
    }
  }

  /* ── CSV parser ───────────────────────────────────────────── */
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h =>
      h.trim().replace(/^["']|["']$/g, '').toLowerCase()
    );
    return lines.slice(1)
      .filter(l => l.trim())
      .map(line => {
        // Handle quoted commas
        const vals = [];
        let cur = '', inQuote = false;
        for (const ch of line) {
          if (ch === '"') { inQuote = !inQuote; continue; }
          if (ch === ',' && !inQuote) { vals.push(cur); cur = ''; continue; }
          cur += ch;
        }
        vals.push(cur);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
        return obj;
      })
      .filter(r => r.amount && r.date);
  }

  /* ── Percent ──────────────────────────────────────────────── */
  function pct(part, total) {
    if (!total) return 0;
    return Math.min(100, Math.round((part / total) * 100));
  }

  /* ── Animated counter ─────────────────────────────────────── */
  function animateCounter(element, from, to, duration = 700) {
    if (!element) return;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * ease);
      element.textContent = fmt(current);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return {
    fmt, fmtShort, todayISO, currentTime,
    formatDisplayDate, formatDateTime,
    monthLabel, monthFull, el, html, setProgress,
    parseCSV, pct, animateCounter,
  };
})();
