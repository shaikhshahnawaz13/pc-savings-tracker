/* ============================================================
   history.js — Savings history page
   Search, filter by month/source, sort, edit, delete
   ============================================================ */

const History = (() => {

  // State
  let search  = '';
  let month   = '';
  let source  = '';
  let sort    = 'newest';

  /* ── Render full page ─────────────────────────────────────── */
  function render() {
    const page = document.getElementById('page-history');
    if (!page) return;

    // Build unique month list for filter
    const allMonths = [...new Set(
      DB.getEntries().map(e => e.date.slice(0, 7))
    )].sort().reverse();

    page.innerHTML = `
      <!-- Filter bar -->
      <div class="filter-bar" id="filterBar">
        <div class="search-wrap">
          <i class="ti ti-search"></i>
          <input
            class="search-input"
            placeholder="Search…"
            value="${search}"
            oninput="History.onSearch(this.value)"
          />
        </div>

        <select class="filter-select" onchange="History.onMonth(this.value)">
          <option value="">All months</option>
          ${allMonths.map(m =>
            `<option value="${m}" ${month === m ? 'selected' : ''}>${Helpers.monthFull(m)}</option>`
          ).join('')}
        </select>

        <select class="filter-select" onchange="History.onSource(this.value)">
          <option value="">All sources</option>
          ${SOURCES.map(s =>
            `<option value="${s}" ${source === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>

        <select class="filter-select" onchange="History.onSort(this.value)">
          <option value="newest"  ${sort === 'newest'  ? 'selected' : ''}>Newest first</option>
          <option value="oldest"  ${sort === 'oldest'  ? 'selected' : ''}>Oldest first</option>
          <option value="highest" ${sort === 'highest' ? 'selected' : ''}>Highest amount</option>
          <option value="lowest"  ${sort === 'lowest'  ? 'selected' : ''}>Lowest amount</option>
        </select>

        ${(search || month || source) ? `
          <button class="btn btn-ghost btn-sm" onclick="History.clearFilters()">
            <i class="ti ti-x"></i>Clear filters
          </button>` : ''}

        <span class="text-xs text-muted" style="margin-left:auto" id="histCount"></span>
      </div>

      <!-- Table -->
      <div id="historyTable"></div>
    `;

    renderTable();
  }

  /* ── Render just the table ────────────────────────────────── */
  function renderTable() {
    let entries = [...DB.getEntries()];

    // Filter
    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.source.toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q) ||
        String(e.amount).includes(q) ||
        e.date.includes(q)
      );
    }
    if (month)  entries = entries.filter(e => e.date.startsWith(month));
    if (source) entries = entries.filter(e => e.source === source);

    // Sort
    if (sort === 'newest')  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sort === 'oldest')  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sort === 'highest') entries.sort((a, b) => b.amount - a.amount);
    if (sort === 'lowest')  entries.sort((a, b) => a.amount - b.amount);

    // Count label
    const countEl = document.getElementById('histCount');
    if (countEl) countEl.textContent = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`;

    const wrap = document.getElementById('historyTable');
    if (!wrap) return;

    if (!DB.getEntries().length) {
      wrap.innerHTML = `
        <div class="empty-state">
          <i class="ti ti-inbox"></i>
          <p>No savings entries yet.</p>
          <div class="empty-action">
            <button class="btn btn-primary btn-sm" onclick="App.navigate('add', null)">
              <i class="ti ti-plus"></i>Add First Entry
            </button>
          </div>
        </div>`;
      return;
    }

    if (!entries.length) {
      wrap.innerHTML = `
        <div class="empty-state">
          <i class="ti ti-search-off"></i>
          <p>No entries match your filters.</p>
        </div>`;
      return;
    }

    const rows = entries.map(e => `
      <tr>
        <td style="white-space:nowrap;color:var(--text)">${Helpers.formatDisplayDate(e.date)}</td>
        <td><span class="badge ${SOURCE_BADGE[e.source] || 'badge-gray'}">${e.source}</span></td>
        <td class="mono text-green" style="font-weight:500;white-space:nowrap">${Helpers.fmt(e.amount)}</td>
        <td class="text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
            title="${e.notes || ''}">${e.notes || '—'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-icon" title="Edit entry" onclick="AddEntry.startEdit('${e.id}')">
              <i class="ti ti-pencil"></i>
            </button>
            <button class="btn-icon danger" title="Delete entry" onclick="History.deleteEntry('${e.id}')">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>SOURCE</th>
              <th>AMOUNT</th>
              <th>NOTES</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <!-- Total row -->
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:10px;padding:0 2px">
        <span class="text-xs text-muted">Showing total:</span>
        <span class="mono text-green" style="font-size:14px;font-weight:500">
          ${Helpers.fmt(entries.reduce((s, e) => s + Number(e.amount), 0))}
        </span>
      </div>
    `;
  }

  /* ── Event handlers ───────────────────────────────────────── */
  function onSearch(val) { search = val; renderTable(); }
  function onMonth(val)  { month  = val; renderTable(); }
  function onSource(val) { source = val; renderTable(); }
  function onSort(val)   { sort   = val; renderTable(); }

  function clearFilters() {
    search = ''; month = ''; source = '';
    render(); // Re-render full page to reset selects
  }

  function deleteEntry(id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    DB.deleteEntry(id);
    Toast.show('Entry deleted.', 'error');
    renderTable();
    // Refresh month list in filter bar
    render();
  }

  return {
    render, renderTable,
    onSearch, onMonth, onSource, onSort,
    clearFilters, deleteEntry,
  };
})();
