/**
 * NOCO AI Smart 3.0 — Synonyme, Umgangssprache, mehr Intents
 */
(function initNocoAISmart(global) {
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

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Roheingabe → klarer Befehl fuer andere Module */
  const REWRITES = [
    [/^(hi|hey|hello|moin|servus)\s*$/i, "Hallo"],
    [/^(danke|thx|thanks)\s*$/i, "Danke"],
    [/^(hilfe|\?)\s*$/i, "Hilfe"],
    [/\b(kannst du|kannste|koennest du|could you)\s+(mir\s+)?(die\s+)?/gi, ""],
    [/\b(bitte|mal|eben|schnell|doch|mal eben)\s*$/gi, ""],
    [/\b(mach|mach mal|starte|start|zeig|zeig mir|hol|hol mir|bring mich zu|ruf|aufrufen)\s+(die\s+)?(app\s+)?/gi, "oeffne "],
    [/\b(open|launch|run|go to)\s+(the\s+)?(app\s+)?/gi, "oeffne "],
    [/\b(app\s+)(offnen|offne|oeffnen|oeffne|open)\s+/gi, "oeffne "],
    [/\b(notizen?\s+app|notes\s+app)\b/gi, "notizen"],
    [/\b(theme\s+app|themes\s+app|design\s+app)\b/gi, "themes"],
    [/\b(einstellungs?\s*app|settings\s+app|core\s+app)\b/gi, "core"],
    [/\b(sicherheits?\s*app|security\s+app)\b/gi, "security"],
    [/\b(dunkleres?\s+design|dunkles?\s+theme|dark\s+mode)\b/gi, "theme midnight"],
    [/\b(helleres?\s+design|helles?\s+theme)\b/gi, "theme aurora"],
    [/\b(design\s+)(aendern|andern|wechseln|change)\b/gi, "design aendern"],
    [/\b(look\s+)(aendern|andern|wechseln)\b/gi, "design aendern"],
    [/\b(mehr|weniger)\s+glas\b/gi, (m) => (m[1] === "mehr" ? "mehr liquid glass" : "weniger performance")],
    [/\b(heller|dunkler)\s+machen\b/gi, (m) => (m[1] === "heller" ? "heller" : "dunkler")],
    [/\b(was\s+)(kann ich|mach ich|tun|jetzt)\b/gi, "was soll ich jetzt tun"],
    [/\b(erzaehl|erzahl)\s+(mir\s+)?(was|etwas)\b/gi, "erzaehl was"],
    [/\b(installier|installiere|hol dir|lad dir)\s+/gi, "installiere "],
    [/\b(deinstallier|deinstalliere|entferne|loesch)\s+(die\s+)?app\s+/gi, "deinstalliere "],
    [/\b(such|suche|find)\s+(mir\s+)?(nach\s+)?/gi, "such ueberall nach "],
    [/\b(neues?\s+gespraech|neuer\s+ki\s+chat)\b/gi, "neuer chat"],
    [/\b(loesch|delete)\s+(diesen\s+)?(chat|gespraech)\b/gi, "loesche diesen chat"],
    [/\b(erinner mich|erinnerung setzen)\b/gi, "erinnere mich"],
    [/\b(was hab ich zu tun|was muss ich tun)\b/gi, "was steht an"],
    [/\b(systemuebersicht|geraetestatus)\b/gi, "system status"],
    [/\b(pomodoro|fokus starten)\b/gi, "fokus modus"],
    [/\b(such nach|finde in notizen)\b/gi, "such in notizen nach "],
    [/\b(hake ab|abhacken)\b/gi, "erledige aufgabe "],
    [/\b(ich brauch|brauche)\s+(den\s+)?/gi, "oeffne "],
    [/\b(wo is|wo iss|wo sind)\s+/gi, "wo ist "],
    [/\b(gib mir|zeig mir)\s+(den\s+)?/gi, ""],
    [/\b(tages briefing|morgen report)\b/gi, "tagesbriefing"],
    [/\b(schnell merken|kurz notieren)\b/gi, "merke dir "],
    [/\b(zufalls app|random app)\b/gi, "ueberrasch mich"],
    [/\b(beam nach|spotlight nach)\s+/gi, "beam suche nach "],
    [/\b(neue todo|neues todo)\s+/gi, "erstelle aufgabe "]
  ];

  function expandQuery(raw) {
    let t = String(raw || "").trim();
    if (!t) return t;
    REWRITES.forEach((entry) => {
      const re = entry[0];
      const rep = entry[1];
      if (typeof rep === "function") t = t.replace(re, rep);
      else t = t.replace(re, rep);
    });
    return t.replace(/\s+/g, " ").trim();
  }

  function openAppAction(h, appId, label) {
    const title = h.getAppTitle?.(appId) || label || appId;
    return {
      type: "action",
      text: `<p>${pick(["Starte", "Oeffne", "Alles klar —"])} <strong>${esc(title)}</strong> …</p>`,
      run: () => h.openApp?.(appId),
      rememberTopic: appId
    };
  }

  function tryOpenLoose(q, raw, helpers) {
    if (/\b(oeffne|offne|open|starte|zeig|mach|launch)\b/.test(q)) return null;
    const loose = [
      { re: /\b(forge|app store|shop)\b/, id: "forge" },
      { re: /\b(beam|spotlight|suche)\b/, id: "beam", beam: true },
      { re: /\b(hub)\b/, id: "hub", hub: true },
      { re: /\b(theme|themes|design|farben)\b/, id: "themes" },
      { re: /\b(core|einstellung|settings)\b/, id: "settings" },
      { re: /\b(notiz|notizen)\b/, id: "notes" },
      { re: /\b(aufgaben|tasks|todo)\b/, id: "tasks" },
      { re: /\b(timer|countdown)\b/, id: "timer" },
      { re: /\b(arcade|spiele)\b/, id: "arcade" },
      { re: /\b(security|shield|sicherheit)\b/, id: "security" },
      { re: /\b(sync|backup|keycard)\b/, id: "sync" },
      { re: /\b(pay|wallet|guthaben)\b/, id: "pay" },
      { re: /\b(exclusive|premium)\b/, id: "exclusive" },
      { re: /\b(rechner|calculator|mathe)\b/, id: "calculator" },
      { re: /\b(wetter|weather)\b/, id: "weather" },
      { re: /\b(memory|erinnerung)\b/, id: "memories" },
      { re: /\b(device|geraet)\b/, id: "device" }
    ];
    if (q.split(" ").length > 5) return null;
    for (const item of loose) {
      if (!item.re.test(q)) continue;
      if (item.beam) {
        return {
          type: "action",
          text: "<p>Starte <strong>NOCO Beam</strong> …</p>",
          run: () => helpers.openBeam?.(),
          rememberTopic: "beam"
        };
      }
      if (item.hub) {
        return {
          type: "action",
          text: "<p>Oeffne <strong>NOCO Hub</strong> …</p>",
          run: () => helpers.openHub?.(),
          rememberTopic: "hub"
        };
      }
      return openAppAction(helpers, item.id);
    }
    return null;
  }

  function process(raw, helpers) {
    const expanded = expandQuery(raw);
    const q = norm(expanded);
    if (!q) return null;

    if (/^(hallo|hi|hey|moin|servus)$/.test(q)) {
      return {
        type: "text",
        text: `<p>${pick([
          "Hey! Ich bin <strong>NOCO AI</strong> — frag mich etwas, sag <strong>Witz</strong>, oder <strong>Oeffne Themes</strong>.",
          "Hallo! Offline, schnell, privat. Probier <strong>Was steht an?</strong> oder Sprache: <strong>NOCO AI</strong> sagen.",
          "Hi! Alles klar bei dir? Ich kann Apps, Design, Notizen & mehr — tippe <strong>Hilfe</strong>."
        ])}</p>`,
        rememberTopic: "hello"
      };
    }

    if (/^(danke|thx|thanks|super|perfekt)$/.test(q) || /\b(vielen dank|danke dir)\b/.test(q)) {
      return {
        type: "text",
        text: `<p>${pick([
          "Gern! Sag Bescheid, wenn du mehr brauchst.",
          "Freut mich! Noch ein Befehl? Ich bin da.",
          "Kein Problem — NOCO bleibt im Glas-Modus bereit."
        ])}</p>`,
        rememberTopic: "thanks"
      };
    }

    if (/\b(empfehl|empfehle|vorschlag|idee|was soll ich|was jetzt|langweil)\b/.test(q)) {
      const tips = [
        "Probier <strong>Theme Sunset</strong> fuer warmen Look.",
        "Starte <strong>Fokus Modus</strong> (25 Min Timer).",
        "Schau in <strong>Forge</strong> nach neuen Mini-Apps.",
        "Frag <strong>Was steht an?</strong> fuer Inbox-Ueberblick.",
        "Aktiviere Sprache: <strong>Sprachmodus an</strong>."
      ];
      return {
        type: "text",
        text: `<p>${pick(["Mein Tipp:", "Ich wuerde:", "Gerade cool:"])}</p><p>${pick(tips)}</p>`,
        rememberTopic: "tip"
      };
    }

    if (/\b(heller|helligkeit hoch|brightness up)\b/.test(q)) {
      return {
        type: "action",
        text: "<p>UI wird <strong>heller</strong> …</p>",
        run: () => helpers.adjustUiBrightness?.("up"),
        rememberTopic: "brightness"
      };
    }
    if (/\b(dunkler|helligkeit runter|brightness down)\b/.test(q)) {
      return {
        type: "action",
        text: "<p>UI wird <strong>dunkler</strong> …</p>",
        run: () => helpers.adjustUiBrightness?.("down"),
        rememberTopic: "brightness"
      };
    }

    if (/\b(auto lock|autolock|bildschirm sperre)\s+(an|ein|aus)\b/.test(q)) {
      const on = /\b(an|ein)\b/.test(q);
      return {
        type: "action",
        text: `<p>Auto-Lock <strong>${on ? "an" : "aus"}</strong> …</p>`,
        run: () => helpers.setSettingToggle?.("autoLock", on),
        rememberTopic: "settings"
      };
    }

    if (/\b(zeige?|show|vorschau)\s+(sperre|lock screen|lockscreen)\b/.test(q) || q === "sperrbildschirm") {
      return {
        type: "action",
        text: "<p>Zeige <strong>Lock Screen</strong> …</p>",
        run: () => helpers.showLockScreenPreview?.(),
        rememberTopic: "lock"
      };
    }

    if (/\b(neuer chat|neues gespraech)\b/.test(q)) {
      return {
        type: "action",
        text: "<p>Starte <strong>neuen Chat</strong> …</p>",
        run: () => helpers.startNewChat?.({}),
        rememberTopic: "chat"
      };
    }

    if (/\b(loesch|delete)\s+(diesen\s+)?(chat|gespraech)\b/.test(q)) {
      return {
        type: "action",
        text: "<p>Loesche aktiven <strong>Chat</strong> …</p>",
        run: () => helpers.deleteActiveChat?.(),
        rememberTopic: "chat"
      };
    }

    if (/\b(installier|installiere)\s+(.+)/.test(q)) {
      const m = expanded.match(/\b(installier|installiere)\s+(.+)/i);
      const name = m ? m[2].trim() : "";
      const hit = global.NocoAI?.resolveAppFromQuery?.(norm(name), 48);
      if (hit?.appId) {
        return {
          type: "action",
          text: `<p>Installiere <strong>${esc(helpers.getAppTitle?.(hit.appId) || hit.appId)}</strong> …</p>`,
          run: () => helpers.installForgeApp?.(hit.appId),
          rememberTopic: "install"
        };
      }
    }

    if (/\b(deinstallier|deinstalliere|entferne)\s+(.+)/.test(q)) {
      const m = expanded.match(/\b(deinstallier|deinstalliere|entferne)\s+(.+)/i);
      const name = m ? m[2].trim() : "";
      const hit = global.NocoAI?.resolveAppFromQuery?.(norm(name), 48);
      if (hit?.appId) {
        return {
          type: "action",
          text: `<p>Entferne <strong>${esc(helpers.getAppTitle?.(hit.appId) || hit.appId)}</strong> …</p>`,
          run: () => helpers.uninstallForgeApp?.(hit.appId),
          rememberTopic: "uninstall"
        };
      }
    }

    if (/\b(beam|suche)\b/.test(q) && q.length < 22 && !/\b(was ist|wie)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>NOCO Beam</strong> — Suche …</p>",
        run: () => helpers.openBeam?.(),
        rememberTopic: "beam"
      };
    }

    const loose = tryOpenLoose(q, expanded, helpers);
    if (loose) return loose;

    const hit = global.NocoAI?.resolveAppFromQuery?.(q, 50);
    if (hit?.appId && q.length <= 28 && !/\b(was|wie|warum|wo)\b/.test(q)) {
      if (!/\b(oeffne|offne|open)\b/.test(q)) {
        return {
          type: "text",
          text: `<p>Meinst du <strong>${esc(helpers.getAppTitle?.(hit.appId) || hit.appId)}</strong>? Schreib <strong>«Oeffne ${esc(helpers.getAppTitle?.(hit.appId) || hit.appId)}»</strong> oder <strong>ja</strong>.</p>`,
          offerRun: () => helpers.openApp?.(hit.appId),
          offerLabel: helpers.getAppTitle?.(hit.appId) || hit.appId,
          rememberTopic: hit.appId
        };
      }
    }

    return null;
  }

  function smartHint(text, helpers) {
    const q = norm(expandQuery(text));
    if (q.length < 4) return null;
    const hints = [];
    if (/\b(theme|design)\b/.test(q)) hints.push("«Oeffne Theme App» oder «Theme Midnight»");
    if (/\b(app|forge|timer)\b/.test(q)) hints.push("«Oeffne …» + App-Name");
    if (/\b(witz|lustig)\b/.test(q)) hints.push("«Witz»");
    if (!hints.length) return null;
    return {
      text: `<p>Vielleicht hilft: ${hints.map((h) => h).join(" · ")}</p>`
    };
  }

  global.NocoAISmart = {
    expandQuery,
    process,
    smartHint,
    norm
  };
})(typeof window !== "undefined" ? window : globalThis);
