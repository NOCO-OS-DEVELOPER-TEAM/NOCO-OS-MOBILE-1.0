/**
 * NOCO Memory — lokale Erinnerungen mit Countdown
 */
(function initNocoReminders(global) {
  const STORAGE_KEY = "noco_mobile_reminders_v1";
  let tickHandle = null;
  const listeners = new Set();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw.filter((r) => r && r.text) : [];
    } catch (_) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 48)));
    } catch (_) {
      return;
    }
    listeners.forEach((fn) => {
      try {
        fn(list);
      } catch (_) {}
    });
  }

  function active(list = load()) {
    return list.filter((r) => !r.done && r.fireAt > Date.now() - 500);
  }

  function add({ text, delayMinutes }) {
    const mins = Math.max(1, Math.min(24 * 60, Math.floor(Number(delayMinutes) || 1)));
    const clean = String(text || "Erinnerung").trim().slice(0, 200);
    const entry = {
      id: "rem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      text: clean,
      createdAt: new Date().toISOString(),
      fireAt: Date.now() + mins * 60 * 1000,
      delayMinutes: mins,
      done: false
    };
    save([entry, ...load()]);
    return entry;
  }

  function remove(id) {
    save(load().filter((r) => r.id !== id));
  }

  function markDone(id) {
    const list = load();
    const item = list.find((r) => r.id === id);
    if (item) item.done = true;
    save(list);
  }

  function remainingMs(entry) {
    return Math.max(0, entry.fireAt - Date.now());
  }

  function formatEta(entry) {
    const ms = remainingMs(entry);
    const sec = Math.ceil(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm ? `${h}h ${rm}m` : `${h}h`;
  }

  function tick() {
    const now = Date.now();
    let list = load();
    let changed = false;
    const fired = [];
    list.forEach((r) => {
      if (r.done) return;
      if (r.fireAt <= now) {
        r.done = true;
        changed = true;
        fired.push(r);
      }
    });
    if (changed) save(list);
    fired.forEach((r) => {
      global.dispatchEvent?.(
        new CustomEvent("noco-reminder-fired", { detail: { reminder: r } })
      );
    });
  }

  function startTicker() {
    if (tickHandle) return;
    tick();
    tickHandle = window.setInterval(tick, 1000);
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  global.NocoReminders = {
    load,
    save,
    active,
    add,
    remove,
    markDone,
    remainingMs,
    formatEta,
    startTicker,
    onChange
  };
})(window);
