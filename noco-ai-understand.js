/**
 * NOCO AI Understand 4.0 — Tippfehler, Kontext, Umgangssprache, Nachfragen
 */
(function initNocoAIUnderstand(global) {
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

  /** Wort-Ersetzungen (haeufige Tippfehler & Kurzformen) */
  const TOKEN_FIXES = {
    eintsellungen: "einstellungen",
    einstelungen: "einstellungen",
    einstelllungen: "einstellungen",
    setings: "settings",
    settigns: "settings",
    forsch: "forge",
    forg: "forge",
    foreg: "forge",
    nozizen: "notizen",
    notzien: "notizen",
    notizen: "notizen",
    aufgaben: "aufgaben",
    aufgabe: "aufgabe",
    timmer: "timer",
    timr: "timer",
    memorie: "memory",
    erinerung: "erinnerung",
    erinnnerung: "erinnerung",
    sicherheit: "sicherheit",
    siccherheit: "sicherheit",
    thems: "themes",
    thme: "theme",
    "noco ai": "noco ai",
    "noko ai": "noco ai",
    nocoai: "noco ai",
    spolight: "spotlight",
    spotlght: "spotlight",
    bibliotek: "bibliothek",
    bibilothek: "bibliothek",
    widgets: "widgets",
    widgts: "widgets",
    exclusive: "exclusive",
    exklusiv: "exclusive",
    pomodoro: "pomodoro",
    fokusmodus: "fokus modus",
    inbox: "inbox",
    wasstehtan: "was steht an",
    systemstatus: "system status",
    taschenlampe: "taschenlampe"
  };

  const PHRASE_FIXES = [
    [/\bwas\s+steht\s+an\b/gi, "was steht an"],
    [/\b(kannst du mir|koennen sie mir|bitte mal)\s+/gi, ""],
    [/\b(ich will|ich moechte|ich möchte|ich muss|ich will mal)\s+/gi, ""],
    [/\b(zeig mir mal|zeig mal|mach mal)\s+/gi, "zeig "],
    [/\b(kann ich|darf ich)\s+(die\s+)?/gi, ""],
    [/\b(hilf mir|help me)\s+(bei|mit)\s+/gi, "wie "],
    [/\b(gibt es|gibts)\s+(eine?\s+)?(app|möglichkeit)\s+fuer\s+/gi, "oeffne "],
    [/\b(wo finde ich|wo ist die)\s+/gi, "wo ist "],
    [/\b(merk dir|merke dir|notier|notiere schnell|gedanke)\s+/gi, "merke dir "],
    [/\b(überrasch|ueberrasch|surprise)\s+mich\b/gi, "ueberrasch mich"],
    [/\b(guten morgen|guten abend|gute nacht)\b/gi, (m) => m[0].toLowerCase()],
    [/\b(arbeitsmodus|arbeit modus|work mode)\b/gi, "arbeitsmodus"],
    [/\b(chill modus|entspann modus|relax modus)\b/gi, "chillmodus"],
    [/\b(spiel modus|game mode|spielen modus)\b/gi, "spielmodus"],
    [/\b(beam suche|suche in beam|spotlight suche)\s+nach\s+/gi, "beam suche nach "],
    [/\b(tagesbriefing|morgen briefing|daily briefing)\b/gi, "tagesbriefing"],
    [/\b(und was noch|was sonst noch)\b/gi, "was steht an"],
    [/\b(stimmung|mood)\s+(notieren|speichern|loggen)\b/gi, "stimmung notieren "],
    [/\b(hey[, ]+)?my name is\b/gi, "my name is"],
    [/\b(ich heisse|ich heiße)\b/gi, "ich heisse"],
    [/\b(how are you|wie gehts dir|wie geht es dir)\b/gi, "wie geht es dir"],
    [/\b(letzte app|last app)\b/gi, "letzte app oeffnen"],
    [/\b(meeting prep|meeting vorbereitung)\b/gi, "meeting vorbereitung"]
  ];

  function fixTokens(t) {
    return t
      .split(" ")
      .map((w) => TOKEN_FIXES[w] || w)
      .join(" ");
  }

  function expandQuery(text, raw, ctx) {
    let t = String(text || "").trim();
    if (!t) return t;
    PHRASE_FIXES.forEach(([re, rep]) => {
      if (typeof rep === "function") t = t.replace(re, rep);
      else t = t.replace(re, rep);
    });
    t = fixTokens(norm(t));
    if (ctx?.lastBrainTopic === "inbox" && /^(und|auch|noch)\s/.test(t)) {
      if (/\b(timer)\b/.test(t)) return "wann ist mein timer";
      if (/\b(memory|erinnerung)\b/.test(t)) return "liste erinnerungen";
      if (/\b(task|aufgab|todo)\b/.test(t)) return "offene aufgaben";
      if (/\b(notiz)\b/.test(t)) return "wie viele notizen";
    }
    return t.replace(/\s+/g, " ").trim();
  }

  function processFollowUp(text, raw, helpers, ctx) {
    const q = norm(text);
    const r = String(raw || "").trim();
    if (!q || q.length > 80) return null;

    const topic = ctx?.lastBrainTopic;

    if (
      /^(und der timer|und timer|was mit dem timer|wie laeuft der timer|timer noch)\b/.test(q) ||
      (topic === "timer" && /^(und|auch|noch|details)\b/.test(q) && /\btimer\b/.test(q))
    ) {
      return global.NocoAISystem?.processCommand?.("wann ist mein timer", helpers);
    }
    if (
      /^(und (die )?erinnerung|und memory|und memories|erinnerungen noch)\b/.test(q) ||
      (topic === "memory" && /^(und|auch)\b/.test(q))
    ) {
      return global.NocoAISystem?.processCommand?.("liste erinnerungen", helpers);
    }
    if (/^(und (die )?aufgaben|und tasks|und todos|tasks noch)\b/.test(q) || (topic === "tasks" && /^und\b/.test(q))) {
      return global.NocoAISystem?.processCommand?.("offene aufgaben", helpers);
    }
    if (/^(und der status|system noch|status noch|mehr details)\b/.test(q) || (topic === "status" && /^und\b/.test(q))) {
      return global.NocoAISystem?.processCommand?.("system status", helpers);
    }
    if (/^(und inbox|nochmal inbox|was steht noch an)\b/.test(q) || (topic === "inbox" && /^und\b/.test(q))) {
      return global.NocoAISystem?.processCommand?.("was steht an", helpers);
    }
    if (/^(und notizen|meine notizen)\b/.test(q)) {
      return global.NocoAISystem?.processCommand?.("wie viele notizen", helpers);
    }
    if (/^(oeffne das|mach das|ja mach|genau so)\b/.test(q) && ctx?.lastSuggestedCommand) {
      return global.NocoAI?.processMessage?.(ctx.lastSuggestedCommand, helpers);
    }
    if (/^(nein|stop|abbrechen|cancel)\b/.test(q) && q.length < 16) {
      ctx.pendingOffer = null;
      ctx.pendingAppId = null;
      return { type: "text", text: "<p>Okay — abgebrochen. Was moechtest du stattdessen?</p>", rememberTopic: "cancel" };
    }
    if (/^(verstanden|ok danke|alles klar danke)\b/.test(q)) {
      return {
        type: "text",
        text: "<p>Super! Ich bin bereit fuer den naechsten Befehl — <strong>Was steht an?</strong> oder <strong>Hilfe</strong>.</p>",
        rememberTopic: "thanks"
      };
    }

    return null;
  }

  function smartHint(text) {
    const q = norm(expandQuery(text, text, {}));
    if (q.length < 3) return null;
    const hints = [];
    if (/[aeiou]{4,}/.test(q) || /\b\w{12,}\b/.test(q)) hints.push("Kuerzer formulieren hilft — z. B. «Oeffne Timer»");
    if (/\b(wie|was)\b/.test(q) && !/\?$/.test(String(text || ""))) hints.push("Fragezeichen am Ende kann helfen");
    if (/\b(und|auch)\s*$/.test(q)) hints.push("Nachfrage: «und der Timer?» oder «und Aufgaben?»");
    if (!hints.length) return null;
    return { text: `<p><small>Verstaendnis-Tipp: ${hints.join(" · ")}</small></p>` };
  }

  global.NocoAIUnderstand = {
    expandQuery,
    processFollowUp,
    smartHint,
    norm,
    fixTokens
  };
})(typeof window !== "undefined" ? window : globalThis);
