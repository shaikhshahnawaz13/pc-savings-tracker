/* ============================================================
   exportData.js — Export entries as XLSX, CSV, JSON, or PDF
   Includes: entries (with time), goal, and components
   ============================================================ */

const ExportData = (() => {

  /* ── Render page ──────────────────────────────────────────── */
  function render() {
    const page = document.getElementById('page-export');
    if (!page) return;

    const entries    = DB.getEntries();
    const total      = DB.totalSavings();
    const goal       = DB.getGoal();
    const components = DB.getComponents();
    const count      = entries.length;

    page.innerHTML = `
      <div class="page-header">
        <h1>Export Data</h1>
        <p>Download everything — entries, goal, and components — in your preferred format.</p>
      </div>

      <div class="grid-3 section-gap" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">

        <div class="card hover-lift" style="text-align:center">
          <div style="width:54px;height:54px;background:rgba(34,211,160,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <i class="ti ti-file-spreadsheet" style="font-size:26px;color:var(--green)"></i>
          </div>
          <div style="font-size:15px;font-weight:600;margin-bottom:5px">Excel</div>
          <div class="text-sm text-muted" style="margin-bottom:18px">.xlsx · 3 sheets</div>
          <button class="btn btn-success" style="width:100%;justify-content:center"
                  onclick="ExportData.toXLSX()" ${!count ? 'disabled' : ''}>
            <i class="ti ti-download"></i>Download .xlsx
          </button>
        </div>

        <div class="card hover-lift" style="text-align:center">
          <div style="width:54px;height:54px;background:rgba(59,130,246,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <i class="ti ti-file-text" style="font-size:26px;color:var(--blue)"></i>
          </div>
          <div style="font-size:15px;font-weight:600;margin-bottom:5px">CSV</div>
          <div class="text-sm text-muted" style="margin-bottom:18px">.csv · includes goal</div>
          <button class="btn btn-ghost" style="width:100%;justify-content:center"
                  onclick="ExportData.toCSV()" ${!count ? 'disabled' : ''}>
            <i class="ti ti-download"></i>Download .csv
          </button>
        </div>

        <div class="card hover-lift" style="text-align:center">
          <div style="width:54px;height:54px;background:rgba(124,109,250,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <i class="ti ti-file-code" style="font-size:26px;color:var(--accent2)"></i>
          </div>
          <div style="font-size:15px;font-weight:600;margin-bottom:5px">JSON</div>
          <div class="text-sm text-muted" style="margin-bottom:18px">.json · full backup</div>
          <button class="btn btn-ghost" style="width:100%;justify-content:center"
                  onclick="ExportData.toJSON()" ${!count ? 'disabled' : ''}>
            <i class="ti ti-download"></i>Download .json
          </button>
        </div>

        <div class="card hover-lift" style="text-align:center">
          <div style="width:54px;height:54px;background:rgba(239,68,68,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <i class="ti ti-file-type-pdf" style="font-size:26px;color:#ef4444"></i>
          </div>
          <div style="font-size:15px;font-weight:600;margin-bottom:5px">PDF</div>
          <div class="text-sm text-muted" style="margin-bottom:18px">.pdf · printable report</div>
          <button class="btn btn-ghost" style="width:100%;justify-content:center"
                  onclick="ExportData.toPDF()" ${!count ? 'disabled' : ''}>
            <i class="ti ti-download"></i>Download .pdf
          </button>
        </div>

      </div>

      <!-- Summary card -->
      <div class="card section-gap">
        <div class="card-header">
          <span class="card-title">EXPORT SUMMARY</span>
          <span class="text-xs text-muted">${count} entries · ${components.length} components</span>
        </div>

        <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:${components.length ? '16px' : '0'}">
          <div>
            <div class="text-xs text-muted" style="margin-bottom:3px">TOTAL SAVED</div>
            <div class="mono text-green" style="font-size:18px;font-weight:500">${Helpers.fmt(total)}</div>
          </div>
          ${goal ? `
            <div>
              <div class="text-xs text-muted" style="margin-bottom:3px">GOAL — ${goal.name}</div>
              <div class="mono" style="font-size:18px;font-weight:500;color:var(--amber)">${Helpers.fmt(goal.target)}</div>
            </div>
            <div>
              <div class="text-xs text-muted" style="margin-bottom:3px">PROGRESS</div>
              <div class="mono" style="font-size:18px;font-weight:500;color:var(--accent2)">${Helpers.pct(total, goal.target)}%</div>
            </div>` : ''}
        </div>

        ${components.length ? `
          <div style="margin-bottom:16px">
            <div class="text-xs text-muted" style="margin-bottom:8px;letter-spacing:0.5px">COMPONENTS INCLUDED</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${components.map(c => `
                <span style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;
                             padding:3px 10px;font-size:12px;color:var(--text2)">
                  ${c.name}${c.price ? ` <span class="mono" style="color:var(--green)">₹${Number(c.price).toLocaleString('en-IN')}</span>` : ''}
                </span>`).join('')}
            </div>
          </div>` : ''}

        ${count ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>DATE</th><th>TIME</th><th>AMOUNT</th><th>SOURCE</th><th>NOTES</th></tr></thead>
              <tbody>
                ${[...entries]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 8)
                  .map(e => `
                    <tr>
                      <td>${e.date}</td>
                      <td class="text-muted">${e.time || '—'}</td>
                      <td class="mono text-green">${Helpers.fmt(e.amount)}</td>
                      <td><span class="badge ${SOURCE_BADGE[e.source] || 'badge-gray'}">${e.source}</span></td>
                      <td class="text-muted">${e.notes || '—'}</td>
                    </tr>`).join('')}
              </tbody>
            </table>
          </div>
          ${count > 8 ? `<p class="text-xs text-muted" style="text-align:center;margin-top:8px">… and ${count - 8} more entries</p>` : ''}
        ` : `<div class="empty-state" style="padding:24px 0">
              <i class="ti ti-inbox"></i>
              <p>No entries to export yet.</p>
            </div>`}
      </div>
    `;
  }

  /* ── Download helper ──────────────────────────────────────── */
  function download(filename, type, content) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function timestamp() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ── CSV export ───────────────────────────────────────────── */
  function toCSV() {
    const entries    = DB.getEntries();
    if (!entries.length) { Toast.show('No entries to export.', 'error'); return; }

    const goal       = DB.getGoal();
    const components = DB.getComponents();
    const goalName   = goal ? goal.name   : '';
    const goalTarget = goal ? goal.target : '';

    const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;

    // Entries section
    const header = 'amount,date,time,source,notes,goal_name,goal_target\n';
    const rows   = entries.map(e =>
      [e.amount, e.date, e.time || '', esc(e.source), esc(e.notes || ''), esc(goalName), goalTarget].join(',')
    ).join('\n');

    // Components section appended at bottom
    let compSection = '';
    if (components.length) {
      compSection = '\n\n# COMPONENTS\nname,price\n' +
        components.map(c => `${esc(c.name)},${c.price || 0}`).join('\n');
    }

    download(`pc-savings-${timestamp()}.csv`, 'text/csv', header + rows + compSection);
    Toast.show('CSV downloaded!');
  }

  /* ── JSON export ──────────────────────────────────────────── */
  function toJSON() {
    const data = DB.exportAll();
    if (!data.entries.length) { Toast.show('No entries to export.', 'error'); return; }
    download(`pc-savings-${timestamp()}.json`, 'application/json', JSON.stringify(data, null, 2));
    Toast.show('JSON backup downloaded!');
  }

  /* ── XLSX export ──────────────────────────────────────────── */
  function toXLSX() {
    const entries    = DB.getEntries();
    if (!entries.length) { Toast.show('No entries to export.', 'error'); return; }
    if (typeof XLSX === 'undefined') { Toast.show('Excel library failed to load. Try CSV instead.', 'error'); return; }

    try {
      const goal       = DB.getGoal();
      const components = DB.getComponents();
      const total      = DB.totalSavings();

      // Sheet 1 — Savings entries
      const rows = entries.map(e => ({
        'Amount'      : Number(e.amount),
        'Date'        : e.date,
        'Time'        : e.time || '',
        'Source'      : e.source,
        'Notes'       : e.notes || '',
        'Goal Name'   : goal ? goal.name           : '',
        'Goal (Rs.)'  : goal ? Number(goal.target) : '',
      }));
      const wsEntries = XLSX.utils.json_to_sheet(rows);
      wsEntries['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 10 },
        { wch: 22 }, { wch: 36 }, { wch: 24 }, { wch: 14 },
      ];

      // Sheet 2 — Summary
      const summaryRows = [
        { Key: 'Total Saved (Rs.)',   Value: total },
        { Key: 'Number of Entries',   Value: entries.length },
        { Key: 'Goal Name',           Value: goal ? goal.name           : 'Not set' },
        { Key: 'Goal Amount (Rs.)',   Value: goal ? Number(goal.target) : 'Not set' },
        { Key: 'Progress (%)',        Value: goal ? Helpers.pct(total, goal.target) : '-' },
        { Key: 'Components Count',    Value: components.length },
        { Key: 'Exported On',         Value: new Date().toLocaleString('en-IN') },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 22 }, { wch: 18 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsEntries, 'Savings');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Sheet 3 — Components (if any)
      if (components.length) {
        const compRows = components.map(c => ({
          'Component'  : c.name,
          'Price (Rs.)': c.price ? Number(c.price) : 0,
        }));
        const wsComps = XLSX.utils.json_to_sheet(compRows);
        wsComps['!cols'] = [{ wch: 26 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, wsComps, 'Components');
      }

      XLSX.writeFile(wb, `pc-savings-${timestamp()}.xlsx`);
      Toast.show('Excel file downloaded!');
    } catch (err) {
      console.error('[ExportData] XLSX error:', err);
      Toast.show('Export failed. Please try again.', 'error');
    }
  }

  /* ── PDF export ───────────────────────────────────────────── */
  function toPDF() {
    const entries    = DB.getEntries();
    if (!entries.length) { Toast.show('No entries to export.', 'error'); return; }
    if (typeof window.jspdf === 'undefined') { Toast.show('PDF library failed to load. Try XLSX instead.', 'error'); return; }

    try {
      const { jsPDF } = window.jspdf;
      const doc        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const goal       = DB.getGoal();
      const components = DB.getComponents();
      const total      = DB.totalSavings();
      const dateStr    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      // ── Header bar ──
      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PC Build Savings Tracker', 14, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 180);
      doc.text('Exported on ' + dateStr, 14, 20);
      doc.text(entries.length + ' records', 196, 20, { align: 'right' });

      // ── Summary boxes ──
      const boxes = [
        { label: 'TOTAL SAVED',  value: 'Rs.' + total.toLocaleString('en-IN'),                                  color: [34, 211, 160]  },
        { label: 'ENTRIES',      value: String(entries.length),                                                  color: [124, 109, 250] },
        { label: 'GOAL',         value: goal ? 'Rs.' + Number(goal.target).toLocaleString('en-IN') : 'Not set', color: [245, 158, 11]  },
        { label: 'PROGRESS',     value: goal ? Helpers.pct(total, goal.target) + '%' : '-',                     color: [59, 130, 246]  },
      ];
      const boxW = 43, boxH = 18, boxY = 33, gap = 4, startX = 14;
      boxes.forEach((b, i) => {
        const x = startX + i * (boxW + gap);
        doc.setFillColor(20, 20, 30);
        doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'F');
        doc.setDrawColor(...b.color);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'S');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(130, 130, 150);
        doc.text(b.label, x + boxW / 2, boxY + 6, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...b.color);
        doc.text(b.value, x + boxW / 2, boxY + 14, { align: 'center' });
      });

      let cursorY = boxY + boxH + 6;

      // ── Goal name ──
      if (goal && goal.name) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 180);
        doc.text('Goal: ' + goal.name, 14, cursorY);
        cursorY += 7;
      }

      // ── Entries table ──
      const sorted = [...entries].sort((a, b) => {
        const cmp = new Date(b.date) - new Date(a.date);
        return cmp !== 0 ? cmp : (b.time || '').localeCompare(a.time || '');
      });

      doc.autoTable({
        startY: cursorY,
        head: [['#', 'DATE', 'TIME', 'AMOUNT (Rs.)', 'SOURCE', 'NOTES']],
        body: sorted.map((e, i) => [
          i + 1, e.date, e.time || '-',
          Number(e.amount).toLocaleString('en-IN'),
          e.source, e.notes || '-',
        ]),
        styles:             { fontSize: 8, cellPadding: 3, textColor: [220, 220, 230], fillColor: [14, 14, 22], lineColor: [40, 40, 55], lineWidth: 0.2 },
        headStyles:         { fillColor: [20, 20, 35], textColor: [140, 130, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [18, 18, 28] },
        columnStyles: {
          0: { cellWidth: 8,  halign: 'center' },
          1: { cellWidth: 26 },
          2: { cellWidth: 18 },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 32 },
          5: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 100);
          doc.text('PC Build Savings Tracker  ·  Page ' + data.pageNumber + ' of ' + pageCount, 105, 290, { align: 'center' });
        },
      });

      // ── Components table (if any) ──
      if (components.length) {
        const compTotal = components.reduce((s, c) => s + Number(c.price || 0), 0);
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 10,
          head: [['COMPONENT', 'PRICE (Rs.)']],
          body: [
            ...components.map(c => [c.name, c.price ? Number(c.price).toLocaleString('en-IN') : '-']),
            [{ content: 'TOTAL COMPONENT COST', styles: { fontStyle: 'bold', textColor: [140, 130, 255] } },
             { content: compTotal.toLocaleString('en-IN'), styles: { fontStyle: 'bold', halign: 'right', textColor: [34, 211, 160] } }],
          ],
          styles:             { fontSize: 8, cellPadding: 3, textColor: [220, 220, 230], fillColor: [14, 14, 22], lineColor: [40, 40, 55], lineWidth: 0.2 },
          headStyles:         { fillColor: [20, 20, 35], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 7 },
          alternateRowStyles: { fillColor: [18, 18, 28] },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 40, halign: 'right' },
          },
          margin: { left: 14, right: 14 },
        });
      }

      doc.save('pc-savings-' + timestamp() + '.pdf');
      Toast.show('PDF downloaded!');
    } catch (err) {
      console.error('[ExportData] PDF error:', err);
      Toast.show('PDF export failed. Please try again.', 'error');
    }
  }

  return { render, toCSV, toJSON, toXLSX, toPDF };
})();
