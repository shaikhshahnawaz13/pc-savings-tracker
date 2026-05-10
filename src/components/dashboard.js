/* ============================================================
   dashboard.js — Dashboard page renderer
   ============================================================ */

const Dashboard = (() => {

  function render() {
    const page = document.getElementById('page-dashboard');
    if (!page) return;

    const total   = DB.totalSavings();
    const monthly = DB.currentMonthSavings();
    const goal    = DB.getGoal();
    const goalAmt = goal ? Number(goal.target) : 0;
    const remaining = goalAmt > 0 ? Math.max(0, goalAmt - total) : 0;
    const progress  = Helpers.pct(total, goalAmt);

    page.innerHTML = `
      <!-- Stat cards -->
      <div class="stats-grid stagger">
        ${statCard('green',  'ti-wallet',        'TOTAL SAVED',   Helpers.fmt(total),   DB.getEntries().length + ' entries')}
        ${statCard('purple', 'ti-calendar-month','THIS MONTH',    Helpers.fmt(monthly), new Date().toLocaleString('default',{month:'long',year:'numeric'}))}
        ${statCard('amber',  'ti-target',        'GOAL AMOUNT',   goalAmt ? Helpers.fmt(goalAmt) : '—', goalAmt ? 'PC Build Target' : 'Not set')}
        ${statCard('blue',   'ti-trending-up',   'REMAINING',     goalAmt ? Helpers.fmt(remaining) : '—', goalAmt ? progress + '% complete' : 'Set a goal')}
      </div>

      <!-- Progress bar -->
      <div class="card section-gap" id="dashProgress">
        <div class="card-header" style="margin-bottom:10px">
          <span class="card-title">BUILD PROGRESS</span>
          ${goalAmt
            ? `<span class="mono text-accent" style="font-size:13px">${progress}%</span>`
            : `<button class="btn btn-ghost btn-sm" onclick="Goals.openGoalModal()">
                <i class="ti ti-plus"></i>Set Goal
               </button>`
          }
        </div>
        ${goalAmt ? `
          <div class="progress-labels">
            <span>${Helpers.fmt(total)} saved</span>
            <span>${Helpers.fmt(goalAmt)} target</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="dashProgressFill" style="width:0%"></div>
          </div>
          <div class="text-xs text-muted" style="margin-top:8px">
            ${remaining > 0 ? Helpers.fmt(remaining) + ' to go' : 'Goal reached!'}
          </div>
        ` : `<p class="text-sm text-muted">Set a PC build goal to track your progress here.</p>`}
      </div>

      <!-- Charts row -->
      <div class="grid-2 section-gap">
        <div class="card">
          <div class="card-header"><span class="card-title">MONTHLY SAVINGS</span></div>
          <div class="chart-box"><canvas id="dashMonthlyChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">INCOME SOURCES</span></div>
          <div class="chart-box"><canvas id="dashSourceChart"></canvas></div>
          <div id="dashSourceLegend" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>
        </div>
      </div>

      <!-- Recent transactions -->
      <div class="card" id="dashRecent"></div>
    `;

    // Animate progress bar after paint
    if (goalAmt) {
      requestAnimationFrame(() => Helpers.setProgress('dashProgressFill', progress));
    }

    renderRecent();
    Charts.monthlyBar('dashMonthlyChart');
    Charts.sourceDoughnut('dashSourceChart', 'dashSourceLegend');
  }

  function statCard(colorClass, icon, label, value, sub) {
    return `
      <div class="stat-card ${colorClass}">
        <div class="stat-label">
          <i class="ti ${icon}" style="color:var(--${colorClass === 'purple' ? 'accent2' : colorClass})"></i>
          ${label}
        </div>
        <div class="stat-value" style="color:var(--${colorClass === 'purple' ? 'accent2' : colorClass})">${value}</div>
        <div class="stat-sub">${sub}</div>
      </div>`;
  }

  function renderRecent() {
    const el = document.getElementById('dashRecent');
    if (!el) return;

    const entries = [...DB.getEntries()]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    let html = `
      <div class="card-header">
        <span class="card-title">RECENT TRANSACTIONS</span>
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('history', null)">
          View all <i class="ti ti-arrow-right"></i>
        </button>
      </div>`;

    if (!entries.length) {
      html += `<div class="empty-state">
        <i class="ti ti-inbox"></i>
        <p>No entries yet — add your first saving!</p>
        <div class="empty-action">
          <button class="btn btn-primary btn-sm" onclick="App.navigate('add', null)">
            <i class="ti ti-plus"></i>Add Entry
          </button>
        </div>
      </div>`;
    } else {
      const rows = entries.map(e => `
        <tr>
          <td style="color:var(--text)">${Helpers.formatDisplayDate(e.date)}</td>
          <td><span class="badge ${SOURCE_BADGE[e.source] || 'badge-gray'}">${e.source}</span></td>
          <td class="mono text-green" style="font-weight:500">${Helpers.fmt(e.amount)}</td>
          <td class="text-muted" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.notes || '—'}</td>
        </tr>`).join('');

      html += `<div class="table-wrap">
        <table>
          <thead><tr><th>DATE</th><th>SOURCE</th><th>AMOUNT</th><th>NOTES</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }

    el.innerHTML = html;
  }

  return { render };
})();
