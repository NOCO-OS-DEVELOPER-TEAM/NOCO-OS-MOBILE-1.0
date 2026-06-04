/**
 * NOCO Notizen — mehrere Notizen (localStorage)
 */
(function initNocoNotes(global) {
  const STORAGE_KEY = "noco_mobile_notes_v1";
  const LEGACY_KEY = "noco_mobile_note";
  const MAX_NOTES = 40;

  function createId() {
    return "n_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function migrateLegacy() {
    let legacy = null;
    try {
      legacy = localStorage.getItem(LEGACY_KEY);
    } catch (_) {
      return null;
    }
    if (!legacy || !legacy.trim()) return null;
    return {
      id: createId(),
      title: "Erste Notiz",
      body: legacy.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function createDefaultStore() {
    const id = createId();
    return {
      activeId: id,
      notes: [{ id, title: "Hauptnotiz", body: "", createdAt: Date.now(), updatedAt: Date.now() }]
    };
  }

  function loadStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (raw?.notes?.length && raw.activeId) return sanitize(raw);
    } catch (_) {}
    const migrated = migrateLegacy();
    if (migrated) {
      const store = { activeId: migrated.id, notes: [migrated] };
      saveStore(store);
      return store;
    }
    const store = createDefaultStore();
    saveStore(store);
    return store;
  }

  function sanitize(store) {
    const notes = store.notes
      .filter((n) => n && n.id)
      .slice(0, MAX_NOTES)
      .map((n) => ({
        id: String(n.id),
        title: String(n.title || "Notiz").slice(0, 60),
        body: String(n.body || ""),
        createdAt: n.createdAt || Date.now(),
        updatedAt: n.updatedAt || Date.now()
      }));
    if (!notes.length) {
      const fresh = createDefaultStore();
      saveStore(fresh);
      return fresh;
    }
    let activeId = store.activeId;
    if (!notes.some((n) => n.id === activeId)) activeId = notes[0].id;
    return { activeId, notes };
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      const active = store.notes.find((n) => n.id === store.activeId);
      if (active) localStorage.setItem(LEGACY_KEY, active.body);
    } catch (_) {}
  }

  let store = loadStore();

  function reload() {
    store = loadStore();
    return store;
  }

  function getActiveNote() {
    return store.notes.find((n) => n.id === store.activeId) || store.notes[0];
  }

  function listNotes() {
    return store.notes.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function setActive(id) {
    if (!store.notes.some((n) => n.id === id)) return false;
    store.activeId = id;
    saveStore(store);
    return true;
  }

  function createNote(title, body = "") {
    const id = createId();
    const note = {
      id,
      title: String(title || `Notiz ${store.notes.length + 1}`).trim().slice(0, 60) || "Neue Notiz",
      body: String(body || ""),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    store.notes.unshift(note);
    if (store.notes.length > MAX_NOTES) store.notes = store.notes.slice(0, MAX_NOTES);
    store.activeId = id;
    saveStore(store);
    return note;
  }

  function updateNote(id, { title, body }) {
    const note = store.notes.find((n) => n.id === id);
    if (!note) return null;
    if (title != null) note.title = String(title).trim().slice(0, 60) || note.title;
    if (body != null) note.body = String(body);
    note.updatedAt = Date.now();
    saveStore(store);
    return note;
  }

  function deleteNote(id) {
    if (store.notes.length <= 1) return false;
    store.notes = store.notes.filter((n) => n.id !== id);
    if (store.activeId === id) store.activeId = store.notes[0].id;
    saveStore(store);
    return true;
  }

  const TASK_HINTS = ["aufgabe", "aufgaben", "task", "tasks", "todo", "to do", "erledigen", "checkliste", "liste", "einkauf"];

  function tokenizeSearch(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);
  }

  /**
   * @param {string} query
   * @param {{ preferTasks?: boolean, limit?: number }} [options]
   */
  function searchNotes(query, options = {}) {
    const limit = options.limit ?? 5;
    const preferTasks = !!options.preferTasks;
    let terms = tokenizeSearch(query);
    if (preferTasks) TASK_HINTS.forEach((h) => {
      if (!terms.includes(h)) terms.push(h);
    });
    terms = [...new Set(terms)];

    const scored = store.notes.map((note) => {
      let score = 0;
      const titleL = note.title.toLowerCase();
      const bodyL = (note.body || "").toLowerCase();
      const blob = `${titleL} ${bodyL}`;

      terms.forEach((t) => {
        if (titleL.includes(t)) score += 40;
        if (bodyL.includes(t)) score += 32;
      });

      if (preferTasks) {
        TASK_HINTS.forEach((h) => {
          if (blob.includes(h)) score += 26;
        });
      }

      return { id: note.id, title: note.title, score, updatedAt: note.updatedAt, preview: (note.body || "").slice(0, 80) };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  global.NocoNotes = {
    reload,
    listNotes,
    getActiveNote,
    setActive,
    createNote,
    updateNote,
    deleteNote,
    searchNotes
  };
})(window);
