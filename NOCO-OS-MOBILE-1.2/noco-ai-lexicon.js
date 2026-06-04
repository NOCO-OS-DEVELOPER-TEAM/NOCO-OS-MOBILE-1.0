/**
 * NOCO AI Lexikon — Alltagssprache ↔ Apps (Settings≠Core, Wallet=Pay, …)
 * Beantwortet Fragen direkt; oeffnet Apps nur wenn sinnvoll.
 */
(function initNocoAILexicon(global) {
  const ENTRIES = [
    {
      id: "settings",
      appId: "settings",
      label: "Einstellungen",
      internal: "NOCO Core",
      aliases: [
        "settings",
        "setting",
        "einstellung",
        "einstellungen",
        "optionen",
        "preferences",
        "prefs",
        "system einstellungen",
        "os einstellungen",
        "konfiguration",
        "anpassungen",
        "systemeinstellungen"
      ],
      openAliases: ["core", "noco core"],
      describe(helpers) {
        const s = helpers.getSystemSnapshot?.() || {};
        return `<p><strong>Einstellungen</strong> (App: NOCO Core)</p>
          <ul>
            <li>Theme: <strong>${s.theme}</strong> · Live-Hintergrund: <strong>${s.liveWallpaper ? "an" : "aus"}</strong></li>
            <li>Glas-Boost: <strong>${s.glassBoost ? "an" : "aus"}</strong> · Auto-Lock: <strong>${s.autoLock ? "an" : "aus"}</strong></li>
          </ul>
          <p>Sag z. B. «Heller», «Theme Midnight», «Auto-Lock 1 Minute».</p>`;
      }
    },
    {
      id: "pay",
      appId: "pay",
      label: "Wallet",
      internal: "NOCO Pay",
      aliases: [
        "wallet",
        "geldbeutel",
        "bezahlkonto",
        "nocopay",
        "noco pay",
        "pay",
        "konto",
        "guthaben",
        "kredit",
        "kontostand",
        "balance",
        "geld",
        "bezahlen",
        "aufladen"
      ],
      isMoneyQuestion(q) {
        return (
          /\b(wie viel|wieviel|wie steht|habe? ich|hab ich|was habe? ich|was hab ich|noch geld|genug geld)\b/.test(q) ||
          /\b(kontostand|guthaben|balance|kredit)\b/.test(q)
        );
      },
      answerMoney(helpers) {
        const s = helpers.getSystemSnapshot?.() || {};
        return `<p>Dein Guthaben: <strong>${s.payBalance || "0 EUR"}</strong> (NOCO Pay).</p>
          <p><small>Zum Aufladen: «Pay +10 EUR» oder «Oeffne Wallet».</small></p>`;
      }
    },
    {
      id: "forge",
      appId: "forge",
      label: "App Store",
      internal: "NOCO Forge",
      aliases: ["app store", "appstore", "apps laden", "apps installieren", "neue apps", "shop", "store", "forge"],
      describe: () =>
        "<p><strong>App Store</strong> = <strong>NOCO Forge</strong>. Dort installierst du Timer, Spiele, Rechner usw.</p><p>Sag: «Oeffne App Store» oder «Installiere Timer».</p>"
    },
    {
      id: "beam",
      appId: "beam",
      label: "Suche",
      internal: "NOCO Beam",
      aliases: ["suche", "search", "spotlight", "finder", "finden", "apps suchen", "beam"],
      run: (h) => h.openBeam?.(),
      describe: () => "<p><strong>Suche</strong> = <strong>NOCO Beam</strong> — findet Apps und Aktionen schnell.</p>"
    },
    {
      id: "sync",
      appId: "sync",
      label: "Backup",
      internal: "Sync / Keycard",
      aliases: ["backup", "sicherung", "daten sichern", "export", "import", "keycard", "sync", "sichern"],
      describe: () => "<p><strong>Backup</strong> = <strong>Sync / Keycard</strong> — Einstellungen & Daten als Datei.</p>"
    },
    {
      id: "security",
      appId: "security",
      label: "Sicherheit",
      internal: "ShieldGate",
      aliases: ["sicherheit", "schutz", "code", "pin", "passwort", "passkey", "face id", "entsperren", "shield", "security"],
      describe(helpers) {
        const s = helpers.getSystemSnapshot?.() || {};
        return `<p><strong>Sicherheit</strong> = App <strong>ShieldGate</strong>. Code: <strong>${s.codeLock ? "an" : "aus"}</strong>.</p>`;
      }
    },
    {
      id: "exclusive",
      appId: "exclusive",
      label: "Mitgliedschaft",
      internal: "NOCO Exclusive",
      aliases: ["exclusive", "premium", "mitgliedschaft", "abo", "abonnement", "member", "mitglied", "unlimited"],
      describe(helpers) {
        const s = helpers.getSystemSnapshot?.() || {};
        return `<p><strong>Mitgliedschaft</strong> = <strong>NOCO Exclusive</strong> — ${s.exclusiveActive ? "<strong>aktiv</strong>" : "nicht aktiv"} (inkl. unbegrenzte NOCO AI).</p>`;
      }
    },
    {
      id: "themes",
      appId: "themes",
      label: "Design & Farben",
      internal: "Themes",
      aliases: ["themes", "theme", "farben", "farbschema", "design app", "look", "stimmung farben"],
      describe(helpers) {
        const s = helpers.getSystemSnapshot?.() || {};
        return `<p>Aktuelles Theme: <strong>${s.theme}</strong>. Wechsel: «Theme Sunset» oder App <strong>Themes</strong>.</p>`;
      }
    },
    {
      id: "notes",
      appId: "notes",
      label: "Notizen",
      internal: "Notizen",
      aliases: ["notizen", "notizbuch", "notepad", "notes", "notiz", "schreibblock", "memo"],
      describe(helpers) {
        const s = helpers.getSystemSnapshot?.() || {};
        return `<p>Du hast <strong>${s.noteCount ?? 0}</strong> Notizen. «Erstelle Notiz» oder «Oeffne Notizen».</p>`;
      }
    },
    {
      id: "tasks",
      appId: "tasks",
      label: "Aufgaben",
      internal: "Tasks",
      aliases: ["aufgaben", "tasks", "todo", "to do", "checkliste", "aufgabenliste"],
      describe: () => "<p><strong>Aufgaben</strong> = Tasks-App. «Erstelle Aufgabe» oder «Offene Aufgaben».</p>"
    },
    {
      id: "nocoai",
      appId: "nocoai",
      label: "Assistent",
      internal: "NOCO AI",
      aliases: ["assistent", "ki", "chat", "hilfe chat", "copilot"],
      describe: () => "<p>Du bist schon hier — <strong>NOCO AI</strong>. Frag mich oder tippe «Chats» oben.</p>"
    },
    {
      id: "timer",
      appId: "timer",
      label: "Timer",
      internal: "Timer",
      aliases: ["timer", "countdown", "stoppuhr", "fokus"],
      describe: (h) => {
        const t = h.getTimerStatus?.();
        const run = t?.running ? `laeuft noch <strong>${t.label || "Timer"}</strong>` : "steht still";
        return `<p><strong>Timer</strong> — ${run}. «Starte Timer 5 Minuten» oder «Wann ist mein Timer rum?».</p>`;
      }
    },
    {
      id: "memories",
      appId: "memories",
      label: "Memory",
      internal: "Memory",
      aliases: ["memory", "memories", "erinnerungen", "erinnerung"],
      describe: () => "<p><strong>Memory</strong> — Erinnerungen mit Uhrzeit. «Erinnere mich in 20 Minuten …».</p>"
    },
    {
      id: "hub",
      appId: "hub",
      label: "Hub",
      internal: "NOCO Hub",
      aliases: ["hub", "noco hub"],
      run: (h) => h.openHub?.(),
      describe: () => "<p><strong>NOCO Hub</strong> — Schnellaktionen. Island → Hub.</p>"
    },
    {
      id: "arcade",
      appId: "arcade",
      label: "Spiele",
      internal: "Arcade",
      aliases: ["arcade", "spiele", "mini games", "minispiele"],
      describe: () => "<p><strong>Spiele</strong> in Bibliothek → Tab <strong>Spiele</strong>.</p>"
    },
    {
      id: "device",
      appId: "device",
      label: "Device",
      internal: "NOCO Device",
      aliases: ["device", "geraet", "handy info", "system info"],
      describe: () => "<p><strong>Device</strong> — Geraete-Infos & Demo-Funktionen aus Forge.</p>"
    }
  ];

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
    return /\b(oeffne|offne|open|starte|zeig mir|hol mir|bring mich|geh zu|gehe zu)\b/.test(q);
  }

  function hasQuestionVerb(q) {
    return /\b(wie|was|wo|wieviel|wie viel|habe|hab ich|kann ich|kann man|welche|wieviel|noch|genug)\b/.test(q);
  }

  function matchesEntry(q, entry) {
    const words = [...entry.aliases, ...(entry.openAliases || [])];
    return words.some((a) => {
      const n = norm(a);
      return q === n || q.includes(" " + n + " ") || q.startsWith(n + " ") || q.endsWith(" " + n) || q.includes(n);
    });
  }

  function findEntry(q) {
    let best = null;
    let score = 0;
    ENTRIES.forEach((entry) => {
      const words = [...entry.aliases, ...(entry.openAliases || [])];
      words.forEach((a) => {
        const n = norm(a);
        if (!n || n.length < 3) return;
        if (q === n) {
          if (n.length + 5 > score) {
            score = n.length + 5;
            best = entry;
          }
        } else if (q.includes(n) && n.length > score) {
          score = n.length;
          best = entry;
        }
      });
    });
    return best;
  }

  function tryDirectAnswers(q, raw, helpers) {
    const entry = findEntry(q);
    if (!entry) return null;

    if (entry.id === "pay" && (entry.isMoneyQuestion?.(q) || (!hasOpenVerb(q) && q.length < 24))) {
      return {
        type: "text",
        text: entry.answerMoney(helpers),
        rememberTopic: "pay"
      };
    }

    if (hasQuestionVerb(q) && matchesEntry(q, entry) && !hasOpenVerb(q)) {
      if (entry.describe) {
        return {
          type: "text",
          text: entry.describe(helpers),
          rememberTopic: entry.id
        };
      }
    }

    if (/\b(was ist|was bedeutet|meinst du)\b/.test(q) && matchesEntry(q, entry)) {
      return {
        type: "text",
        text: `<p><strong>${escapeHtml(entry.label)}</strong> ist bei NOCO die App <strong>${escapeHtml(entry.internal)}</strong>.</p>${entry.describe ? entry.describe(helpers) : ""}`,
        rememberTopic: entry.id
      };
    }

    return null;
  }

  function tryOpen(q, raw, helpers) {
    const entry = findEntry(q);
    if (!entry) return null;

    const wantsOpen = hasOpenVerb(q) || (!hasQuestionVerb(q) && q.length < 22 && matchesEntry(q, entry));
    if (!wantsOpen) return null;

    if (entry.id === "pay" && !hasOpenVerb(q)) {
      return null;
    }

    const run =
      entry.run ||
      (() => {
        if (entry.appId === "beam") helpers.openBeam?.();
        else helpers.openApp?.(entry.appId);
      });

    const hint = entry.internal && entry.label !== entry.internal ? ` (${entry.internal})` : "";
    return {
      type: "action",
      text: `Oeffne <strong>${escapeHtml(entry.label)}</strong>${escapeHtml(hint)} …`,
      run,
      rememberTopic: entry.id
    };
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!q || q.length < 2) return null;
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return null;
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return null;

    return tryDirectAnswers(q, raw, helpers) || tryOpen(q, raw, helpers);
  }

  function isLexiconQuery(q, raw) {
    return !!findEntry(q) || ENTRIES.some((e) => e.isMoneyQuestion?.(q));
  }

  function resolveAppId(q) {
    const entry = findEntry(q);
    return entry?.appId || null;
  }

  global.NocoAILexicon = {
    process,
    isLexiconQuery,
    resolveAppId,
    findEntry,
    ENTRIES
  };
})(typeof window !== "undefined" ? window : globalThis);
