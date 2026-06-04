/**
 * NOCO AI System Map — Wo ist was, wie funktioniert es, direkt oeffnen
 */
(function initNocoAISystemMap(global) {
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

  function hasOpenVerb(q) {
    return /\b(oeffne|offne|open|starte|zeig mir|hol mir|bring mich|geh zu|gehe zu|navigiere|fuehr mich|fuhr mich|mach auf)\b/.test(q);
  }

  function isWhereQuery(q) {
    return /\b(wo ist|wo sind|wo finde|wo liegt|wo bekomme|where is|finden|finde ich|in welcher app|in welchem tab|welcher tab|welche seite)\b/.test(q);
  }

  function isHowQuery(q) {
    return /\b(wie komme ich|wie finde ich|wie gelange|wie oeffne ich|wie offne ich|wie stelle ich|wie aktiviere|wie installiere|wie bearbeite|how do i|how to)\b/.test(q);
  }

  function isSystemOverview(q) {
    return /\b(system karte|systemkarte|ueberblick system|mein system|meine apps|was hab ich installiert|was ist installiert|zeig system|erklar system|erklaer system|alles uber noco|alles ueber noco)\b/.test(
      q
    );
  }

  /** UI & Apps — Ort, Erklaerung, optional oeffnen */
  const PLACES = [
    {
      id: "home",
      aliases: ["home", "startseite", "willkommen", "start screen", "homescreen"],
      label: "Home",
      where: "Erste Seite — wische nach <strong>rechts</strong> oder tippe in der Island den <strong>linken Punkt</strong> (Home).",
      open: (h) => h.goToPage?.(0)
    },
    {
      id: "apps",
      aliases: ["apps", "app bibliothek", "bibliothek", "desktop", "app library", "apps seite"],
      label: "App-Bibliothek",
      where: "Zweite Seite — wische nach <strong>links</strong> oder Island → <strong>Apps</strong>. Oben: Schnellzugriff, darunter Tabs Core / Forge / Spiele.",
      open: (h) => h.goToPage?.(1)
    },
    {
      id: "island",
      aliases: ["island", "insel", "notch", "dynamic island", "systemleiste", "leiste oben"],
      label: "Island",
      where: "Ganz oben: <strong>Uhr</strong>, Seiten-Punkte, <strong>✧ NOCO AI</strong>. Tippen auf die Insel = Schnellmenu (Home/Apps, Beam, Hub, Edit).",
      open: null
    },
    {
      id: "nocoai",
      appId: "nocoai",
      aliases: ["noco ai", "assistent", "ki", "ai button", "ai widget"],
      label: "NOCO AI",
      where: "Island <strong>✧</strong> oder Home-Widget <strong>NOCO AI</strong>. In Apps: Insel-Tipp → NOCO AI (wenn nicht schon offen).",
      open: (h) => h.openApp?.("nocoai")
    },
    {
      id: "beam",
      appId: "beam",
      aliases: ["beam", "suche", "spotlight", "system suche"],
      label: "NOCO Beam",
      where: "Island-Menü → <strong>Beam</strong>, Home-Button <strong>Suchen</strong>, oder «Oeffne Beam».",
      open: (h) => h.openBeam?.()
    },
    {
      id: "hub",
      appId: "hub",
      aliases: ["hub", "noco hub"],
      label: "NOCO Hub",
      where: "Island-Menü → <strong>Hub</strong> — Kurzaktionen & Systemtools.",
      open: (h) => h.openHub?.()
    },
    {
      id: "edit",
      aliases: ["bearbeiten", "edit mode", "edit modus", "home bearbeiten", "widgets bearbeiten"],
      label: "Bearbeiten (Home)",
      where: "Island aufklappen → <strong>Edit</strong>. Unten erscheint <strong>+</strong> (Widgets) und Stift (Schnellzugriff).",
      open: (h) => {
        h.goToPage?.(0);
        window.setTimeout(() => h.enableEditMode?.(), 200);
      }
    },
    {
      id: "widgets_panel",
      aliases: ["widget hinzufuegen", "widget hinzufugen", "widgets hinzufuegen", "neues widget"],
      label: "Widgets hinzufuegen",
      where: "Home → Island → <strong>Edit</strong> → unten <strong>+</strong>. Oder: «Widget Pack AI».",
      open: (h) => {
        h.goToPage?.(0);
        window.setTimeout(() => {
          h.enableEditMode?.();
          window.setTimeout(() => h.openWidgetPanel?.(), 280);
        }, 200);
      }
    },
    {
      id: "library_edit",
      aliases: ["bibliothek bearbeiten", "schnellzugriff bibliothek", "library edit"],
      label: "Bibliothek Schnellzugriff",
      where: "App-Bibliothek → Island → <strong>Edit</strong> → Stift (Schnellzugriff) oder <strong>+</strong> (App hinzufuegen).",
      open: (h) => {
        h.goToPage?.(1);
        window.setTimeout(() => h.enableEditMode?.(), 220);
      }
    },
    {
      id: "tab_core",
      aliases: ["core tab", "tab core", "core bereich", "core apps"],
      label: "Tab Core",
      where: "App-Bibliothek → Tab <strong>Core</strong> (ShieldGate, Sync, Pay, Themes, …).",
      open: (h) => h.openLibraryTab?.("core")
    },
    {
      id: "tab_forge",
      aliases: ["forge tab", "tab forge", "forge bereich", "store tab"],
      label: "Tab Forge",
      where: "App-Bibliothek → Tab <strong>Forge</strong> (installierbare Apps).",
      open: (h) => h.openLibraryTab?.("forge")
    },
    {
      id: "tab_games",
      aliases: ["spiele tab", "games tab", "tab spiele", "spiele bereich"],
      label: "Tab Spiele",
      where: "App-Bibliothek → Tab <strong>Spiele</strong> (Arcade & Mini-Games).",
      open: (h) => h.openLibraryTab?.("games")
    },
    {
      id: "settings",
      appId: "settings",
      aliases: ["einstellungen", "settings", "noco core", "core app", "optionen", "system einstellungen"],
      label: "NOCO Core",
      where: "Bibliothek → <strong>Core</strong> → App <strong>NOCO Core</strong>. Theme, Glas, Auto-Lock, Wallpaper.",
      open: (h) => h.openApp?.("settings")
    },
    {
      id: "security",
      appId: "security",
      aliases: ["sicherheit", "security", "shieldgate", "shield", "code", "pin", "passkey"],
      label: "ShieldGate",
      where: "Bibliothek → <strong>Core</strong> → <strong>ShieldGate</strong>. Code, Scan, Passkey.",
      open: (h) => h.openApp?.("security")
    },
    {
      id: "sync",
      appId: "sync",
      aliases: ["sync", "keycard", "backup", "sicherung", "export"],
      label: "Sync / Keycard",
      where: "Bibliothek → <strong>Core</strong> → <strong>Sync</strong>. Daten als Datei exportieren/importieren.",
      open: (h) => h.openApp?.("sync")
    },
    {
      id: "forge",
      appId: "forge",
      aliases: ["forge", "app store", "shop", "store", "apps installieren"],
      label: "NOCO Forge",
      where: "Bibliothek → Tab <strong>Forge</strong> oder Core-App <strong>Forge</strong> oeffnen — dort installierst du neue Apps.",
      open: (h) => h.openApp?.("forge")
    },
    {
      id: "pay",
      appId: "pay",
      aliases: ["pay", "wallet", "guthaben", "noco pay"],
      label: "NOCO Pay",
      where: "Bibliothek → <strong>Core</strong> → <strong>NOCO Pay</strong>.",
      open: (h) => h.openApp?.("pay")
    },
    {
      id: "themes",
      appId: "themes",
      aliases: ["themes", "theme app", "farben", "design app"],
      label: "Themes",
      where: "Bibliothek → <strong>Core</strong> → <strong>Themes</strong> (Aurora, Midnight, …).",
      open: (h) => h.openApp?.("themes")
    },
    {
      id: "exclusive",
      appId: "exclusive",
      aliases: ["exclusive", "premium", "mitgliedschaft", "abo"],
      label: "NOCO Exclusive",
      where: "Bibliothek → <strong>Core</strong> oder Home-Hinweis — App <strong>Exclusive</strong>.",
      open: (h) => h.openApp?.("exclusive")
    },
    {
      id: "notes",
      appId: "notes",
      aliases: ["notizen", "notes", "notizbuch"],
      label: "Notizen",
      where: "Installiert in <strong>Forge</strong>-Tab oder Schnellzugriff. Home-Widget «Notizen» moeglich.",
      open: (h) => h.openApp?.("notes")
    },
    {
      id: "tasks",
      appId: "tasks",
      aliases: ["tasks", "aufgaben", "todo"],
      label: "Tasks",
      where: "Nach Installation unter <strong>Forge</strong>-Tab oder Schnellzugriff.",
      open: (h) => h.openApp?.("tasks")
    },
    {
      id: "timer",
      appId: "timer",
      aliases: ["timer", "countdown", "stoppuhr", "fokus timer"],
      label: "Timer",
      where: "Aus <strong>Forge</strong> installieren → Tab Forge. Island zeigt Countdown wenn aktiv.",
      open: (h) => h.openApp?.("timer")
    },
    {
      id: "memories",
      appId: "memories",
      aliases: ["memory", "memories", "erinnerungen", "reminder"],
      label: "Memory",
      where: "Forge-App — Erinnerungen mit Uhrzeit. Oder direkt: «Erinnere mich in 20 Minuten …».",
      open: (h) => h.openApp?.("memories")
    },
    {
      id: "arcade",
      appId: "arcade",
      aliases: ["arcade", "spiele", "games", "mini spiele"],
      label: "Spiele",
      where: "Bibliothek → Tab <strong>Spiele</strong> oder App <strong>Arcade</strong>.",
      open: (h) => {
        h.goToPage?.(1);
        h.openLibraryTab?.("games");
      }
    },
    {
      id: "chats",
      aliases: ["chats", "chat liste", "gespraeche", "unterhaltungen"],
      label: "AI-Chats",
      where: "In <strong>NOCO AI</strong> oben auf <strong>Chats</strong> tippen — mehrere Gespraechsverlaeufe.",
      open: (h) => h.openApp?.("nocoai")
    },
    {
      id: "shortcuts",
      aliases: ["schnellzugriff", "shortcuts", "home shortcuts"],
      label: "Schnellzugriff (Home)",
      where: "Home-Widget <strong>Schnellzugriff</strong> — «Anpassen» oder Edit-Modus auf Home.",
      open: (h) => {
        h.goToPage?.(0);
        window.setTimeout(() => h.enableEditMode?.(), 200);
      }
    }
  ];

  function findPlace(q) {
    let best = null;
    let score = 0;
    PLACES.forEach((place) => {
      place.aliases.forEach((alias) => {
        const a = norm(alias);
        if (!a) return;
        let s = 0;
        if (q === a) s = a.length + 8;
        else if (q.endsWith(" " + a) || q.startsWith(a + " ") || q.includes(" " + a + " ")) s = a.length + 3;
        else if (q.includes(a) && a.length >= 4) s = a.length;
        if (s > score) {
          score = s;
          best = place;
        }
      });
    });
    return score >= 4 ? best : null;
  }

  function extractSubject(q) {
    const patterns = [
      /\bwo ist\s+(.+)/,
      /\bwo sind\s+(.+)/,
      /\bwo finde ich\s+(.+)/,
      /\bwo liegt\s+(.+)/,
      /\bwhere is\s+(.+)/,
      /\bwie komme ich zu\s+(.+)/,
      /\bwie finde ich\s+(.+)/,
      /\bwie oeffne ich\s+(.+)/,
      /\bwie offne ich\s+(.+)/,
      /\bwas ist\s+(.+)/,
      /\bzeig mir\s+(.+)/,
      /\bbring mich zu\s+(.+)/,
      /\bgeh zu\s+(.+)/,
      /\boeffne\s+(.+)/,
      /\boffne\s+(.+)/
    ];
    for (const re of patterns) {
      const m = q.match(re);
      if (m) return norm(m[1]).replace(/\b(bitte|mal|doch|jetzt)\b/g, " ").trim();
    }
    return q;
  }

  function buildPersonalSystemCard(helpers) {
    const s = helpers.getSystemSnapshot?.() || {};
    const page = helpers.getCurrentPage?.();
    const app = helpers.getCurrentApp?.();
    const pageLabel = page === 1 ? "App-Bibliothek" : "Home";
    const appLine = app
      ? `<li>Gerade offen: <strong>${escapeHtml(helpers.getAppTitle?.(app) || app)}</strong></li>`
      : "<li>Keine App im Vordergrund — du siehst die Seiten Home/Apps.</li>";
    const installed = helpers.listInstalledApps?.() || [];
    const instLine = installed.length
      ? `<li>Installiert (${installed.length}): <strong>${escapeHtml(installed.slice(0, 8).join(", "))}${installed.length > 8 ? " …" : ""}</strong></li>`
      : "<li>Noch keine Forge-Apps — hol sie in <strong>Forge</strong>.</li>";

    return `<p><strong>Dein NOCO — individuell</strong></p>
      <ul>
        <li>Seite: <strong>${pageLabel}</strong></li>
        ${appLine}
        <li>Theme <strong>${escapeHtml(s.theme || "aurora")}</strong> · Glas-Boost <strong>${s.glassBoost ? "an" : "aus"}</strong> · Code <strong>${s.codeLock ? "an" : "aus"}</strong></li>
        <li>Widgets auf Home: <strong>${escapeHtml((s.widgets || []).join(", ") || "Standard")}</strong></li>
        ${instLine}
        <li>Notizen: <strong>${s.noteCount ?? 0}</strong> · AI-Chats: <strong>${s.chatCount ?? 0}</strong> · Pay: <strong>${escapeHtml(s.payBalance || "0 EUR")}</strong></li>
        <li>Exclusive: <strong>${s.exclusiveActive ? "aktiv" : "nicht aktiv"}</strong></li>
      </ul>
      <p><small>Frag «Wo ist Forge?» oder «Oeffne Timer» — ich fuehre dich hin.</small></p>`;
  }

  function tryContext(q, raw, helpers) {
    if (!/\b(wo bin ich|where am i|was ist offen|was habe ich offen|aktueller bildschirm|gerade offen)\b/.test(q)) {
      return null;
    }
    return { type: "text", text: buildPersonalSystemCard(helpers), rememberTopic: "context" };
  }

  function tryOverview(q, helpers) {
    if (!isSystemOverview(q)) return null;
    return { type: "text", text: buildPersonalSystemCard(helpers), rememberTopic: "system" };
  }

  function tryPlaceQuery(q, raw, helpers, wantsOpen) {
    const subject = extractSubject(q);
    const place = findPlace(subject) || findPlace(q);
    if (!place) return null;

    const openWanted = wantsOpen || (hasOpenVerb(q) && !isWhereQuery(q) && !isHowQuery(q));
    let text = `<p><strong>${escapeHtml(place.label)}</strong></p><p>${place.where}</p>`;

    if (place.appId && helpers.isAppInstalled && !helpers.isAppInstalled(place.appId) && place.appId !== "nocoai") {
      const forgeApps = ["notes", "tasks", "timer", "memories", "calculator", "weather", "arcade"];
      if (forgeApps.includes(place.appId)) {
        text += `<p><small>Bei dir noch nicht installiert — sag <strong>Installiere ${escapeHtml(place.label)}</strong> oder oeffne <strong>Forge</strong>.</small></p>`;
      }
    }

    if (openWanted && place.open) {
      return {
        type: "action",
        text: text + "<p>Ich oeffne das fuer dich …</p>",
        run: () => place.open(helpers),
        rememberTopic: place.id
      };
    }

    if (place.open) {
      return {
        type: "text",
        text: text + "<p>Soll ich es oeffnen? Schreib <strong>Ja</strong>.</p>",
        offerRun: () => place.open(helpers),
        offerLabel: place.label,
        rememberTopic: place.id
      };
    }

    return { type: "text", text, rememberTopic: place.id };
  }

  function tryListInstalled(q, helpers) {
    if (!/\b(welche apps|liste apps|alle apps|apps auflisten|was ist installiert)\b/.test(q)) return null;
    const installed = helpers.listInstalledApps?.() || [];
    if (!installed.length) {
      return {
        type: "text",
        text: "<p>Noch keine extra Apps — oeffne <strong>Forge</strong> und installiere z. B. Timer oder Notizen.</p>",
        offerRun: () => helpers.openApp?.("forge"),
        offerLabel: "Forge",
        rememberTopic: "apps"
      };
    }
    const lines = installed.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
    return {
      type: "text",
      text: `<p><strong>Installierte Apps</strong> (${installed.length}):</p><ul>${lines}</ul><p><small>Core-Apps (Shield, Sync, Pay) sind immer da. Forge-Apps erscheinen nach Installation.</small></p>`,
      rememberTopic: "apps"
    };
  }

  function process(raw, helpers, ctx) {
    const q = norm(raw);
    if (!q || q.length < 2) return null;
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return null;

    const ctxHit = tryContext(q, raw, helpers);
    if (ctxHit) return ctxHit;

    const overview = tryOverview(q, helpers);
    if (overview) return overview;

    const list = tryListInstalled(q, helpers);
    if (list) return list;

    if (isWhereQuery(q) || isHowQuery(q) || (hasOpenVerb(q) && findPlace(extractSubject(q)))) {
      return tryPlaceQuery(q, raw, helpers, hasOpenVerb(q));
    }

    if (/\b(zeig mir wo|navigiere zu|fuehr mich zu|fuhr mich)\b/.test(q)) {
      return tryPlaceQuery(q, raw, helpers, true);
    }

    const vague = findPlace(q);
    if (vague && q.length <= 28 && !global.NocoAICreate?.isCreateIntent?.(raw, q)) {
      if (/\b(suche|finde)\b/.test(q) && !isWhereQuery(q)) return null;
      return tryPlaceQuery(q, raw, helpers, false);
    }

    return null;
  }

  function isSystemQuery(q, raw) {
    if (isSystemOverview(q) || isWhereQuery(q) || isHowQuery(q)) return true;
    if (/\b(wo bin ich|system karte|mein system)\b/.test(q)) return true;
    if (findPlace(q) || findPlace(extractSubject(q))) return true;
    return false;
  }

  function smartHint(raw, helpers) {
    return {
      text: `<p><strong>System-Hilfe</strong> — Beispiele:</p>
        <ul>
          <li>«Wo ist Forge?» · «Wie komme ich zu den Einstellungen?»</li>
          <li>«Oeffne Tab Spiele» · «Zeig mir Widgets»</li>
          <li>«Wo bin ich?» · «Was ist installiert?»</li>
        </ul>`
    };
  }

  global.NocoAISystemMap = {
    process,
    isSystemQuery,
    findPlace,
    PLACES,
    smartHint,
    buildPersonalSystemCard
  };
})(typeof window !== "undefined" ? window : globalThis);
