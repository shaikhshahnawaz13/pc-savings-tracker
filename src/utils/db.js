/* ============================================================
   db.js — LocalStorage database wrapper
   All data lives in the browser. No server required.
   ============================================================ */

const DB = (() => {
  const KEY_ENTRIES    = 'pcbt_entries';
  const KEY_GOAL       = 'pcbt_goal';
  const KEY_COMPONENTS = 'pcbt_components';

  /* ── Internal helpers ─────────────────────────────────────── */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('[DB] write error:', err);
      return false;
    }
  }

  function makeId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* ── Entries ──────────────────────────────────────────────── */
  function getEntries() {
    return read(KEY_ENTRIES, []);
  }

  function addEntry(data) {
    const entries = getEntries();
    const entry = { ...data, id: makeId(), createdAt: new Date().toISOString() };
    entries.push(entry);
    write(KEY_ENTRIES, entries);
    return entry;
  }

  function updateEntry(id, data) {
    const entries = getEntries().map(e =>
      e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
    );
    write(KEY_ENTRIES, entries);
  }

  function deleteEntry(id) {
    write(KEY_ENTRIES, getEntries().filter(e => e.id !== id));
  }

  function bulkAddEntries(newEntries) {
    const entries = getEntries();
    const makeKey = e => `${e.date}_${e.time || ''}_${Number(e.amount)}_${e.source}`;
    const existingKeys = new Set(entries.map(makeKey));

    let added = 0;
    let skipped = 0;

    newEntries.forEach(row => {
      const e = {
        amount : Number(row.amount || row.Amount || 0),
        date   : String(row.date   || row.Date   || '').slice(0, 10),
        time   : String(row.time   || row.Time   || '').slice(0, 5),
        source : row.source || row.Source || 'Other',
        notes  : row.notes  || row.Notes  || '',
      };
      if (!e.amount || !e.date || isNaN(e.amount)) { skipped++; return; }
      const key = makeKey(e);
      if (existingKeys.has(key)) { skipped++; return; }
      e.id = makeId();
      e.createdAt = new Date().toISOString();
      entries.push(e);
      existingKeys.add(key);
      added++;
    });

    write(KEY_ENTRIES, entries);
    return { added, skipped };
  }

  /* ── Goal ─────────────────────────────────────────────────── */
  function getGoal() {
    return read(KEY_GOAL, null);
  }

  function setGoal(goal) {
    write(KEY_GOAL, goal);
  }

  function clearGoal() {
    localStorage.removeItem(KEY_GOAL);
  }

  /* ── Components ───────────────────────────────────────────── */
  function getComponents() {
    return read(KEY_COMPONENTS, []);
  }

  function addComponent(comp) {
    const comps = getComponents();
    const item = { ...comp, id: makeId() };
    comps.push(item);
    write(KEY_COMPONENTS, comps);
    return item;
  }

  function deleteComponent(id) {
    write(KEY_COMPONENTS, getComponents().filter(c => c.id !== id));
  }

  /* ── FULL OVERWRITE — imported file is source of truth ───── */
  function replaceAll(backup) {
    const result = {
      entriesLoaded    : 0,
      goalLoaded       : false,
      componentsLoaded : 0,
    };

    // Always wipe everything first
    localStorage.removeItem(KEY_ENTRIES);
    localStorage.removeItem(KEY_GOAL);
    localStorage.removeItem(KEY_COMPONENTS);

    // Load entries exactly as in file
    if (Array.isArray(backup.entries) && backup.entries.length) {
      const cleaned = backup.entries
        .map(row => ({
          id        : row.id || makeId(),
          amount    : Number(row.amount || row.Amount || 0),
          date      : String(row.date   || row.Date   || '').slice(0, 10),
          time      : String(row.time   || row.Time   || '').slice(0, 5),
          source    : row.source || row.Source || 'Other',
          notes     : row.notes  || row.Notes  || '',
          createdAt : row.createdAt || new Date().toISOString(),
        }))
        .filter(e => e.amount && e.date && !isNaN(e.amount));
      write(KEY_ENTRIES, cleaned);
      result.entriesLoaded = cleaned.length;
    }

    // Load goal exactly as in file
    if (backup.goal) {
      write(KEY_GOAL, backup.goal);
      result.goalLoaded = true;
    }

    // Load components exactly as in file
    if (Array.isArray(backup.components) && backup.components.length) {
      const cleaned = backup.components
        .filter(c => c.name)
        .map(c => ({ id: c.id || makeId(), name: c.name, price: c.price || 0 }));
      write(KEY_COMPONENTS, cleaned);
      result.componentsLoaded = cleaned.length;
    }

    return result;
  }

  /* ── Stats helpers ────────────────────────────────────────── */
  function totalSavings() {
    return getEntries().reduce((s, e) => s + Number(e.amount), 0);
  }

  function currentMonthSavings() {
    const now = new Date();
    return getEntries()
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + Number(e.amount), 0);
  }

  function monthlyMap() {
    const map = {};
    getEntries().forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + Number(e.amount);
    });
    return map;
  }

  function sourceMap() {
    const map = {};
    getEntries().forEach(e => {
      map[e.source] = (map[e.source] || 0) + Number(e.amount);
    });
    return map;
  }

  function dailyMap() {
    const map = {};
    getEntries().forEach(e => {
      map[e.date] = (map[e.date] || 0) + Number(e.amount);
    });
    return map;
  }

  function weeklyMap() {
    const map = {};
    getEntries().forEach(e => {
      const key = isoWeekKey(new Date(e.date));
      map[key] = (map[key] || 0) + Number(e.amount);
    });
    return map;
  }

  function yearlyMap() {
    const map = {};
    getEntries().forEach(e => {
      const year = e.date.slice(0, 4);
      map[year] = (map[year] || 0) + Number(e.amount);
    });
    return map;
  }

  function isoWeekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  function todaySavings() {
    const today = new Date().toISOString().slice(0, 10);
    return getEntries()
      .filter(e => e.date === today)
      .reduce((s, e) => s + Number(e.amount), 0);
  }

  function thisWeekSavings() {
    const nowKey = isoWeekKey(new Date());
    return getEntries()
      .filter(e => isoWeekKey(new Date(e.date)) === nowKey)
      .reduce((s, e) => s + Number(e.amount), 0);
  }

  function thisYearSavings() {
    const year = String(new Date().getFullYear());
    return getEntries()
      .filter(e => e.date.startsWith(year))
      .reduce((s, e) => s + Number(e.amount), 0);
  }

  // Day streak: counts consecutive days ending today (or yesterday if nothing today yet).
  // Only shows ≥1 if you saved yesterday AND today, or a run ending yesterday.
  // A single isolated day = streak of 1 only if it's today; no cross-period inflation.
  function dayStreak() {
    const map = dailyMap();
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    // Find the most recent day with savings to anchor the streak
    let anchor = 0; // how many days back the streak anchor is
    if (map[todayKey]) {
      anchor = 0; // streak can include today
    } else {
      // Check yesterday — if no savings today, streak may still be alive from yesterday
      const yd = new Date(now); yd.setDate(now.getDate() - 1);
      const ydKey = yd.toISOString().slice(0, 10);
      if (map[ydKey]) anchor = 1;
      else return 0; // gap of 2+ days, streak is broken
    }

    let streak = 0;
    for (let i = anchor; i < 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (map[key]) streak++;
      else break;
    }
    return streak;
  }

  // Week streak: counts consecutive ISO weeks ending this week or last week.
  function weekStreak() {
    const map = weeklyMap();
    const now = new Date();
    const thisWeekKey = isoWeekKey(now);
    const lastWeekDate = new Date(now); lastWeekDate.setDate(now.getDate() - 7);
    const lastWeekKey = isoWeekKey(lastWeekDate);

    let anchor = 0;
    if (map[thisWeekKey]) {
      anchor = 0;
    } else if (map[lastWeekKey]) {
      anchor = 1; // this week has no savings yet, but last week did
    } else {
      return 0;
    }

    let streak = 0;
    for (let i = anchor; i < 52; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const key = isoWeekKey(d);
      if (map[key]) streak++;
      else break;
    }
    return streak;
  }

  // Month streak: counts consecutive calendar months ending this month or last month.
  function monthStreak() {
    const map = monthlyMap();
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;

    let anchor = 0;
    if (map[thisMonthKey]) {
      anchor = 0;
    } else if (map[lastMonthKey]) {
      anchor = 1;
    } else {
      return 0;
    }

    let streak = 0;
    for (let i = anchor; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map[key]) streak++;
      else break;
    }
    return streak;
  }

  // Year streak: counts consecutive calendar years ending this year or last year.
  function yearStreak() {
    const map = yearlyMap();
    const nowYear = new Date().getFullYear();
    const thisYearKey = String(nowYear);
    const lastYearKey = String(nowYear - 1);

    let anchor = 0;
    if (map[thisYearKey]) {
      anchor = 0;
    } else if (map[lastYearKey]) {
      anchor = 1;
    } else {
      return 0;
    }

    let streak = 0;
    for (let i = anchor; i < 10; i++) {
      const key = String(nowYear - i);
      if (map[key]) streak++;
      else break;
    }
    return streak;
  }

  function savingStreak() { return monthStreak(); }

  /* ── Export all data ──────────────────────────────────────── */
  function exportAll() {
    return {
      entries    : getEntries(),
      goal       : getGoal(),
      components : getComponents(),
      exportedAt : new Date().toISOString(),
      version    : '3',
    };
  }

  /* ── Legacy merge restore (kept for compatibility) ────────── */
  function restoreAll(backup, mode = 'merge') {
    return replaceAll(backup);
  }

  return {
    getEntries, addEntry, updateEntry, deleteEntry, bulkAddEntries,
    getGoal, setGoal, clearGoal,
    getComponents, addComponent, deleteComponent,
    totalSavings, currentMonthSavings,
    todaySavings, thisWeekSavings, thisYearSavings,
    dailyMap, weeklyMap, monthlyMap, yearlyMap,
    sourceMap, isoWeekKey,
    savingStreak, dayStreak, weekStreak, monthStreak, yearStreak,
    exportAll, replaceAll, restoreAll,
  };
})();
