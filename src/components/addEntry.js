/* ============================================================
   addEntry.js — Add / Edit savings entry page
   ============================================================ */

const AddEntry = (() => {

  let editingId = null; // null = new entry, string = editing existing

  /* ── Render page ──────────────────────────────────────────── */
  function render(prefill) {
    const page = document.getElementById('page-add');
    if (!page) return;

    const f = prefill || {};
    const nowTime = Helpers.currentTime();

    page.innerHTML = `
      <div class="max-560">
        <div class="page-header">
          <h1>${editingId ? 'Edit Entry' : 'Add Savings Entry'}</h1>
          <p>${editingId ? 'Update the details of this savings entry.' : 'Record a new savings amount to track your progress.'}</p>
        </div>

        <div class="card">
          <form id="entryForm" onsubmit="AddEntry.submit(event)" novalidate>

            <!-- Row 1: Amount + Source -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="fAmount">Amount (₹) *</label>
                <input
                  class="form-input"
                  type="number"
                  id="fAmount"
                  placeholder="e.g. 5000"
                  min="1"
                  step="1"
                  value="${f.amount || ''}"
                  autocomplete="off"
                  required
                />
                <div class="form-error" id="errAmount"></div>
              </div>

              <div class="form-group">
                <label class="form-label" for="fSource">Source of Income *</label>
                <select class="form-select" id="fSource" required>
                  <option value="">Select a source…</option>
                  ${SOURCES.map(s =>
                    `<option value="${s}" ${f.source === s ? 'selected' : ''}>${s}</option>`
                  ).join('')}
                </select>
                <div class="form-error" id="errSource"></div>
              </div>
            </div>

            <!-- Row 2: Date + Time -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="fDate">Date *</label>
                <input
                  class="form-input"
                  type="date"
                  id="fDate"
                  value="${f.date || Helpers.todayISO()}"
                  max="${Helpers.todayISO()}"
                  required
                />
                <div class="form-error" id="errDate"></div>
              </div>

              <div class="form-group">
                <label class="form-label" for="fTime">Time *</label>
                <input
                  class="form-input"
                  type="time"
                  id="fTime"
                  value="${f.time || nowTime}"
                  required
                />
                <div class="form-error" id="errTime"></div>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label class="form-label" for="fNotes">Notes <span class="text-muted">(optional)</span></label>
              <textarea
                class="form-textarea"
                id="fNotes"
                placeholder="e.g. Freelance logo project payment…"
                rows="3"
              >${f.notes || ''}</textarea>
              <div class="form-hint">Add any context or reminder about this saving.</div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap">
              <button type="submit" class="btn btn-primary">
                <i class="ti ${editingId ? 'ti-device-floppy' : 'ti-check'}"></i>
                ${editingId ? 'Update Entry' : 'Save Entry'}
              </button>
              <button type="button" class="btn btn-ghost" onclick="AddEntry.reset()">
                <i class="ti ti-refresh"></i>Clear
              </button>
              ${editingId ? `
                <button type="button" class="btn btn-danger" onclick="AddEntry.cancelEdit()">
                  <i class="ti ti-x"></i>Cancel
                </button>` : ''}
            </div>

          </form>
        </div>

        <!-- Source reference card -->
        <div class="card" style="margin-top:14px">
          <div class="card-header"><span class="card-title">INCOME SOURCES</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${SOURCES.map(s =>
              `<span class="badge ${SOURCE_BADGE[s] || 'badge-gray'}">${s}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Submit / validate ────────────────────────────────────── */
  function submit(e) {
    e.preventDefault();

    const amount = Number(document.getElementById('fAmount').value);
    const date   = document.getElementById('fDate').value;
    const time   = document.getElementById('fTime').value;
    const source = document.getElementById('fSource').value;
    const notes  = document.getElementById('fNotes').value.trim();

    // Clear errors
    ['errAmount', 'errDate', 'errTime', 'errSource'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });

    let valid = true;

    if (!amount || amount <= 0) {
      document.getElementById('errAmount').textContent = 'Amount must be a positive number.';
      valid = false;
    }
    if (!date) {
      document.getElementById('errDate').textContent = 'Please select a date.';
      valid = false;
    }
    if (!time) {
      document.getElementById('errTime').textContent = 'Please enter a time.';
      valid = false;
    }
    if (!source) {
      document.getElementById('errSource').textContent = 'Please select an income source.';
      valid = false;
    }

    if (!valid) return;

    if (editingId) {
      DB.updateEntry(editingId, { amount, date, time, source, notes });
      Toast.show('Entry updated successfully.');
      editingId = null;
    } else {
      DB.addEntry({ amount, date, time, source, notes });
      Toast.show('Entry saved!');
    }

    App.navigate('history', null);
  }

  /* ── Load entry for editing ───────────────────────────────── */
  function startEdit(id) {
    const entry = DB.getEntries().find(e => e.id === id);
    if (!entry) return;
    editingId = id;
    App.navigate('add', null);
    // Render after page is shown
    setTimeout(() => render(entry), 30);
  }

  /* ── Reset form ───────────────────────────────────────────── */
  function reset() {
    editingId = null;
    render();
  }

  /* ── Cancel edit ──────────────────────────────────────────── */
  function cancelEdit() {
    editingId = null;
    App.navigate('history', null);
  }

  return { render, submit, startEdit, reset, cancelEdit };
})();
