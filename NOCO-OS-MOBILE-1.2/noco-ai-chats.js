/**
 * NOCO AI — Multi-Chat Speicher (localStorage + Speicher-Fallback)
 */
(function initNocoAIChats(global) {
  const STORAGE_KEY = "noco_mobile_ai_chats_v1";
  const MAX_CHATS = 24;
  const MAX_MESSAGES_PER_CHAT = 80;

  const WELCOME_HTML =
    "<p><strong>NOCO AI</strong> — ich kenne dein System.</p><p>Frag <strong>«Wo ist Forge?»</strong>, <strong>«Wo bin ich?»</strong> oder <strong>«Was steht an?»</strong>. Ein Wort reicht: Timer · Notizen · Apps.</p>";

  let memoryStore = null;
  let storageOk = true;

  function createId() {
    return "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function createDefaultStore() {
    const id = createId();
    return {
      activeId: id,
      chats: [
        {
          id,
          name: "Hauptchat",
          messages: [{ role: "bot", html: WELCOME_HTML, ts: Date.now() }],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
    };
  }

  function sanitizeStore(store) {
    const chats = store.chats
      .filter((c) => c && c.id)
      .slice(0, MAX_CHATS)
      .map((c) => ({
        id: String(c.id),
        name: String(c.name || "Chat").slice(0, 40),
        messages: Array.isArray(c.messages) ? c.messages.slice(-MAX_MESSAGES_PER_CHAT) : [],
        createdAt: c.createdAt || Date.now(),
        updatedAt: c.updatedAt || Date.now()
      }));
    if (!chats.length) {
      const fresh = createDefaultStore();
      saveStore(fresh);
      return fresh;
    }
    let activeId = store.activeId;
    if (!chats.some((c) => c.id === activeId)) activeId = chats[0].id;
    return { activeId, chats };
  }

  function saveStore(store) {
    memoryStore = store;
    if (!storageOk) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {
      storageOk = false;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      } catch (_) {}
    }
  }

  function loadStore() {
    const tryParse = (raw) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.chats?.length && parsed.activeId) return sanitizeStore(parsed);
      } catch (_) {}
      return null;
    };

    try {
      const fromLs = tryParse(localStorage.getItem(STORAGE_KEY));
      if (fromLs) {
        memoryStore = fromLs;
        return fromLs;
      }
    } catch (_) {
      storageOk = false;
    }

    try {
      const fromSs = tryParse(sessionStorage.getItem(STORAGE_KEY));
      if (fromSs) {
        memoryStore = fromSs;
        return fromSs;
      }
    } catch (_) {}

    if (memoryStore?.chats?.length) return memoryStore;

    const store = createDefaultStore();
    saveStore(store);
    return store;
  }

  let store = loadStore();

  function reload() {
    store = loadStore();
    return store;
  }

  function flush() {
    saveStore(store);
  }

  function getActiveChat() {
    return store.chats.find((c) => c.id === store.activeId) || store.chats[0];
  }

  function listChats() {
    return store.chats.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function setActive(id) {
    if (!store.chats.some((c) => c.id === id)) return false;
    store.activeId = id;
    saveStore(store);
    return true;
  }

  function createChat(name) {
    const id = createId();
    const chat = {
      id,
      name: (name || `Chat ${store.chats.length + 1}`).slice(0, 40),
      messages: [{ role: "bot", html: WELCOME_HTML, ts: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    store.chats.unshift(chat);
    if (store.chats.length > MAX_CHATS) store.chats = store.chats.slice(0, MAX_CHATS);
    store.activeId = id;
    saveStore(store);
    return chat;
  }

  function renameChat(id, name) {
    const chat = store.chats.find((c) => c.id === id);
    if (!chat || !String(name || "").trim()) return false;
    chat.name = String(name).trim().slice(0, 40);
    chat.updatedAt = Date.now();
    saveStore(store);
    return true;
  }

  function deleteChat(id) {
    if (store.chats.length <= 1) return false;
    store.chats = store.chats.filter((c) => c.id !== id);
    if (store.activeId === id) store.activeId = store.chats[0].id;
    saveStore(store);
    return true;
  }

  function addMessage(role, html, chatId) {
    const id = chatId || store.activeId;
    const chat = store.chats.find((c) => c.id === id);
    if (!chat) return;
    chat.messages.push({ role, html, ts: Date.now() });
    if (chat.messages.length > MAX_MESSAGES_PER_CHAT) {
      chat.messages = chat.messages.slice(-MAX_MESSAGES_PER_CHAT);
    }
    chat.updatedAt = Date.now();
    saveStore(store);
  }

  function getMessages(chatId) {
    const chat = store.chats.find((c) => c.id === (chatId || store.activeId));
    return chat ? chat.messages.slice() : [];
  }

  function isDefaultChatName(name) {
    return /^(Hauptchat|Chat \d+)$/i.test(String(name || "").trim());
  }

  function autoNameFromMessage(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const q = raw.toLowerCase();
    if (/\b(hilfe|help|hallo|hi|hey)\b/.test(q) && raw.length < 24) return "Begruessung";
    const openMatch = raw.match(/(?:oeffne|offne|open|starte|zeig)\s+(.+)/i);
    if (openMatch) return `Oeffne ${openMatch[1].trim().slice(0, 22)}`;
    const noteMatch = raw.match(/(?:notiz|note).{0,20}(?:titel|ueberschrift|headline)\s+(.+)/i);
    if (noteMatch) return `Notiz: ${noteMatch[1].trim().slice(0, 20)}`;
    if (/\b(was kann|what can|wie geht|smalltalk)\b/i.test(raw)) return "Fragen & Ideen";
    const words = raw.replace(/[^\w\säöüÄÖÜß-]/gi, " ").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    const label = words.slice(0, 5).join(" ");
    return label.length > 32 ? `${label.slice(0, 30)}…` : label;
  }

  function stripHtml(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

  function searchChats(query, options = {}) {
    const limit = options.limit ?? 5;
    const preferQuestions = !!options.preferQuestions;
    let terms = tokenizeSearch(query);
    if (!terms.length && preferQuestions) terms = ["frage", "hilfe", "wie", "was"];

    const scored = store.chats.map((chat) => {
      let score = 0;
      const nameL = chat.name.toLowerCase();
      terms.forEach((t) => {
        if (nameL.includes(t)) score += 42;
      });

      (chat.messages || []).forEach((m) => {
        const plain = (m.role === "user" ? m.html : stripHtml(m.html)).toLowerCase();
        terms.forEach((t) => {
          if (plain.includes(t)) score += m.role === "user" ? 28 : 10;
        });
        if (preferQuestions && m.role === "user") {
          if (plain.includes("?") || /\b(wie|was|warum|wieso|wer|when|why|how)\b/.test(plain)) score += 22;
        }
      });

      if (preferQuestions && /frage|question|gefragt/i.test(nameL)) score += 18;
      return { id: chat.id, name: chat.name, score, updatedAt: chat.updatedAt };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  function maybeAutoRenameActive(userMessage) {
    const chat = getActiveChat();
    if (!chat || !isDefaultChatName(chat.name)) return false;
    const userCount = (chat.messages || []).filter((m) => m.role === "user").length;
    if (userCount > 1) return false;
    const name = autoNameFromMessage(userMessage);
    if (!name) return false;
    return renameChat(chat.id, name);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
  }

  global.NocoAIChats = {
    reload,
    flush,
    listChats,
    getActiveChat,
    setActive,
    createChat,
    renameChat,
    deleteChat,
    addMessage,
    getMessages,
    maybeAutoRenameActive,
    searchChats,
    WELCOME_HTML
  };
})(window);
