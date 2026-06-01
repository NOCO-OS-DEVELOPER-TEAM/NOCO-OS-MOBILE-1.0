/**
 * NOCO AI — Nachrichten-Limit (offline, lokal)
 * Kostenlos: 20 Nachrichten / Tag · Unbegrenzt mit NOCO Exclusive (inkl. NOCO AI)
 */
(function initNocoAILimits(global) {
  const STORAGE_KEY = "noco_mobile_ai_usage_v1";
  const FREE_DAILY = 20;

  function dayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadStore() {
    try {
      let stored = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch (_) {
        return { date: dayKey(), count: 0 };
      }
      const raw = JSON.parse(stored || "null");
      if (raw && raw.date === dayKey()) return { date: raw.date, count: Number(raw.count) || 0 };
    } catch (_) {}
    return { date: dayKey(), count: 0 };
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  /** Unbegrenzt: NOCO Exclusive (inkl. AI) oder Legacy-Flag */
  function isPlusActive(settings) {
    return !!(settings?.nocoExclusive || settings?.exclusiveActive || settings?.nocoAiPlus || settings?.nocoAiUnlimited);
  }

  function getUsage(settings) {
    const store = loadStore();
    const exclusive = !!(settings?.nocoExclusive || settings?.exclusiveActive);
    if (isPlusActive(settings)) {
      return {
        remaining: Infinity,
        count: store.count,
        limit: Infinity,
        plus: true,
        exclusive,
        label: exclusive ? "exclusive" : "plus"
      };
    }
    const remaining = Math.max(0, FREE_DAILY - store.count);
    return { remaining, count: store.count, limit: FREE_DAILY, plus: false, exclusive: false, label: "free" };
  }

  function canSend(settings) {
    if (isPlusActive(settings)) return true;
    return getUsage(settings).remaining > 0;
  }

  function recordSend(settings) {
    const store = loadStore();
    store.count += 1;
    saveStore(store);
    return getUsage(settings);
  }

  global.NocoAILimits = {
    FREE_DAILY,
    canSend,
    recordSend,
    getUsage,
    isPlusActive
  };
})(window);
