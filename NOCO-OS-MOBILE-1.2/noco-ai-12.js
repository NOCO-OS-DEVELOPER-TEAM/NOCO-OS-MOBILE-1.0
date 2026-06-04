/**
 * NOCO AI 1.2 — Verstehen, einfache Fragen, Kontext
 */
(function initNocoAI12(global) {
  const VERSION = "1.2";

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
    return /\b(oeffne|offne|open|starte|zeig mir|geh zu|gehe zu|launch|installier|deinstallier)\b/.test(q);
  }

  function isQuestion(q, raw) {
    const t = String(raw || "").trim();
    if (t.endsWith("?")) return true;
    return /\b(was|wie|wo|wann|wer|warum|wieso|weshalb|welche|welcher|welches|kann ich|kannst du|geht es|gibt es|brauche ich|soll ich|ist das|bedeutet)\b/.test(q);
  }

  /** «Was ist neu …» = Update-Frage, NICHT «etwas Neues anlegen» */
  function isVersionOrUpdateQuestion(q, raw) {
    if (/\b(was ist neu|was gibt es neu|was ist alles neu|neu in|neues in|neu bei|neu dabei|changelog|release notes?)\b/.test(q)) {
      return true;
    }
    if (/\b(update|version|changelog)\b/.test(q) && /\b(1\s*2|1\.2|noco|mobile|ai|os)\b/.test(q)) {
      return true;
    }
    if (/\bwas ist neu\b/.test(q) || /\bneu in 1\b/.test(q)) {
      return true;
    }
    const t = String(raw || "").trim();
    return /\bwas ist neu\b/i.test(t) && /\b1\.?2\b/i.test(t);
  }

  function buildVersionAnswerHtml() {
    return `<p><strong>Neu in NOCO OS Mobile & NOCO AI ${VERSION}</strong></p>
      <ul>
        <li><strong>NOCO AI 2.0</strong> — erweitertes System-Wissen, Sprache («NOCO AI» Wake), Aktionen, klarere UI</li>
        <li><strong>NOCO AI ${VERSION}</strong> — Fragen, «Wo ist Forge?», Ein-Wort-Befehle, Offline</li>
        <li><strong>App-Bibliothek</strong> — Tabs Core / Forge / Spiele, Schnellzugriff bearbeiten</li>
        <li><strong>Island</strong> — nur Uhr & ✧ AI oben, kein doppelter Home-Titel auf dem Handy</li>
        <li><strong>Liquid Glass 1.2</strong> — Apps bleiben offen, Wischen zwischen Home & Apps, Beam & Hub</li>
        <li><strong>Widgets</strong> — NOCO-AI-Widget, Edit-Modus mit +, feste Entfernung</li>
      </ul>
      <p><small>Alles <strong>offline</strong>. Frag z. B. «Wo bin ich?» oder «System Status».</small></p>`;
  }

  function tryVersionAnswer(q, raw) {
    if (!isVersionOrUpdateQuestion(q, raw)) return null;
    return { type: "text", text: buildVersionAnswerHtml(), rememberTopic: "version" };
  }

  /** Einfache FAQ — direkte Antworten ohne Umweg */
  const FAQ = [
    {
      keys: ["noco ai 1.2", "version 1.2", "neu in 1.2", "was ist neu", "was gibt es neu", "update 1.2", "ai 1.2", "changelog"],
      answer: () => buildVersionAnswerHtml()
    },
    {
      keys: ["brauche ich internet", "ohne internet", "offline", "funktioniert ohne wlan", "ohne netz"],
      answer: () =>
        "<p><strong>Nein</strong> — NOCO AI laeuft komplett <strong>offline</strong>. Kein WLAN, keine Cloud-KI. Alles bleibt auf deinem Geraet.</p>"
    },
    {
      keys: ["wie viele nachrichten", "nachrichten limit", "tageslimit", "20 nachrichten", "limit ai"],
      answer: (h) => {
        const usage = global.NocoAILimits?.getUsage?.(h.getSettings?.() || {});
        if (usage?.exclusive || usage?.plus) {
          return "<p>Bei dir: <strong>unbegrenzte NOCO AI</strong> (Exclusive aktiv).</p>";
        }
        const rem = usage?.remaining ?? 20;
        const lim = usage?.limit ?? 20;
        return `<p>Kostenlos: <strong>${rem} von ${lim}</strong> Nachrichten heute. <strong>Exclusive</strong> enthaelt unbegrenzte NOCO AI.</p>`;
      }
    },
    {
      keys: ["ist noco ai echt", "echte ki", "chatgpt", "gpt", "wie chatgpt"],
      answer: () =>
        "<p>Ich bin <strong>kein ChatGPT</strong> — ein lokaler Assistent mit festen Regeln, Apps und deinen Daten. Schnell & privat, aber kein Internet-Wissen.</p>"
    },
    {
      keys: ["daten sicher", "privatsphaere", "privacy", "wer sieht", "speicherst du"],
      answer: () =>
        "<p>Chats, Notizen und Einstellungen liegen in <strong>localStorage</strong> auf deinem Geraet. Nichts wird an Server gesendet.</p>"
    },
    {
      keys: ["wie oeffne ich", "wie offne ich", "wo finde ich apps", "wo sind die apps"],
      answer: () =>
        "<p><strong>Apps:</strong> Wische zum Apps-Screen oder Island → <strong>Apps</strong>.</p><p>Oder sag: «Gehe zu Apps», «Oeffne Forge», «Oeffne Beam».</p>"
    },
    {
      keys: ["wie bearbeite ich widgets", "widgets hinzufuegen", "widget hinzufugen"],
      answer: () =>
        "<p>Island → <strong>Edit</strong> → unten <strong>+</strong> fuer Widgets. Oder frag mich: «Widget Pack AI».</p>"
    },
    {
      keys: ["wie stelle ich code", "pin einstellen", "sperrcode", "code lock"],
      answer: () =>
        "<p><strong>ShieldGate</strong> → Code aktivieren → 4 Ziffern setzen. Oder: «Oeffne Security».</p>"
    },
    {
      keys: ["was ist der unterschied", "unterschied home apps"],
      answer: () =>
        "<p><strong>Home</strong> = Widgets & Schnellzugriff.</p><p><strong>Apps</strong> = Bibliothek mit Core, Forge, Spiele.</p><p>Island oben wechselt die Seite.</p>"
    },
    {
      keys: ["kannst du bilder", "bilder erstellen", "fotos generieren"],
      answer: () =>
        "<p><strong>Bilder</strong> kann ich noch nicht. Ich kann Apps oeffnen, Notizen/Tasks anlegen, rechnen und dein System steuern.</p>"
    },
    {
      keys: ["sprichst du englisch", "english", "deutsch"],
      answer: () =>
        "<p>Hauptsprache ist <strong>Deutsch</strong>. Englische Befehle wie «open settings» funktionieren oft auch.</p>"
    },
    {
      keys: ["was machst du", "wofuer bist du", "deine aufgabe"],
      answer: () =>
        "<p>Ich helfe dir <strong>NOCO OS</strong> zu bedienen: Fragen beantworten, Apps oeffnen, Notizen/Tasks/Timer/Memory, Ueberblick & Tipps — <strong>offline</strong>.</p>"
    },
    {
      keys: ["wo ist was", "system karte", "systemkarte", "navigation hilfe"],
      answer: () =>
        "<p>Frag mich konkret: <strong>«Wo ist Forge?»</strong>, <strong>«Wo bin ich?»</strong>, <strong>«Wie komme ich zu den Einstellungen?»</strong> — ich sage dir den Weg und kann es oeffnen.</p>"
    },
    {
      keys: ["wie installiere ich apps", "app installieren", "neue app holen"],
      answer: () =>
        "<p><strong>Forge</strong> oeffnen → App waehlen → Installieren. Oder sag: «Installiere Timer» / «Oeffne Forge».</p>"
    },
    {
      keys: ["wie wechsle ich seite", "von home zu apps", "seite wechseln"],
      answer: () =>
        "<p>Wische horizontal oder nutze die <strong>Island-Punkte</strong> (links = Home, rechts = Apps).</p>"
    },
    {
      keys: ["was ist liquid glass", "liquid glass", "glas effekt"],
      answer: (h) => {
        const s = h.getSystemSnapshot?.() || {};
        return `<p><strong>Liquid Glass</strong> = halbtransparentes UI mit Blur. Bei dir: Boost <strong>${s.glassBoost ? "an" : "aus"}</strong>. Aendern: «Mehr Liquid Glass» oder Core → Deck.</p>`;
      }
    },
    {
      keys: ["was ist inbox", "inbox bedeutung"],
      answer: () =>
        "<p><strong>Inbox</strong> = Kurzuebersicht: offene Tasks, naechste Memory, Timer-Status, Notizen-Hinweis. Sag einfach <strong>«Inbox»</strong> oder <strong>«Was steht an?»</strong>.</p>"
    }
  ];

  /** Ein Wort / sehr kurz — klare Aktion */
  const SHORT = [
    { match: /^(timer|countdown|stoppuhr)$/, label: "Timer", cmd: "Starte Timer 5 Minuten", app: "timer" },
    { match: /^(notiz|notizen|notes?)$/, label: "Notizen", app: "notes" },
    { match: /^(aufgaben|tasks?|todo)$/, label: "Tasks", app: "tasks" },
    { match: /^(memory|erinnerung|reminder)$/, label: "Memory", app: "memories" },
    { match: /^(apps?|bibliothek|desktop)$/, label: "App-Bibliothek", page: 1 },
    { match: /^(home|start)$/, label: "Home", page: 0 },
    { match: /^(einstellungen|settings|core|optionen)$/, label: "Core", app: "settings" },
    { match: /^(sicherheit|security|shield|code)$/, label: "ShieldGate", app: "security" },
    { match: /^(forge|store|shop)$/, label: "Forge", app: "forge" },
    { match: /^(beam|suche|suchen)$/, label: "Beam", beam: true },
    { match: /^(hub)$/, label: "Hub", hub: true },
    { match: /^(wetter|weather)$/, label: "Wetter", app: "weather" },
    { match: /^(rechner|calculator|mathe)$/, label: "Rechner", app: "calculator" },
    { match: /^(pay|wallet|guthaben|geld)$/, label: "Pay", cmd: "Zeig Guthaben" },
    { match: /^(hilfe|help|\?)$/, label: "Hilfe", cmd: "Hilfe" },
    { match: /^(status|ueberblick|inbox|inbox)$/, label: "Ueberblick", cmd: "Was steht an?" },
    { match: /^(glas|glass|helligkeit|heller|dunkler)$/, label: "Look", cmd: "Mehr Liquid Glass" },
    { match: /^(exclusive|premium|abo)$/, label: "Exclusive", app: "exclusive" },
    { match: /^(spiele|games|arcade)$/, label: "Spiele", app: "arcade" },
    { match: /^(sync|backup|keycard)$/, label: "Sync", app: "sync" },
    { match: /^(themes?|look|design)$/, label: "Themes", app: "themes" },
    { match: /^(device|geraet|handy)$/, label: "Device", app: "device" },
    { match: /^(karte|system|navigation)$/, label: "System", cmd: "Wo bin ich?" },
    { match: /^(installiert|apps liste)$/, label: "Apps", cmd: "Liste Apps" }
  ];

  function scoreFaq(q) {
    let best = null;
    let score = 0;
    FAQ.forEach((entry) => {
      let s = 0;
      entry.keys.forEach((k) => {
        const nk = norm(k);
        if (q === nk || q.includes(nk)) s += nk.length >= 8 ? 3 : 2;
      });
      if (s > score) {
        score = s;
        best = entry;
      }
    });
    if (!best || score < 2) return null;
    return { text: best.answer, topic: "faq" };
  }

  function tryShort(q, raw, helpers) {
    if (q.length > 24 || hasOpenVerb(q)) return null;
    if (isQuestion(q, raw) && q.length > 12) return null;
    for (const entry of SHORT) {
      if (!entry.match.test(q)) continue;
      if (entry.cmd) {
        return {
          type: "text",
          text: `<p><strong>${escapeHtml(entry.label)}</strong> — meinst du «${escapeHtml(entry.cmd)}»? Schreib <strong>Ja</strong>.</p>`,
          offerRun: () => {
            const res = global.NocoAI?.processMessage?.(entry.cmd, helpers);
            if (res?.type === "action" && typeof res.run === "function") res.run();
            else if (typeof res?.offerRun === "function") res.offerRun();
          },
          offerLabel: entry.label,
          rememberTopic: entry.label
        };
      }
      if (entry.page != null) {
        return {
          type: "action",
          text: `Wechsle zu <strong>${entry.label}</strong> …`,
          run: () => helpers.goToPage?.(entry.page),
          rememberTopic: "nav"
        };
      }
      if (entry.beam) {
        return {
          type: "action",
          text: `Starte <strong>NOCO Beam</strong> …`,
          run: () => helpers.openBeam?.(),
          rememberTopic: "beam"
        };
      }
      if (entry.hub) {
        return {
          type: "action",
          text: `Oeffne <strong>NOCO Hub</strong> …`,
          run: () => helpers.openHub?.(),
          rememberTopic: "hub"
        };
      }
      if (entry.app) {
        const title = helpers.getAppTitle?.(entry.app) || entry.label;
        return {
          type: "action",
          text: `Starte <strong>${escapeHtml(title)}</strong> …`,
          run: () => helpers.openApp?.(entry.app),
          rememberTopic: entry.app
        };
      }
    }
    return null;
  }

  function classifyGoal(q, raw) {
    if (hasOpenVerb(q)) return { goal: "open", confidence: 0.9 };
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return { goal: "create", confidence: 0.9 };
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return { goal: "math", confidence: 0.95 };
    if (isQuestion(q, raw)) return { goal: "question", confidence: 0.85 };
    if (q.length <= 18) return { goal: "short", confidence: 0.7 };
    return { goal: "general", confidence: 0.4 };
  }

  function tryClarifyIntent(q, raw, helpers) {
    if (isVersionOrUpdateQuestion(q, raw)) return null;
    if (isQuestion(q, raw)) return null;
    const goal = classifyGoal(q, raw);
    if (goal.goal !== "general" && goal.confidence >= 0.7) return null;
    if (q.length < 4 || q.length > 90) return null;
    if (hasOpenVerb(q)) return null;

    const topics = global.NocoAIIntent?.scoreTopics?.(q, raw) || [];
    if (!topics.length) return null;
    const top = topics[0];
    if (top.score < 1) return null;

    const sug = global.NocoAIIntent?.suggestionsForTopic?.(top.id, helpers) || [];
    const first = sug[0];
    if (!first) return null;

    const chips = sug
      .slice(0, 4)
      .map((s) => `«<strong>${escapeHtml(s.cmd || s.label)}</strong>»`)
      .join(" · ");

    return {
      type: "text",
      text: `<p>Ich hoere <strong>${escapeHtml(top.label)}</strong> raus. Meinst du:</p><p>${chips}</p><p><small>Ein Begriff reicht — oder «Ja» fuer «${escapeHtml(first.label)}».</small></p>`,
      offerRun: first.run,
      offerLabel: first.label,
      rememberTopic: top.id
    };
  }

  function trySimpleQuestion(q, raw, helpers) {
    const version = tryVersionAnswer(q, raw);
    if (version) return version;

    if (!isQuestion(q, raw) && !/\b(erklar|erklaer|was ist|was bedeutet|wie funktioniert)\b/.test(q)) {
      return null;
    }
    if (hasOpenVerb(q) && /\b(oeffne|offne|open)\b/.test(q)) return null;

    const faq = scoreFaq(q);
    if (faq) {
      const html = typeof faq.text === "function" ? faq.text(helpers) : faq.text;
      return { type: "text", text: html, rememberTopic: faq.topic };
    }

    const brainHit = global.NocoAIBrain?.process?.(raw, helpers, {});
    if (brainHit?.text && brainHit.type !== "action") {
      return brainHit;
    }

    const lex = global.NocoAILexicon?.process?.(raw, helpers);
    if (lex?.text) return lex;

    return null;
  }

  function process(raw, helpers, ctx = {}) {
    const q = norm(raw);
    if (!q || q.length < 1) return null;

    const versionFirst = tryVersionAnswer(q, raw);
    if (versionFirst) return versionFirst;

    if (global.NocoAISystemMap?.isSystemQuery?.(q, raw)) return null;
    if (global.NocoAIDiagnostics?.isPerformanceQuery?.(q, raw)) return null;
    if (global.NocoAIChatCmd?.process?.(raw, helpers)) return null;

    if (hasOpenVerb(q)) return null;
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return null;
    if (global.NocoAITime?.parseTimerStartMinutes?.(raw) != null) return null;

    const goal = classifyGoal(q, raw);

    if (goal.goal === "math") return null;

    const short = tryShort(q, raw, helpers);
    if (short) return short;

    if (goal.goal === "question" || /\b(hilfe|help|was kann|wie geht|was ist|warum)\b/.test(q)) {
      const qa = trySimpleQuestion(q, raw, helpers);
      if (qa) return qa;
    }

    if (goal.goal === "short" || (q.length < 30 && !hasOpenVerb(q))) {
      const short2 = tryShort(q, raw, helpers);
      if (short2) return short2;
      const clarify = tryClarifyIntent(q, raw, helpers);
      if (clarify) return clarify;
    }

    if (q.length < 50 && !hasOpenVerb(q)) {
      const clarify = tryClarifyIntent(q, raw, helpers);
      if (clarify) return clarify;
    }

    return null;
  }

  function smartFallback(raw, helpers) {
    const q = norm(raw);
    const goal = classifyGoal(q, raw);
    const hints = [];
    if (goal.goal === "question") {
      hints.push("Was ist Forge?", "Brauche ich Internet?", "Wie stelle ich Code ein?");
    } else if (goal.goal === "open") {
      hints.push("Oeffne Core", "Oeffne Notizen", "Gehe zu Apps");
    } else {
      hints.push("Was steht an?", "Inbox", "Erstelle Notiz", "Timer", "Hilfe");
    }
    const chips = hints
      .slice(0, 4)
      .map((s) => `«<strong>${escapeHtml(s)}</strong>»`)
      .join(" · ");
    return {
      text: `<p><strong>NOCO AI ${VERSION}</strong> ist nicht sicher, was du meinst. Probier:</p><p>${chips}</p><p><small>Oder ein Wort: Timer · Notizen · Apps · Hilfe</small></p>`
    };
  }

  function isUnderstandingQuery(q, raw) {
    const goal = classifyGoal(q, raw);
    return goal.goal === "question" || goal.goal === "short" || scoreFaq(q) != null;
  }

  global.NocoAI12 = {
    VERSION,
    process,
    smartFallback,
    isUnderstandingQuery,
    isVersionOrUpdateQuestion,
    tryVersionAnswer,
    buildVersionAnswerHtml,
    classifyGoal,
    scoreFaq
  };
})(typeof window !== "undefined" ? window : globalThis);
