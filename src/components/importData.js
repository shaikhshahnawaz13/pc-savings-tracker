/* ============================================================
   importData.js — Import records from CSV / JSON / XLSX
   FILE IS ALWAYS SOURCE OF TRUTH — existing data is replaced.
   ============================================================ */

const ImportData = (() => {

  /* ── Render page ──────────────────────────────────────────── */
  function render() {
    const page = document.getElementById('page-import');
    if (!page) return;

    page.innerHTML = `
      <div class="max-640">
        <div class="page-header">
          <h1>Import Records</h1>
          <p>Upload a saved export to restore your data. <strong style="color:var(--red,#ef4444)">This completely replaces your current data</strong> — the file is always the source of truth.</p>
        </div>

        <!-- Warning banner -->
        <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);
                    border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;
                    display:flex;align-items:flex-start;gap:10px">
          <i class="ti ti-alert-triangle" style="color:#ef4444;font-size:18px;flex-shrink:0;margin-top:1px"></i>
          <div>
            <div style="font-size:13px;font-weight:600;color:#ef4444;margin-bottom:3px">Overwrite mode</div>
            <div class="text-xs text-muted">Any entries, goal, or components you have added manually will be replaced by the contents of the file. Add new entries <em>after</em> importing.</div>
          </div>
        </div>

        <div class="card section-gap">
          <div class="card-header"><span class="card-title">UPLOAD FILE</span></div>

          <!-- Drop zone -->
          <div
            class="upload-area"
            id="uploadArea"
            onclick="document.getElementById('fileInput').click()"
            ondragover="event.preventDefault();document.getElementById('uploadArea').classList.add('drag')"
            ondragleave="document.getElementById('uploadArea').classList.remove('drag')"
            ondrop="ImportData.handleDrop(event)"
            role="button"
            aria-label="Click or drag file to upload"
            tabindex="0"
          >
            <i class="ti ti-upload upload-icon"></i>
            <div class="upload-title">Drop file here or click to browse</div>
            <div class="upload-sub">Supports .json · .xlsx · .csv</div>
            <input
              type="file"
              id="fileInput"
              accept=".csv,.json,.xlsx"
              style="display:none"
              onchange="ImportData.handleInput(this)"
            />
          </div>

          <!-- Result panel -->
          <div id="importResult"></div>
        </div>

        <!-- Format guide -->
        <div class="card">
          <div class="card-header"><span class="card-title">EXPECTED FORMAT</span></div>
          <p class="text-sm text-muted" style="margin-bottom:14px">
            Best to use a file exported from this app (.json keeps everything including goal and components). For CSV/XLSX, the following columns are supported:
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>COLUMN</th><th>TYPE</th><th>EXAMPLE</th><th>REQUIRED</th></tr>
              </thead>
              <tbody>
                <tr><td style="color:var(--text)">amount</td><td class="text-muted">Number</td><td class="mono text-muted">5000</td><td><span class="badge badge-red">Yes</span></td></tr>
                <tr><td style="color:var(--text)">date</td><td class="text-muted">YYYY-MM-DD</td><td class="mono text-muted">2024-03-15</td><td><span class="badge badge-red">Yes</span></td></tr>
                <tr><td style="color:var(--text)">time</td><td class="text-muted">HH:MM</td><td class="mono text-muted">14:30</td><td><span class="badge badge-gray">No</span></td></tr>
                <tr><td style="color:var(--text)">source</td><td class="text-muted">Text</td><td class="mono text-muted">Freelancing</td><td><span class="badge badge-amber">No*</span></td></tr>
                <tr><td style="color:var(--text)">notes</td><td class="text-muted">Text</td><td class="mono text-muted">Logo project</td><td><span class="badge badge-gray">No</span></td></tr>
                <tr><td style="color:var(--text)">goal_name</td><td class="text-muted">Text</td><td class="mono text-muted">Dream PC</td><td><span class="badge badge-gray">No</span></td></tr>
                <tr><td style="color:var(--text)">goal_target</td><td class="text-muted">Number</td><td class="mono text-muted">80000</td><td><span class="badge badge-gray">No</span></td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted" style="margin-top:10px">* Defaults to "Other" if not provided or unrecognised.</p>
          <div style="margin-top:14px">
            <div class="text-xs text-muted" style="margin-bottom:8px;letter-spacing:0.5px">VALID SOURCE VALUES</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${SOURCES.map(s => `<span class="badge ${SOURCE_BADGE[s] || 'badge-gray'}">${s}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ── Drag & drop ──────────────────────────────────────────── */
  function handleDrop(e) {
    e.preventDefault();
    const area = document.getElementById('uploadArea');
    if (area) area.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleInput(input) {
    const file = input.files[0];
    if (file) processFile(file);
    input.value = '';
  }

  /* ── File processing ──────────────────────────────────────── */
  function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    showLoading();

    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          // Full JSON backup (has entries/goal/components)
          if (data.entries || data.goal || data.components) {
            applyFullBackup(data, file.name);
          } else if (Array.isArray(data)) {
            // Raw array of entries
            applyFullBackup({ entries: data }, file.name);
          } else {
            showError('Invalid JSON format. Please use a file exported from this app.');
          }
        } catch {
          showError('Invalid JSON file. Please check the format.');
        }
      };
      reader.readAsText(file);

    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          if (typeof XLSX === 'undefined') { showError('Excel library not loaded. Please refresh and try again.'); return; }
          const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
          // First sheet = Savings entries
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

          // Try to read Summary sheet for goal
          let goal = null;
          const summarySheet = wb.Sheets['Summary'];
          if (summarySheet) {
            const summaryRows = XLSX.utils.sheet_to_json(summarySheet, { defval: '' });
            const nameRow   = summaryRows.find(r => String(r['Key'] || '').toLowerCase().includes('goal name'));
            const targetRow = summaryRows.find(r => String(r['Key'] || '').toLowerCase().includes('goal amount'));
            if (nameRow && targetRow && targetRow['Value'] && !isNaN(Number(targetRow['Value']))) {
              goal = { name: String(nameRow['Value']), target: Number(targetRow['Value']) };
            }
          }

          // Try to read Components sheet
          let components = [];
          const compSheet = wb.Sheets['Components'];
          if (compSheet) {
            const compRows = XLSX.utils.sheet_to_json(compSheet, { defval: '' });
            components = compRows
              .filter(r => r['Component'] || r['Name'] || r['name'])
              .map(r => ({
                name  : r['Component'] || r['Name'] || r['name'] || '',
                price : Number(r['Price (Rs.)'] || r['Price'] || r['price'] || 0),
              }))
              .filter(c => c.name);
          }

          applyFullBackup({ entries: rows, goal, components }, file.name);
        } catch (err) {
          console.error(err);
          showError('Could not read Excel file. Ensure it is a valid .xlsx exported from this app.');
        }
      };
      reader.readAsArrayBuffer(file);

    } else if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = e => {
        const rows = Helpers.parseCSV(e.target.result);
        // Try to read goal from goal_name / goal_target columns of first data row
        let goal = null;
        if (rows.length > 0) {
          const r = rows[0];
          const gName   = r['goal_name']   || r['Goal Name']   || '';
          const gTarget = r['goal_target'] || r['Goal Target'] || r['goal_amount'] || '';
          if (gName && gTarget && !isNaN(Number(gTarget))) {
            goal = { name: gName, target: Number(gTarget) };
          }
        }
        applyFullBackup({ entries: rows, goal, components: [] }, file.name);
      };
      reader.readAsText(file);

    } else {
      showError('Unsupported file type. Please upload a .json, .xlsx, or .csv file.');
    }
  }

  /* ── Apply backup — always full overwrite ─────────────────── */
  function applyFullBackup(backup, filename) {
    // Normalise source values in entries
    if (Array.isArray(backup.entries)) {
      backup.entries = backup.entries.map(r => {
        const src = r.source || r.Source || '';
        return { ...r, source: SOURCES.includes(src) ? src : 'Other' };
      });
    }

    const result = DB.replaceAll(backup);
    showResult(filename, result);
  }

  /* ── UI helpers ───────────────────────────────────────────── */
  function showLoading() {
    const el = document.getElementById('importResult');
    if (el) el.innerHTML = `
      <div style="text-align:center;padding:20px 0;color:var(--text3)">
        <i class="ti ti-loader-2 spin" style="font-size:24px"></i>
        <p class="text-sm" style="margin-top:8px">Replacing data…</p>
      </div>`;
  }

  function showError(msg) {
    const el = document.getElementById('importResult');
    if (el) el.innerHTML = `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
                  border-radius:var(--radius);padding:14px 16px;margin-top:16px;
                  display:flex;align-items:center;gap:10px">
        <i class="ti ti-alert-circle" style="color:var(--red,#ef4444);font-size:18px;flex-shrink:0"></i>
        <span class="text-sm" style="color:var(--red,#ef4444)">${msg}</span>
      </div>`;
    Toast.show(msg, 'error');
  }

  function showResult(filename, result) {
    const el = document.getElementById('importResult');
    if (!el) return;

    const goal       = DB.getGoal();
    const components = DB.getComponents();
    const total      = DB.totalSavings();

    el.innerHTML = `
      <div style="background:var(--bg3);border:1px solid var(--border);
                  border-radius:var(--radius);padding:18px;margin-top:16px" class="fade-in">

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <i class="ti ti-circle-check" style="color:var(--green);font-size:18px"></i>
          <span style="font-size:14px;font-weight:600">Data replaced successfully</span>
          <span class="text-xs text-muted" style="margin-left:auto">${filename}</span>
        </div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
          <div style="text-align:center;padding:12px;background:rgba(34,211,160,0.07);border:1px solid rgba(34,211,160,0.15);border-radius:var(--radius-sm)">
            <div class="mono text-xs" style="color:var(--green);margin-bottom:4px">ENTRIES</div>
            <div class="mono" style="font-size:22px;font-weight:600;color:var(--green)">${result.entriesLoaded}</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg4);border-radius:var(--radius-sm)">
            <div class="mono text-xs text-muted" style="margin-bottom:4px">TOTAL SAVED</div>
            <div class="mono" style="font-size:16px;font-weight:600;color:var(--text)">${Helpers.fmt(total)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg4);border-radius:var(--radius-sm)">
            <div class="mono text-xs text-muted" style="margin-bottom:4px">COMPONENTS</div>
            <div class="mono" style="font-size:22px;font-weight:600;color:var(--text)">${result.componentsLoaded}</div>
          </div>
        </div>

        <!-- Goal row -->
        ${result.goalLoaded && goal ? `
          <div style="background:rgba(124,109,250,0.07);border:1px solid rgba(124,109,250,0.2);
                      border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;
                      display:flex;align-items:center;justify-content:space-between">
            <div>
              <div class="text-xs text-muted" style="margin-bottom:2px">GOAL RESTORED</div>
              <div style="font-size:13px;font-weight:600;color:var(--accent2)">${goal.name}</div>
            </div>
            <div class="mono" style="font-size:15px;font-weight:600;color:var(--amber)">${Helpers.fmt(goal.target)}</div>
          </div>` : ''}

        <!-- Components list -->
        ${result.componentsLoaded > 0 ? `
          <div style="background:var(--bg4);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px">
            <div class="text-xs text-muted" style="margin-bottom:8px;letter-spacing:0.5px">COMPONENTS LOADED</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${components.map(c => `
                <span style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;
                             padding:3px 10px;font-size:12px;color:var(--text2)">
                  ${c.name}${c.price ? ` <span class="mono" style="color:var(--green)">₹${Number(c.price).toLocaleString('en-IN')}</span>` : ''}
                </span>`).join('')}
            </div>
          </div>` : ''}

        <!-- Action buttons -->
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" style="flex:1;justify-content:center"
                  onclick="App.navigate('dashboard', null)">
            <i class="ti ti-layout-dashboard"></i>View Dashboard
          </button>
          <button class="btn btn-ghost" style="flex:1;justify-content:center"
                  onclick="App.navigate('history', null)">
            <i class="ti ti-table"></i>View History
          </button>
        </div>
      </div>`;

    Toast.show(`Loaded ${result.entriesLoaded} entries from file`);

    // Re-render dashboard in background so it's fresh when user navigates there
    if (typeof Dashboard !== 'undefined') Dashboard.render();
  }

  return { render, handleDrop, handleInput };
})();
