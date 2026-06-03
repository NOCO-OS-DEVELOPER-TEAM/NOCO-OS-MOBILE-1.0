/**
 * NOCO AI — Offline-Assistent, viele Befehle, fuzzy, Widget + App
 */
(function initNocoAIModule(global) {
  const AI_NAME = "NOCO AI";
  const MAX_LOG_NODES = 56;
  const TYPING_MS = 340;
  const TYPING_WIDGET_MS = 260;

  const APP_ALIASES = [
    { id: "settings", words: ["settings", "setting", "einstellungen", "einstellung", "optionen", "preferences", "prefs", "konfiguration", "systemeinstellungen", "core", "noco core", "system", "deck", "konfigurieren", "einstellen", "anpassen system"] },
    { id: "security", words: ["security", "sicherheit", "shield", "shieldgate", "passkey", "code", "schutz", "scan", "face id", "faceid", "pin", "sperre"] },
    { id: "sync", words: ["sync", "keycard", "import", "export", "backup", "synchron", "verbinden", "key card"] },
    { id: "forge", words: ["forge", "store", "app store", "appstore", "apps laden", "apps installieren", "neue apps", "shop", "installieren"] },
    { id: "nocoai", words: ["noco ai", "nocoai", "ki", "ai", "assistent", "chatbot", "copilot", "hilfe ki", "sprachassistent"] },
    { id: "beam", words: ["beam", "noco beam", "suche", "search", "spotlight", "finden", "suchen", "finder"] },
    { id: "themes", words: ["themes", "theme", "design app", "farben", "look", "aurora", "wallpaper", "midnight", "sunset", "forest"] },
    { id: "notes", words: ["notes", "notizen", "notiz", "notizblock", "notizbuch", "notepad", "schreibblock", "schnellnotiz", "memo", "tagebuch"] },
    { id: "tasks", words: ["tasks", "aufgaben", "todo", "to do", "checkliste", "erledigen", "task liste", "aufgabenliste"] },
    { id: "timer", words: ["timer", "countdown", "fokus timer", "uhrzeit", "stoppuhr"] },
    { id: "memories", words: ["memory", "erinnerung", "erinnerungen", "reminder", "erinner mich", "wecker", "alarm"] },
    { id: "calculator", words: ["rechner", "calculator", "mathe", "rechnen", "taschenrechner"] },
    { id: "weather", words: ["wetter", "weather", "regen", "sonne", "wolken"] },
    { id: "flashlight", words: ["taschenlampe", "flashlight", "taschen lampe", "mach licht", "licht an", "lampe an"] },
    { id: "arcade", words: ["arcade", "mini arcade", "spiele hub"] },
    { id: "hub", words: ["hub", "schnellmenu", "schnell menu", "menu"] },
    { id: "exclusive", words: ["exclusive", "premium", "abo", "member", "mitglied"] },
    { id: "toon", words: ["toon", "zeitung", "news", "meldungen"] },
    { id: "web", words: ["web", "browser", "internet", "explorer"] },
    { id: "pay", words: ["pay", "wallet", "geldbeutel", "guthaben", "kredit", "kontostand", "balance", "geld", "bezahlen", "konto", "nocopay", "noco pay", "aufladen"] },
    { id: "runner", words: ["runner", "laufen", "run", "nocorunner"] },
    { id: "dodgerun", words: ["dodge", "ausweichen", "dodgerun", "dodge run"] },
    { id: "memorygrid", words: ["memory", "merken", "grid", "memory grid"] },
    { id: "tapdash", words: ["tap", "dash", "tippen", "tap dash"] },
    { id: "colorcatch", words: ["color", "farbe", "catch", "color catch"] },
    { id: "quotes", words: ["quotes", "spruch", "zitat", "daily", "sprueche"] },
    { id: "breath", words: ["breath", "atem", "atmen", "ruhe"] },
    { id: "sketch", words: ["sketch", "zeichnen", "zeichnung", "malen"] },
    { id: "pulse", words: ["pulse", "puls", "herz"] },
    { id: "focus", words: ["focus", "fokus", "konzentration"] },
    { id: "cloud", words: ["cloud", "wolke", "speicher"] },
    { id: "mood", words: ["mood", "stimmung", "vibe", "board"] },
    { id: "vault", words: ["vault", "tresor", "geheim"] },
    { id: "glowcam", words: ["glowcam", "kamera", "cam", "foto"] },
    { id: "transit", words: ["transit", "route", "fahrt", "bahn"] },
    { id: "radar", words: ["radar", "status radar", "netz"] },
    { id: "recipes", words: ["recipes", "rezept", "kochen"] },
    { id: "sketch", words: ["sketch"] }
  ];

  const RISKY_APP_IDS = new Set(["focus", "cloud", "web", "hub", "sync", "pay", "radar", "pulse", "mood", "vault", "nocoai", "beam", "quotes", "breath"]);

  const OPEN_VERBS = [
    "offne", "oeffne", "open", "starte", "zeig", "geh zu", "gehe zu", "navigiere", "switch", "launch", "start", "ruf", "hol",
    "wechsel", "wechsle", "bring mich", "fuehr mich", "fuehre mich", "goto", "gehe", "oeffne mir", "starte mir"
  ];

  const CHITCHAT = [
    { keys: ["hallo", "hi", "hey", "moin", "servus", "guten tag", "hello", "na"], replies: [
      "Hallo! Ich bin NOCO AI — komplett offline. Du kannst mit mir reden, Apps oeffnen oder Home-Widgets verwalten.",
      "Hey! Schoen, dass du da bist. Frag mich «Was kannst du?» oder tippe «Oeffne Core».",
      "Hi! Alles laeuft lokal auf deinem Geraet — schnell, privat, ohne Cloud."
    ]},
    { keys: ["wie geht", "wie gehts", "wie geht es", "alles fit", "was geht", "wie lauft"], replies: [
      "Mir geht es glasig-gut — null Lag, nur NOCO-Vibes. Wie ist es bei dir?",
      "Alles smooth im Liquid-Glass-Modus. Ich bin bereit fuer Befehle oder Smalltalk.",
      "Bestens! Offline heisst: sofort antworten, auch ohne Internet."
    ]},
    { keys: ["wer bist", "was bist", "was kannst", "faehigkeiten"], replies: [
      "Ich bin NOCO AI — offline Assistent fuer NOCO OS Mobile 1.2. Apps oeffnen, navigieren, Tipps geben, Tippfehler korrigieren.",
      "Kein echtes Internet-KI-Modell — dafuer hunderte fertige Antworten und starke Befehls-Erkennung.",
      "Sag «Hilfe» fuer eine Befehlsliste, «Oeffne …» fuer Apps, oder plaudere einfach mit mir."
    ]},
    { keys: ["danke", "thx", "thanks", "super", "cool", "nice", "perfekt", "geil", "stark"], replies: [
      "Gern! Ich bin jederzeit da — offline und ohne Wartezeit.",
      "Freut mich! Probier auch das NOCO-AI-Widget auf dem Home-Screen.",
      "Danke dir! Noch Fragen? Einfach tippen."
    ]},
    { keys: ["tschuss", "bye", "ciao", "bis bald", "bis dann", "machs gut"], replies: [
      "Tschuess! NOCO bleibt im Glas-Modus bereit.",
      "Bis bald — ein Befehl genuegt, wenn du zurueck bist.",
      "Ciao! Alles bleibt lokal auf deinem Geraet."
    ]},
    { keys: ["was kann ich", "what can i", "was soll ich", "was mach ich", "was kann man", "ideen fuer", "langweile mich"], replies: [
      "Du kannst Apps oeffnen («Oeffne Core»), Notizen erstellen («Erstelle Notiz mit Titel Aufgaben»), plaudern, oder die Bibliothek erkunden — Beam, Forge, Spiele, Core.",
      "Probiere: Home-Widgets, NOCO Beam, einen neuen AI-Chat, oder Spiele im Forge-Ordner. Frag mich «Hilfe» fuer alle Befehle.",
      "Ich kann navigieren, Notizen anlegen, Apps starten und Smalltalk — alles offline. Was interessiert dich am meisten?"
    ]},
    { keys: ["liebe", "magst du", "freund", "nett"], replies: [
      "Als offline KI mag ich vor allem klare Befehle und gute Vibes — danke fuer die netten Worte!",
      "Ich bin fuer dich da — am besten mit «Oeffne Forge» oder einem freundlichen Hallo.",
      "Das klingt freundlich — zurueck kommt Liquid Glass und ein Laecheln aus dem Display."
    ]},
    { keys: ["langweilig", "gelangweilt", "was tun", "idee"], replies: [
      "Probier Spiele in der Bibliothek, NOCO Beam oder das Memory-Grid in Forge.",
      "Oeffne Arcade, starte einen Timer oder frag mich «Liste Apps».",
      "Wechsel das Theme in Core — neuer Look, neues Gefuehl."
    ]},
    { keys: ["gut gemacht", "nice work", "krass", "wow", "hammer"], replies: [
      "Danke! NOCO OS und ich sind ein gutes Team — offline und schnell.",
      "Freut mich! Noch ein Befehl? Ich kann Apps, Notizen und Chats verbinden.",
      "Stark — weiter gehts mit «Hilfe» oder einem neuen Chat."
    ]},
    { keys: ["schlecht", "mist", "aerger", "frustriert", "genervt"], replies: [
      "Verstehe ich. Probier einen Hard-Refresh oder schliess die App kurz — alles bleibt lokal gespeichert.",
      "Wenn etwas haengt: Island schliessen, zurueck zum Home, nochmal oeffnen. Ich helfe gern mit «Hilfe».",
      "Atme kurz durch — dann «Oeffne Core» fuer Einstellungen oder «Was kann ich tun?»"
    ]},
    { keys: ["was jetzt", "nächster schritt", "naechster schritt", "empfehlung"], replies: [
      "Gerade sinnvoll: Kurz in Notizen schreiben, einen AI-Chat fuer Fragen, oder «Oeffne Beam» fuer Apps.",
      "Ich wuerde mit «Was kann ich tun?» starten — oder direkt «Oeffne Notiz mit Aufgaben» wenn du listen hast.",
      "Probier die Schnellzugriff-Apps auf der Bibliothek-Seite — NOCO AI, Notizen, Tasks."
    ]},
    { keys: ["morgen", "heute", "spaeter", "erinner"], replies: [
      "Schreib es in eine Notiz: «Erstelle Notiz mit Titel Erinnerung» — oder nutze Tasks im Forge-Bereich.",
      "Ich kann Erinnerungen nicht pushen (offline), aber Notizen und Tasks bleiben auf dem Geraet.",
      "Tipp: «Oeffne Notiz mit Aufgaben» findet deine Listen automatisch."
    ]},
    { keys: ["witzig", "lustig", "haha", "lol", "witz"], replies: [
      "Offline-Witz: Warum ist NOCO AI nie offline? … Doch, ist es — und trotzdem da.",
      "Ich lache in Liquid Glass — Reflexe included.",
      "Humor-Modus: an. Ernst-Modus: «Oeffne Core»."
    ]},
    { keys: ["musik", "song", "hoeren"], replies: [
      "Kein Spotify hier — aber Forge hat Spiele und Mood-Boards. Oder frag mich nach «Was kann ich tun?»",
      "Offline heisst: deine Notizen, nicht die Charts. Trotzdem gute Vibes.",
      "Fuer Fokus: «Oeffne Timer» oder «Starte Fokus Timer»."
    ]},
    { keys: ["wetter heute", "regnet es", "sonne"], replies: [
      "Fuer echtes Wetter: «Oeffne Wetter» in der Bibliothek — Demo-Daten, aber schoen animiert.",
      "Ich sehe nur dein OS, nicht den Himmel. Die Wetter-App hilft weiter.",
      "Kurz: offline = keine Live-Wetter-API. App-Wetter schon."
    ]},
    { keys: ["schlaf", "muede", "müde", "muede"], replies: [
      "Dann vielleicht Breath oder Ruhe-Apps in Forge — oder Sperrbildschirm: «Zeige Lock Screen».",
      "Gute Nacht! Morgen reicht ein «Hallo» — ich bin noch da.",
      "Auto-Lock in Core einstellen, dann sperrt sich das Handy von selbst."
    ]}
  ];

  const TOPIC_REPLIES = [
    { keys: ["glas", "glass", "liquid", "design look"], text: "Liquid Glass = indirekte Farben, Blur, Glow. In Core: Glass Boost und Motion anpassen." },
    { keys: ["version", "1.2", "update", "neu"], text: "NOCO OS Mobile 1.2: App-Bibliothek mit Ausklapp, NOCO AI + Widget, Beam, Forge." },
    { keys: ["lag", "bug", "fehler", "absturz", "langsam", "haengt"], text: "Alles laeuft offline. Bei Haken: App schliessen, kurz warten. Gesten haben Safety-Timer. NOCO AI blockiert nichts im Hintergrund." },
    { keys: ["keycard", "backup"], text: "Sync in der Core-Bibliothek: Keycard importiert Theme, Apps, Notizen und mehr." },
    { keys: ["exclusive", "premium"], text: "Exclusive = Premium-Apps in Forge. «Oeffne Exclusive» zeigt den Status." },
    { keys: ["widget", "widgets", "home"], text: "Home anpassen: Island → Edit → Plus-Button fuer Widgets. NOCO-AI-Widget ist neu dabei!" },
    { keys: ["bibliothek", "library", "apps seite"], text: "Wische zur App-Bibliothek: Beam, Forge, Spiele, Core — Ordner klappen mit installierten Apps aus." },
    { keys: ["island", "dynamic"], text: "Die Island: Uhr, Seiten-Punkte und das ✧-Symbol fuer NOCO AI. Tippen oeffnet das Schnellmenu — dort auch «NOCO AI»." },
    { keys: ["passwort", "code", "pin"], text: "Security in Core: Code, Passkey und ShieldGate. «Oeffne Security»." },
    { keys: ["chat", "verlauf", "gespraech", "nachrichten"], text: "Deine Chats bleiben gespeichert. In der App: «Chats» oben — neuer Chat mit +, umbenennen per Langdruck auf einen Chat." },
    { keys: ["speicher", "merken", "gespeichert"], text: "Alles laeuft lokal in deinem Browser — Chats, Themes, Keycards. Nichts geht in die Cloud." },
    { keys: ["system", "verbindung", "apps zusammen"], text: "Ich durchsuche deine AI-Chats und Notizen offline — z. B. «Oeffne Chat wo ich gefragt habe» oder «Oeffne Notiz mit Aufgaben»." },
    { keys: ["scroll", "chat lang", "verlauf lang"], text: "In der NOCO-AI-App scrollt nur der Chat in der Mitte — Kopfleiste und Eingabe bleiben fixiert." },
    { keys: ["schnellzugriff", "bibliothek", "ordner"], text: "App-Seite: Schnellzugriff oben (AI, Notizen, …), darunter Beam/Forge/Spiele/Core zum Ausklappen." },
    { keys: ["timer start", "countdown"], text: "«Oeffne Timer» oder «Starte Fokus Timer» — Timer-App aus Forge/Core." },
    { keys: ["rechne", "rechnung", "plus"], text: "«Oeffne Rechner» startet den NOCO Taschenrechner sofort." },
    { keys: ["limit", "nachrichten", "plus", "abo ai", "noco ai plus"], text: "Kostenlos: 20 Nachrichten/Tag. <strong>Unbegrenzt</strong> mit <strong>NOCO Exclusive</strong> — NOCO AI ist im Paket enthalten, kein Extra-Plus." },
    { keys: ["offline", "internet", "cloud ki"], text: "Ich laufe komplett offline auf deinem Geraet — kein Chat an Server. Dafuer privat und schnell." },
    { keys: ["falsch", "verwechselt", "falsche app"], text: "Wenn die falsche App aufging: schreib den Namen klarer («Oeffne Notizen») oder sag «ja» nur wenn ich nachfrage." }
  ];

  const SYSTEM_HINTS = [
    { keys: ["finde chat", "such chat", "chat suchen"], reply: "Sag z. B. «Oeffne NOCO AI Chat wo ich nach Hilfe gefragt habe» — ich durchsuche alle gespeicherten Chats." },
    { keys: ["finde notiz", "notiz suchen", "aufgaben notiz"], reply: "Sag «Oeffne Notiz mit Aufgaben» oder «Zeig Notizblock mit Tasks» — ich vergleiche Titel und Text deiner Notizen." },
    { keys: ["vergleich", "schau in notizen", "schau in chats"], reply: "Ich lese lokal in Chats und Notizen und oeffne den besten Treffer — komplett offline auf deinem Geraet." },
    { keys: ["notizblock", "notepad", "aufgabenliste"], reply: "Sag «Oeffne Notiz mit Aufgaben» — ich suche in allen Notizen nach Tasks und oeffne den besten Treffer." },
    { keys: ["alter chat", "letzter chat", "frueherer chat"], reply: "«Oeffne Chat wo ich …» funktioniert mit Stichworten — z. B. Hilfe, Core, oder deine Frage." }
  ];

  const AFFIRMATIVE = [
    "ja",
    "jap",
    "jo",
    "ok",
    "okay",
    "klar",
    "genau",
    "mach",
    "los",
    "bitte",
    "go",
    "yep",
    "sure",
    "yes",
    "please",
    "mach das",
    "tu es",
    "gerne",
    "ja gerne",
    "sehr gerne",
    "ja bitte",
    "ok gerne",
    "mach bitte",
    "mach es",
    "bitte schon",
    "do it",
    "na klar",
    "alles klar"
  ];

  const FALLBACKS = [
    "Das habe ich nicht sicher erkannt. Schreib «Hilfe» fuer Befehle oder «Oeffne …» + App-Name.",
    "Offline kenne ich viele Apps — mit kleinen Tippfehlern finde ich meist den Weg. Probier die Vorschlaege.",
    "Interessant! Meinst du eine App? Dann: «Oeffne Forge». Smalltalk? «Wie gehts dir?»",
    "Ich rate lokal. Bei Unsicherheit frage ich nach — sag «ja» nur wenn du sicher bist.",
    "NOCO AI bleibt simpel: Fragen, Apps, Navigation. «Liste Apps» zeigt, was installiert ist.",
    "Vielleicht meintest du Core, Beam oder Notizen? Formuliere es mit «Oeffne …».",
    "Zu allgemein fuer mich — ein App-Name oder «Wie erstelle ich …?» hilft."
  ];

  const DEFAULT_SUGGESTIONS = [
    "Was steht an?",
    "Helligkeit",
    "Heller",
    "Theme Midnight",
    "Hintergrund",
    "Wann ist mein Timer rum?",
    "Inbox",
    "Erstelle Notiz",
    "Live Wallpaper an",
    "Hilfe"
  ];

  const WIDGET_SUGGESTIONS = ["Was steht an?", "Inbox", "3 plus 3", "Wie stelle ich Auto-Lock ein?", "Hilfe"];

  let mountedRoot = null;
  let busy = false;
  let msgId = 0;
  let dynamicAliases = [];
  let uiHooks = { refreshChats: null, newChat: null, openDrawer: null };
  let sessionContext = {
    pendingAppId: null,
    pendingTitle: null,
    pendingOffer: null,
    pendingOfferLabel: null,
    lastUserText: null,
    lastTopic: null,
    lastUltraTopic: null
  };

  const Chats = () => global.NocoAIChats;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 0; i < a.length; i++) {
      let prev = i + 1;
      for (let j = 0; j < b.length; j++) {
        const val = a[i] === b[j] ? row[j] : Math.min(row[j], row[j + 1], prev) + 1;
        row[j] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hasWholeWord(text, word) {
    if (!word || word.length < 2) return false;
    return new RegExp(`\\b${escapeRegExp(word)}\\b`).test(text);
  }

  function fuzzyWordScore(word, target) {
    if (!word || !target) return 0;
    if (word.length < 4 || target.length < 4) {
      return word === target ? 100 : 0;
    }
    if (word === target) return 100;
    if (word.length < 5 && target.includes(word)) return 0;
    if (target.includes(word) || word.includes(target)) {
      if (word.length < 5 || target.length < 5) return 0;
      return 88 - Math.min(24, Math.abs(word.length - target.length) * 3);
    }
    const dist = levenshtein(word, target);
    const limit = target.length <= 4 ? 1 : target.length <= 7 ? 2 : 3;
    if (dist > limit) return 0;
    return 72 - dist * 14;
  }

  function allAliases() {
    return APP_ALIASES.concat(dynamicAliases);
  }

  function scoreAlias(query, alias) {
    const q = normalize(query);
    let best = 0;
    alias.words.forEach((w) => {
      const nw = normalize(w);
      if (!nw) return;
      if ((nw === "chat" || nw === "chats") && isOpenChatListCommand(query, q)) return;
      if (nw.length >= 4 && hasWholeWord(q, nw)) best = Math.max(best, 96);
      else if (nw.length < 4 && hasWholeWord(q, nw)) best = Math.max(best, 90);
      q.split(" ").forEach((part) => {
        if (part.length < 4) return;
        nw.split(" ").forEach((seg) => {
          if (seg.length >= 4) best = Math.max(best, fuzzyWordScore(part, seg));
        });
        if (nw.length >= 5) best = Math.max(best, fuzzyWordScore(part, nw.replace(/\s/g, "")));
      });
    });
    return best;
  }

  function isQuestionOrChat(query) {
    const q = normalize(query);
    if (!q) return false;
    if (global.NocoAIInsights?.isInsightQuery?.(q, query)) return true;
    if (global.NocoAIPro?.isProQuery?.(q, query)) return true;
    if (global.NocoAITime?.isTimeQuery?.(q, query)) return true;
    if (global.NocoAINatural?.isSettingsRelated?.(q, query)) return true;
    if (global.NocoAILexicon?.isLexiconQuery?.(q, query)) return true;
    if (global.NocoAIIntent?.isIntentLike?.(q, query)) return true;
    if (global.NocoAIUltra?.isBriefingQuery?.(q)) return true;
    if (global.NocoAIUltra?.isFollowUp?.(q, query)) return true;
    if (global.NocoAICreate?.isCreateIntent?.(query, q)) return false;
    if (global.NocoAISystem?.processGuide?.(query, {})) return true;
    if (/\b(wo finde|where (do i|can i) find|where is|wie erstelle|wie kann ich|how do i|how to)\b/.test(q)) return true;
    if (/\b(was kann ich|what can i|was kann man|was soll ich|was mach ich|wie geht|wer bist|was bist|hallo|hi |hey |danke|hilfe|help)\b/.test(q)) return true;
    if (/\b(warum|wieso|weshalb|why|who|when)\b/.test(q) && q.length < 80 && !/\b(oeffne|offne|open)\b/.test(q)) return true;
    if (q.endsWith("?") && !OPEN_VERBS.some((v) => hasWholeWord(q, normalize(v)))) return true;
    return false;
  }

  function resolveAppFromQuery(query, minScore = 50) {
    const q = normalize(query);
    const raw = String(query || "").trim();
    if (isOpenChatListCommand(raw, q)) return null;
    let best = null;
    let score = 0;
    allAliases().forEach((alias) => {
      const s = scoreAlias(q, alias);
      if (s > score) {
        score = s;
        best = alias;
      }
    });
    if (!best || score < minScore) return null;
    return { appId: best.id, confidence: score, label: best.id };
  }

  function rankAppMatches(query) {
    const q = normalize(query);
    if (!q) return [];
    const byId = new Map();
    allAliases().forEach((alias) => {
      const s = scoreAlias(q, alias);
      if (s < 48) return;
      const prev = byId.get(alias.id);
      if (!prev || s > prev.score) byId.set(alias.id, { appId: alias.id, score: s });
    });
    return [...byId.values()].sort((a, b) => b.score - a.score);
  }

  function queryHasOpenVerb(query) {
    const q = normalize(query);
    return OPEN_VERBS.some((v) => {
      const nv = normalize(v);
      return nv.length >= 5 ? hasWholeWord(q, nv) : hasWholeWord(q, nv) && !/\b(machen|mache)\b/.test(q);
    });
  }

  function shouldConfirmAppOpen(appId, confidence, query, ranked) {
    const hasVerb = queryHasOpenVerb(query);
    if (ranked.length >= 2 && ranked[0].score - ranked[1].score < 14 && ranked[1].score >= 56) return true;
    if (RISKY_APP_IDS.has(appId) && confidence < 84) return true;
    if (!hasVerb && confidence < 80) return true;
    return confidence < 74;
  }

  function detectOpenIntent(query) {
    const q = normalize(query);
    if (!q) return null;
    if (global.NocoAICreate?.isCreateIntent?.(query, q)) return null;
    if (isQuestionOrChat(query)) return null;
    const hasVerb = OPEN_VERBS.some((v) => {
      const nv = normalize(v);
      return nv.length >= 5 ? hasWholeWord(q, nv) : hasWholeWord(q, nv) && !/\b(machen|mache)\b/.test(q);
    });
    const settingPhrases = ["ich will", "ich mochte", "ich moechte", "brauche", "einstellen", "anpassen", "andern", "aendern", "konfig", "etwas einstellen", "something einstellen"];
    if (!hasVerb && settingPhrases.some((p) => q.includes(p))) {
      return { appId: "settings", confidence: 85, label: "Core" };
    }
    if (hasVerb || /^(zeig|go|ruf|hol)\s/.test(q)) {
      return resolveAppFromQuery(q, 68);
    }
    if (q.split(" ").length <= 3 && !isQuestionOrChat(query)) {
      return resolveAppFromQuery(q, 80);
    }
    return null;
  }

  function tokenizeContext(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);
  }

  const STOP_TERMS = new Set([
    "ich", "du", "wir", "ihr", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einer",
    "mit", "wo", "war", "hat", "hab", "hast", "habe", "schon", "noch", "mal", "bitte", "mein", "meine",
    "dein", "deine", "mir", "dir", "sie", "the", "and", "for", "you", "mein", "notiz", "notizen", "chat", "chats",
    "noco", "ai", "oeffne", "offne", "open", "zeig", "such", "finde"
  ]);

  function parseOpenContext(raw, q) {
    const terms = [];
    const quoted = raw.match(/["«"]([^"»"]+)["»"]/);
    if (quoted) terms.push(...tokenizeContext(quoted[1]));

    const patterns = [
      /(?:wo ich|where i|in dem ich|chat wo ich|gespraech wo ich|chat in dem ich)\s+(.+)/i,
      /(?:ueber|about|zum thema|thema|mit dem titel)\s+(.+)/i,
      /(?:stichwort|keyword|wort)\s+(.+)/i,
      /(?:nach|wegen)\s+(.+)/i
    ];
    patterns.forEach((re) => {
      const m = raw.match(re);
      if (m) terms.push(...tokenizeContext(m[1]));
    });

    const cleanTerms = [...new Set(terms)].filter((t) => !STOP_TERMS.has(t)).slice(0, 12);

    return {
      terms: cleanTerms,
      wantsQuestionChat:
        /\b(gefragt|frage gestellt|question|gefragt hab|asked|nachgefragt|eine frage|meine frage)\b/.test(q),
      wantsTasksNote: /\b(aufgaben|tasks|task|todo|to do|erledigen|checkliste|einkaufsliste)\b/.test(q),
      openChat:
        /\b(oeffne|offne|open|zeig|such|finde|goto|geh zu|wechsel)\b/.test(q) &&
        /\b(chat|gespraech|unterhaltung|noco ai|ki chat|ai chat)\b/.test(q),
      openNote:
        /\b(oeffne|offne|open|zeig|such|finde|goto|geh zu|wechsel)\b/.test(q) &&
        /\b(notiz|notizen|notepad|notizblock|notizbuch|notizheft|schreibblock)\b/.test(q),
      searchOnly: /\b(such|finde|vergleich|schau|durchsuch|check)\b/.test(q) && !/\b(oeffne|offne|open|zeig)\b/.test(q)
    };
  }

  function processSystemBridge(raw, q, helpers) {
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return null;
    if (global.NocoAIPro?.isProQuery?.(q, raw)) return null;
    if (global.NocoAIInsights?.isInsightQuery?.(q, raw)) return null;
    if (global.NocoAIPro?.isProQuery?.(q, raw)) return null;

    if (isOpenChatListCommand(raw, q)) {
      return {
        type: "action",
        text: "Hier ist deine <strong>Chat-Liste</strong>.",
        run: () => uiHooks.openDrawer?.()
      };
    }

    if (/\b(oeffne|offne|open|starte)\s+noco\s*ai\b/.test(q) && !/\b(chat|gespraech|wo ich|notiz)\b/.test(q)) {
      return null;
    }

    const ctx = parseOpenContext(raw, q);
    const wantsChat =
      (ctx.openChat && !/^(oeffne|offne|open)\s+(die\s+)?chats?\s*$/i.test(raw.trim())) ||
      (ctx.searchOnly && /\b(chat|gespraech|chats)\b/.test(q));
    const wantsNote = ctx.openNote || ctx.wantsTasksNote || (ctx.searchOnly && /\b(notiz|notizen|notepad)\b/.test(q));

    if (wantsChat && helpers.searchChats) {
      const searchQ = ctx.terms.length ? ctx.terms.join(" ") : raw;
      let results = helpers.searchChats(searchQ, {
        preferQuestions: ctx.wantsQuestionChat,
        limit: 6
      });
      if (!results.length && ctx.wantsQuestionChat) {
        results = helpers.searchChats("", { preferQuestions: true, limit: 4 });
      }
      if (results.length) {
        const best = results[0];
        const more =
          results.length > 1
            ? `<p><small>Weitere Treffer: ${results
                .slice(1, 3)
                .map((r) => r.name)
                .join(", ")}</small></p>`
            : "";
        const reason = ctx.wantsQuestionChat
          ? "Chat mit Fragen gefunden"
          : `Treffer-Score ${best.score}`;
        return {
          type: "action",
          text: `<p><strong>${reason}</strong> — oeffne <strong>${best.name}</strong>.</p>${more}`,
          run: () => helpers.openChat(best.id)
        };
      }
      return {
        type: "text",
        text: "<p>Keinen passenden <strong>AI-Chat</strong> gefunden.</p><p>Tipp: Benenne Chats um oder nenne ein Stichwort aus deiner Frage.</p>"
      };
    }

    if (wantsNote && helpers.searchNotes) {
      const searchQ = ctx.terms.length
        ? ctx.terms.join(" ")
        : ctx.wantsTasksNote
          ? "aufgaben tasks todo"
          : raw;
      const results = helpers.searchNotes(searchQ, {
        preferTasks: ctx.wantsTasksNote || /\b(aufgaben|task|todo)\b/.test(q),
        limit: 6
      });
      if (results.length) {
        const best = results[0];
        const hint = helpers.summarizeNoteMatch?.(best, raw) || "";
        const preview = best.preview
          ? `<p><small>${String(best.preview).replace(/</g, "")}${best.preview.length >= 80 ? "…" : ""}</small></p>`
          : "";
        return {
          type: "action",
          text: `<p>Notiz <strong>${best.title}</strong> passt am besten zu deiner Anfrage.</p><p><small>${hint}</small></p>${preview}<p>Oeffne Notizen …</p>`,
          run: () => helpers.openNote(best.id)
        };
      }
      if (ctx.wantsTasksNote) {
        return {
          type: "text",
          text: "<p>Keine Notiz mit <strong>Aufgaben/Tasks</strong> gefunden.</p><p>Sag: «Erstelle Notiz mit Titel Aufgaben» und schreib deine Liste dort hinein.</p>"
        };
      }
      if (!ctx.terms.length && helpers.openApp) {
        return {
          type: "action",
          text: "Oeffne die <strong>Notizen</strong>-App …",
          run: () => helpers.openApp("notes")
        };
      }
    }

    return null;
  }

  function parseDelayMinutes(num, unit) {
    const n = Math.max(1, Math.floor(Number(num) || 1));
    const u = normalize(unit || "min");
    if (/stund|std|hour|^h$/.test(u)) return Math.min(24 * 60, n * 60);
    return Math.min(24 * 60, n);
  }

  function parseReminderCommand(raw) {
    const patterns = [
      /(?:erinnere mich|remind me)\s+in\s+(\d+)\s*(minuten|min|minute|stunden|std|stunde|h|hours?)\s*(?:(?:dass|das|zu|um|to|that)\s+)?(.+)/i,
      /(?:erinnere mich|remind me)\s+in\s+(\d+)\s*(min|minuten?)\s+(.+)/i,
      /^in\s+(\d+)\s*(minuten|min|minute|stunden|std|stunde|h)\s+(.+)/i
    ];
    for (const re of patterns) {
      const m = raw.match(re);
      if (!m) continue;
      let text = String(m[3] || "").trim().replace(/^[,.\s:]+/, "");
      text = text.replace(/^(dass|das|zu|um|to|that)\s+/i, "").trim();
      if (text.length < 2) continue;
      return { minutes: parseDelayMinutes(m[1], m[2]), text: text.slice(0, 200) };
    }
    return null;
  }

  function parseTimerStartCommand(raw) {
    const mins = global.NocoAITime?.parseTimerStartMinutes?.(raw);
    if (mins != null) return mins;
    const m =
      raw.match(/(?:starte?|start|stell|setz).{0,20}timer.{0,16}(\d+)\s*(minuten|min|minute|stunden|std|h)?/i) ||
      raw.match(/timer.{0,14}(\d+)\s*(minuten|min)/i);
    if (!m) return null;
    return parseDelayMinutes(m[1], m[2] || "min");
  }

  function escapeHtmlLite(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function processSmartActions(query, helpers) {
    const raw = String(query || "").trim();
    const q = normalize(raw);

    const created = global.NocoAICreate?.process?.(raw, helpers);
    if (created) {
      global.NocoAIPro?.rememberCreateSpec?.(raw);
      return created;
    }

    const insights = global.NocoAIInsights?.process?.(raw, helpers);
    if (insights) return insights;

    const timeHit = global.NocoAITime?.process?.(raw, helpers);
    if (timeHit) return timeHit;

    const ultra = global.NocoAIUltra?.process?.(raw, helpers, sessionContext);
    if (ultra) return ultra;

    const pro = global.NocoAIPro?.process?.(raw, helpers, sessionContext);
    if (pro) return pro;

    const bridge = processSystemBridge(raw, q, helpers);
    if (bridge) return bridge;

    const mathHit = global.NocoAIMath?.evaluate?.(raw);
    if (mathHit) return { type: "text", text: mathHit.text };

    const reminder = parseReminderCommand(raw);
    if (reminder && helpers.addReminder) {
      return {
        type: "action",
        text: `<p><strong>Memory</strong> in ${reminder.minutes} Min:</p><p>«${escapeHtmlLite(reminder.text)}»</p><p><small>Du bekommst einen Toast, wenn die Zeit um ist.</small></p>`,
        run: () => {
          helpers.addReminder({ text: reminder.text, minutes: reminder.minutes });
          helpers.openMemories?.();
        }
      };
    }

    const timerMins = parseTimerStartCommand(raw);
    if (timerMins != null && helpers.applyTimerMinutes) {
      return global.NocoAITime?.buildTimerStartAction?.(timerMins, helpers) || {
        type: "action",
        text: `Stelle Timer auf <strong>${timerMins} Minuten</strong> und starte …`,
        run: () => {
          helpers.applyTimerMinutes(timerMins);
          helpers.startTimerCountdown?.();
          helpers.openTimerApp?.();
        }
      };
    }

    if (
      /\b(bild|bilder|foto|fotos|image|picture|zeichnung generier)\b/.test(q) &&
      /\b(erstell|mach|generier|male|zeichne|kannst)\b/.test(q)
    ) {
      return {
        type: "text",
        text: "<p>Bilder kann ich leider <strong>noch nicht</strong> erstellen — das kommt spaeter.</p><p>Ich kann aber <strong>Notizen</strong> anlegen, Apps oeffnen, navigieren und mit dir plaudern.</p>"
      };
    }

    if (/\b(speicher|schreib).{0,15}notiz\b/.test(q) && helpers.appendToActiveNote) {
      const textMatch = raw.match(/notiz\s+(.+)/i);
      const chunk = textMatch ? textMatch[1].replace(/^["«]|["»]$/g, "").trim() : "";
      if (chunk) {
        return {
          type: "action",
          text: "Fuege Text zur aktiven Notiz hinzu …",
          run: () => helpers.appendToActiveNote(chunk)
        };
      }
    }

    return null;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function formatHelpHtml() {
    return `
      <p><strong>So sprichst du mit mir</strong></p>
      <ul>
        <li><strong>Apps:</strong> «Oeffne Core», «Starte Forge», «Zeig Wetter»</li>
        <li><strong>Navigation:</strong> «Gehe zu Home», «Gehe zu Apps»</li>
        <li><strong>Core:</strong> «Auto-Lock aus», «Mehr Liquid Glass», «System Status»</li>
        <li><strong>Erklaeren:</strong> «Wo finde ich Animationen?» — nur Anleitung. «Ja gerne» fuehrt aus.</li>
        <li><strong>Erstellen:</strong> «Erstelle Notiz» = leeres Beispiel. Mit Titel: «Erstelle Notiz mit Titel Einkauf». Gleiches fuer Task, Chat, Timer.</li>
        <li><strong>Widgets:</strong> «Widget Pack AI», «Standard Widgets», «Welche Widgets habe ich?»</li>
        <li><strong>Theme/Pay:</strong> «Theme Sunset», «Zeig Guthaben», «Pay +10 EUR»</li>
        <li><strong>Apps:</strong> «Oeffne ShieldGate», «Installiere Dodge Run», «Oeffne Beam»</li>
        <li><strong>Info:</strong> «Liste Apps», «Was ist installiert?»</li>
        <li><strong>Smalltalk:</strong> «Wie geht's dir?», «Was kann ich tun?»</li>
        <li><strong>Rechnen:</strong> «3 plus 3», «3*4+5», «3 mal 4 plus 5»</li>
        <li><strong>Daten:</strong> «Inbox», «Meine Notizen», «Offene Aufgaben», «Such ueberall nach …»</li>
        <li><strong>Alltagssprache:</strong> Ein Wort reicht — «Timer», «Notizen», «Helligkeit», «Inbox» — ich biete Aktionen oder starte direkt</li>
        <li><strong>Fragen:</strong> «Wie stelle ich Auto-Lock ein?» — «Ja» fuehrt aus</li>
        <li><strong>Ueberblick:</strong> «Was steht an?», «System Status» — auch «und der Timer?» als Nachfrage</li>
        <li><strong>Zeit:</strong> «Wann ist mein Timer rum?», «Wann ist meine Erinnerung?»</li>
        <li><strong>Modi:</strong> «Fokus Modus», «Tagesplan», «Coach»</li>
        <li><strong>Smart:</strong> «Erledige Aufgabe …», «15 Prozent von 80», «10 km in Meilen»</li>
        <li><strong>Wissen:</strong> «Empfehl mir was», «Was ist Forge?»</li>
        <li><strong>Notizen:</strong> «Erstelle Notiz» (leer) · «Erstelle Notiz mit Titel Einkauf»</li>
        <li><strong>Tasks:</strong> «Erstelle Aufgabe» · «Erstelle Aufgabe Milch kaufen»</li>
        <li><strong>Memory:</strong> «Erinnere mich in 20 Minuten, Muell rausbringen»</li>
        <li><strong>Timer:</strong> «Starte Timer 10 Minuten»</li>
        <li><strong>System-Suche:</strong> «Oeffne Chat wo ich gefragt habe», «Oeffne Notiz mit Aufgaben»</li>
      </ul>
      <p>Tippfehler sind ok — «Einstellungen», «Setings» oder «Workspaca» werden oft erkannt.</p>
      <p><strong>Chats:</strong> Mehrere Gespraeche, Verlauf bleibt gespeichert. «Chats» in der App oder ✧ in der Island.</p>
    `;
  }

  function isAffirmative(query) {
    const raw = String(query || "").trim();
    const q = normalize(query);
    if (!q || q.length > 42) return false;
    if (AFFIRMATIVE.some((w) => q === w || q.startsWith(w + " ") || q.endsWith(" " + w) || q.includes(" " + w + " "))) {
      return true;
    }
    return /^(ja|ok|yes|sure|gerne|bitte|klar|go)[\s!,.\-]*$/i.test(raw) || /\b(ja|yes)\s+(gerne|bitte|klar|mach)\b/.test(q);
  }

  function isOpenChatListCommand(raw, q) {
    const t = String(raw || "").trim();
    return (
      /^(oeffne|offne|open|zeig)\s+(die\s+)?(chats?|gespraeche?|chatliste|unterhaltungen?)\s*$/i.test(t) ||
      /^(chats?|gespraeche?)\s*(oeffnen|offnen|open|zeigen?)\s*$/i.test(t)
    );
  }

  function isExplicitFlashlightCommand(q) {
    return (
      /\b(taschenlampe|flashlight)\b/.test(q) ||
      /\b(mach|schalt).{0,8}(licht|lampe)\b/.test(q) ||
      /\b(licht|lampe)\s*(an|ein)\b/.test(q)
    );
  }

  function processNavAndSystem(query, helpers) {
    const q = normalize(query);
    const raw = String(query || "").trim();

    if (isOpenChatListCommand(raw, q)) {
      return {
        type: "action",
        text: "Oeffne die <strong>Chat-Liste</strong> …",
        run: () => uiHooks.openDrawer?.()
      };
    }

    if (/\b(hilfe|help|befehle|commands|anleitung)\b/.test(q) && q.length < 40) {
      return { type: "text", text: formatHelpHtml() };
    }

    if (/\b(system status|status report|geraete status|wie steht)\b/.test(q)) {
      const status = global.NocoAIBrain?.process?.("system status", helpers);
      if (status?.text) return { type: "text", text: status.text };
    }

    if (/\b(liste|list|zeig).*(apps|installiert|programme)\b/.test(q) || /\bwas ist installiert\b/.test(q)) {
      const list = helpers.listInstalledApps?.() || [];
      const core = "Core, Security, Sync, NOCO AI";
      const extra = list.length ? list.join(", ") : "keine Extra-Apps aus Forge";
      return {
        type: "text",
        text: `<p><strong>Installiert / verfuegbar</strong></p><p>Standard: ${core}</p><p>Aus Forge: ${extra}</p><p>Bibliothek: Beam · Forge · Spiele · Core (Ordner antippen).</p>`
      };
    }

    if (/\b(home|startseite|start bildschirm)\b/.test(q) && /\b(geh|zeig|offne|oeffne|navig|switch|zu)\b/.test(q)) {
      return {
        type: "action",
        text: "Wechsle zum <strong>Home</strong> …",
        run: () => helpers.goToPage?.(0)
      };
    }

    if (/\b(apps|desktop|bibliothek|app bibliothek)\b/.test(q) && /\b(geh|zeig|offne|oeffne|navig|switch|zu)\b/.test(q)) {
      return {
        type: "action",
        text: "Oeffne die <strong>App-Bibliothek</strong> …",
        run: () => helpers.goToPage?.(1)
      };
    }

    if (/\b(widget|widgets)\b/.test(q) && /\b(hinzuf|add|neu|einfueg|einfug)\b/.test(q)) {
      return {
        type: "action",
        text: "Home-Anpassen: tippe auf dem Home zuerst <strong>Edit</strong> (Island), dann den <strong>+</strong> Button unten rechts.",
        run: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.enableEditMode?.();
            window.setTimeout(() => helpers.openWidgetPanel?.(), 280);
          }, 320);
        }
      };
    }

    if (/\b(bearbeit|edit|anpassen)\b/.test(q) && /\b(home|start)\b/.test(q)) {
      return {
        type: "action",
        text: "<strong>Bearbeiten-Modus</strong> am Home wird aktiviert …",
        run: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => helpers.enableEditMode?.(), 200);
        }
      };
    }

    if (/\b(spiele|games)\b/.test(q) && /\b(bibliothek|ordner|zeig)\b/.test(q)) {
      return {
        type: "action",
        text: "Gehe zu Apps und oeffne den Ordner <strong>Spiele</strong> …",
        run: () => {
          helpers.goToPage?.(1);
          window.setTimeout(() => helpers.openLibraryFolder?.("games"), 400);
        }
      };
    }

    if (/\b(workspace|workspac|arbeits)\b/.test(q)) {
      return {
        type: "action",
        text: "Core-Bereich in der Bibliothek — dort liegt Workspace …",
        run: () => {
          helpers.goToPage?.(1);
          window.setTimeout(() => helpers.openLibraryFolder?.("core"), 400);
        }
      };
    }

    if (/\b(neuer chat|neues gespraech|neue unterhaltung)\b/.test(q) || (/\bchat\b/.test(q) && /\b(neu|erstell|start)\b/.test(q))) {
      return {
        type: "action",
        text: "Starte einen <strong>neuen Chat</strong> — dein alter Verlauf bleibt gespeichert.",
        run: () => uiHooks.newChat?.()
      };
    }

    if (/\b(chats|chat liste|gespraeche|unterhaltungen)\b/.test(q) && q.length < 36) {
      return {
        type: "action",
        text: "Oeffne die <strong>Chat-Liste</strong> …",
        run: () => uiHooks.openDrawer?.()
      };
    }

    if (/\b(island|insel)\b/.test(q) && /\b(ai|ki|assistent)\b/.test(q)) {
      return {
        type: "text",
        text: "NOCO AI sitzt in der Island: tippe das <strong>✧</strong> neben den Punkten — oder Island aufklappen → «NOCO AI»."
      };
    }

    if (/\b(schnellzugriff|quick apps|favoriten apps)\b/.test(q)) {
      return {
        type: "action",
        text: "Zur <strong>App-Bibliothek</strong> — Schnellzugriff ist oben sichtbar …",
        run: () => helpers.goToPage?.(1)
      };
    }

    if (/\b(zurueck|zuruck|back)\b/.test(q) && /\b(home|start|desktop)\b/.test(q)) {
      return { type: "action", text: "Zurueck zum <strong>Home</strong> …", run: () => helpers.goToPage?.(0) };
    }

    if (/\b(schliess|schliesse|close)\b/.test(q) && /\b(app|fenster|sheet)\b/.test(q)) {
      return {
        type: "text",
        text: "Tippe oben rechts auf <strong>×</strong> oder wische die App nach unten weg."
      };
    }

    if (/\b(bearbeit|edit)\b/.test(q) && /\b(home|start|widget)\b/.test(q) && !/\b(apps|desktop|bibliothek)\b/.test(q)) {
      return {
        type: "action",
        text: "<strong>Home bearbeiten</strong> — Island → Edit, dann + fuer Widgets.",
        run: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => helpers.enableEditMode?.(), 280);
        }
      };
    }

    if (/\b(widget|widgets)\b/.test(q) && /\b(hinzuf|add|neu)\b/.test(q) && !/\b(liste|zeig)\b/.test(q)) {
      return {
        type: "action",
        text: "Oeffne Widget-Auswahl …",
        run: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.enableEditMode?.();
            window.setTimeout(() => helpers.openWidgetPanel?.(), 260);
          }, 240);
        }
      };
    }

    return null;
  }

  function chitchatReply(query) {
    const q = normalize(query);
    for (const hint of SYSTEM_HINTS) {
      if (hint.keys.some((k) => q.includes(normalize(k)))) return hint.reply;
    }
    for (const block of CHITCHAT) {
      if (block.keys.some((k) => q.includes(normalize(k)))) {
        return pickRandom(block.replies);
      }
    }
    for (const topic of TOPIC_REPLIES) {
      if (topic.keys.some((k) => {
        const nk = normalize(k);
        if (nk === "chat" || nk === "verlauf") return /\b(chats?|verlauf|gespraech)\b/.test(q) && !/^(oeffne|offne|open)\s/.test(q);
        return q.includes(nk);
      })) {
        return topic.text;
      }
    }
    return null;
  }

  function confidenceLabel(score) {
    if (score >= 88) return "Treffer: sicher";
    if (score >= 72) return "Treffer: gut (Tippfehler korrigiert)";
    return "Treffer: wahrscheinlich";
  }

  function processMessage(query, helpers, context = {}) {
    const text = String(query || "").trim();
    if (!text) {
      return { type: "text", text: "Schreib eine Nachricht — z. B. «Hilfe», «Oeffne Core» oder «Wie geht's dir?»" };
    }

    const pendingId = context.pendingAppId || sessionContext.pendingAppId;
    const pendingTitle = context.pendingTitle || sessionContext.pendingTitle;
    if (pendingId && isAffirmative(text) && helpers.openApp) {
      const title = pendingTitle || (helpers.getAppTitle ? helpers.getAppTitle(pendingId) : pendingId);
      sessionContext.pendingAppId = null;
      sessionContext.pendingTitle = null;
      if (pendingId === "beam" && helpers.openBeam) {
        return { type: "action", text: `Alles klar — <strong>NOCO Beam</strong>.`, run: () => helpers.openBeam() };
      }
      if (pendingId === "hub" && helpers.openHub) {
        return { type: "action", text: `Oeffne <strong>NOCO Hub</strong>.`, run: () => helpers.openHub() };
      }
      return {
        type: "action",
        text: `Starte <strong>${title}</strong> — wie besprochen.`,
        run: () => helpers.openApp(pendingId)
      };
    }

    if (/\b(wiederhol|nochmal|same|gleiche)\b/.test(normalize(text)) && sessionContext.lastUserText) {
      return processMessage(sessionContext.lastUserText, helpers, context);
    }

    if (sessionContext.pendingOffer && isAffirmative(text)) {
      const run = sessionContext.pendingOffer;
      const label = sessionContext.pendingOfferLabel || "Aufgabe";
      sessionContext.pendingOffer = null;
      sessionContext.pendingOfferLabel = null;
      return {
        type: "action",
        text: `Alles klar — ich fuehre das aus (<strong>${label}</strong>) …`,
        run: () => {
          try {
            run();
          } catch (_) {}
        }
      };
    }

    const guide = global.NocoAISystem?.processGuide?.(text, helpers);
    if (guide) {
      sessionContext.pendingOffer = guide.offerRun || null;
      sessionContext.pendingOfferLabel = guide.offerLabel || null;
      return { type: "text", text: guide.text };
    }

    sessionContext.pendingOffer = null;
    sessionContext.pendingOfferLabel = null;

    const naturalEarly = global.NocoAINatural?.process?.(text, helpers);
    if (naturalEarly) {
      if (naturalEarly.offerRun) {
        sessionContext.pendingOffer = naturalEarly.offerRun;
        sessionContext.pendingOfferLabel = naturalEarly.offerLabel || null;
      }
      return naturalEarly;
    }

    const lexiconEarly = global.NocoAILexicon?.process?.(text, helpers);
    if (lexiconEarly) {
      if (lexiconEarly.offerRun) {
        sessionContext.pendingOffer = lexiconEarly.offerRun;
        sessionContext.pendingOfferLabel = lexiconEarly.offerLabel || null;
      }
      return lexiconEarly;
    }

    const intentEarly = global.NocoAIIntent?.process?.(text, helpers, sessionContext);
    if (intentEarly) {
      if (intentEarly.offerRun) {
        sessionContext.pendingOffer = intentEarly.offerRun;
        sessionContext.pendingOfferLabel = intentEarly.offerLabel || null;
      }
      return intentEarly;
    }

    const ultraEarly = global.NocoAIUltra?.process?.(text, helpers, sessionContext);
    if (ultraEarly) return ultraEarly;

    const createEarly = global.NocoAICreate?.process?.(text, helpers);
    if (createEarly) {
      global.NocoAIPro?.rememberCreateSpec?.(text);
      return createEarly;
    }

    const insightsEarly = global.NocoAIInsights?.process?.(text, helpers);
    if (insightsEarly) return insightsEarly;

    const timerStartMins = global.NocoAITime?.parseTimerStartMinutes?.(text);
    if (timerStartMins != null && helpers.applyTimerMinutes) {
      return global.NocoAITime.buildTimerStartAction(timerStartMins, helpers);
    }

    const timeEarly = global.NocoAITime?.process?.(text, helpers);
    if (timeEarly) return timeEarly;

    const proEarly = global.NocoAIPro?.process?.(text, helpers, sessionContext);
    if (proEarly) {
      if (sessionContext.pendingOffer) {
        sessionContext.pendingOfferLabel = sessionContext.pendingOfferLabel || "Coach-Aktion";
      }
      return proEarly;
    }

    const systemEarly = global.NocoAISystem?.processCommand?.(text, helpers);
    if (systemEarly) {
      if (systemEarly.offerRun) {
        sessionContext.pendingOffer = systemEarly.offerRun;
        sessionContext.pendingOfferLabel = systemEarly.offerLabel || null;
      }
      return systemEarly;
    }

    const brain = global.NocoAIBrain?.process?.(text, helpers, sessionContext);
    if (brain) {
      if (brain.rememberTopic) sessionContext.lastBrainTopic = brain.rememberTopic;
      return brain;
    }

    const system = processNavAndSystem(text, helpers);
    if (system) return system;

    const smart = processSmartActions(text, helpers);
    if (smart) return smart;

    if (isQuestionOrChat(text)) {
      const chatFirst = chitchatReply(text);
      if (chatFirst) return { type: "text", text: chatFirst };
    }

    const ranked = rankAppMatches(text);
    const openCheck = detectOpenIntent(text);
    if (openCheck && openCheck.confidence >= 50) {
      const appId = openCheck.appId;
      const qn = normalize(text);
      if (shouldConfirmAppOpen(appId, openCheck.confidence, text, ranked)) {
        const title = helpers.getAppTitle ? helpers.getAppTitle(appId) : appId;
        const alt = ranked.find((r) => r.appId !== appId);
        sessionContext.pendingAppId = appId;
        sessionContext.pendingTitle = title;
        const altHint = alt ? ` Oder meintest du <strong>${helpers.getAppTitle?.(alt.appId) || alt.appId}</strong>?` : "";
        return {
          type: "text",
          text: `Soll ich <strong>${title}</strong> oeffnen?${altHint} Schreib <strong>ja</strong> oder «Oeffne ${title}».`
        };
      }
      if (appId === "nocoai" && helpers.isInNocoAI?.()) {
        if (isOpenChatListCommand(text, qn)) {
          return {
            type: "action",
            text: "Du bist schon in NOCO AI — ich oeffne die <strong>Chat-Liste</strong>.",
            run: () => uiHooks.openDrawer?.()
          };
        }
        return {
          type: "text",
          text: "<p>Du bist bereits in <strong>NOCO AI</strong>.</p><p>Fuer andere Chats tippe <strong>Chats</strong> oben oder sag «Oeffne Chat wo ich …».</p>"
        };
      }
      if (appId === "flashlight" && !isExplicitFlashlightCommand(qn)) {
        return {
          type: "text",
          text: "<p>Meintest du die <strong>Taschenlampe</strong>? Schreib klar: «Mach Licht an» oder «Oeffne Taschenlampe».</p>"
        };
      }
      const title = helpers.getAppTitle ? helpers.getAppTitle(appId) : appId;
      const hint = confidenceLabel(openCheck.confidence);
      if (appId === "beam" && helpers.openBeam) {
        return { type: "action", text: `Oeffne <strong>NOCO Beam</strong>.<br><small>${hint}</small>`, run: () => helpers.openBeam() };
      }
      if (appId === "hub" && helpers.openHub) {
        return { type: "action", text: `Oeffne <strong>NOCO Hub</strong>.<br><small>${hint}</small>`, run: () => helpers.openHub() };
      }
      if (helpers.openApp && appId !== "beam" && appId !== "hub") {
        sessionContext.pendingAppId = null;
        sessionContext.pendingTitle = null;
        return {
          type: "action",
          text: `Alles klar — <strong>${title}</strong> wird geoeffnet.<br><small>${hint}</small>`,
          run: () => helpers.openApp(appId)
        };
      }
    }

    const chat = chitchatReply(text);
    if (chat) return { type: "text", text: chat };

    const guess = !isQuestionOrChat(text) ? resolveAppFromQuery(text, 72) : null;
    if (guess) {
      const title = helpers.getAppTitle ? helpers.getAppTitle(guess.appId) : guess.appId;
      sessionContext.pendingAppId = guess.appId;
      sessionContext.pendingTitle = title;
      return {
        type: "text",
        text: `Meintest du <strong>${title}</strong>? Schreib <strong>ja</strong> oder «Oeffne ${title}» — dann starte ich die App.`
      };
    }

    sessionContext.pendingAppId = null;
    sessionContext.pendingTitle = null;

    const smartFb =
      global.NocoAIIntent?.smartFallback?.(text, helpers, sessionContext) ||
      global.NocoAIUltra?.smartFallback?.(text, helpers) ||
      global.NocoAIPro?.smartFallback?.(text, normalize(text), helpers);
    if (smartFb?.text) {
      const softened = global.NocoAINatural?.softenFallback?.(smartFb.text) || smartFb.text;
      return { type: "text", text: softened };
    }

    return { type: "text", text: pickRandom(FALLBACKS) };
  }

  function registerDynamicAliases(helpers) {
    dynamicAliases = [];
    const apps = helpers.getForgeCatalog?.() || [];
    apps.forEach((app) => {
      if (!app?.id) return;
      const words = [app.id, app.title, normalize(app.title), normalize(app.text || "")].filter(Boolean);
      dynamicAliases.push({ id: app.id, words: [...new Set(words)] });
    });
  }

  function buildTemplate() {
    return `
      <div class="noco-ai-wrap noco-ai-glass" data-noco-ai-root>
        <div class="noco-ai-glass-orb noco-ai-glass-orb--violet" aria-hidden="true"></div>
        <div class="noco-ai-glass-orb noco-ai-glass-orb--mint" aria-hidden="true"></div>
        <div class="noco-ai-glass-orb noco-ai-glass-orb--pink" aria-hidden="true"></div>
        <header class="noco-ai-header">
          <div class="noco-ai-hero-row">
            <div class="noco-ai-model-orb" aria-hidden="true">
              <span class="noco-ai-model-ring"></span>
              <span class="noco-ai-model-core">✧</span>
            </div>
            <div class="noco-ai-brand">
              <div class="noco-ai-brand-titles">
                <strong>NOCO AI</strong>
                <span class="noco-ai-version-pill">1.1</span>
              </div>
              <span class="noco-ai-brand-sub">Offline-Sprachmodell · Apps & Aufgaben</span>
            </div>
            <div class="noco-ai-status noco-ai-status--compact" aria-hidden="true">
              <span class="noco-ai-dot"></span>
              <span>Bereit</span>
            </div>
          </div>
          <div class="noco-ai-quota-row" data-noco-ai-quota-wrap>
            <span class="noco-ai-quota-text" data-noco-ai-quota-text>20 Nachrichten heute</span>
            <button type="button" class="noco-ai-quota-plus" data-noco-ai-plus-toggle>Exclusive</button>
          </div>
          <div class="noco-ai-toolbar">
            <button type="button" class="noco-ai-toolbar-btn" data-noco-ai-chats-toggle aria-expanded="false">Chats</button>
            <span class="noco-ai-active-name" data-noco-ai-active-name>Hauptchat</span>
            <button type="button" class="noco-ai-toolbar-btn noco-ai-toolbar-btn--icon" data-noco-ai-new-chat aria-label="Neuer Chat">+</button>
          </div>
          <aside class="noco-ai-chats-drawer hidden" data-noco-ai-chats-drawer aria-label="Gespeicherte Chats">
            <p class="noco-ai-chats-hint">Langdruck auf einen Chat zum Umbenennen.</p>
            <ul class="noco-ai-chats-list" data-noco-ai-chats-list></ul>
          </aside>
        </header>
        <div class="noco-ai-log-scroll">
          <div class="noco-ai-log" data-noco-ai-log role="log" aria-live="polite"></div>
        </div>
        <footer class="noco-ai-footer">
          <div class="noco-ai-quick-row" role="group" aria-label="Schnellaktionen">
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Mehr Liquid Glass">Glas</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="System Status">Status</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Zeige Lock Screen">Sperre</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Widget Pack AI">Widgets</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Theme Midnight">Theme</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Erstelle Notiz">Notiz</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Erstelle Aufgabe">Task</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Inbox">Inbox</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Was kannst du alles?">Hilfe</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Gib mir einen Tipp">Tipp</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Fokus Modus">Fokus</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Tagesplan">Plan</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Was soll ich jetzt tun?">Coach</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Wann ist mein Timer rum?">Timer?</button>
            <button type="button" class="noco-ai-quick-btn" data-noco-ai-cmd="Was steht an?">Ueberblick</button>
          </div>
          <div class="noco-ai-tips" data-noco-ai-tips>
            <button type="button" class="noco-ai-tips-toggle" data-noco-ai-tips-toggle aria-expanded="false">
              <span>Vorschlaege</span>
              <span class="noco-ai-tips-chevron" aria-hidden="true">▾</span>
            </button>
            <div class="noco-ai-tips-panel hidden" data-noco-ai-tips-panel>
              <div class="noco-ai-suggestions" data-noco-ai-chips></div>
            </div>
          </div>
          <div class="noco-ai-compose">
            <textarea class="noco-ai-input" data-noco-ai-input rows="1" placeholder="Frag mich, oeffne Apps, erstelle Notizen …" aria-label="Nachricht an NOCO AI"></textarea>
            <button type="button" class="noco-ai-send" data-noco-ai-send aria-label="Senden">↑</button>
          </div>
        </footer>
        <div class="noco-ai-plus-sheet hidden" data-noco-ai-plus-sheet role="dialog" aria-label="NOCO AI Plus">
          <p class="noco-ai-rename-title">NOCO AI Plus</p>
          <p class="noco-ai-plus-copy">Kostenlos: <strong>20 Nachrichten pro Tag</strong>. <strong>Unbegrenzte NOCO AI</strong> ist in <strong>NOCO Exclusive</strong> enthalten — ein Paket, kein separates Plus-Abo.</p>
          <button type="button" class="primary-action noco-ai-plus-activate" data-noco-ai-plus-activate>Exclusive oeffnen</button>
          <button type="button" class="noco-ai-rename-cancel" data-noco-ai-plus-close>Schliessen</button>
        </div>
        <div class="noco-ai-rename-sheet hidden" data-noco-ai-rename-sheet role="dialog" aria-label="Chat umbenennen">
          <p class="noco-ai-rename-title">Chat umbenennen</p>
          <input type="text" class="noco-ai-rename-input" data-noco-ai-rename-input maxlength="40" />
          <div class="noco-ai-rename-actions">
            <button type="button" class="noco-ai-rename-cancel" data-noco-ai-rename-cancel>Abbrechen</button>
            <button type="button" class="noco-ai-rename-save" data-noco-ai-rename-save>Speichern</button>
          </div>
          <button type="button" class="noco-ai-rename-delete" data-noco-ai-rename-delete>Chat loeschen</button>
        </div>
      </div>
    `;
  }

  function buildWidgetMarkup() {
    return `
      <div class="noco-ai-widget-inner" data-noco-ai-widget>
        <div class="noco-ai-widget-hero">
          <div class="noco-ai-widget-orb" aria-hidden="true"><span>✧</span></div>
          <div class="noco-ai-widget-brand">
            <p class="eyebrow">Sprachmodell</p>
            <h2>NOCO AI <span class="noco-ai-version-pill noco-ai-version-pill--sm">1.1</span></h2>
          </div>
          <button type="button" class="mini-action" data-app="nocoai">Vollbild</button>
        </div>
        <p class="noco-ai-widget-teaser">Frag mich alles — Apps oeffnen, Notizen, Tasks, System.</p>
        <div class="noco-ai-widget-chips" data-noco-ai-chips></div>
        <div class="noco-ai-widget-log" data-noco-ai-log role="log"></div>
        <div class="noco-ai-widget-row">
          <input type="text" class="noco-ai-widget-input" data-noco-ai-input placeholder="Frag mich …" aria-label="NOCO AI Widget" />
          <button type="button" class="noco-ai-widget-send" data-noco-ai-send aria-label="Senden">↑</button>
        </div>
      </div>
    `;
  }

  function trimLog(log) {
    while (log.children.length > MAX_LOG_NODES) {
      log.removeChild(log.firstChild);
    }
  }

  function scrollChatToBottom(log) {
    if (!log) return;
    const scroller = log.closest(".noco-ai-log-scroll") || log;
    scroller.scrollTop = scroller.scrollHeight;
  }

  function bindIosKeyboard(root, input) {
    const vv = window.visualViewport;
    if (!vv || !input || !root) return;
    const log = root.querySelector("[data-noco-ai-log]");
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--noco-ai-kb-inset", `${Math.round(inset)}px`);
      root.classList.toggle("noco-ai-keyboard-open", inset > 8);
      if (inset > 8) scrollChatToBottom(log);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    input.addEventListener("focus", () => window.setTimeout(update, 60));
    input.addEventListener("blur", () => window.setTimeout(update, 120));
  }

  function appendMessage(log, role, html, isHtml = false, options = {}) {
    const el = document.createElement("div");
    el.className = `noco-ai-msg ${role}`;
    el.dataset.msgId = String(++msgId);
    const rich = isHtml || (role === "bot" && String(html).includes("<"));
    if (role === "bot") {
      el.innerHTML = `<strong>${AI_NAME}</strong>${rich ? html : `<p>${html}</p>`}`;
    } else {
      el.textContent = html;
    }
    log.appendChild(el);
    trimLog(log);
    scrollChatToBottom(log);
    if (!options.skipPersist && Chats()) {
      Chats().addMessage(role, role === "bot" ? (rich ? html : `<p>${html}</p>`) : html);
      global.dispatchEvent?.(new CustomEvent("noco-ai-updated"));
    }
    return el;
  }

  function renderLogFromStore(log, widget = false) {
    if (!log || !Chats()) return;
    log.innerHTML = "";
    const messages = Chats().getMessages();
    const slice = widget ? messages.slice(-8) : messages;
    slice.forEach((m) => {
      if (m.role === "bot") appendMessage(log, "bot", m.html, true, { skipPersist: true });
      else appendMessage(log, "user", m.html, false, { skipPersist: true });
    });
    if (!slice.length) {
      appendMessage(log, "bot", Chats().WELCOME_HTML, true, { skipPersist: true });
    }
    scrollChatToBottom(log);
  }

  function renderChips(root, suggestions, onChip) {
    const wrap = root.querySelector("[data-noco-ai-chips]");
    if (!wrap) return;
    wrap.innerHTML = suggestions
      .map((s) => `<button type="button" class="noco-ai-chip" data-noco-ai-chip="${s.replace(/"/g, "&quot;")}">${s}</button>`)
      .join("");
    wrap.querySelectorAll("[data-noco-ai-chip]").forEach((btn) => {
      btn.addEventListener("click", () => onChip(btn.dataset.nocoAiChip || btn.textContent));
    });
    const toggle = root.querySelector("[data-noco-ai-tips-toggle]");
    const panel = root.querySelector("[data-noco-ai-tips-panel]");
    if (toggle && panel && !toggle.dataset.bound) {
      toggle.dataset.bound = "1";
      toggle.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        const closed = panel.classList.contains("hidden");
        toggle.setAttribute("aria-expanded", closed ? "false" : "true");
        toggle.querySelector(".noco-ai-tips-chevron").textContent = closed ? "▾" : "▴";
      });
    }
  }

  function bindChatPanel(root) {
    if (!root || optionsWidget(root)) return;
    const drawer = root.querySelector("[data-noco-ai-chats-drawer]");
    const list = root.querySelector("[data-noco-ai-chats-list]");
    const nameEl = root.querySelector("[data-noco-ai-active-name]");
    const toggle = root.querySelector("[data-noco-ai-chats-toggle]");
    const newBtn = root.querySelector("[data-noco-ai-new-chat]");
    const renameSheet = root.querySelector("[data-noco-ai-rename-sheet]");
    const renameInput = root.querySelector("[data-noco-ai-rename-input]");
    const renameSave = root.querySelector("[data-noco-ai-rename-save]");
    const renameCancel = root.querySelector("[data-noco-ai-rename-cancel]");
    const renameDelete = root.querySelector("[data-noco-ai-rename-delete]");
    if (!drawer || !list || !Chats()) return;

    let renameTargetId = null;
    let longPressTimer = null;

    const syncActiveName = () => {
      const chat = Chats().getActiveChat();
      if (nameEl && chat) nameEl.textContent = chat.name;
    };

    const setDrawerOpen = (open) => {
      drawer.classList.toggle("hidden", !open);
      toggle?.setAttribute("aria-expanded", open ? "true" : "false");
    };

    const renderChatList = () => {
      list.innerHTML = "";
      Chats().listChats().forEach((chat) => {
        const li = document.createElement("li");
        li.className = "noco-ai-chat-item";
        if (chat.id === Chats().getActiveChat()?.id) li.classList.add("active");
        li.dataset.chatId = chat.id;
        const preview = (chat.messages || []).filter((m) => m.role === "user").pop();
        const sub = preview ? String(preview.html).replace(/<[^>]+>/g, "").slice(0, 42) : "Neuer Chat";
        li.innerHTML = `<strong>${chat.name}</strong><span>${sub}</span>`;
        li.addEventListener("click", () => {
          Chats().setActive(chat.id);
          syncActiveName();
          renderChatList();
          const log = root.querySelector("[data-noco-ai-log]");
          renderLogFromStore(log, false);
          setDrawerOpen(false);
        });
        const startLongPress = () => {
          longPressTimer = window.setTimeout(() => {
            renameTargetId = chat.id;
            if (renameInput) renameInput.value = chat.name;
            renameSheet?.classList.remove("hidden");
            hapticLong?.();
          }, 520);
        };
        const cancelLongPress = () => {
          if (longPressTimer) window.clearTimeout(longPressTimer);
          longPressTimer = null;
        };
        li.addEventListener("pointerdown", startLongPress);
        li.addEventListener("pointerup", cancelLongPress);
        li.addEventListener("pointerleave", cancelLongPress);
        li.addEventListener("pointercancel", cancelLongPress);
        list.appendChild(li);
      });
      syncActiveName();
    };

    function hapticLong() {
      if (navigator.vibrate) navigator.vibrate([8, 40, 8]);
    }

    toggle?.addEventListener("click", () => {
      const open = drawer.classList.contains("hidden");
      setDrawerOpen(open);
      if (open) renderChatList();
    });

    newBtn?.addEventListener("click", () => {
      Chats().createChat();
      renderChatList();
      const log = root.querySelector("[data-noco-ai-log]");
      renderLogFromStore(log, false);
      setDrawerOpen(false);
    });

    renameCancel?.addEventListener("click", () => {
      renameSheet?.classList.add("hidden");
      renameTargetId = null;
    });

    renameSave?.addEventListener("click", () => {
      if (renameTargetId && renameInput) Chats().renameChat(renameTargetId, renameInput.value);
      renameSheet?.classList.add("hidden");
      renameTargetId = null;
      renderChatList();
    });

    renameDelete?.addEventListener("click", () => {
      if (renameTargetId) Chats().deleteChat(renameTargetId);
      renameSheet?.classList.add("hidden");
      renameTargetId = null;
      renderChatList();
      const log = root.querySelector("[data-noco-ai-log]");
      renderLogFromStore(log, false);
    });

    uiHooks.refreshChats = renderChatList;
    uiHooks.newChat = () => newBtn?.click();
    uiHooks.openDrawer = () => {
      setDrawerOpen(true);
      renderChatList();
    };

    renderChatList();
  }

  function optionsWidget(root) {
    return !!root.closest?.("[data-noco-ai-widget]");
  }

  function refreshQuotaDisplay(root, helpers) {
    const el = root?.querySelector?.("[data-noco-ai-quota-text]");
    const btn = root?.querySelector?.("[data-noco-ai-plus-toggle]");
    const copy = root?.querySelector?.(".noco-ai-plus-copy");
    const activate = root?.querySelector?.("[data-noco-ai-plus-activate]");
    if (!el || !global.NocoAILimits) return;
    const settings = helpers.getSettings?.() || {};
    const usage = global.NocoAILimits.getUsage(settings);
    if (usage.plus) {
      el.textContent = usage.exclusive
        ? "Unbegrenzt · in Exclusive enthalten"
        : "Unbegrenzt · NOCO AI";
      btn?.classList.add("is-active");
      if (btn) btn.textContent = usage.exclusive ? "Exclusive ✓" : "Aktiv";
    } else {
      el.textContent = `${usage.remaining} von ${usage.limit} heute`;
      btn?.classList.remove("is-active");
      if (btn) btn.textContent = "Exclusive";
    }
    if (copy) {
      copy.innerHTML = usage.exclusive
        ? "<p>Du hast <strong>NOCO Exclusive</strong> — <strong>NOCO AI unbegrenzt</strong> ist im Paket enthalten.</p>"
        : "<p>Kostenlos: <strong>20 Nachrichten/Tag</strong>.</p><p><strong>Unbegrenzte NOCO AI</strong> bekommst du mit <strong>NOCO Exclusive</strong> (Glas, Apps, Deep Scan + Assistent) — <em>ein</em> Abo.</p>";
    }
    if (activate) {
      activate.textContent = usage.exclusive ? "Exclusive aktiv ✓" : "Exclusive holen";
    }
  }

  function bindChat(root, helpers, options = {}) {
    if (root.dataset.nocoAiBound === "1") return;
    const log = root.querySelector("[data-noco-ai-log]");
    const input = root.querySelector("[data-noco-ai-input]");
    const send = root.querySelector("[data-noco-ai-send]");
    if (!log || !input || !send) return;
    root.dataset.nocoAiBound = "1";

    Chats()?.reload();
    refreshQuotaDisplay(root, helpers);

    const typingMs = options.widget ? TYPING_WIDGET_MS : TYPING_MS;
    const suggestions = options.widget ? WIDGET_SUGGESTIONS : DEFAULT_SUGGESTIONS;

    const plusSheet = root.querySelector("[data-noco-ai-plus-sheet]");
    root.querySelector("[data-noco-ai-plus-toggle]")?.addEventListener("click", () => {
      plusSheet?.classList.toggle("hidden");
    });
    root.querySelector("[data-noco-ai-plus-close]")?.addEventListener("click", () => {
      plusSheet?.classList.add("hidden");
    });
    root.querySelector("[data-noco-ai-plus-activate]")?.addEventListener("click", () => {
      plusSheet?.classList.add("hidden");
      helpers.openExclusive?.() || helpers.activateNocoAiPlus?.();
      refreshQuotaDisplay(root, helpers);
    });

    const submit = () => {
      if (busy) return;
      const text = (input.value || "").trim();
      if (!text) return;
      const settings = helpers.getSettings?.() || {};
      if (global.NocoAILimits && !global.NocoAILimits.canSend(settings)) {
        const usage = global.NocoAILimits.getUsage(settings);
        appendMessage(log, "user", text);
        input.value = "";
        appendMessage(
          log,
          "bot",
          `<p><strong>Tageslimit erreicht</strong> — du hast heute alle <strong>${usage.limit}</strong> kostenlosen Nachrichten genutzt.</p><p><strong>Unbegrenzte NOCO AI</strong> ist in <strong>NOCO Exclusive</strong> enthalten — tippe oben auf <strong>Exclusive</strong>.</p>`,
          true
        );
        scrollChatToBottom(log);
        return;
      }
      busy = true;
      send.disabled = true;
      input.value = "";
      sessionContext.lastUserText = text;
      appendMessage(log, "user", text);

      const typing = document.createElement("div");
      typing.className = "noco-ai-typing";
      typing.textContent = "NOCO AI …";
      log.appendChild(typing);
      scrollChatToBottom(log);

      window.setTimeout(() => {
        typing.remove();
        let result = processMessage(text, helpers);
        result = global.NocoAIUltra?.finalize?.(result, text, helpers, sessionContext) || result;
        const isHtml = result.text.includes("<");
        appendMessage(log, "bot", result.text, isHtml);
        if (result.type === "action" && typeof result.run === "function") {
          window.setTimeout(() => {
            try {
              result.run();
            } catch (_) {}
          }, 140);
        }
        global.NocoAILimits?.recordSend(helpers.getSettings?.() || {});
        refreshQuotaDisplay(root, helpers);
        busy = false;
        send.disabled = false;
        if (!options.widget) {
          uiHooks.refreshChats?.();
          input.focus();
        }
        Chats()?.maybeAutoRenameActive?.(text);
        uiHooks.refreshChats?.();
        global.dispatchEvent?.(new CustomEvent("noco-ai-updated"));
      }, typingMs);
    };

    send.addEventListener("click", submit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });

    renderChips(root, suggestions, (label) => {
      input.value = label;
      submit();
    });

    root.querySelectorAll("[data-noco-ai-cmd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cmd = btn.dataset.nocoAiCmd || btn.textContent;
        if (!cmd || busy) return;
        input.value = cmd;
        submit();
      });
    });

    const footer = root.querySelector(".noco-ai-footer");
    const resizeInput = () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(88, Math.max(44, input.scrollHeight))}px`;
    };
    input.style.overflow = "hidden";
    input.addEventListener("input", resizeInput);
    resizeInput();
    if (document.body.classList.contains("device-handset") && !options.widget) {
      bindIosKeyboard(root, input);
    }
    footer?.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false }
    );
    footer?.addEventListener("touchmove", (event) => event.stopPropagation(), { passive: true });
    input.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });

    renderLogFromStore(log, options.widget);
    if (!options.widget) bindChatPanel(root);
  }

  function focusChatInput(root, options = {}) {
    if (options.widget || !root) return;
    const input = root.querySelector("[data-noco-ai-input]");
    if (!input) return;
    const focus = () => {
      try {
        input.focus({ preventScroll: true });
        const len = input.value?.length || 0;
        if (typeof input.setSelectionRange === "function") input.setSelectionRange(len, len);
      } catch (_) {}
    };
    const handset = document.body.classList.contains("device-handset");
    window.setTimeout(focus, handset ? 420 : 380);
    if (!handset) window.setTimeout(focus, 820);
  }

  function mount(root, helpers) {
    if (!root) return;
    mountedRoot = root;
    registerDynamicAliases(helpers);
    bindChat(root, helpers, { widget: false });
    refreshQuotaDisplay(root, helpers);
    focusChatInput(root);
  }

  function mountWidget(root, helpers) {
    if (!root) return;
    registerDynamicAliases(helpers);
    bindChat(root, helpers, { widget: true });
  }

  global.addEventListener?.("noco-ai-updated", () => {
    document.querySelectorAll(".island-ai-btn").forEach((btn) => btn.classList.add("has-activity"));
    document.querySelectorAll("[data-noco-ai-widget] [data-noco-ai-log]").forEach((log) => {
      renderLogFromStore(log, true);
    });
    mountedRoot?.querySelector("[data-noco-ai-active-name]") &&
      uiHooks.refreshChats?.();
  });

  global.NocoAI = {
    buildTemplate,
    buildWidgetMarkup,
    mount,
    mountWidget,
    focusChatInput,
    processMessage,
    DEFAULT_SUGGESTIONS,
    resolveAppFromQuery,
    registerDynamicAliases,
    renderLogFromStore,
    uiRefreshChats: () => uiHooks.refreshChats?.()
  };
})(window);
