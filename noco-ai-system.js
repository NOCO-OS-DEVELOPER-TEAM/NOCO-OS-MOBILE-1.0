/**
 * NOCO AI — Systembefehle (Core, Widgets, Forge, Notizen, Pay, Themes)
 */
(function initNocoAISystem(global) {
  const THEMES = ["aurora", "midnight", "sunset", "forest"];

  const TOGGLE_META = {
    autoLock: {
      label: "Auto-Lock",
      section: "lock",
      aliases: ["auto lock", "autolock", "autolog", "auto log", "auto sperre", "autosperre", "automatisch sperren", "sperre automatisch"]
    },
    liveWallpaper: {
      label: "Live Wallpaper",
      section: "deck",
      aliases: ["live wallpaper", "live hintergrund", "animierter hintergrund", "bewegter hintergrund", "hintergrund animation"]
    },
    glassBoost: {
      label: "Liquid Glass Boost",
      section: "deck",
      aliases: ["glass boost", "liquid glass boost", "glas boost", "glas effekt", "glass effekt"]
    },
    motion: {
      label: "Animationen",
      section: "deck",
      aliases: ["animationen", "motion", "bewegung", "uebergaenge", "animation"]
    },
    nativeFeel: {
      label: "App Handling",
      section: "deck",
      aliases: ["app handling", "native feel", "app gefuehl", "iphone feeling", "app feeling"]
    },
    keepAppsAlive: {
      label: "Apps behalten",
      section: "deck",
      aliases: ["apps behalten", "keep apps", "apps im hintergrund", "app state", "apps offen lassen"]
    },
    compactTiles: {
      label: "Kompakte Kacheln",
      section: "deck",
      aliases: ["kompakte kacheln", "compact tiles", "kleine kacheln", "kleine icons"]
    },
    codeLock: { label: "Schutz (Code)", section: "shield", aliases: ["code lock", "code schutz", "schutz code", "app schutz"] },
    strictSecurity: {
      label: "Strenger Modus",
      section: "shield",
      aliases: ["strenger modus", "strict security", "strenge sicherheit", "streng"]
    },
    requireCodeOnLaunch: {
      label: "Login-Code",
      section: "shield",
      aliases: ["login code", "code beim start", "code nach neustart", "start code"]
    }
  };

  const WIDGET_ALIASES = {
    clock: ["uhr", "clock", "zeit", "time", "grosse uhr", "riesenuhr", "uhrzeit"],
    nocoai: ["noco ai", "ki widget", "ai widget", "assistent widget"],
    notes: ["notiz", "notes", "schnellnotiz", "notizblock"],
    shortcuts: ["shortcuts", "schnellzugriff", "schnellaktionen"],
    status: ["status", "system status", "mobile status"],
    sync: ["sync", "keycard", "noco sync"],
    feed: ["feed", "heute", "news feed"],
    hero: ["hero", "willkommen", "start"],
    focusMini: ["focus", "fokus", "focus mini"],
    forgePick: ["forge tipp", "forge pick", "app tipp"],
    payMini: ["pay mini", "wallet widget", "pay widget"],
    securityMini: ["shield mini", "security mini", "sicherheit widget"]
  };

  const FORGE_ALIASES = {
    breeze: "breath",
    briese: "breath",
    forge: "forge",
    "mini arcade": "arcade",
    "tap dash": "tapdash",
    "dodge run": "dodgerun",
    "color catch": "colorcatch",
    "memory grid": "memorygrid",
    taschenlampe: "flashlight",
    rechner: "calculator",
    wetter: "weather"
  };

  const APP_OPEN_ALIASES = {
    core: "settings",
    einstellungen: "settings",
    settings: "settings",
    security: "security",
    sicherheit: "security",
    shield: "security",
    shieldgate: "security",
    themes: "themes",
    theme: "themes",
    look: "themes",
    forge: "forge",
    store: "forge",
    pay: "pay",
    wallet: "pay",
    sync: "sync",
    keycard: "sync",
    notizen: "notes",
    notes: "notes",
    beam: "beam",
    hub: "hub",
    exclusive: "exclusive"
  };

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

  function parseOnOff(q) {
    if (/\b(aus|off|deaktiv|deaktiviere|ausschalten|disable|stop|entfern)\b/.test(q)) return false;
    if (/\b(an|ein|on|aktiv|aktiviere|einschalten|enable|start|mehr)\b/.test(q)) return true;
    return null;
  }

  function parseLockSeconds(q, raw) {
    if (global.NocoAITime?.isAutoLockTimeQuery?.(raw, q) === false) return null;
    if (global.NocoAITime?.isTimerStartCommand?.(raw, q)) return null;
    if (/\b(timer|countdown|stoppuhr|erinnere|remind|memory)\b/.test(q)) return null;
    if (/\b(start|starte|stell|setz)\b/.test(q) && /\b(timer|countdown)\b/.test(q)) return null;
    if (!global.NocoAITime?.isAutoLockTimeQuery?.(raw, q)) {
      if (!/\b(auto\s*lock|autolock|autolog|auto\s+log)\b/.test(q)) return null;
    }
    const mMin = raw.match(/(\d+)\s*(?:min|minute|minuten)/i);
    if (mMin) return Math.min(600, Number(mMin[1]) * 60);
    const mSec = raw.match(/(\d+)\s*(?:sek|sekunden|sec|seconds|s)\b/i);
    if (mSec) return Math.min(600, Number(mSec[1]));
    if (/\beine\s+minute\b|\b1\s+minute\b|\b1\s+min\b/.test(q)) return 60;
    if (/\bzwei\s+minute\b|\b2\s+min\b/.test(q)) return 120;
    if (/\bdrei\s+minute\b|\b3\s+min\b/.test(q)) return 180;
    if (/\bfunf\s+minute\b|\b5\s+min\b/.test(q)) return 300;
    if (/\b30\s+sek|\b30\s+s\b|\bdreissig\s+sek/.test(q)) return 30;
    if (/\b60\s+sek/.test(q)) return 60;
    return null;
  }

  function matchToggle(q) {
    let best = null;
    let score = 0;
    Object.entries(TOGGLE_META).forEach(([key, meta]) => {
      meta.aliases.forEach((alias) => {
        const n = norm(alias);
        if (q.includes(n) && n.length > score) {
          score = n.length;
          best = key;
        }
      });
    });
    if (/\bauto\s*lock\b|\bautolock\b|\bautolog\b/.test(q)) best = "autoLock";
    return best;
  }

  function matchWidget(q) {
    for (const [id, words] of Object.entries(WIDGET_ALIASES)) {
      if (words.some((w) => q.includes(norm(w)))) return id;
    }
    if (/\buhr\b|\bzeit\b/.test(q) && !/\bautolock\b/.test(q)) return "clock";
    return null;
  }

  function resolveForgeApp(q) {
    for (const [alias, id] of Object.entries(FORGE_ALIASES)) {
      if (q.includes(norm(alias))) return id;
    }
    return null;
  }

  function resolveTheme(q) {
    return THEMES.find((t) => q.includes(t)) || null;
  }

  function parseNoteCreate(raw) {
    if (global.NocoAICreate?.parseCreateSpec) {
      const spec = global.NocoAICreate.parseCreateSpec(raw);
      if (spec?.kind === "note") {
        return { title: spec.title, body: spec.body, example: spec.example };
      }
      if (spec && spec.kind !== "note") return null;
    }
    const mBody =
      raw.match(
        /(?:erstell|leg|mach|schreib|neue?).{0,30}notiz.{0,40}(?:mit|inhalt|text)\s+(.+)/i
      ) ||
      raw.match(/(?:schreib|trag).{0,20}(?:in|zur)\s+notiz[:\s]+(.+)/i) ||
      raw.match(/notiz.{0,25}(?:inhalt|text)\s+(.+)/i);
    const mTitle =
      raw.match(
        /(?:erstell|leg|mach|neue?).{0,30}(?:eine\s+)?notiz.{0,35}(?:mit|mit dem|titel|ueberschrift|überschrift|headline|betreff)\s+([^.,!?\n]+)/i
      ) ||
      raw.match(/notiz.{0,25}(?:titel|ueberschrift|überschrift|headline)\s+([^.,!?\n]+)/i) ||
      raw.match(/(?:erstell|leg).{0,20}notiz\s+["«]?([^"»,!?\n]+)["»]?/i);
    if (!mTitle && !mBody) return null;
    let title = (mTitle?.[1] || "Neue Notiz").trim().slice(0, 60);
    let body = (mBody?.[1] || "").trim();
    const titleBody = title.match(/^(.+?)\s+(?:mit|inhalt|text)\s+(.+)$/i);
    if (titleBody) {
      title = titleBody[1].trim().slice(0, 60);
      body = body || titleBody[2].trim();
    }
    return { title, body };
  }

  const OFFER_HINT =
    "<p><small>Soll ich das fuer dich machen? Sag <strong>Ja</strong>, <strong>Ja gerne</strong> oder <strong>Mach das</strong>.</small></p>";

  function isDirectCommand(q) {
    return /\b(oeffne|offne|open|starte|aktivier|deaktivier|stell|setz|mach|erstell|leg|install|deinstall|entfern|zeig lock|autolock|auto lock)\b/.test(q);
  }

  function isWhereFindQuery(q) {
    if (isDirectCommand(q)) return false;
    return (
      /\bwo\s+(finde|ist|sind|bekomm|gibts|liegt|steht)\b/.test(q) ||
      /\bwhere\s+(do i|can i|is|are)\s+(find|the)\b/.test(q) ||
      /\b(where is|where are|where can i find)\b/.test(q)
    );
  }

  function isHowToQuery(q, raw) {
    if (isDirectCommand(q)) return false;
    if (/\b(wie geht|wie gehts|who are you|what are you|hallo|hi)\b/.test(q)) return false;
    if (/\b(erstell|leg)\s+(eine|neue)\s+notiz\b/.test(q) && !/\bwie\b/.test(q)) return false;
    return (
      /\b(wie|how)\s+(kann ich|do i|to|mache ich|funktioniert|geht das)\b/.test(q) ||
      (/\b(wie|how)\b/.test(q) && /\b(erstell|anleg|aktivier|deaktivier|ander|find|install|nutz|benutz|schreib)\b/.test(q))
    );
  }

  function guideForTopic(q, helpers) {
    if (/\banimation|motion|uebergang|bewegung\b/.test(q)) {
      return {
        offerLabel: "Animationen an",
        text: `<p><strong>Animationen</strong> findest du so:</p><ol><li><strong>Apps</strong> (zweite Seite) → Ordner <strong>Core</strong></li><li>Tab <strong>NocoDeck</strong></li><li>Schalter <strong>Animationen</strong></li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck", toggle: "motion", value: true })
      };
    }
    if (/\b(liquid\s*glass|glas\s*boost|glass)\b/.test(q)) {
      return {
        offerLabel: "Liquid Glass Boost",
        text: `<p><strong>Liquid Glass</strong> in <strong>NOCO Core → NocoDeck</strong>:</p><ol><li>Core oeffnen</li><li><strong>Mehr Liquid Glass</strong> (Glass Boost)</li><li>Optional: <strong>Live Wallpaper</strong></li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.enableGlassMode?.()
      };
    }
    if (/\b(auto\s*lock|autolock|autolog|sperre automatisch)\b/.test(q)) {
      return {
        offerLabel: "Auto-Lock oeffnen",
        text: `<p><strong>Auto-Lock</strong>:</p><ol><li><strong>Core</strong> → Tab <strong>Lock Screen</strong></li><li><strong>Auto-Lock aktivieren</strong></li><li>Zeit waehlen (30s, 1min, …)</li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.navigateCore?.({ section: "lock", highlight: "lock-time" })
      };
    }
    if (/\b(widget|widgets|home)\b/.test(q)) {
      return {
        offerLabel: "Widget-Panel",
        text: `<p><strong>Widgets</strong> auf dem Home:</p><ol><li>Island aufklappen → <strong>Edit</strong></li><li>Unten rechts <strong>+</strong></li><li>Widget antippen zum Hinzufuegen</li></ol>${OFFER_HINT}`,
        offerRun: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.enableEditMode?.();
            window.setTimeout(() => helpers.openWidgetPanel?.(), 300);
          }, 280);
        }
      };
    }
    if (/\b(notiz|notizen|notes)\b/.test(q)) {
      return {
        offerLabel: "Notiz erstellen",
        text: `<p><strong>Notiz erstellen</strong>:</p><ol><li>App <strong>Notizen</strong> in der Bibliothek</li><li><strong>+ Neue Notiz</strong> oben</li><li>Oder Schnellnotiz-Widget auf dem Home</li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.createNote?.({ title: "Beispiel", body: "", example: true, openApp: true })
      };
    }
    if (/\b(theme|design|look|aurora|midnight|sunset|forest)\b/.test(q)) {
      return {
        offerLabel: "Themes oeffnen",
        text: `<p><strong>Themes</strong>:</p><ol><li>App <strong>Themes</strong> (Bibliothek / Core-Verweis)</li><li>Farbe antippen (Aurora, Midnight, …)</li></ol><p>In <strong>Core → NocoDeck</strong> findest du auch Glas- und Animations-Schalter.</p>${OFFER_HINT}`,
        offerRun: () => helpers.openThemes?.()
      };
    }
    if (/\b(code aendern|pin aendern|code wechseln|neuer code|ander.*code|change code|code einrichten|code setzen|code aendern)\b/.test(q)) {
      return {
        offerLabel: "Security oeffnen",
        text: `<p><strong>Code aendern</strong> (4 Ziffern):</p><ol><li><strong>ShieldGate</strong> oeffnen</li><li>Schutz oder Login-Code aktivieren</li><li>Neuen Code eingeben — nicht 1234 oder 0000</li></ol><p>Du musst in die App springen — ich kann den Code nicht aus dem Chat setzen.</p>${OFFER_HINT}`,
        offerRun: () => helpers.openSecurity?.()
      };
    }
    if (/\b(code|schutz|shield|sicherheit|passkey|face id)\b/.test(q)) {
      return {
        offerLabel: "ShieldGate",
        text: `<p><strong>Sicherheit</strong>:</p><ol><li>App <strong>ShieldGate</strong> (Security)</li><li>Oder <strong>Core → ShieldGate</strong></li><li>Code, Passkey, Login-Code dort</li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.openSecurity?.()
      };
    }
    if (/\b(forge|app store|installier)\b/.test(q)) {
      return {
        offerLabel: "Forge oeffnen",
        text: `<p><strong>Apps installieren</strong>:</p><ol><li><strong>NOCO Forge</strong> oeffnen</li><li>App waehlen → <strong>Installieren</strong></li><li>Danach unter <strong>Apps</strong> im Ordner Forge/Spiele</li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.openForge?.()
      };
    }
    if (/\b(einstellung|settings|core|noco core)\b/.test(q)) {
      return {
        offerLabel: "Core oeffnen",
        text: `<p><strong>NOCO Core</strong> (Einstellungen):</p><ol><li><strong>Apps</strong> → Ordner <strong>Core</strong></li><li>Tabs: <strong>NocoDeck</strong>, <strong>Lock</strong>, <strong>Shield</strong>, <strong>Vault</strong></li></ol>${OFFER_HINT}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck" })
      };
    }
    if (/\b(pay|wallet|guthaben)\b/.test(q)) {
      return {
        offerLabel: "Pay oeffnen",
        text: `<p><strong>NOCO Pay</strong>: App <strong>Pay</strong> in der Bibliothek — Guthaben, Aufladen, Verlauf.</p>${OFFER_HINT}`,
        offerRun: () => helpers.openPay?.()
      };
    }
    if (/\b(sync|keycard)\b/.test(q)) {
      return {
        offerLabel: "Sync oeffnen",
        text: `<p><strong>Keycard / Sync</strong>: App <strong>Sync</strong> — Import und Export deiner Mobile-Keycard.</p>${OFFER_HINT}`,
        offerRun: () => helpers.openSync?.()
      };
    }
    return null;
  }

  function processGuide(raw, helpers) {
    const text = String(raw || "").trim();
    const q = norm(text);
    if (!text || !helpers) return null;

    const topic = guideForTopic(q, helpers);
    if (!topic) {
      if (isWhereFindQuery(q)) {
        return {
          text: `<p>Ich erklaere dir gern den Weg — nenne ein Stichwort, z. B. <strong>Animationen</strong>, <strong>Auto-Lock</strong>, <strong>Widgets</strong> oder <strong>Notizen</strong>.</p><p>Beispiel: «Wo finde ich Animationen?»</p>`
        };
      }
      if (isHowToQuery(q, text)) {
        return {
          text: `<p>Frag konkret, z. B. <strong>Wie erstelle ich eine Notiz?</strong> oder <strong>Wie aktiviere ich Auto-Lock?</strong></p><p>Dann erklaere ich Schritt fuer Schritt — und kann es auf Wunsch ausfuehren.</p>`
        };
      }
      return null;
    }

    if (isWhereFindQuery(q) || isHowToQuery(q, text)) {
      return topic;
    }
    return null;
  }

  function snapshotHtml(snap) {
    if (!snap) return "<p>Keine Systemdaten.</p>";
    return `<p><strong>Dein System</strong></p><ul>
      <li>Theme: <strong>${snap.theme}</strong></li>
      <li>Auto-Lock: <strong>${snap.autoLock ? snap.autoLockSeconds + "s" : "aus"}</strong></li>
      <li>Liquid Glass: <strong>${snap.glassBoost ? "an" : "aus"}</strong></li>
      <li>Schutz: <strong>${snap.codeLock ? "an" : "aus"}</strong></li>
      <li>Pay: <strong>${snap.payBalance}</strong></li>
      <li>Widgets: ${snap.widgets?.join(", ") || "—"}</li>
      <li>Forge-Apps: <strong>${snap.installed}</strong> installiert</li>
    </ul>`;
  }

  function processCommand(raw, helpers) {
    const text = String(raw || "").trim();
    const q = norm(text);
    if (!text || !helpers) return null;

    if (isWhereFindQuery(q) || isHowToQuery(q, text)) return null;

    if (/\b(hilfe|help|befehle|was kann|faehigkeiten)\b/.test(q) && q.length < 55) {
      return null;
    }

    if (
      /\b(status|uebersicht|zusammenfassung|system info|systeminfo)\b/.test(q) &&
      /\b(zeig|wie|was|gib|system|einstellung|mobile)\b/.test(q)
    ) {
      const snap = helpers.getSystemSnapshot?.();
      return { type: "text", text: snapshotHtml(snap) };
    }

    if (
      /\b(wie viel|guthaben|kontostand|wallet|pay balance)\b/.test(q) ||
      (/\b(pay|wallet)\b/.test(q) && /\b(zeig|wie viel|status)\b/.test(q))
    ) {
      const snap = helpers.getSystemSnapshot?.();
      return {
        type: "action",
        text: `Dein Guthaben: <strong>${snap?.payBalance || "?"}</strong> — oeffne NOCO Pay …`,
        run: () => helpers.openPay?.()
      };
    }

    if (/\b(pay|wallet)\b/.test(q) && /\b(auflad|plus|guthaben|10|euro|eur)\b/.test(q)) {
      const m = raw.match(/(\d+)\s*(?:eur|euro)?/i);
      const amount = m ? Number(m[1]) : 10;
      return {
        type: "action",
        text: `Lade <strong>+${amount} EUR</strong> auf …`,
        run: () => helpers.addPayBalance?.(amount)
      };
    }

    const timerMins = global.NocoAITime?.parseTimerStartMinutes?.(text);
    if (timerMins != null && helpers.applyTimerMinutes) {
      return global.NocoAITime.buildTimerStartAction(timerMins, helpers);
    }

    const noteCreate = parseNoteCreate(text);
    if (noteCreate && helpers.createNote) {
      return {
        type: "action",
        text: `Erstelle Notiz <strong>${noteCreate.title}</strong>${noteCreate.body ? " mit Text" : ""} …`,
        run: () => helpers.createNote({ title: noteCreate.title, body: noteCreate.body, openApp: true })
      };
    }

    if (/\b(schreib|trag|ergaenz|füge|fuege)\b/.test(q) && /\bnotiz\b/.test(q) && helpers.appendToActiveNote) {
      const m = text.match(/notiz[:\s]+(.+)/i) || text.match(/(?:schreib|trag)\s+(.+)/i);
      const chunk = m?.[1]?.trim();
      if (chunk && chunk.length > 2) {
        return {
          type: "action",
          text: "Schreibe in deine <strong>aktive Notiz</strong> …",
          run: () => {
            helpers.appendToActiveNote(chunk);
            helpers.openApp?.("notes");
          }
        };
      }
    }

    if (/\b(loesch|lösch|delete)\b/.test(q) && /\b(aktive\s+)?notiz\b/.test(q) && helpers.deleteActiveNote) {
      return {
        type: "action",
        text: "Loesche die <strong>aktive Notiz</strong> …",
        run: () => helpers.deleteActiveNote()
      };
    }

    if (/\b(neuer chat|neues gespraech|neue unterhaltung)\b/.test(q) || (/\bchat\b/.test(q) && /\b(neu|erstell|start)\b/.test(q) && !/\b(oeffne|offne|such|finde)\b/.test(q))) {
      return {
        type: "action",
        text: "Starte einen <strong>neuen AI-Chat</strong> …",
        run: () => helpers.startNewChat?.()
      };
    }

    if (
      /\b(mehr|max|starker|staerker|premium)\b/.test(q) &&
      /\b(liquid\s*glass|glas|glass)\b/.test(q)
    ) {
      return {
        type: "action",
        text: "Aktiviere <strong>max Liquid Glass</strong> (Boost, Wallpaper, Motion) …",
        run: () => helpers.enableGlassMode?.()
      };
    }

    const theme = resolveTheme(q);
    if (theme && (/\b(theme|design|look|farbe|stimmung)\b/.test(q) || /\b(stell|setz|wechsel|mach|auf)\b/.test(q))) {
      return {
        type: "action",
        text: `Theme <strong>${theme}</strong> wird gesetzt …`,
        run: () => {
          helpers.setTheme?.(theme);
          helpers.openThemes?.();
        }
      };
    }

    if (/\b(widget|widgets)\b/.test(q) && /\b(welche|liste|zeig|was hab)\b/.test(q)) {
      const list = helpers.listHomeWidgets?.() || [];
      const names = list.map((id) => helpers.getWidgetTitle?.(id) || id).join(", ");
      return {
        type: "text",
        text: `<p><strong>Home-Widgets</strong></p><p>${names || "Keine"}</p>`
      };
    }

    if (/\b(standard|default|zurueck|reset)\b/.test(q) && /\b(widget|widgets|home)\b/.test(q)) {
      return {
        type: "action",
        text: "Setze <strong>Standard-Widgets</strong> …",
        run: () => helpers.resetHomeWidgets?.()
      };
    }

    const packMatch = q.match(/\b(minimal|voll|full|focus|fokus|ai|ki|spiele|games)\b/);
    if (packMatch && /\b(widget|widgets|home|pack)\b/.test(q)) {
      const word = packMatch[1];
      const pack =
        word === "minimal" ? "minimal" :
        word === "voll" || word === "full" ? "full" :
        word === "focus" || word === "fokus" ? "focus" :
        word === "ai" || word === "ki" ? "ai" :
        word === "spiele" || word === "games" ? "games" : null;
      if (pack) {
        return {
          type: "action",
          text: `Widget-Pack <strong>${pack}</strong> wird angewendet …`,
          run: () => helpers.setHomeWidgetPack?.(pack)
        };
      }
    }

    if (/\b(bearbeit|edit|anpassen)\b/.test(q) && /\b(home|widget|start)\b/.test(q)) {
      return {
        type: "action",
        text: "<strong>Bearbeiten</strong> am Home + Widget-Panel …",
        run: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.enableEditMode?.();
            window.setTimeout(() => helpers.openWidgetPanel?.(), 300);
          }, 280);
        }
      };
    }

    for (const [word, appId] of Object.entries(APP_OPEN_ALIASES)) {
      if (q.includes(norm(word)) && /\b(oeffne|offne|open|zeig|starte|geh)\b/.test(q)) {
        const titles = { settings: "NOCO Core", security: "ShieldGate", themes: "Themes", forge: "Forge", pay: "Pay", sync: "Sync" };
        const label = titles[appId] || appId;
        if (appId === "beam") {
          return { type: "action", text: `Oeffne <strong>NOCO Beam</strong> …`, run: () => helpers.openBeam?.() };
        }
        if (appId === "hub") {
          return { type: "action", text: `Oeffne <strong>NOCO Hub</strong> …`, run: () => helpers.openHub?.() };
        }
        return {
          type: "action",
          text: `Oeffne <strong>${label}</strong> …`,
          run: () => helpers.openApp?.(appId)
        };
      }
    }

    if (
      /\b(zeig|show|oeffne|offne|open).{0,20}(lock\s*screen|sperrbildschirm|sperr screen)\b/.test(q) ||
      /\b(lock\s*screen|sperrbildschirm)\s*(zeigen|anzeigen|preview)\b/.test(q)
    ) {
      return {
        type: "action",
        text: "Zeige den <strong>Lock Screen</strong> …",
        run: () => helpers.showLockScreenPreview?.()
      };
    }

    if (/\b(core|noco core|einstellungen|settings)\b/.test(q) && /\b(oeffne|offne|open|zeig|geh)\b/.test(q)) {
      const section =
        /\b(lock|sperre|autolock|auto lock)\b/.test(q) ? "lock" :
        /\b(shield|schutz|code|passkey)\b/.test(q) ? "shield" :
        /\b(vault|session|forge)\b/.test(q) ? "vault" : "deck";
      return {
        type: "action",
        text: `Oeffne <strong>NOCO Core</strong> — Tab <strong>${section}</strong> …`,
        run: () => helpers.navigateCore?.({ section })
      };
    }

    const lockSec = parseLockSeconds(q, text);
    const toggleKey = matchToggle(q);
    let onOff = parseOnOff(q);
    if (toggleKey && onOff == null && /\b(umschalten|toggle|wechsel)\b/.test(q)) {
      onOff = !helpers.getSystemSnapshot?.()[toggleKey];
    }

    const autoLockIntent =
      global.NocoAITime?.isAutoLockTimeQuery?.(text, q) ||
      /\b(autolock|auto lock|autolog|auto log)\b/.test(q) ||
      (toggleKey === "autoLock" && /\b(autolock|auto lock|autolog|sperre)\b/.test(q));

    if (autoLockIntent && (lockSec != null || (toggleKey === "autoLock" && (onOff != null || /\b(autolock|auto lock|autolog|sperre)\b/.test(q))))) {
      const seconds = lockSec != null ? lockSec : null;
      const enable = onOff !== false;
      if (onOff === false && seconds == null) {
        return {
          type: "action",
          text: "Schalte <strong>Auto-Lock</strong> aus und oeffne Core …",
          run: () => helpers.navigateCore?.({ section: "lock", toggle: "autoLock", value: false })
        };
      }
      const label = seconds != null ? `${seconds < 60 ? seconds + " Sekunden" : seconds / 60 + " Minuten"}` : enable ? "aktiviert" : "geaendert";
      return {
        type: "action",
        text: `Auto-Lock <strong>${label}</strong> — springe zu Core Lock …`,
        run: () =>
          helpers.navigateCore?.({
            section: "lock",
            toggle: "autoLock",
            value: seconds != null ? true : enable,
            autoLockSeconds: seconds != null ? seconds : undefined
          })
      };
    }

    if (toggleKey && onOff != null) {
      const meta = TOGGLE_META[toggleKey];
      const verb = onOff ? "aktiviere" : "deaktiviere";
      return {
        type: "action",
        text: `Ich <strong>${verb}</strong> ${meta.label} in NOCO Core …`,
        run: () => helpers.navigateCore?.({ section: meta.section, toggle: toggleKey, value: onOff })
      };
    }

    if (toggleKey && /\b(ein|an|on|aus|off)\b/.test(q)) {
      const meta = TOGGLE_META[toggleKey];
      const val = /\b(aus|off)\b/.test(q) ? false : true;
      return {
        type: "action",
        text: `Stelle <strong>${meta.label}</strong> ${val ? "an" : "aus"} …`,
        run: () => helpers.navigateCore?.({ section: meta.section, toggle: toggleKey, value: val })
      };
    }

    if (/\b(zeig|show).{0,15}(autolock|auto lock|autolog).{0,15}(zeit|dauer|sek|min)/.test(q)) {
      return {
        type: "action",
        text: "Zeige Auto-Lock-Zeit in <strong>Core → Lock</strong> …",
        run: () => helpers.navigateCore?.({ section: "lock", highlight: "lock-time" })
      };
    }

    if (
      (/\b(alle|all)\b/.test(q) && /\b(widget|widgets)\b/.test(q) && /\b(entfern|loesch|weg|clear|delete)\b/.test(q)) ||
      /\bwidgets?\s+entfernen\b/.test(q)
    ) {
      return {
        type: "action",
        text: "Entferne alle Home-Widgets (Willkommen bleibt) …",
        run: () => helpers.setHomeWidgets?.(["hero"])
      };
    }

    const widgetId = matchWidget(q);
    if (widgetId && /\b(widget|widgets|home)\b/.test(q) && /\b(hinzuf|add|einfueg|einfug|ergaenz|pack)\b/.test(q)) {
      const title = helpers.getWidgetTitle?.(widgetId) || widgetId;
      return {
        type: "action",
        text: `Fuege Widget <strong>${title}</strong> zum Home hinzu …`,
        run: () => helpers.addHomeWidget?.(widgetId)
      };
    }

    if (widgetId && /\b(widget|widgets)\b/.test(q) && /\b(entfern|loesch|weg)\b/.test(q)) {
      return {
        type: "action",
        text: `Entferne Widget <strong>${widgetId}</strong> …`,
        run: () => helpers.removeHomeWidget?.(widgetId)
      };
    }

    let forgeId = resolveForgeApp(q);
    if (!forgeId) {
      const catalog = helpers.getForgeCatalog?.() || [];
      let best = null;
      let score = 0;
      catalog.forEach((app) => {
        const title = norm(app.title || "");
        if (q.includes(title) && title.length > score) {
          score = title.length;
          best = app.id;
        }
      });
      forgeId = best;
    }

    if (forgeId && /\b(deinstall|loesch|uninstall|entfern|delete)\b/.test(q)) {
      const title = helpers.getAppTitle?.(forgeId) || forgeId;
      return {
        type: "action",
        text: `Deinstalliere <strong>${title}</strong> …`,
        run: () => helpers.uninstallForgeApp?.(forgeId)
      };
    }

    if (forgeId && /\b(install|installier|laden|hol)\b/.test(q)) {
      const title = helpers.getAppTitle?.(forgeId) || forgeId;
      const catalog = helpers.getForgeCatalog?.() || [];
      const meta = catalog.find((a) => a.id === forgeId);
      if (meta?.exclusive && !helpers.isExclusiveActive?.()) {
        return {
          type: "text",
          text: `<p><strong>${title}</strong> ist eine <strong>Exclusive</strong>-App.</p><p>Zuerst Exclusive aktivieren, dann in Forge installieren.</p>${OFFER_HINT}`,
          offerRun: () => helpers.openExclusive?.(),
          offerLabel: "Exclusive oeffnen"
        };
      }
      if (helpers.isAppInstalled?.(forgeId)) {
        return {
          type: "text",
          text: `<p><strong>${title}</strong> ist schon installiert.</p><p>Soll ich die App oeffnen?</p>${OFFER_HINT}`,
          offerRun: () => helpers.openApp?.(forgeId),
          offerLabel: title
        };
      }
      return {
        type: "text",
        text: `<p><strong>${title}</strong> installieren:</p><ol><li>Forge oeffnen</li><li><strong>Installieren</strong> tippen</li><li>Danach unter Apps im Ordner</li></ol><p>Bei Schutz fragt das System nach deinem <strong>4-stelligen Code</strong>.</p>${OFFER_HINT}`,
        offerRun: () => helpers.installForgeApp?.(forgeId),
        offerLabel: "Jetzt installieren"
      };
    }

    if (forgeId && /\b(oeffne|offne|open|starte|spiel)\b/.test(q)) {
      const title = helpers.getAppTitle?.(forgeId) || forgeId;
      return {
        type: "action",
        text: `Starte <strong>${title}</strong> …`,
        run: () => helpers.openApp?.(forgeId)
      };
    }

    if (theme) {
      return {
        type: "action",
        text: `Theme <strong>${theme}</strong> …`,
        run: () => helpers.setTheme?.(theme)
      };
    }

    return null;
  }

  global.NocoAISystem = { processCommand, processGuide, TOGGLE_META, WIDGET_ALIASES, THEMES };
})(window);
