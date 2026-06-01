/**
 * NOCO AI Intent — allgemeines Verstehen: Themen erkennen, Aktionen anbieten oder ausloesen
 */
(function initNocoAIIntent(global) {
  const TOPICS = [
    {
      id: "settings",
      label: "Einstellungen & Look",
      terms: [
        "einstellung",
        "settings",
        "core",
        "theme",
        "design",
        "glas",
        "glass",
        "helligkeit",
        "brightness",
        "hintergrund",
        "wallpaper",
        "widget",
        "auto lock",
        "autolock",
        "motion",
        "animation"
      ]
    },
    {
      id: "timer",
      label: "Timer & Fokus",
      terms: ["timer", "countdown", "stoppuhr", "fokus", "focus", "pause", "pomodoro", "minuten timer"]
    },
    {
      id: "memory",
      label: "Erinnerungen",
      terms: ["memory", "erinnerung", "erinnere", "remind", "reminder", "wecker"]
    },
    {
      id: "notes",
      label: "Notizen",
      terms: ["notiz", "notizen", "notes", "schreib", "text", "idee"]
    },
    {
      id: "tasks",
      label: "Aufgaben",
      terms: ["task", "tasks", "aufgabe", "aufgaben", "todo", "erledig", "checkbox"]
    },
    {
      id: "status",
      label: "Ueberblick & Status",
      terms: ["status", "ueberblick", "überblick", "inbox", "was steht", "heute", "plan", "coach", "tagesplan"]
    },
    {
      id: "nav",
      label: "Apps & Navigation",
      terms: ["oeffne", "offne", "open", "starte", "zeig", "app", "forge", "beam", "hub", "home", "apps", "desktop"]
    },
    {
      id: "create",
      label: "Neu anlegen",
      terms: ["erstell", "erstelle", "leg an", "neu", "anlegen", "mach mir", "schreib mir"]
    },
    {
      id: "pay",
      label: "Pay & Guthaben",
      terms: ["pay", "guthaben", "wallet", "euro", "eur", "auflad"]
    },
    {
      id: "security",
      label: "Schutz",
      terms: ["code", "pin", "passkey", "sicherheit", "schutz", "shield", "sperre", "entsperr"]
    },
    {
      id: "math",
      label: "Rechnen",
      terms: ["plus", "minus", "mal", "geteilt", "rechne", "prozent", "%", "rechnung"]
    },
    {
      id: "help",
      label: "Hilfe",
      terms: ["hilfe", "help", "was kannst", "wie funktioniert", "erklaer", "erklar"]
    }
  ];

  const NOUN_OPENS = [
    { terms: ["timer", "countdown", "stoppuhr"], app: "timer", title: "Timer" },
    { terms: ["notiz", "notizen", "notes"], app: "notes", title: "Notizen" },
    { terms: ["task", "tasks", "aufgaben", "todo"], app: "tasks", title: "Tasks" },
    { terms: ["memory", "erinnerungen", "memories"], app: "memories", title: "Memory" },
    { terms: ["einstellungen", "settings", "optionen", "preferences"], app: "settings", title: "Einstellungen" },
    { terms: ["core", "noco core"], app: "settings", title: "Einstellungen (Core)" },
    { terms: ["themes", "theme", "design"], app: "themes", title: "Themes" },
    { terms: ["forge", "store", "shop", "app store", "appstore"], app: "forge", title: "App Store" },
    { terms: ["beam", "suche", "spotlight"], app: "beam", title: "NOCO Beam", run: (h) => h.openBeam?.() },
    { terms: ["hub"], app: "hub", title: "NOCO Hub", run: (h) => h.openHub?.() },
    { terms: ["pay", "wallet", "guthaben", "kredit"], app: "pay", title: "Wallet" },
    { terms: ["rechner", "calculator", "calc"], app: "calculator", title: "Rechner" },
    { terms: ["wetter", "weather"], app: "weather", title: "Wetter" },
    { terms: ["exclusive", "premium"], app: "exclusive", title: "Exclusive" }
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
    return /\b(oeffne|offne|open|starte|zeig mir|geh zu|gehe zu|launch)\b/.test(q);
  }

  function scoreTopics(q, raw) {
    const scores = TOPICS.map((topic) => {
      let score = 0;
      topic.terms.forEach((term) => {
        const n = norm(term);
        if (!n) return;
        if (q === n || q.startsWith(n + " ") || q.endsWith(" " + n) || q.includes(" " + n + " ")) {
          score += n.length >= 6 ? 3 : 2;
        } else if (q.includes(n)) {
          score += 1;
        }
      });
      return { id: topic.id, label: topic.label, score };
    });
    return scores.filter((t) => t.score > 0).sort((a, b) => b.score - a.score);
  }

  function suggestionsForTopic(topicId, helpers) {
    const s = helpers.getSystemSnapshot?.() || {};
    const map = {
      settings: [
        { label: "Heller", run: () => helpers.adjustUiBrightness?.("up") },
        { label: "Theme " + (s.theme || "Aurora"), run: () => helpers.openThemes?.() },
        { label: "Core oeffnen", run: () => helpers.navigateCore?.({ section: "deck" }) },
        { label: "System Status", cmd: "System Status" }
      ],
      timer: [
        { label: "Timer 5 Min", cmd: "Starte Timer 5 Minuten" },
        { label: "Fokus Modus", cmd: "Fokus Modus" },
        { label: "Timer App", run: () => helpers.openApp?.("timer") },
        { label: "Wann fertig?", cmd: "Wann ist mein Timer rum?" }
      ],
      memory: [
        { label: "Erinnere 15 Min", cmd: "Erinnere mich in 15 Minuten Pause" },
        { label: "Memory App", run: () => helpers.openApp?.("memories") },
        { label: "Naechste Erinnerung?", cmd: "Wann ist meine Erinnerung?" }
      ],
      notes: [
        { label: "Neue Notiz", cmd: "Erstelle Notiz" },
        { label: "Notizen oeffnen", run: () => helpers.openApp?.("notes") },
        { label: "Notizen zusammenfassen", cmd: "Fass Notizen zusammen" }
      ],
      tasks: [
        { label: "Neue Aufgabe", cmd: "Erstelle Aufgabe" },
        { label: "Offene Tasks", cmd: "Offene Aufgaben" },
        { label: "Tasks App", run: () => helpers.openApp?.("tasks") }
      ],
      status: [
        { label: "Was steht an?", cmd: "Was steht an?" },
        { label: "Inbox", cmd: "Inbox" },
        { label: "Coach", cmd: "Was soll ich jetzt tun?" },
        { label: "System Status", cmd: "System Status" }
      ],
      nav: [
        { label: "Home", run: () => helpers.goToPage?.(0) },
        { label: "Apps", run: () => helpers.goToPage?.(1) },
        { label: "Beam", run: () => helpers.openBeam?.() },
        { label: "Forge", run: () => helpers.openApp?.("forge") }
      ],
      create: [
        { label: "Notiz", cmd: "Erstelle Notiz" },
        { label: "Aufgabe", cmd: "Erstelle Aufgabe" },
        { label: "Timer 10 Min", cmd: "Starte Timer 10 Minuten" }
      ],
      pay: [
        { label: "Guthaben", cmd: "Zeig Guthaben" },
        { label: "Pay oeffnen", run: () => helpers.openApp?.("pay") }
      ],
      security: [
        { label: "ShieldGate", run: () => helpers.openApp?.("security") },
        { label: "Lock Screen", cmd: "Zeige Lock Screen" }
      ],
      math: [{ label: "3 plus 3", cmd: "3 plus 3" }],
      help: [
        { label: "Hilfe", cmd: "Hilfe" },
        { label: "Was kannst du?", cmd: "Was kannst du alles?" }
      ]
    };
    return map[topicId] || map.status;
  }

  function buildOfferFromSuggestions(suggestions, topicLabel, helpers) {
    const items = suggestions.slice(0, 5);
    const chips = items
      .map((s) => `«<strong>${escapeHtml(s.label)}</strong>»`)
      .join(" · ");
    const primary = items.find((s) => s.run) || items[0];
    return {
      type: "text",
      text: `<p>Ich verstehe <strong>${escapeHtml(topicLabel)}</strong>. Du kannst:</p><p>${chips}</p><p><small>Einfach einen Begriff tippen oder «Ja» fuer die erste Aktion.</small></p>`,
      offerRun: primary?.run
        ? () => {
            try {
              primary.run();
            } catch (_) {}
          }
        : null,
      offerLabel: primary?.label,
      rememberTopic: topicLabel
    };
  }

  function tryNounOpen(q, raw, helpers) {
    if (hasOpenVerb(q) || q.length > 28) return null;
    if (/\b(wie|was|warum|wieso|wann|wer)\b/.test(q)) return null;
    for (const entry of NOUN_OPENS) {
      if (entry.terms.some((t) => q === t || q.startsWith(t + " "))) {
        const run = entry.run || (() => helpers.openApp?.(entry.app));
        return {
          type: "action",
          text: `Oeffne <strong>${entry.title}</strong> …`,
          run,
          rememberTopic: entry.app
        };
      }
    }
    const resolved = global.NocoAI?.resolveAppFromQuery?.(raw, 62);
    if (resolved?.appId && q.length <= 22) {
      const title = helpers.getAppTitle?.(resolved.appId) || resolved.appId;
      if (resolved.appId === "beam") {
        return { type: "action", text: `Starte <strong>NOCO Beam</strong> …`, run: () => helpers.openBeam?.() };
      }
      if (resolved.appId === "hub") {
        return { type: "action", text: `Starte <strong>NOCO Hub</strong> …`, run: () => helpers.openHub?.() };
      }
      return {
        type: "action",
        text: `Starte <strong>${escapeHtml(title)}</strong> …`,
        run: () => helpers.openApp?.(resolved.appId),
        rememberTopic: resolved.appId
      };
    }
    return null;
  }

  function delegateTopic(topicId, q, raw, helpers, ctx) {
    switch (topicId) {
      case "settings":
        return global.NocoAINatural?.process?.(raw, helpers) || global.NocoAISystem?.processCommand?.(raw, helpers);
      case "timer": {
        const mins = global.NocoAITime?.parseTimerStartMinutes?.(raw);
        if (mins != null && helpers.applyTimerMinutes) {
          return global.NocoAITime.buildTimerStartAction(mins, helpers);
        }
        return global.NocoAITime?.process?.(raw, helpers) || global.NocoAIPro?.process?.(raw, helpers, ctx);
      }
      case "memory":
        return global.NocoAITime?.process?.(raw, helpers) || global.NocoAICreate?.process?.(raw, helpers);
      case "notes":
      case "tasks":
      case "create":
        if (global.NocoAICreate?.isCreateIntent?.(raw, q)) {
          return global.NocoAICreate.process(raw, helpers);
        }
        if (topicId === "notes") return global.NocoAIInsights?.process?.(raw, helpers);
        if (topicId === "tasks") return global.NocoAIInsights?.process?.(raw, helpers);
        return null;
      case "status":
        return (
          global.NocoAIUltra?.process?.(raw, helpers, ctx) ||
          global.NocoAIInsights?.process?.(raw, helpers) ||
          global.NocoAIBrain?.process?.(raw, helpers, ctx)
        );
      case "math":
        if (global.NocoAIMath?.looksLikeMath?.(raw)) {
          const hit = global.NocoAIMath.evaluate(raw);
          return hit?.text ? { type: "text", text: hit.text, rememberTopic: "math" } : null;
        }
        return null;
      case "pay":
      case "security":
        return global.NocoAISystem?.processCommand?.(raw, helpers) || global.NocoAINatural?.process?.(raw, helpers);
      case "nav":
        return global.NocoAISystem?.processCommand?.(raw, helpers);
      case "help":
        return null;
      default:
        return null;
    }
  }

  function tryStrongIntent(q, raw, helpers, ctx) {
    const topics = scoreTopics(q, raw);
    if (!topics.length) return null;

    const top = topics[0];
    const second = topics[1];

    if (top.score >= 4 && (!second || top.score >= second.score + 2)) {
      const hit = delegateTopic(top.id, q, raw, helpers, ctx);
      if (hit) return hit;
    }

    if (top.score >= 2 && q.length < 40) {
      const hit = delegateTopic(top.id, q, raw, helpers, ctx);
      if (hit) return hit;
    }

    return null;
  }

  function offerHintHtml(primary) {
    if (!primary?.run) {
      return "<p><small>Waehle einen der Begriffe oben oder formuliere genauer.</small></p>";
    }
    return "<p><small>Sag <strong>Ja</strong> fuer die erste Aktion.</small></p>";
  }

  function tryMultiTopicOffer(q, raw, helpers) {
    const topics = scoreTopics(q, raw).slice(0, 3);
    if (topics.length < 2) return null;
    const lines = topics.map((t) => {
      const sug = suggestionsForTopic(t.id, helpers)[0];
      return `<li><strong>${escapeHtml(t.label)}</strong> — z. B. «${escapeHtml(sug?.cmd || sug?.label)}»</li>`;
    });
    const first = suggestionsForTopic(topics[0].id, helpers)[0];
    return {
      type: "text",
      text: `<p>Darin steckt mehreres — ich hoere:</p><ul>${lines.join("")}</ul>${offerHintHtml(first)}`,
      offerRun: first?.run,
      offerLabel: first?.label,
      rememberTopic: topics[0].id
    };
  }

  function trySoftUnderstand(q, raw, helpers) {
    const topics = scoreTopics(q, raw);
    if (!topics.length) return null;
    const top = topics[0];
    if (top.score < 1) return null;
    return buildOfferFromSuggestions(suggestionsForTopic(top.id, helpers), top.label, helpers);
  }

  function smartFallback(raw, helpers, ctx) {
    const q = norm(raw);
    const topics = scoreTopics(q, raw);
    const dynamic = [];
    topics.slice(0, 2).forEach((t) => {
      suggestionsForTopic(t.id, helpers)
        .slice(0, 2)
        .forEach((s) => dynamic.push(s.cmd || s.label));
    });
    const defaults = ["Was steht an?", "Erstelle Notiz", "Helligkeit", "Oeffne Timer"];
    const chips = [...new Set([...dynamic, ...defaults])]
      .slice(0, 5)
      .map((s) => `«<strong>${escapeHtml(s)}</strong>»`)
      .join(" · ");
    return {
      text: `<p>Das habe ich nicht ganz sicher — gemeint koennte sein:</p><p>${chips}</p><p><small>Ein Wort reicht: «Timer», «Notizen», «Heller», «Inbox» …</small></p>`
    };
  }

  function process(raw, helpers, ctx = {}) {
    const q = norm(raw);
    if (!q || q.length < 2) return null;

    const noun = tryNounOpen(q, raw, helpers);
    if (noun) return noun;

    const strong = tryStrongIntent(q, raw, helpers, ctx);
    if (strong) return strong;

    if (q.length < 55 && !hasOpenVerb(q)) {
      const multi = tryMultiTopicOffer(q, raw, helpers);
      if (multi) return multi;
      const soft = trySoftUnderstand(q, raw, helpers);
      if (soft) return soft;
    }

    return null;
  }

  function isIntentLike(q, raw) {
    if (scoreTopics(q, raw).length) return true;
    return NOUN_OPENS.some((e) => e.terms.some((t) => q === t || q.startsWith(t + " ")));
  }

  global.NocoAIIntent = {
    process,
    smartFallback,
    scoreTopics,
    isIntentLike,
    suggestionsForTopic
  };
})(typeof window !== "undefined" ? window : globalThis);
