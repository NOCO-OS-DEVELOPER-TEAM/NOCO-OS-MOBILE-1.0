/**
 * NOCO AI Brain — Offline-Intelligenz (Kontext, Wissen, Empfehlungen)
 */
(function initNocoAIBrain(global) {
  const session = { topics: [], lastQuery: "" };

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

  function tokens(text) {
    return norm(text).split(/\s+/).filter((w) => w.length >= 2);
  }

  function scoreTokens(query, keys) {
    const qt = new Set(tokens(query));
    if (!qt.size) return 0;
    let hit = 0;
    keys.forEach((k) => {
      tokens(k).forEach((t) => {
        if (qt.has(t)) hit += 1;
      });
    });
    return hit;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shouldHandle(raw, q) {
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return true;
    if (global.NocoAINatural?.isSettingsRelated?.(q, raw)) return true;
    if (global.NocoAILexicon?.isLexiconQuery?.(q, raw)) return true;
    if (global.NocoAIIntent?.isIntentLike?.(q, raw)) return true;
    if (global.NocoAIInsights?.isInsightQuery?.(q, raw)) return true;
    if (global.NocoAIPro?.isProQuery?.(q, raw)) return true;
    if (global.NocoAITime?.isTimeQuery?.(q, raw)) return true;
    if (global.NocoAIUltra?.isBriefingQuery?.(q)) return true;
    if (global.NocoAIUltra?.isFollowUp?.(q, raw)) return true;
    if (!q || q.length > 320) return false;
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return false;
    if (/\b(oeffne|offne|open|starte|install|deinstall)\b/.test(q) && !/\b(was ist|warum|empfehl|inbox|notizen|aufgaben)\b/.test(q)) {
      return false;
    }
    if (/^(ja|ok|nein|yes|no)[\s!,.\-]*$/i.test(raw.trim())) return false;
    return true;
  }

  function tryMath(raw) {
    return global.NocoAIMath?.evaluate?.(raw) || null;
  }

  function tryDateTime(q) {
    const now = new Date();
    if (/\b(morgen|übermorgen|ubermorgen|naechste woche|nächste woche)\b/.test(q)) {
      const d = new Date(now);
      if (/ubermorgen|übermorgen/.test(q)) d.setDate(d.getDate() + 2);
      else if (/woche/.test(q)) d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      const label = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      return { text: `<p><strong>${label}</strong> (lokal berechnet).</p>`, topic: "time" };
    }
    if (!/\b(uhrzeit|wie spaet|wie spat|welcher tag|welches datum|heute datum|what time|welcher wochentag)\b/.test(q)) {
      return null;
    }
    const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return {
      text: `<p>Es ist <strong>${time}</strong> — <strong>${date}</strong> (lokal auf deinem Geraet).</p>`,
      topic: "time"
    };
  }

  function snapshot(helpers) {
    return helpers.getSystemSnapshot?.() || {};
  }

  function buildPersonalStatus(helpers) {
    const s = snapshot(helpers);
    const settings = helpers.getSettings?.() || {};
    const usage = global.NocoAILimits?.getUsage?.(settings);
    const installed = helpers.listInstalledApps?.() || [];
    const reminders = window.NocoReminders?.active?.()?.length || 0;

    let aiLine = `<li>NOCO AI: <strong>${usage?.remaining ?? 20}/${usage?.limit ?? 20}</strong> Nachrichten heute (kostenlos)</li>`;
    if (usage?.exclusive) {
      aiLine = "<li>NOCO AI: <strong>unbegrenzt</strong> — in <strong>NOCO Exclusive</strong> enthalten</li>";
    } else if (usage?.plus) {
      aiLine = "<li>NOCO AI: <strong>unbegrenzt</strong></li>";
    }

    return `<p><strong>Dein NOCO-System — Kurzueberblick</strong></p>
      <p><em>Design & Sperre</em></p>
      <ul>
        <li>Theme: <strong>${s.theme || "aurora"}</strong> — Farbstimmung des ganzen OS</li>
        <li>Live-Wallpaper: <strong>${s.liveWallpaper ? "an" : "aus"}</strong></li>
        <li>Liquid Glass: <strong>${s.glassBoost ? "Boost an" : "Standard"}</strong> — mehr Blur in Core</li>
        <li>Auto-Lock: <strong>${s.autoLock ? "an" : "aus"}</strong>${s.autoLock ? ` nach ${s.autoLockSeconds || 60}s` : ""}</li>
        <li>Code-Schutz: <strong>${s.codeLock ? "aktiv" : "aus"}</strong></li>
      </ul>
      <p><em>Apps & Inhalte</em></p>
      <ul>
        <li>Forge-Apps installiert: <strong>${s.installed || 0}</strong>${installed.length ? ` — z. B. ${installed.slice(0, 4).join(", ")}` : ""}</li>
        <li>Notizen: <strong>${s.noteCount ?? 0}</strong> · AI-Chats: <strong>${s.chatCount ?? 0}</strong></li>
        <li>Memory-Erinnerungen aktiv: <strong>${reminders}</strong></li>
        <li>Home-Widgets: <strong>${(s.widgets || []).join(", ") || "keine"}</strong></li>
      </ul>
      <p><em>Exclusive & AI</em></p>
      <ul>
        ${aiLine}
        <li>Exclusive: <strong>${s.exclusiveActive ? "Member aktiv" : "nicht aktiv"}</strong></li>
        <li>NOCO Pay: <strong>${s.payBalance || "0 EUR"}</strong></li>
      </ul>
      <p><small>Frag «Empfehl mir was» oder «Was ist Forge?» fuer Details.</small></p>`;
  }

  const KNOWLEDGE = [
    {
      keys: ["unterschied beam forge", "beam oder forge", "beam vs forge"],
      answer: () =>
        "<p><strong>NOCO Beam</strong> = schnelle Suche & Spotlight fuer Apps.</p><p><strong>NOCO Forge</strong> = App-Store zum Installieren neuer Apps.</p><p>Kurz: Beam findet, Forge liefert neue Apps.</p>"
    },
    {
      keys: ["unterschied core settings", "core oder security", "core vs security"],
      answer: () =>
        "<p><strong>NOCO Core</strong> = Einstellungen (Glas, Lock, Themes).</p><p><strong>ShieldGate</strong> = Security (Code, Passkey, Scan).</p><p><strong>Sync</strong> = Keycard Import/Export.</p>"
    },
    {
      keys: ["lohnt exclusive", "exclusive lohnenswert", "brauche ich exclusive", "was bringt exclusive"],
      answer: (h) => {
        const active = h.isExclusiveActive?.();
        if (active) {
          return "<p>Du hast Exclusive — nutze:</p><ul><li><strong>Unbegrenzte NOCO AI</strong> (inklusive)</li><li><strong>Deep Scan</strong> & Pro Themes</li><li><strong>Member-Apps</strong> in Forge</li></ul>";
        }
        return "<p>Exclusive lohnt sich, wenn du willst:</p><ul><li><strong>NOCO AI ohne Tageslimit</strong> (im Paket)</li><li><strong>Liquid Glass Pro</strong></li><li><strong>Deep Scan</strong> + 3 Member-Apps</li></ul><p>1 Tag Probetag gratis (Demo).</p>";
      }
    },
    {
      keys: ["was ist noco ai plus", "noco ai plus", "ai plus kosten", "plus aktivieren"],
      answer: (h) => {
        if (h.isExclusiveActive?.()) {
          return "<p><strong>NOCO AI unbegrenzt</strong> ist bei dir in <strong>NOCO Exclusive</strong> enthalten — <em>ein</em> Paket, kein separates Plus-Abo.</p>";
        }
        return "<p><strong>Unbegrenzte NOCO AI</strong> ist in <strong>NOCO Exclusive</strong> enthalten (Glas, Apps, Deep Scan + Assistent). Ohne Exclusive: 20 Nachrichten/Tag gratis.</p>";
      }
    },
    {
      keys: ["exclusive noco ai", "ai in exclusive", "unbegrenzt exclusive"],
      answer: () =>
        "<p>Ja — <strong>NOCO Exclusive</strong> beinhaltet <strong>unbegrenzte NOCO AI</strong>. Du musst kein Extra-Plus kaufen.</p>"
    },
    {
      keys: ["memory timer", "memory oder timer", "erinnerung timer"],
      answer: () =>
        "<p><strong>Memory</strong> = Erinnerung zu einer Uhrzeit («in 20 Min Muell»).</p><p><strong>Timer</strong> = Countdown (5, 10, 25 Min) der runterzaehlt.</p>"
    },
    {
      keys: ["noco ai rechnen", "rechnet noco ai", "mathe chat"],
      answer: () =>
        "<p>Ja — schreib z. B. <strong>3 plus 3</strong>, <strong>3*4+5</strong> oder <strong>3 mal 4 plus 5</strong>. Ich rechne offline im Chat.</p>"
    },
    {
      keys: ["was kannst du alles", "was kannst du", "faehigkeiten liste", "hilf mir alles"],
      answer: () =>
        "<p>Ich helfe dir <strong>offline</strong>: Fragen & Einstellungen, Apps oeffnen, Notizen/Tasks, Timer & Memory, Rechnen, Ueberblick («Was steht an?»), Nachfragen («und der Timer?»). Frag <strong>«Was kannst du alles?»</strong> oder <strong>«Hilfe»</strong>.</p>"
    },
    {
      keys: ["sicher offline", "datenschutz", "privat", "wer sieht meine chats"],
      answer: () =>
        "<p>Alles bleibt <strong>auf deinem Geraet</strong> — Chats, Notizen, Settings in localStorage. Keine Cloud-KI, keine Server-Chats.</p>"
    },
    {
      keys: ["keycard", "backup handy", "daten mitnehmen"],
      answer: () =>
        "<p>Mit <strong>Sync / Keycard</strong> exportierst du Theme, Apps, Guthaben und mehr als Datei — auf dem Desktop importieren oder umgekehrt.</p>"
    },
    {
      keys: ["beste spiele", "welches spiel", "spiel empfehlung"],
      answer: (h) => {
        const installed = h.listInstalledApps?.() || [];
        const games = ["Dodge Run", "Tap Dash", "Memory Grid", "Runner"].filter((g) =>
          installed.some((i) => norm(i).includes(norm(g.split(" ")[0])))
        );
        if (games.length) {
          return `<p>Du hast schon Spiele installiert — probier <strong>${pick(games)}</strong>. Oeffne den Ordner <strong>Spiele</strong> in der Bibliothek.</p>`;
        }
        return "<p>Fuer Action: <strong>Dodge Run</strong> oder <strong>Tap Dash</strong>. Fuer Kopf: <strong>Memory Grid</strong>. Sag «Installiere Dodge Run» oder hol sie aus Forge.</p>";
      }
    },
    {
      keys: ["produktiv", "produktiver werden", "fokus arbeit"],
      answer: () =>
        "<p>Produktiv offline: Sag <strong>«Erstelle Notiz»</strong> fuer eine leere Beispiel-Notiz, <strong>«Erstelle Aufgabe»</strong> fuer Tasks, <strong>«Erstelle Chat»</strong> fuer einen neuen AI-Chat — oder mit eigenem Titel.</p>"
    },
    {
      keys: ["erinnerung", "memory app", "reminder", "wecker stellen"],
      answer: () =>
        "<p>Sag z. B.: <strong>«Erinnere mich in 20 Minuten, Muell rausbringen»</strong> — oder oeffne die App <strong>Memory</strong>.</p>"
    },
    {
      keys: ["erste schritte", "anfangen", "neu hier", "wie starte ich"],
      answer: () =>
        "<p><strong>Start</strong>:</p><ol><li>Home erkunden (Widgets, Island)</li><li>Wische zu <strong>Apps</strong> — Beam & Forge</li><li>Frag mich «System Status» oder «Hilfe»</li><li>Optional: Code in ShieldGate setzen</li></ol>"
    },
    {
      keys: ["inbox", "tagesuebersicht", "was steht an"],
      answer: () =>
        "<p>Sag <strong>«Inbox»</strong> — ich zeige Notizen, offene Tasks und Memory aus deinen lokalen Daten.</p>"
    },
    {
      keys: ["such ueberall", "suche alles", "globale suche"],
      answer: () =>
        "<p><strong>«Such ueberall nach Urlaub»</strong> — ich durchsuche Notizen und AI-Chats und liste Treffer.</p>"
    },
    {
      keys: ["widget pack", "welches widget pack", "home widgets"],
      answer: () =>
        "<p>Widget-Packs: <strong>«Widget Pack AI»</strong>, <strong>Focus</strong>, <strong>Minimal</strong>, <strong>Games</strong>. Oder Island → Edit → +.</p>"
    },
    {
      keys: ["arcade", "spiele ordner", "mini spiele"],
      answer: () =>
        "<p><strong>Arcade</strong> im Spiele-Ordner — Dodge Run, Tap Dash, Runner. Installiere aus Forge, wenn noch nicht da.</p>"
    },
    {
      keys: ["wetter app", "wetter demo", "regen wetter"],
      answer: () =>
        "<p><strong>Wetter</strong> ist eine Demo-App (kein Live-API). «Oeffne Wetter» — schoene Animation, offline.</p>"
    },
    {
      keys: ["rechner app", "taschenrechner forge"],
      answer: () =>
        "<p>Kurz-Mathe im Chat — fuer volle Rechenmaschine: <strong>Rechner</strong> aus Forge installieren.</p>"
    },
    {
      keys: ["hub noco", "was ist hub", "noco hub"],
      answer: () =>
        "<p><strong>NOCO Hub</strong> = Schnellzentrale: Motion, Glass, Desktop, Shortcuts zu Apps.</p>"
    },
    {
      keys: ["toon", "zeitung app", "noco toon"],
      answer: () =>
        "<p><strong>NOCO Toon</strong> = Mini-Zeitung mit News — eigene Notiz wird in der Keycard mitgespeichert.</p>"
    },
    {
      keys: ["dodge run", "runner spiel", "tap dash"],
      answer: () =>
        "<p>Action: <strong>Dodge Run</strong> / <strong>Runner</strong>. Reflex: <strong>Tap Dash</strong>. Sag «Installiere Dodge Run».</p>"
    },
    {
      keys: ["code sperre", "pin vergessen", "4 stellig"],
      answer: () =>
        "<p>Code in <strong>ShieldGate</strong> — 4 Ziffern. Demo: kein Cloud-Reset; Keycard-Backup in Sync nutzen.</p>"
    },
    {
      keys: ["apps am leben", "keep alive", "apps nicht schliessen"],
      answer: () =>
        "<p>In <strong>Core → NocoDeck</strong>: Schalter <strong>Apps am Leben halten</strong> — Sheets bleiben im Speicher.</p>"
    },
    {
      keys: ["swipe gesten", "seiten wischen", "home apps swipe"],
      answer: () =>
        "<p>Zwischen <strong>Home</strong> und <strong>Apps</strong> wischen — in Apps oft links/rechts fuer Unterseiten.</p>"
    },
    {
      keys: ["erledige aufgabe", "task abhaken", "aufgabe erledigt"],
      answer: () =>
        "<p>Sag <strong>«Erledige Aufgabe Milch»</strong> — ich hake ab, ohne dass du Tasks oeffnen musst.</p>"
    },
    {
      keys: ["umrechnen", "km meilen", "celsius fahrenheit"],
      answer: () =>
        "<p>Demo-Umrechnung: <strong>«10 km in Meilen»</strong> oder <strong>«20 Celsius in Fahrenheit»</strong>.</p>"
    },
    {
      keys: ["erstelle notiz leer", "neue notiz beispiel", "notiz anlegen"],
      answer: () =>
        "<p><strong>«Erstelle Notiz»</strong> = neue leere <em>Beispiel</em>-Notiz — keine alte Notiz oeffnen.</p>"
    },
    {
      keys: ["fokus modus", "focus mode", "pomodoro"],
      answer: () =>
        "<p><strong>Fokus Modus</strong> startet 25-Min-Timer + Motion — ein Befehl, mehrere Aktionen.</p>"
    },
    {
      keys: ["coach", "was soll ich jetzt", "naechster schritt"],
      answer: () =>
        "<p><strong>Coach</strong> schaut auf Tasks, Memory & Tageszeit und schlaegt den sinnvollsten naechsten Schritt vor — sag <strong>Ja</strong> zum Ausfuehren.</p>"
    },
    {
      keys: ["tagesplan", "plan fuer heute"],
      answer: () =>
        "<p><strong>Tagesplan</strong> baut aus offenen Tasks & Memory eine kleine To-do-Reihenfolge fuer heute.</p>"
    },
    {
      keys: ["fass zusammen", "zusammenfassung notizen"],
      answer: () =>
        "<p><strong>«Fass Notizen zusammen»</strong> oder <strong>«Fass Chat zusammen»</strong> — Kurzueberblick ohne Internet.</p>"
    }
  ];

  function matchKnowledge(q, helpers) {
    let best = null;
    let score = 0;
    KNOWLEDGE.forEach((entry) => {
      const s = scoreTokens(q, entry.keys);
      if (s > score) {
        score = s;
        best = entry;
      }
    });
    if (!best || score < 2) return null;
    const ans = typeof best.answer === "function" ? best.answer(helpers) : best.answer;
    return { text: ans, topic: "knowledge" };
  }

  function tryWhyQuestions(q) {
    if (!/\b(warum|wieso|weshalb|why)\b/.test(q)) return null;
    if (/\b(autolock|auto lock)\b/.test(q)) {
      return {
        text: "<p><strong>Auto-Lock</strong> schuetzt dein Handy, wenn du es liegen laesst — Zeit stellst du in Core → Lock Screen ein.</p>",
        topic: "why"
      };
    }
    if (/\b(offline|kein internet)\b/.test(q)) {
      return {
        text: "<p><strong>Offline</strong> = Privatsphaere & Geschwindigkeit. NOCO AI antwortet sofort ohne Server — dafuer kein GPT-Internet-Wissen.</p>",
        topic: "why"
      };
    }
    if (/\b(exclusive|premium)\b/.test(q)) {
      return {
        text: "<p>Exclusive finanziert (im Demo) <strong>Premium-Features</strong>: mehr Glas, Deep Scan, Extra-Apps. Free bleibt nutzbar — Exclusive ist optional.</p>",
        topic: "why"
      };
    }
    if (/\b(limit|20 nachrichten|tageslimit)\b/.test(q)) {
      return {
        text: "<p>Das Limit haelt die Demo fair — <strong>Exclusive</strong> hebt es auf und packt Premium in <strong>ein</strong> Paket.</p>",
        topic: "why"
      };
    }
    if (/\b(forge|apps installieren)\b/.test(q)) {
      return {
        text: "<p>Forge trennt <strong>Basis-OS</strong> von <strong>optionalen Apps</strong> — du installierst nur, was du brauchst.</p>",
        topic: "why"
      };
    }
    return null;
  }

  function tryRecommend(q, helpers) {
    if (!/\b(empfehl|empfehle|vorschlag|soll ich|was soll|idee|tipps?)\b/.test(q)) return null;
    const s = snapshot(helpers);
    const usage = global.NocoAILimits?.getUsage?.(helpers.getSettings?.() || {});
    const ideas = [];

    if (!s.glassBoost) {
      ideas.push("<li><strong>Mehr Liquid Glass</strong> — staerkerer Blur auf Home & Apps.</li>");
    }
    if (!s.codeLock) {
      ideas.push("<li><strong>ShieldGate → Code</strong> — 4 Ziffern, schuetzt Apps beim Oeffnen.</li>");
    }
    if ((s.installed || 0) < 2) {
      ideas.push("<li><strong>Forge</strong> — installiere Timer, Memory oder ein Spiel.</li>");
    }
    if (!helpers.isExclusiveActive?.()) {
      ideas.push("<li><strong>NOCO Exclusive Probetag</strong> — unbegrenzte NOCO AI + Pro-Glas in einem Paket.</li>");
    } else if (!usage?.plus) {
      ideas.push("<li>Exclusive ist aktiv — du hast unbegrenzte NOCO AI.</li>");
    }
    if ((usage?.remaining ?? 20) <= 5 && !usage?.plus) {
      ideas.push("<li>Dein AI-Tageslimit ist niedrig — Exclusive enthaelt unbegrenzte Chats.</li>");
    }
    ideas.push("<li><strong>Beam</strong> — schnell eine App finden statt suchen.</li>");
    ideas.push("<li><strong>Memory</strong> — «Erinnere mich in 20 Minuten …»</li>");
    ideas.push("<li><strong>Inbox</strong> — «Was steht an?» zeigt Notizen, Tasks & Memory.</li>");
    if ((s.noteCount ?? 0) > 3) {
      ideas.push("<li><strong>Suche</strong> — «Such ueberall nach …» in Notizen & Chats.</li>");
    }

    const pickList = ideas.sort(() => Math.random() - 0.5).slice(0, 5);
    return {
      text: `<p><strong>Empfehlungen fuer dein Setup</strong></p><ul>${pickList.join("")}</ul><p><small>Alles offline — sag «ja» wenn ich etwas ausfuehren soll.</small></p>`,
      topic: "recommend"
    };
  }

  function tryCompare(q) {
    const m = q.match(/unterschied zwischen (.+?) und (.+)/) || q.match(/(.+?) oder (.+?)(\?|$)/);
    if (!m) return null;
    const a = norm(m[1]);
    const b = norm(m[2]);
    const pairs = [
      {
        a: ["beam", "suche", "spotlight"],
        b: ["forge", "store", "shop"],
        text: "<p><strong>NOCO Beam</strong> = Spotlight — findet Apps & Befehle.</p><p><strong>NOCO Forge</strong> = Store — installiert neue Apps.</p><p>Kurz: suchen vs. holen.</p>"
      },
      {
        a: ["notiz", "notizen", "notes"],
        b: ["tasks", "aufgaben", "todo"],
        text: "<p><strong>Notizen</strong> = langer Text, Ideen.</p><p><strong>Tasks</strong> = To-do mit Haken.</p>"
      },
      {
        a: ["core", "settings", "einstellung"],
        b: ["security", "shield", "sicherheit"],
        text: "<p><strong>Core</strong> = Theme, Glas, Lock, Widgets.</p><p><strong>ShieldGate</strong> = Code, Passkey, Scan.</p>"
      },
      {
        a: ["pay", "wallet"],
        b: ["exclusive", "premium"],
        text: "<p><strong>NOCO Pay</strong> = Demo-Guthaben.</p><p><strong>Exclusive</strong> = Mitgliedschaft inkl. unbegrenzter NOCO AI + Apps.</p>"
      },
      {
        a: ["memory", "erinnerung"],
        b: ["timer", "countdown"],
        text: "<p><strong>Memory</strong> = Erinnerung zu festem Zeitpunkt.</p><p><strong>Timer</strong> = Countdown von jetzt an.</p>"
      },
      {
        a: ["noco ai", "ki", "assistent"],
        b: ["rechner", "calculator"],
        text: "<p><strong>NOCO AI</strong> = Chat + Steuerung + Kurz-Mathe.</p><p><strong>Rechner</strong> = volle Taschenrechner-App mit Speicher.</p>"
      },
      {
        a: ["sync", "keycard"],
        b: ["cloud", "icloud"],
        text: "<p><strong>Sync/Keycard</strong> = Datei-Backup unter deiner Kontrolle.</p><p><strong>Cloud</strong> (Demo-App) = Spielerei — kein echtes Apple/Google-Backup.</p>"
      },
      {
        a: ["arcade", "spiele"],
        b: ["forge", "store"],
        text: "<p><strong>Arcade/Spiele</strong> = bereits installierte Mini-Games.</p><p><strong>Forge</strong> = neue Apps holen.</p>"
      },
      {
        a: ["notizen", "notes"],
        b: ["noco ai", "chat"],
        text: "<p><strong>Notizen</strong> = deine Texte speichern.</p><p><strong>NOCO AI</strong> = mit mir reden & Befehle — Chats sind Gespraechsverlaeufe.</p>"
      }
    ];
    for (const p of pairs) {
      const matchA = p.a.some((w) => a.includes(w));
      const matchB = p.b.some((w) => b.includes(w));
      if ((matchA && matchB) || (p.a.some((w) => b.includes(w)) && p.b.some((w) => a.includes(w)))) {
        return { text: `<p><strong>Vergleich</strong></p>${p.text}`, topic: "compare" };
      }
    }
    return null;
  }

  function tryDefine(q) {
    const m = q.match(/\b(was ist|was bedeutet|erklar mir|erklaer mir|define)\s+(.+)/);
    if (!m) return null;
    const term = norm(m[2]).slice(0, 40);
    const defs = {
      "noco ai": "Offline-Assistent: Apps, Core, Notizen, Memory, Rechnen, Tipps — ohne Internet.",
      "liquid glass": "Halbtransparentes UI mit Blur — in Core unter Glass Boost.",
      keycard: "Datei-Backup deiner Einstellungen, Apps und Daten zwischen Geraeten.",
      forge: "App-Store: Timer, Spiele, Rechner, Memory usw. installieren.",
      beam: "Spotlight-Suche: Apps und Aktionen — «Oeffne Beam».",
      island: "Leiste oben: Uhr, Seiten-Wechsel, Schnellmenu, NOCO AI ✧.",
      exclusive: "Premium-Paket: unbegrenzte NOCO AI, Pro-Glas, Deep Scan, Member-Apps.",
      "noco pay": "Demo-Wallet — Guthaben fuer Exclusive-Abo.",
      wallet: "Alltagssprache fuer NOCO Pay — «Wie viel Guthaben?» zeigt den Betrag.",
      guthaben: "Dein NOCO-Pay-Guthaben — frag «Wie viel hab ich?».",
      einstellungen: "Alltagssprache fuer NOCO Core (Theme, Lock, Glas, Wallpaper).",
      settings: "Wie Einstellungen — App heisst intern NOCO Core.",
      memory: "Erinnerungs-App mit Countdown — auch per Sprachbefehl an mich.",
      timer: "Countdown-App — eigene Minuten, laeuft im Hintergrund.",
      tasks: "Aufgabenliste mit Checkboxen.",
      notes: "Notizbuch mit mehreren Notizen und Suche.",
      inbox: "Befehl «Inbox» — Kurzuebersicht aus Notizen, Tasks und Memory.",
      hub: "Kurzmenu mit Glass, Motion und App-Shortcuts.",
      arcade: "Sammlung der Mini-Spiele.",
      weather: "Demo-Wetter mit Animation.",
      calculator: "Vollwertiger Taschenrechner aus Forge.",
      widgets: "Kacheln auf dem Home — per Island → Edit hinzufuegen.",
      autolock: "Sperrt das Geraet nach Inaktivitaet — Zeit in Core.",
      helligkeit: "UI-Helligkeit im NOCO-Look — sag «Heller» / «Dunkler» (echte Display-Lampe steuert iOS).",
      brightness: "Wie Helligkeit — NOCO macht Glas & UI heller oder dunkler.",
      wallpaper: "Live Wallpaper in Core — Farben folgen dem Theme (Aurora, Midnight, …).",
      hintergrund: "Theme + Live Wallpaper — «Theme Sunset» oder «Hintergrund an».",
      shieldgate: "Security-App: Code, Passkey, Scan.",
      sync: "Keycard Export/Import fuer Backup.",
      themes: "Farb-Themes: Aurora, Midnight, Sunset, Forest.",
      memories: "Erinnerungen mit Countdown — auch per Sprachbefehl.",
      sketch: "Skizzen-App aus Forge.",
      breath: "Atem-Uebung / Ruhe aus Forge."
    };
    for (const [key, val] of Object.entries(defs)) {
      if (term.includes(key) || key.includes(term)) {
        return {
          text: `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong></p><p>${val}</p><p><small>Frag «Oeffne ${key}» zum direkten Start.</small></p>`,
          topic: "define"
        };
      }
    }
    return null;
  }

  function tryFollowUp(q, helpers) {
    if (!session.topics.length) return null;
    if (!/\b(und|noch|mehr|dazu|weiter|details?)\b/.test(q) || q.length > 60) return null;
    const last = session.topics[session.topics.length - 1];
    if (last === "recommend") return tryRecommend("empfehlung", helpers);
    if (last === "knowledge" || last === "compare") return matchKnowledge(q + " " + session.lastQuery, helpers);
    return null;
  }

  function tryGeneralQuestion(q, helpers) {
    if (!/\b(was|wie|wo|wer|welche|wieviel|kannst du|kann man|gibt es)\b/.test(q)) return null;
    if (/\b(status|zustand|system)\b/.test(q)) {
      return { text: buildPersonalStatus(helpers), topic: "status" };
    }
    if (/\b(nachrichten|limit|quota|plus|tageslimit)\b/.test(q)) {
      const settings = helpers.getSettings?.() || {};
      const u = global.NocoAILimits?.getUsage?.(settings);
      if (!u) return null;
      if (u.exclusive) {
        return {
          text: "<p>Du hast <strong>NOCO Exclusive</strong> — <strong>NOCO AI ist unbegrenzt</strong> (im Paket, kein Extra-Abo).</p>",
          topic: "limits"
        };
      }
      return {
        text: u.plus
          ? "<p><strong>Unbegrenzte NOCO AI</strong> ist aktiv.</p>"
          : `<p>Heute noch <strong>${u.remaining}</strong> von <strong>${u.limit}</strong> kostenlosen Nachrichten.</p><p><strong>Unbegrenzt</strong> mit <strong>NOCO Exclusive</strong> (ein Paket).</p>`,
        topic: "limits"
      };
    }
    return null;
  }

  function process(query, helpers, ctx = {}) {
    const raw = String(query || "").trim();
    const q = norm(raw);
    if (!shouldHandle(raw, q)) return null;

    const handlers = [
      () => tryMath(raw),
      () => tryDateTime(q),
      () => {
        const pro = global.NocoAIPro?.process?.(raw, helpers, ctx);
        if (!pro || pro.type === "action") return null;
        return pro.text ? { text: pro.text, topic: "pro" } : null;
      },
      () => {
        const ins = global.NocoAIInsights?.tryAnswer?.(raw, q, helpers);
        return ins?.text ? { text: ins.text, topic: "insights" } : ins;
      },
      () => tryFollowUp(q, helpers),
      () => global.NocoAINatural?.process?.(raw, helpers),
      () => tryGeneralQuestion(q, helpers),
      () => tryWhyQuestions(q),
      () => tryCompare(q),
      () => tryDefine(q),
      () => tryRecommend(q, helpers),
      () => matchKnowledge(q, helpers)
    ];

    for (const fn of handlers) {
      const hit = fn();
      if (hit?.text) {
        session.lastQuery = q;
        if (hit.topic) {
          session.topics.push(hit.topic);
          if (session.topics.length > 6) session.topics.shift();
        }
        if (ctx) ctx.lastBrainTopic = hit.topic;
        return { type: "text", text: hit.text, rememberTopic: hit.topic };
      }
    }

    if (/\b(erklar|erklaer|hilf mir|verstehe nicht)\b/.test(q) && q.length < 120) {
      return {
        type: "text",
        text: "<p>Gern — sag mir <strong>worum</strong> es geht (App, Feature, Problem). Oder «Hilfe» fuer alle Befehle.</p><p>Beispiele: «Was ist Forge?», «Empfehl mir was», «System Status».</p>",
        rememberTopic: "help"
      };
    }

    return null;
  }

  global.NocoAIBrain = { process, reset: () => { session.topics = []; session.lastQuery = ""; } };
})(window);
