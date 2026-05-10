/* ============================================================
   analytics.js — Full analytics with period tabs & all streaks
   Periods: Day · Week · Month · Year
   Streaks:  Day · Week · Month · Year
   ============================================================ */

const Analytics = (() => {

  let activeTab = 'month'; // day | week | month | year

  /* ── Main render ──────────────────────────────────────────── */
  function render() {
    const page = document.getElementById('page-analytics');
    if (!page) return;

    const entries = DB.getEntries();
    const total   = DB.totalSavings();

    page.innerHTML = `
      <div class="page-header">
        <h1>Analytics</h1>
        <p>Period breakdowns, saving streaks, and long-term trends.</p>
      </div>

      <!-- Period tabs -->
      <div class="analytics-tabs section-gap" id="analyticsTabs">
        ${['day','week','month','year'].map(t => `
          <button
            class="tab-btn ${activeTab === t ? 'active' : ''}"
            onclick="Analytics.switchTab('${t}')"
          >${t.charAt(0).toUpperCase() + t.slice(1)}</button>
        `).join('')}
      </div>

      <!-- Period content panel -->
      <div id="periodPanel" class="section-gap"></div>

      <!-- Streak cards -->
      <div class="section-gap">
        <div class="card-title" style="margin-bottom:12px;letter-spacing:0.8px">SAVING STREAKS</div>
        <div class="grid-4 stagger" id="streakGrid"></div>
      </div>

      <!-- Cumulative chart -->
      <div class="card section-gap">
        <div class="card-header">
          <span class="card-title">CUMULATIVE SAVINGS</span>
          <span class="mono text-green" style="font-size:13px">${Helpers.fmt(total)}</span>
        </div>
        <div class="chart-box-lg"><canvas id="cumChart"></canvas></div>
      </div>

      <!-- Source breakdown -->
      ${renderSourceTable(entries, total)}
    `;

    renderStreaks();
    renderPeriodPanel();
    Charts.cumulativeLine('cumChart');
  }

  /* ── Tab switcher ─────────────────────────────────────────── */
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.toLowerCase() === tab);
    });
    renderPeriodPanel();
  }

  /* ── Period panel dispatcher ──────────────────────────────── */
  function renderPeriodPanel() {
    const panel = document.getElementById('periodPanel');
    if (!panel) return;
    const entries = DB.getEntries();

    if (activeTab === 'day')   renderDay(panel, entries);
    if (activeTab === 'week')  renderWeek(panel, entries);
    if (activeTab === 'month') renderMonth(panel, entries);
    if (activeTab === 'year')  renderYear(panel, entries);
  }

  /* ─────────────────────────── DAY ──────────────────────────── */
  function renderDay(panel, entries) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const todayAmt = DB.todaySavings();
    const dayMap   = DB.dailyMap();
    const days     = Object.keys(dayMap).sort();
    const bestDay  = days.length ? days.reduce((a, b) => dayMap[a] > dayMap[b] ? a : b) : null;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return dayMap[d.toISOString().slice(0, 10)] || 0;
    });

    const todayEntries = [...entries]
      .filter(e => e.date === todayISO)
      .sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    panel.innerHTML = `
      <div class="grid-3 section-gap stagger">
        ${statMini('TODAY', Helpers.fmt(todayAmt), 'ti-sun', 'var(--amber)', todayEntries.length + ' entr' + (todayEntries.length === 1 ? 'y' : 'ies'))}
        ${statMini('LAST 7 DAYS', Helpers.fmt(last7.reduce((s,v)=>s+v,0)), 'ti-calendar-week', 'var(--blue)', 'Rolling week total')}
        ${statMini('BEST DAY', bestDay ? Helpers.fmt(dayMap[bestDay]) : '—', 'ti-trophy', 'var(--green)', bestDay ? Helpers.formatDisplayDate(bestDay) : 'No data')}
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">TODAY BY HOUR</span>
            <span class="text-xs text-muted">${todayISO}</span>
          </div>
          <div class="chart-box"><canvas id="dayHourChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">LAST 30 DAYS</span></div>
          <div class="chart-box"><canvas id="day30Chart"></canvas></div>
        </div>
      </div>
      ${todayEntries.length ? `
        <div class="card" style="margin-top:14px">
          <div class="card-header">
            <span class="card-title">TODAY'S ENTRIES</span>
            <span class="mono text-green" style="font-size:13px">${Helpers.fmt(todayAmt)}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>TIME</th><th>AMOUNT</th><th>SOURCE</th><th>NOTES</th></tr></thead>
              <tbody>${todayEntries.map(e => `
                <tr>
                  <td class="mono text-muted" style="font-size:12px">${fmtTime(e.time)}</td>
                  <td class="mono text-green">${Helpers.fmt(e.amount)}</td>
                  <td><span class="badge ${SOURCE_BADGE[e.source] || 'badge-gray'}">${e.source}</span></td>
                  <td class="text-muted">${e.notes || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
    `;

    Charts.hourlyBar('dayHourChart', todayISO);
    Charts.dailyBar('day30Chart', 30);
  }

  /* ─────────────────────────── WEEK ─────────────────────────── */
  function renderWeek(panel, entries) {
    const nowKey      = DB.isoWeekKey(new Date());
    const weekMap     = DB.weeklyMap();
    const weeks       = Object.keys(weekMap).sort();
    const thisWeekAmt = DB.thisWeekSavings();
    const bestWeek    = weeks.length ? weeks.reduce((a, b) => weekMap[a] > weekMap[b] ? a : b) : null;
    const avgWeekly   = weeks.length ? Math.round(Object.values(weekMap).reduce((s,v)=>s+v,0)/weeks.length) : 0;

    const weekEntries = [...entries]
      .filter(e => DB.isoWeekKey(new Date(e.date)) === nowKey)
      .sort((a, b) => (b.date+(b.time||'')).localeCompare(a.date+(a.time||'')));

    // Day-of-week buckets Mon–Sun
    const dowLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const dowData   = Array(7).fill(0);
    weekEntries.forEach(e => {
      const day = new Date(e.date).getDay();
      dowData[day === 0 ? 6 : day - 1] += Number(e.amount);
    });

    panel.innerHTML = `
      <div class="grid-3 section-gap stagger">
        ${statMini('THIS WEEK', Helpers.fmt(thisWeekAmt), 'ti-calendar-week', 'var(--blue)', 'Current ISO week')}
        ${statMini('WEEKLY AVG', Helpers.fmt(avgWeekly), 'ti-calculator', 'var(--accent2)', weeks.length + ' weeks tracked')}
        ${statMini('BEST WEEK', bestWeek ? Helpers.fmt(weekMap[bestWeek]) : '—', 'ti-trophy', 'var(--green)', bestWeek || 'No data')}
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">THIS WEEK BY DAY</span></div>
          <div class="chart-box"><canvas id="weekDowChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">LAST 12 WEEKS</span></div>
          <div class="chart-box"><canvas id="week12Chart"></canvas></div>
        </div>
      </div>
      ${weekEntries.length ? `
        <div class="card" style="margin-top:14px">
          <div class="card-header">
            <span class="card-title">THIS WEEK'S ENTRIES</span>
            <span class="mono text-green" style="font-size:13px">${Helpers.fmt(thisWeekAmt)}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>DATE &amp; TIME</th><th>AMOUNT</th><th>SOURCE</th><th>NOTES</th></tr></thead>
              <tbody>${weekEntries.map(e => `
                <tr>
                  <td class="mono" style="font-size:12px">${Helpers.formatDisplayDate(e.date)}${e.time ? ', '+fmtTime(e.time) : ''}</td>
                  <td class="mono text-green">${Helpers.fmt(e.amount)}</td>
                  <td><span class="badge ${SOURCE_BADGE[e.source] || 'badge-gray'}">${e.source}</span></td>
                  <td class="text-muted">${e.notes || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
    `;

    // Day-of-week bar
    setTimeout(() => {
      Charts.destroy('weekDowChart');
      const c = document.getElementById('weekDowChart');
      if (!c) return;
      if (!dowData.some(v => v > 0)) {
        c.parentElement.innerHTML = '<div class="empty-state" style="padding:36px 0"><i class="ti ti-chart-bar"></i><p>No entries this week</p></div>';
        return;
      }
      new Chart(c, {
        type: 'bar',
        data: {
          labels: dowLabels,
          datasets: [{ data: dowData,
            backgroundColor: dowData.map(v => v > 0 ? 'rgba(59,130,246,0.25)' : 'rgba(42,42,58,0.3)'),
            borderColor: dowData.map(v => v > 0 ? '#3b82f6' : 'transparent'),
            borderWidth: 1.5, borderRadius: 5 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw > 0 ? '  '+Helpers.fmt(c.raw) : '  —' } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.045)' }, ticks: { color: '#5a5a72', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.045)' }, ticks: { color: '#5a5a72', font: { size: 11 }, callback: v => v > 0 ? Helpers.fmtShort(v) : '' } },
          },
        },
      });
    }, 30);

    Charts.weeklyBar('week12Chart', 12);
  }

  /* ─────────────────────────── MONTH ────────────────────────── */
  function renderMonth(panel, entries) {
    const monthMap   = DB.monthlyMap();
    const months     = Object.entries(monthMap).sort((a,b) => a[0].localeCompare(b[0]));
    const now        = new Date();
    const thisKey    = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const thisAmt    = monthMap[thisKey] || 0;
    const bestMonth  = months.length ? months.reduce((a,b) => a[1]>b[1]?a:b) : null;
    const avgMonthly = months.length ? Math.round(months.reduce((s,[,v])=>s+v,0)/months.length) : 0;

    const thisMonthEntries = [...entries]
      .filter(e => e.date.startsWith(thisKey))
      .sort((a,b) => b.date.localeCompare(a.date)||(b.time||'').localeCompare(a.time||''));

    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

    panel.innerHTML = `
      <div class="grid-3 section-gap stagger">
        ${statMini('THIS MONTH', Helpers.fmt(thisAmt), 'ti-calendar-month', 'var(--accent2)', now.toLocaleString('default',{month:'long',year:'numeric'}))}
        ${statMini('MONTHLY AVG', Helpers.fmt(avgMonthly), 'ti-calculator', 'var(--blue)', months.length+' months tracked')}
        ${statMini('BEST MONTH', bestMonth ? Helpers.fmt(bestMonth[1]) : '—', 'ti-trophy', 'var(--green)', bestMonth ? Helpers.monthFull(bestMonth[0]) : 'No data')}
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">LAST 8 MONTHS</span></div>
          <div class="chart-box"><canvas id="monthBarChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">THIS MONTH — DAILY</span></div>
          <div class="chart-box"><canvas id="monthDailyChart"></canvas></div>
        </div>
      </div>
      ${thisMonthEntries.length ? `
        <div class="card" style="margin-top:14px">
          <div class="card-header">
            <span class="card-title">THIS MONTH'S ENTRIES</span>
            <span class="mono text-green" style="font-size:13px">${Helpers.fmt(thisAmt)}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>DATE &amp; TIME</th><th>AMOUNT</th><th>SOURCE</th><th>NOTES</th></tr></thead>
              <tbody>${thisMonthEntries.map(e => `
                <tr>
                  <td class="mono" style="font-size:12px">${Helpers.formatDisplayDate(e.date)}${e.time ? ', '+fmtTime(e.time) : ''}</td>
                  <td class="mono text-green">${Helpers.fmt(e.amount)}</td>
                  <td><span class="badge ${SOURCE_BADGE[e.source] || 'badge-gray'}">${e.source}</span></td>
                  <td class="text-muted">${e.notes || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
    `;

    Charts.monthlyBar('monthBarChart');
    Charts.dailyBar('monthDailyChart', daysInMonth);
  }

  /* ─────────────────────────── YEAR ─────────────────────────── */
  function renderYear(panel, entries) {
    const yearMap   = DB.yearlyMap();
    const years     = Object.keys(yearMap).sort();
    const thisYear  = String(new Date().getFullYear());
    const thisAmt   = yearMap[thisYear] || 0;
    const bestYear  = years.length ? years.reduce((a,b) => yearMap[a]>yearMap[b]?a:b) : null;
    const avgYearly = years.length ? Math.round(Object.values(yearMap).reduce((s,v)=>s+v,0)/years.length) : 0;

    const monthMap = DB.monthlyMap();
    const thisYearMonths = MONTH_NAMES.map((name, i) => {
      const key = `${thisYear}-${String(i+1).padStart(2,'0')}`;
      return { name, key, amount: monthMap[key] || 0 };
    });

    panel.innerHTML = `
      <div class="grid-3 section-gap stagger">
        ${statMini('THIS YEAR', Helpers.fmt(thisAmt), 'ti-calendar', 'var(--amber)', thisYear)}
        ${statMini('YEARLY AVG', Helpers.fmt(avgYearly), 'ti-calculator', 'var(--blue)', years.length+' year'+(years.length!==1?'s':'')+' tracked')}
        ${statMini('BEST YEAR', bestYear ? Helpers.fmt(yearMap[bestYear]) : '—', 'ti-trophy', 'var(--green)', bestYear || 'No data')}
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">ALL YEARS</span></div>
          <div class="chart-box"><canvas id="yearBarChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">${thisYear} MONTH BY MONTH</span></div>
          <div class="chart-box"><canvas id="yearMonthChart"></canvas></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="card-header">
          <span class="card-title">${thisYear} MONTHLY BREAKDOWN</span>
          <span class="mono text-green" style="font-size:13px">${Helpers.fmt(thisAmt)}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>MONTH</th><th>AMOUNT</th><th>ENTRIES</th><th>SHARE</th></tr></thead>
            <tbody>${thisYearMonths.map(m => {
              const cnt   = entries.filter(e => e.date.startsWith(m.key)).length;
              const share = Helpers.pct(m.amount, thisAmt);
              return `
                <tr>
                  <td style="color:var(--text)">${m.name}</td>
                  <td class="mono ${m.amount>0?'text-green':'text-muted'}">${m.amount>0 ? Helpers.fmt(m.amount) : '—'}</td>
                  <td class="text-muted">${cnt || '—'}</td>
                  <td>${m.amount>0 ? `
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar-bg" style="width:70px">
                        <div class="progress-bar-fill" style="width:${share}%;background:var(--amber)"></div>
                      </div>
                      <span class="text-xs text-muted">${share}%</span>
                    </div>` : '<span class="text-xs text-muted">—</span>'}
                  </td>
                </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    Charts.yearlyBar('yearBarChart');

    setTimeout(() => {
      Charts.destroy('yearMonthChart');
      const c = document.getElementById('yearMonthChart');
      if (!c) return;
      const data = thisYearMonths.map(m => m.amount);
      if (data.every(v => v === 0)) {
        c.parentElement.innerHTML = '<div class="empty-state" style="padding:36px 0"><i class="ti ti-chart-bar"></i><p>No entries this year yet</p></div>';
        return;
      }
      new Chart(c, {
        type: 'bar',
        data: {
          labels: MONTH_NAMES,
          datasets: [{ data,
            backgroundColor: data.map(v => v>0?'rgba(245,158,11,0.22)':'rgba(42,42,58,0.3)'),
            borderColor: data.map(v => v>0?'#f59e0b':'transparent'),
            borderWidth: 1.5, borderRadius: 5 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw>0 ? '  '+Helpers.fmt(c.raw) : '  —' } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.045)' }, ticks: { color: '#5a5a72', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.045)' }, ticks: { color: '#5a5a72', font: { size: 11 }, callback: v => v>0?Helpers.fmtShort(v):'' } },
          },
        },
      });
    }, 30);
  }

  /* ── All four streak cards ────────────────────────────────── */
  function renderStreaks() {
    const grid = document.getElementById('streakGrid');
    if (!grid) return;

    const dS = DB.dayStreak();
    const wS = DB.weekStreak();
    const mS = DB.monthStreak();
    const yS = DB.yearStreak();

    grid.innerHTML = `
      ${streakCard('DAY STREAK',   dS, 'day'+(dS!==1?'s':''),     'ti-sun',           'var(--amber)',   renderDayDots())}
      ${streakCard('WEEK STREAK',  wS, 'week'+(wS!==1?'s':''),    'ti-calendar-week', 'var(--blue)',    renderWeekDots())}
      ${streakCard('MONTH STREAK', mS, 'month'+(mS!==1?'s':''),   'ti-calendar-month','var(--accent2)', renderMonthDots())}
      ${streakCard('YEAR STREAK',  yS, 'year'+(yS!==1?'s':''),    'ti-calendar',      'var(--green)',   renderYearDots())}
    `;
  }

  function streakCard(label, count, unit, icon, color, dots) {
    const active = count > 0;
    const displayColor = active ? color : 'var(--text3)';
    const displayVal   = active ? count : '—';
    const displayUnit  = active ? unit  : 'no streak yet';
    return `
      <div class="card" style="text-align:center;opacity:${active ? 1 : 0.55}">
        <div style="width:40px;height:40px;border-radius:10px;background:${displayColor}18;
                    display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
          <i class="ti ${icon}" style="font-size:20px;color:${displayColor}"></i>
        </div>
        <div class="mono" style="font-size:36px;font-weight:700;color:${displayColor};line-height:1">${displayVal}</div>
        <div class="text-xs text-muted" style="margin:5px 0 2px">${displayUnit}</div>
        <div class="text-xs" style="color:${displayColor};letter-spacing:0.5px;margin-bottom:12px;font-weight:600">${label}</div>
        <div class="streak-dots" style="justify-content:center">${dots}</div>
      </div>`;
  }

  /* ── Dot grids ────────────────────────────────────────────── */
  function renderDayDots() {
    const map = DB.dailyMap();
    const now = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 13 + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
      return `<div class="streak-dot ${map[key]?'filled':''}" title="${label}"></div>`;
    }).join('');
  }

  function renderWeekDots() {
    const map = DB.weeklyMap();
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (11-i)*7);
      const key = DB.isoWeekKey(d);
      return `<div class="streak-dot ${map[key]?'filled':''}" title="${key}"></div>`;
    }).join('');
  }

  function renderMonthDots() {
    const map = DB.monthlyMap();
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth()-11+i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = MONTH_NAMES[d.getMonth()]+' '+d.getFullYear();
      return `<div class="streak-dot ${map[key]?'filled':''}" title="${label}"></div>`;
    }).join('');
  }

  function renderYearDots() {
    const map = DB.yearlyMap();
    const nowY = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => {
      const y = String(nowY - 5 + i);
      return `<div class="streak-dot ${map[y]?'filled':''}" title="${y}" style="width:14px;height:14px;border-radius:4px"></div>`;
    }).join('');
  }

  /* ── Source breakdown table ───────────────────────────────── */
  function renderSourceTable(entries, total) {
    const srcMap = DB.sourceMap();
    if (!Object.keys(srcMap).length) return '';
    return `
      <div class="card section-gap">
        <div class="card-header"><span class="card-title">SOURCE BREAKDOWN</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>SOURCE</th><th>ENTRIES</th><th>TOTAL</th><th>SHARE</th></tr></thead>
            <tbody>${Object.entries(srcMap).sort((a,b)=>b[1]-a[1]).map(([src,amt]) => {
              const count = entries.filter(e=>e.source===src).length;
              const share = Helpers.pct(amt, total);
              return `
                <tr>
                  <td><span class="badge ${SOURCE_BADGE[src]||'badge-gray'}">${src}</span></td>
                  <td class="text-muted">${count}</td>
                  <td class="mono text-green">${Helpers.fmt(amt)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="progress-bar-bg" style="width:80px">
                        <div class="progress-bar-fill" style="width:${share}%;background:${SOURCE_COLORS[src]||'var(--accent)'}"></div>
                      </div>
                      <span class="text-xs text-muted">${share}%</span>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ── Shared helpers ───────────────────────────────────────── */
  function statMini(label, value, icon, color, sub) {
    return `
      <div class="insight-card">
        <div class="text-xs text-muted" style="display:flex;align-items:center;gap:5px;letter-spacing:0.5px">
          <i class="ti ${icon}" style="color:${color}"></i>${label}
        </div>
        <div class="insight-num" style="color:${color}">${value}</div>
        <div class="text-xs text-muted">${sub}</div>
      </div>`;
  }

  function fmtTime(time) {
    if (!time) return '—';
    try {
      const [h, m] = time.split(':').map(Number);
      return (h%12||12)+':'+String(m).padStart(2,'0')+(h>=12?' PM':' AM');
    } catch { return time; }
  }

  return { render, switchTab };
})();
