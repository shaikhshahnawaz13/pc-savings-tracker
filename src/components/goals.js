/* ============================================================
   goals.js — Goal tracking page
   Set total PC build goal + individual component targets
   ============================================================ */

const Goals = (() => {

  /* ── Render full page ─────────────────────────────────────── */
  function render() {
    const page = document.getElementById('page-goals');
    if (!page) return;

    const goal       = DB.getGoal();
    const components = DB.getComponents();
    const total      = DB.totalSavings();
    const goalAmt    = goal ? Number(goal.target) : 0;
    const progress   = Helpers.pct(total, goalAmt);
    const remaining  = goalAmt > 0 ? Math.max(0, goalAmt - total) : 0;

    page.innerHTML = `
      <div class="page-header">
        <h1>Goal Tracking</h1>
        <p>Set your PC build target and track individual components.</p>
      </div>

      <div class="grid-2 section-gap">

        <!-- ── Left: Main goal card ── -->
        <div class="card" style="display:flex;flex-direction:column;gap:0">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
            <div>
              <div class="text-xs text-muted" style="letter-spacing:0.8px;margin-bottom:8px">PC BUILD GOAL</div>
              <div class="mono" style="font-size:30px;font-weight:700;color:var(--accent2);line-height:1">
                ${goal ? Helpers.fmt(goalAmt) : '—'}
              </div>
              ${goal ? `<div class="text-xs text-muted" style="margin-top:6px">${goal.name || 'PC Build'}</div>` : ''}
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Goals.openGoalModal()">
              <i class="ti ${goal ? 'ti-edit' : 'ti-plus'}"></i>
              ${goal ? 'Edit Goal' : 'Set Goal'}
            </button>
          </div>

          ${goal ? `
            <div class="progress-labels">
              <span>${Helpers.fmt(total)} saved</span>
              <span class="mono" style="color:var(--accent2)">${progress}%</span>
            </div>
            <div class="progress-bar-bg" style="height:8px;margin-bottom:16px">
              <div class="progress-bar-fill" id="goalProgressFill" style="width:0%;height:100%"></div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
              <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
                <div class="text-xs text-muted" style="margin-bottom:4px">SAVED</div>
                <div class="mono text-green" style="font-size:16px;font-weight:500">${Helpers.fmt(total)}</div>
              </div>
              <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
                <div class="text-xs text-muted" style="margin-bottom:4px">REMAINING</div>
                <div class="mono" style="font-size:16px;font-weight:500;color:${remaining > 0 ? 'var(--amber)' : 'var(--green)'}">${Helpers.fmt(remaining)}</div>
              </div>
            </div>

            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
              <div class="text-xs text-muted" style="margin-bottom:4px">TARGET</div>
              <div class="mono" style="font-size:16px;font-weight:500;color:var(--accent2)">${Helpers.fmt(goalAmt)}</div>
            </div>
          ` : `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 0;text-align:center">
              <div style="width:52px;height:52px;border-radius:14px;background:rgba(124,109,250,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
                <i class="ti ti-target" style="font-size:26px;color:var(--accent2)"></i>
              </div>
              <p class="text-sm text-muted" style="margin-bottom:16px">Set your total PC build target to track your progress.</p>
              <button class="btn btn-primary btn-sm" onclick="Goals.openGoalModal()">
                <i class="ti ti-plus"></i>Set Goal
              </button>
            </div>
          `}
        </div>

        <!-- ── Right: Component targets ── -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">COMPONENT TARGETS</span>
            <button class="btn btn-ghost btn-sm" onclick="Goals.openAddComponent()">
              <i class="ti ti-plus"></i>Add
            </button>
          </div>
          <div id="componentList">
            ${renderComponentList(components, total)}
          </div>
        </div>

      </div>

      <!-- Component breakdown table -->
      ${components.length ? `
        <div class="card section-gap">
          <div class="card-header">
            <span class="card-title">COMPONENT BREAKDOWN</span>
            <span class="text-xs text-muted">
              Total: ${Helpers.fmt(components.reduce((s, c) => s + Number(c.price), 0))}
            </span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>COMPONENT</th>
                  <th>TARGET</th>
                  <th>FUNDED</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${components.map(c => {
                  const p = Helpers.pct(total, c.price);
                  const funded = Math.min(total, Number(c.price));
                  return `
                    <tr>
                      <td style="color:var(--text);font-weight:500">${c.name}</td>
                      <td class="mono" style="color:var(--text2)">${Helpers.fmt(c.price)}</td>
                      <td class="mono text-green">${Helpers.fmt(funded)}</td>
                      <td>
                        ${p >= 100
                          ? `<span class="badge badge-green"><i class="ti ti-check" style="font-size:10px"></i>Funded</span>`
                          : `<span class="badge badge-amber">${p}%</span>`}
                      </td>
                      <td>
                        <button class="btn-icon danger" onclick="Goals.deleteComponent('${c.id}')" title="Remove component">
                          <i class="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    // Animate progress bar after DOM is painted
    if (goal && goalAmt > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const fill = document.getElementById('goalProgressFill');
          if (fill) fill.style.width = progress + '%';
        });
      });
    }
  }

  /* ── Component list HTML ──────────────────────────────────── */
  function renderComponentList(components, total) {
    if (!components.length) {
      return `<div class="empty-state" style="padding:24px 0">
        <i class="ti ti-cpu"></i>
        <p>Add components to track individually.</p>
      </div>`;
    }

    return components.map(c => {
      const p = Helpers.pct(total, c.price);
      return `
        <div class="goal-component">
          <div class="goal-component-icon" style="background:rgba(124,109,250,0.1)">
            <i class="ti ${componentIcon(c.name)}" style="color:var(--accent2)"></i>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span style="font-size:13px;font-weight:500;color:var(--text)">${c.name}</span>
              <span class="mono text-xs text-muted">${Helpers.fmt(c.price)}</span>
            </div>
            <div class="progress-bar-bg" style="height:4px">
              <div class="progress-bar-fill ${p >= 100 ? 'green' : ''}" style="width:${p}%"></div>
            </div>
          </div>
          <button class="btn-icon danger" onclick="Goals.deleteComponent('${c.id}')" title="Remove">
            <i class="ti ti-x" style="font-size:12px"></i>
          </button>
        </div>`;
    }).join('');
  }

  /* ── Icon mapping for components ─────────────────────────── */
  function componentIcon(name) {
    const map = {
      'CPU': 'ti-cpu',
      'GPU': 'ti-device-desktop-analytics',
      'Motherboard': 'ti-circuit-board',
      'RAM': 'ti-brand-stackoverflow',
      'Storage (SSD)': 'ti-database',
      'Power Supply': 'ti-bolt',
      'Cabinet / Case': 'ti-box',
      'CPU Cooler': 'ti-wind',
      'Monitor': 'ti-device-desktop',
      'Keyboard': 'ti-keyboard',
      'Mouse': 'ti-mouse',
      'Headset': 'ti-headphones',
      'Speakers': 'ti-speakerphone',
      'UPS': 'ti-plug',
    };
    return map[name] || 'ti-device-desktop';
  }

  /* ── Goal modal ───────────────────────────────────────────── */
  function openGoalModal() {
    const g = DB.getGoal() || {};
    Modals.openGoal(`
      <div class="form-group">
        <label class="form-label" for="gName">Goal Name</label>
        <input class="form-input" id="gName" placeholder="My Dream PC" value="${g.name || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label" for="gTarget">Target Amount (₹) *</label>
        <input class="form-input" type="number" id="gTarget" placeholder="e.g. 150000" value="${g.target || ''}" min="1" />
        <div class="form-hint">Estimated total cost of your build.</div>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-primary" onclick="Goals.saveGoal()">
          <i class="ti ti-check"></i>Save Goal
        </button>
        ${g.target ? `
          <button class="btn btn-danger" onclick="Goals.clearGoal()">
            <i class="ti ti-trash"></i>Clear Goal
          </button>` : ''}
      </div>
    `);
  }

  function saveGoal() {
    const name   = document.getElementById('gName').value.trim();
    const target = Number(document.getElementById('gTarget').value);
    if (!target || target <= 0) {
      Toast.show('Please enter a valid target amount.', 'error');
      return;
    }
    DB.setGoal({ name: name || 'PC Build', target });
    Modals.closeGoal();
    Toast.show('Goal saved!');
    render();
  }

  function clearGoal() {
    if (!confirm('Clear your PC build goal?')) return;
    DB.clearGoal();
    Modals.closeGoal();
    Toast.show('Goal cleared.', 'info');
    render();
  }

  /* ── Add component modal ──────────────────────────────────── */
  function openAddComponent() {
    Modals.openAdd('Add Component Target', `
      <div class="form-group">
        <label class="form-label" for="cName">Component *</label>
        <select class="form-select" id="cName" onchange="Goals.onComponentChange(this)">
          <option value="">Select a component…</option>
          ${PC_COMPONENTS.map(c => `<option value="${c}">${c}</option>`).join('')}
          <option value="__custom">Custom name…</option>
        </select>
      </div>
      <div class="form-group" id="customNameWrap" style="display:none">
        <label class="form-label" for="cCustom">Custom Name *</label>
        <input class="form-input" id="cCustom" placeholder="Component name" />
      </div>
      <div class="form-group">
        <label class="form-label" for="cPrice">Target Price (₹) *</label>
        <input class="form-input" type="number" id="cPrice" placeholder="e.g. 35000" min="1" />
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-primary" onclick="Goals.saveComponent()">
          <i class="ti ti-check"></i>Add Component
        </button>
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      </div>
    `);
  }

  function onComponentChange(select) {
    const wrap = document.getElementById('customNameWrap');
    if (wrap) wrap.style.display = select.value === '__custom' ? 'block' : 'none';
  }

  function saveComponent() {
    let name = document.getElementById('cName').value;
    if (name === '__custom') {
      name = (document.getElementById('cCustom').value || '').trim();
    }
    const price = Number(document.getElementById('cPrice').value);

    if (!name || !price || price <= 0) {
      Toast.show('Please fill in all fields.', 'error');
      return;
    }

    DB.addComponent({ name, price });
    Modals.closeAdd();
    Toast.show('Component added!');
    render();
  }

  function deleteComponent(id) {
    if (!confirm('Remove this component target?')) return;
    DB.deleteComponent(id);
    Toast.show('Component removed.', 'info');
    render();
  }

  return {
    render, openGoalModal, saveGoal, clearGoal,
    openAddComponent, onComponentChange, saveComponent, deleteComponent,
  };
})();
