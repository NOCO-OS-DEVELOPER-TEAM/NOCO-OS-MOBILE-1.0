/**
 * NOCO AI Actions 2.0 — System-Befehle direkt angebunden
 */
(function initNocoAIActions(global) {
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

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const THEME_IDS = ["aurora", "midnight", "sunset", "forest"];

  function parseThemeId(q) {
    for (const id of THEME_IDS) {
      if (q.includes(id)) return id;
    }
    if (/\b(dunkel|dark|nacht)\b/.test(q)) return "midnight";
    if (/\b(sonne|warm|orange)\b/.test(q)) return "sunset";
    if (/\b(wald|gruen|grün|natur)\b/.test(q)) return "forest";
    if (/\b(aurora|standard|default|normal)\b/.test(q)) return "aurora";
    return null;
  }

  const COMMANDS = [
    {
      test: (q, raw) =>
        /\b(oeffne|offne|open|starte|zeig|mach)\s+(die\s+)?(theme|themes|design)\s*(app|anwendung)?\b/.test(q) ||
        /\b(theme|themes|design)\s*app\b/.test(q) ||
        /^(theme|themes|design app)$/i.test(String(raw || "").trim()),
      run: (h) => h.openThemes?.() || h.openApp?.("themes"),
      text: "Oeffne die <strong>Theme-App</strong> …",
      topic: "themes"
    },
    {
      test: (q) =>
        (/\b(theme|design|look|farben|aussehen)\b/.test(q) &&
          /\b(wechsel|aendern|andern|ander|change|setze|mach|stell|auf)\b/.test(q)) ||
        /\b(design aendern|design andern|change design|neues design)\b/.test(q),
      run: (h, q) => {
        const id = parseThemeId(q) || "midnight";
        h.setTheme?.(id, { syncWallpaper: true });
        h.showToast?.("Theme: " + id);
      },
      text: (h, q) => {
        const id = parseThemeId(q) || "midnight";
        return `<p>Wechsle Theme zu <strong>${id}</strong> …</p>`;
      },
      topic: "themes"
    },
    {
      test: (q) => /\btheme\s+(aurora|midnight|sunset|forest)\b/.test(q),
      run: (h, q) => {
        const id = parseThemeId(q) || "aurora";
        h.setTheme?.(id);
      },
      text: (h, q) => `<p>Theme <strong>${parseThemeId(q) || "aurora"}</strong> …</p>`,
      topic: "themes"
    },
    {
      test: (q, raw) => {
        const t = String(raw || "").trim();
        return (
          /^(oeffne|offne|open|starte|zeig|mach)\s+(die\s+)?app\s*$/i.test(t) ||
          /^(oeffne|offne|open)\s+app\s*$/i.test(t) ||
          q === "app offnen" ||
          q === "app oeffnen"
        );
      },
      text: "<p>Welche App? Nenne z. B. <strong>«Oeffne Themes»</strong>, <strong>«Oeffne Forge»</strong> oder <strong>«Oeffne Timer»</strong>.</p>",
      textOnly: true,
      topic: "open"
    },
    {
      test: (q, raw) => {
        const m = String(raw || "").match(
          /(?:oeffne|offne|open|starte|zeig|mach(?:\s+auf)?|launch|hol|bring)\s+(?:die\s+)?(?:app\s+)?(.+)/i
        );
        if (!m) return false;
        const tail = norm(m[1]);
        if (!tail || tail.length < 2) return false;
        if (/^(app|anwendung|eine app)$/i.test(m[1].trim())) return false;
        return true;
      },
      run: (h, q, raw) => {
        const m = String(raw || "").match(
          /(?:oeffne|offne|open|starte|zeig|mach(?:\s+auf)?)\s+(?:die\s+)?(?:app\s+)?(.+)/i
        );
        const tail = norm(m ? m[1] : "");
        const hit = global.NocoAI?.resolveAppFromQuery?.(tail, 52);
        if (hit?.appId) {
          h.openApp?.(hit.appId);
          return;
        }
        if (/\b(theme|themes|design)\b/.test(tail)) {
          h.openThemes?.() || h.openApp?.("themes");
          return;
        }
        const res = global.NocoAI?.processMessage?.(m[1].trim(), h);
        if (res?.type === "action" && res.run) res.run();
        else if (res?.offerRun) res.offerRun();
      },
      text: (h, q, raw) => {
        const m = String(raw || "").match(
          /(?:oeffne|offne|open|starte|zeig|mach(?:\s+auf)?)\s+(?:die\s+)?(?:app\s+)?(.+)/i
        );
        const tail = m ? m[1].trim() : "App";
        return `<p>Oeffne <strong>${tail.replace(/</g, "")}</strong> …</p>`;
      },
      topic: "open",
      needsRaw: true
    },
    {
      test: (q) => /\b(schliesse|schliesse|close|beende)\s+(die\s+)?(app|anwendung)\b/.test(q) || q === "zurueck zur startseite",
      run: (h) => {
        h.closeCurrentApp?.();
      },
      text: "Schliesse die aktuelle App …",
      topic: "nav"
    },
    {
      test: (q) => /\b(gehe|wechsel)\s+zu\s+home\b/.test(q) || q === "nach home" || q === "zur startseite",
      run: (h) => h.goToPage?.(0),
      text: "Wechsle zu <strong>Home</strong> …",
      topic: "nav"
    },
    {
      test: (q) => /\b(gehe|wechsel)\s+zu\s+apps\b/.test(q) || q === "zur bibliothek" || q === "app bibliothek",
      run: (h) => h.goToPage?.(1),
      text: "Wechsle zur <strong>App-Bibliothek</strong> …",
      topic: "nav"
    },
    {
      test: (q) => /\b(bearbeitungsmodus|edit modus)\s+(an|ein|starten|aktivieren)\b/.test(q) || q === "edit mode an",
      run: (h) => {
        h.goToPage?.(0);
        window.setTimeout(() => h.enableEditMode?.(), 200);
      },
      text: "Aktiviere <strong>Edit-Modus</strong> auf Home …",
      topic: "edit"
    },
    {
      test: (q) => /\b(bearbeitungsmodus|edit modus)\s+(aus|beenden|stop)\b/.test(q) || q === "edit mode aus",
      run: (h) => h.disableEditMode?.(),
      text: "Beende <strong>Edit-Modus</strong> …",
      topic: "edit"
    },
    {
      test: (q) => /\b(oeffne|offne|open)\s+(widget|widgets)\s*(panel|auswahl)?\b/.test(q) || q === "widgets hinzufuegen panel",
      run: (h) => h.openWidgetPanel?.(),
      text: "Oeffne <strong>Widget-Auswahl</strong> …",
      topic: "widgets"
    },
    {
      test: (q) => /\b(zeige|oeffne)\s+(core|einstellungen)\s*tab\b/.test(q) || q === "core bibliothek",
      run: (h) => h.openLibraryTab?.("core"),
      text: "Bibliothek → Tab <strong>Core</strong> …",
      topic: "library"
    },
    {
      test: (q) => /\b(zeige|oeffne)\s+forge\s*tab\b/.test(q) || q === "forge bibliothek",
      run: (h) => h.openLibraryTab?.("forge"),
      text: "Bibliothek → Tab <strong>Forge</strong> …",
      topic: "library"
    },
    {
      test: (q) => /\b(zeige|oeffne)\s+spiele\s*tab\b/.test(q) || q === "spiele bibliothek",
      run: (h) => h.openLibraryTab?.("games"),
      text: "Bibliothek → Tab <strong>Spiele</strong> …",
      topic: "library"
    },
    {
      test: (q) => /\b(sprachmodus|wake word|hoeren)\s+(an|ein|aktivieren)\b/.test(q) || q === "noco ai hoeren",
      run: (h) => {
        global.NocoAIVoice?.setWakeEnabled?.(true);
        h.showToast?.("«NOCO AI» hoeren — Mikro erlauben");
      },
      text: "<strong>Wake-Word</strong> aktiv — sage «NOCO AI» …",
      topic: "voice"
    },
    {
      test: (q) => /\b(sprachmodus|wake word|hoeren)\s+(aus|deaktivieren)\b/.test(q) || q === "noco ai nicht hoeren",
      run: () => {
        global.NocoAIVoice?.setWakeEnabled?.(false);
      },
      text: "<strong>Wake-Word</strong> aus …",
      topic: "voice"
    },
    {
      test: (q) => /\b(mikro|mikrofon|spracheingabe)\s+(hilfe|info)\b/.test(q),
      text: "<p><strong>Mikro:</strong> Wake «NOCO AI» oeffnet die App. Im Chat: Mikro-Button = Diktat. Toggle <strong>Hoeren</strong> = Hintergrund-Wake.</p>",
      topic: "voice",
      textOnly: true
    },
    {
      test: (q) => /\b(vollbild|fullscreen)\s+ai\b/.test(q) || q === "ai vollbild",
      run: (h) => h.openApp?.("nocoai"),
      text: "NOCO AI im <strong>Vollbild</strong> …",
      topic: "nocoai"
    },
    {
      test: (q) => /\b(zeige|was ist)\s+build\b/.test(q) || q === "build version",
      run: null,
      text: (h) => {
        const b = h.getBuild?.() || "?";
        return `<p>Build <strong>${esc(b)}</strong> · NOCO AI Wissen <strong>2.0</strong>.</p>`;
      },
      topic: "meta",
      textOnly: true
    },
    {
      test: (q) => /\b(wo bin ich|aktueller ort|meine position im system)\b/.test(q),
      run: null,
      text: (h) => {
        const page = h.getCurrentPage?.() === 1 ? "Apps" : "Home";
        const app = h.getCurrentApp?.();
        if (app) {
          const t = h.getAppTitle?.(app) || app;
          return `<p>App: <strong>${esc(t)}</strong> · Seite: <strong>${page}</strong>${h.isEditMode?.() ? " · Edit" : ""}.</p>`;
        }
        return `<p>Seite: <strong>${page}</strong>${h.isEditMode?.() ? " · Edit-Modus" : ""}.</p>`;
      },
      topic: "context",
      textOnly: true
    },
    {
      test: (q) => /\b(liste|zeig)\s+(home\s+)?widgets\b/.test(q) || q === "meine widgets",
      run: null,
      text: (h) => {
        const ids = h.listHomeWidgets?.() || [];
        const lines = ids.map((id) => esc(h.getWidgetTitle?.(id) || id)).join(", ");
        return `<p>Home-Widgets: <strong>${lines || "keine"}</strong>.</p>`;
      },
      topic: "widgets",
      textOnly: true
    },
    {
      test: (q) => /\b(standard|reset)\s+widgets\b/.test(q) || q === "widgets zuruecksetzen",
      run: (h) => h.resetHomeWidgets?.(),
      text: "Setze <strong>Standard-Widgets</strong> …",
      topic: "widgets"
    },
    {
      test: (q) => /\b(widget pack|ki widgets|ai widgets)\b/.test(q),
      run: (h) => h.setHomeWidgetPack?.("ai"),
      text: "<p>Setze <strong>Widget Pack AI</strong> …</p>",
      topic: "widgets"
    },
    {
      test: (q) => /\b(zeig|wie viel)\s+(guthaben|kontostand|balance)\b/.test(q) || q === "guthaben",
      run: (h) => h.openPay?.(),
      text: (h) => {
        const s = h.getSystemSnapshot?.() || {};
        return `<p>Guthaben: <strong>${esc(s.payBalance || "0 EUR")}</strong> — oeffne Pay …</p>`;
      },
      topic: "pay"
    },
    {
      test: (q) => /\b(mehr|starker)\s+(liquid\s+)?glass\b/.test(q) || q === "glas modus",
      run: (h) => h.enableGlassMode?.(),
      text: "<p><strong>Liquid Glass</strong> verstaerkt …</p>",
      topic: "glass"
    },
    {
      test: (q) => /\bmehr\s+performance\b/.test(q),
      run: (h) => {
        h.setSettingToggle?.("glassBoost", false);
        h.setSettingToggle?.("motion", false);
        h.setSettingToggle?.("liveWallpaper", false);
      },
      text: "<p><strong>Performance-Modus:</strong> Glas/Motion reduziert …</p>",
      topic: "perf"
    },
    {
      test: (q) => /\bweniger\s+performance\b/.test(q),
      run: (h) => h.enableGlassMode?.(),
      text: "<p><strong>Glas-Modus</strong> wieder staerker …</p>",
      topic: "perf"
    },
    {
      test: (q) => /\b(tastatur|keyboard)\s+(schliessen|zu|weg)\b/.test(q),
      run: (h) => h.dismissKeyboard?.(),
      text: "Tastatur geschlossen.",
      topic: "ui"
    },
    {
      test: (q) => /\b(exclusive|plus)\s+status\b/.test(q),
      run: null,
      text: (h) => {
        const on = h.isExclusiveActive?.();
        return `<p>Exclusive: <strong>${on ? "aktiv" : "nicht aktiv"}</strong>.</p>`;
      },
      topic: "exclusive",
      textOnly: true
    }
  ];

  function resolveText(cmd, q, helpers, raw) {
    if (typeof cmd.text === "function") return cmd.text(helpers, q, raw);
    return cmd.text || "";
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!q) return null;

    for (const cmd of COMMANDS) {
      const ok = cmd.test.length >= 2 ? cmd.test(q, raw) : cmd.test(q);
      if (!ok) continue;
      const body = cmd.needsRaw ? resolveText(cmd, q, helpers, raw) : resolveText(cmd, q, helpers);
      if (cmd.textOnly) {
        return { type: "text", text: body, rememberTopic: cmd.topic };
      }
      const inner = body.replace(/^<p>|<\/p>$/g, "");
      return {
        type: "action",
        text: body.startsWith("<") ? body : `<p>${body}</p>`,
        run: () => {
          try {
            if (cmd.needsRaw) cmd.run?.(helpers, q, raw);
            else cmd.run?.(helpers, q);
          } catch (_) {}
        },
        rememberTopic: cmd.topic
      };
    }
    return null;
  }

  function smartFallback(text, helpers) {
    const q = norm(text);
    if (q.length < 5) return null;
    if (/\b(was ist|wie|wo|warum)\b/.test(q)) return global.NocoAIKnowledge?.smartHint?.(text, helpers) || null;
    return null;
  }

  global.NocoAIActions = { process, smartFallback, norm };
})(typeof window !== "undefined" ? window : globalThis);
