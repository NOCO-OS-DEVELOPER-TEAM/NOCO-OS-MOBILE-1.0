/**
 * NOCO AI — Chat-Befehle (neu, loeschen, liste)
 */
(function initNocoAIChatCmd(global) {
  function norm(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function isNewChat(q, raw) {
    const t = String(raw || "").trim();
    return (
      /\b(neuer chat|neues gespraech|neue unterhaltung|new chat|start chat)\b/.test(q) ||
      /\b(chat|gespraech)\b/.test(q) && /\b(neu|erstell|start|anlegen|mach)\b/.test(q) ||
      /^(neuer?\s+chat|new\s+chat)[\s!.]*$/i.test(t)
    );
  }

  function isDeleteChat(q, raw) {
    return (
      /\b(loesch|losch|delete|entfern)\b/.test(q) &&
      /\b(chat|gespraech|unterhaltung)\b/.test(q)
    ) || /\b(diesen chat|aktuellen chat|this chat)\b/.test(q) && /\b(loesch|losch|delete|weg)\b/.test(q);
  }

  function isListChats(q) {
    return /\b(chats|chat liste|gespraeche|unterhaltungen)\b/.test(q) && q.length < 40;
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!q) return null;

    if (isNewChat(q, raw)) {
      return {
        type: "action",
        text: "Starte einen <strong>neuen Chat</strong> — der alte Verlauf bleibt gespeichert.",
        run: () => helpers.startNewChat?.({ name: "Neuer Chat" }),
        rememberTopic: "chat"
      };
    }

    if (isDeleteChat(q, raw)) {
      return {
        type: "action",
        text: "Loesche den <strong>aktiven Chat</strong> …",
        run: () => helpers.deleteActiveChat?.(),
        rememberTopic: "chat"
      };
    }

    if (isListChats(q)) {
      return {
        type: "action",
        text: "Oeffne die <strong>Chat-Liste</strong> …",
        run: () => helpers.openChatDrawer?.(),
        rememberTopic: "chat"
      };
    }

    return null;
  }

  global.NocoAIChatCmd = { process, isNewChat, isDeleteChat };
})(typeof window !== "undefined" ? window : globalThis);
