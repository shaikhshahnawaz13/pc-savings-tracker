/* ============================================================
   charts.js — Chart.js wrapper, chart factory functions
   ============================================================ */

const Charts = (() => {
  const instances = {};

  /* ── Destroy existing chart by key ───────────────────────── */
  function destroy(key) {
    if (instances[key]) {
      instances[key].destroy();
      delete instances[key];
    }
  }

  /* ── Common chart defaults ────────────────────────────────── */
  const GRID_COLOR  = 'rgba(255,255,255,0.045)';
  const TICK_COLOR  = '#5a5a72';
  const TICK_SIZE   = 11;

  function baseScales() {
    return {
      x: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { size: TICK_SIZE }, maxRotation: 40 },
      },
      y: {
        grid: { color: GRID_COLOR },
        ticks: {
          color: TICK_COLOR,
          font: { size: TICK_SIZE },
          callback: v => Helpers.fmtShort(v),
        },
      },
    };
  }

  /* ── Monthly bar chart ────────────────────────────────────── */
  function monthlyBar(canvasId) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const monthMap = DB.monthlyMap();
    const sorted = Object.keys(monthMap).sort();
    const last8 = sorted.slice(-8);

    if (!last8.length) {
      canvas.parentElement.innerHTML = emptyChartHtml('Add entries to see monthly chart');
      return;
    }

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: last8.map(k => Helpers.monthLabel(k)),
        datasets: [{
          label: 'Savings',
          data: last8.map(k => monthMap[k]),
          backgroundColor: 'rgba(124,109,250,0.22)',
          borderColor: '#7c6dfa',
          borderWidth: 1.5,
          borderRadius: 5,
          hoverBackgroundColor: 'rgba(124,109,250,0.42)',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: c => '  ' + Helpers.fmt(c.raw) },
          },
        },
        scales: {
          ...baseScales(),
          x: {
            ...baseScales().x,
            ticks: {
              ...baseScales().x.ticks,
              autoSkip: false,
            },
          },
        },
      },
    });
  }

  /* ── Source doughnut chart ────────────────────────────────── */
  function sourceDoughnut(canvasId, legendContainerId) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const srcMap = DB.sourceMap();
    const labels = Object.keys(srcMap);
    const data   = Object.values(srcMap);
    const colors = labels.map(l => SOURCE_COLORS[l] || '#6b7280');

    if (!labels.length) {
      canvas.parentElement.innerHTML = emptyChartHtml('Add entries to see source breakdown');
      return;
    }

    instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => c + 'aa'),
          borderColor: colors,
          borderWidth: 1.5,
          hoverBorderWidth: 2.5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: c => `  ${c.label}: ${Helpers.fmt(c.raw)}`,
            },
          },
        },
        cutout: '62%',
      },
    });

    // Render custom legend
    const legendEl = document.getElementById(legendContainerId);
    if (legendEl) {
      legendEl.innerHTML = labels.map((l, i) => `
        <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2)">
          <span style="width:8px;height:8px;border-radius:2px;background:${colors[i]};flex-shrink:0"></span>
          ${l}
        </span>`).join('');
    }
  }

  /* ── Trend line chart (all months) ───────────────────────── */
  function trendLine(canvasId) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const monthMap = DB.monthlyMap();
    const sorted = Object.keys(monthMap).sort();

    if (!sorted.length) {
      canvas.parentElement.innerHTML = emptyChartHtml('No data available yet');
      return;
    }

    instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: sorted.map(k => Helpers.monthLabel(k)),
        datasets: [{
          label: 'Monthly savings',
          data: sorted.map(k => monthMap[k]),
          borderColor: '#22d3a0',
          backgroundColor: 'rgba(34,211,160,0.07)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#22d3a0',
          tension: 0.35,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => '  ' + Helpers.fmt(c.raw) } },
        },
        scales: baseScales(),
      },
    });
  }

  /* ── Cumulative area chart ────────────────────────────────── */
  function cumulativeLine(canvasId) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const entries = [...DB.getEntries()].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!entries.length) {
      canvas.parentElement.innerHTML = emptyChartHtml('No entries to chart');
      return;
    }

    let cumSum = 0;
    const cumData = entries.map(e => { cumSum += Number(e.amount); return cumSum; });

    instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: entries.map(e => e.date),
        datasets: [{
          label: 'Total saved',
          data: cumData,
          borderColor: '#7c6dfa',
          backgroundColor: 'rgba(124,109,250,0.07)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => '  ' + Helpers.fmt(c.raw) } },
        },
        scales: {
          x: { display: false },
          y: {
            grid: { color: GRID_COLOR },
            ticks: {
              color: TICK_COLOR,
              font: { size: TICK_SIZE },
              callback: v => Helpers.fmtShort(v),
            },
          },
        },
      },
    });
  }

  /* ── Hourly bar chart for a single day ───────────────────── */
  function hourlyBar(canvasId, dateISO) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const entries = DB.getEntries().filter(e => e.date === dateISO);
    if (!entries.length) {
      canvas.parentElement.innerHTML = emptyChartHtml('No entries for this day');
      return;
    }

    // Bucket into hours 0-23
    const hourBuckets = Array(24).fill(0);
    entries.forEach(e => {
      const h = e.time ? parseInt(e.time.split(':')[0]) : 12;
      hourBuckets[h] += Number(e.amount);
    });
    const labels = Array.from({ length: 24 }, (_, i) => {
      const suffix = i >= 12 ? 'PM' : 'AM';
      return (i % 12 || 12) + suffix;
    });

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Amount',
          data: hourBuckets,
          backgroundColor: hourBuckets.map(v => v > 0 ? 'rgba(34,211,160,0.28)' : 'rgba(42,42,58,0.4)'),
          borderColor: hourBuckets.map(v => v > 0 ? '#22d3a0' : 'transparent'),
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => c.raw > 0 ? '  ' + Helpers.fmt(c.raw) : '  —' } },
        },
        scales: {
          x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 9 }, maxRotation: 45 } },
          y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: TICK_SIZE }, callback: v => v > 0 ? Helpers.fmtShort(v) : '' } },
        },
      },
    });
  }

  /* ── Daily bar chart for the last N days ─────────────────── */
  function dailyBar(canvasId, days) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const map = DB.dailyMap();
    const now = new Date();
    const labels = [], data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const short = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      labels.push(short);
      data.push(map[key] || 0);
    }

    if (data.every(v => v === 0)) {
      canvas.parentElement.innerHTML = emptyChartHtml(`No entries in the last ${days} days`);
      return;
    }

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Daily savings',
          data,
          backgroundColor: data.map(v => v > 0 ? 'rgba(124,109,250,0.25)' : 'rgba(42,42,58,0.3)'),
          borderColor: data.map(v => v > 0 ? '#7c6dfa' : 'transparent'),
          borderWidth: 1.5,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(124,109,250,0.45)',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => c.raw > 0 ? '  ' + Helpers.fmt(c.raw) : '  No entry' } },
        },
        scales: {
          x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 45 } },
          y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: TICK_SIZE }, callback: v => v > 0 ? Helpers.fmtShort(v) : '' } },
        },
      },
    });
  }

  /* ── Weekly bar chart for last N weeks ──────────────────── */
  function weeklyBar(canvasId, weeks) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const map = DB.weeklyMap();
    const now = new Date();
    const labels = [], data = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const key = DB.isoWeekKey(d);
      // Label: "Mon DD MMM"
      const weekStart = new Date(d);
      const day = weekStart.getDay() || 7;
      weekStart.setDate(weekStart.getDate() - day + 1);
      labels.push(weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      data.push(map[key] || 0);
    }

    if (data.every(v => v === 0)) {
      canvas.parentElement.innerHTML = emptyChartHtml(`No entries in the last ${weeks} weeks`);
      return;
    }

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Weekly savings',
          data,
          backgroundColor: 'rgba(59,130,246,0.22)',
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderRadius: 5,
          hoverBackgroundColor: 'rgba(59,130,246,0.42)',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => '  ' + Helpers.fmt(c.raw) } },
        },
        scales: {
          x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 40 } },
          y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: TICK_SIZE }, callback: v => Helpers.fmtShort(v) } },
        },
      },
    });
  }

  /* ── Yearly bar chart ────────────────────────────────────── */
  function yearlyBar(canvasId) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const map = DB.yearlyMap();
    const years = Object.keys(map).sort();

    if (!years.length) {
      canvas.parentElement.innerHTML = emptyChartHtml('No data to show yet');
      return;
    }

    instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Yearly savings',
          data: years.map(y => map[y]),
          backgroundColor: 'rgba(245,158,11,0.22)',
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(245,158,11,0.42)',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => '  ' + Helpers.fmt(c.raw) } },
        },
        scales: {
          x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: TICK_SIZE } } },
          y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: TICK_SIZE }, callback: v => Helpers.fmtShort(v) } },
        },
      },
    });
  }

  /* ── Empty chart placeholder ──────────────────────────────── */
  function emptyChartHtml(msg) {
    return `<div class="empty-state" style="padding:36px 0">
      <i class="ti ti-chart-bar"></i>
      <p>${msg}</p>
    </div>`;
  }

  return { monthlyBar, sourceDoughnut, trendLine, cumulativeLine, hourlyBar, dailyBar, weeklyBar, yearlyBar, destroy };
})();
