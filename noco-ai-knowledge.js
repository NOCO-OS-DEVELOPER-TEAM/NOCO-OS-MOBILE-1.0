/**
 * NOCO AI Knowledge 2.0 — breites System-Wissen, FAQ, kontextuelle Antworten
 */
(function initNocoAIKnowledge(global) {
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

  function hasOpenVerb(q) {
    return /\b(oeffne|offne|open|starte|zeig mir|geh zu|gehe zu|installier|deinstallier|mach auf)\b/.test(q);
  }

  function isQuestion(q, raw) {
    if (String(raw || "").trim().endsWith("?")) return true;
    return /\b(was|wie|wo|wann|wer|warum|wieso|welche|welcher|kann ich|kannst du|gibt es|brauche ich|soll ich|bedeutet|erklaer|erklaere|unterschied)\b/.test(q);
  }

  function snap(h) {
    return h.getSystemSnapshot?.() || {};
  }

  function allEntries() {
    const bank = global.NocoAIFaqBank?.ENTRIES || [];
    return BASE_ENTRIES.concat(bank);
  }

  /** @type {{ keys: string[], test?: (q:string, raw:string)=>boolean, answer: (h:object, q:string)=>string, run?: (h:object)=>Function|null, topic?: string, minScore?: number }[]} */
  const BASE_ENTRIES = [
    {
      keys: ["noco os mobile", "noco mobile", "was ist noco os", "was ist noco"],
      answer: () =>
        "<p><strong>NOCO OS Mobile 1.2</strong> ist dein offline Phone-UI: <strong>Home</strong> (Widgets), <strong>Apps</strong> (Bibliothek), <strong>Island</strong> oben, <strong>NOCO AI</strong> als Assistent — alles lokal im Browser/PWA.</p>"
    },
    {
      keys: ["was ist noco ai", "was kann noco ai", "noco ai erklaeren", "ki assistent noco"],
      answer: () =>
        "<p><strong>NOCO AI</strong> ist eine <strong>KI</strong> — aber fuer <strong>System-Befehle</strong> und <strong>Smalltalk</strong>, nicht fuer allgemeines Weltwissen wie ChatGPT.</p>" +
        "<p><strong>Stark:</strong> «Oeffne …», Timer, Notizen, FAQ. <strong>Schwach:</strong> News, tiefe Recherche. <strong>Hey Noko</strong> schreibt Befehle ins Feld; <strong>🎤</strong> = Diktat nur bei Klick.</p>"
    },
    {
      keys: ["was ist die island", "dynamic island", "insel oben", "leiste oben uhr"],
      answer: () =>
        "<p>Die <strong>Island</strong> zeigt Uhr, Seiten-Punkte (Home/Apps) und <strong>✧ NOCO AI</strong>. Tippen oeffnet das Schnellmenu: Home, Apps, Beam, Hub, Edit.</p>"
    },
    {
      keys: ["chrome", "title bar", "noco os titel", "home apps tabs oben"],
      answer: () =>
        "<p>Oben: <strong>Island</strong> → darunter <strong>Home | Apps</strong> → Titelzeile <strong>NOCO OS</strong>. In einer geoeffneten App bleiben Island + Inline-Home/Apps sichtbar.</p>"
    },
    {
      keys: ["wischen", "swipe", "seite wechseln", "von home zu apps wischen"],
      answer: () =>
        "<p><strong>Horizontal wischen</strong> zwischen Home und Apps — oder Island-Punkte / Tabs <strong>Home | Apps</strong>. In Apps: zurueck zur Seite mit Inline-Nav.</p>"
    },
    {
      keys: ["schnellzugriff", "shortcuts bibliothek", "favoriten apps"],
      answer: () =>
        "<p>Auf der <strong>App-Bibliothek</strong> oben: Schnellzugriff. Bearbeiten: Island → <strong>Edit</strong> → Stift. Oder: «Bearbeitungsmodus Apps».</p>"
    },
    {
      keys: ["core tab", "forge tab", "spiele tab", "library tabs"],
      answer: () =>
        "<p>Bibliothek-Tabs: <strong>Core</strong> (System-Apps), <strong>Forge</strong> (Store), <strong>Spiele</strong> (Arcade & Mini-Games). Wechsel per Tab-Leiste.</p>"
    },
    {
      keys: ["was ist forge", "forge erklaeren", "app store noco"],
      answer: () =>
        "<p><strong>Forge</strong> = App-Store: Mini-Apps installieren/deinstallieren, Exclusive-Apps, Spiele. «Oeffne Forge» oder Apps-Seite → Tab Forge.</p>"
    },
    {
      keys: ["was ist beam", "noco beam", "spotlight noco"],
      answer: () =>
        "<p><strong>NOCO Beam</strong> = Systemsuche: Apps, Befehle, Schnellaktionen. Island-Menü, Home «Suchen» oder «Oeffne Beam».</p>"
    },
    {
      keys: ["was ist hub", "noco hub"],
      answer: () =>
        "<p><strong>NOCO Hub</strong> = Kurzmenue mit Tools und Links. Island → Hub oder «Oeffne Hub».</p>"
    },
    {
      keys: ["was ist shieldgate", "shield gate", "security app", "sicherheits scan"],
      answer: () =>
        "<p><strong>ShieldGate</strong> (Security): Code-Sperre, Fake-Scan-Animation, Schutz-Einstellungen. «Oeffne Security».</p>"
    },
    {
      keys: ["keycard", "sync backup", "was ist sync"],
      answer: () =>
        "<p><strong>Sync / Keycard</strong> = Export/Import deiner Daten als Keycard (offline Backup). «Oeffne Sync» — nicht Cloud-Sync.</p>"
    },
    {
      keys: ["noco pay", "guthaben", "wallet pay", "wie aufladen pay"],
      answer: (h) => {
        const s = snap(h);
        return `<p><strong>NOCO Pay</strong> = Demo-Wallet. Kontostand: <strong>${esc(s.payBalance || "0 EUR")}</strong>. «Zeig Guthaben», «Pay +10 EUR» (Demo).</p>`;
      }
    },
    {
      keys: ["exclusive was", "was ist exclusive", "premium paket", "noco exclusive"],
      answer: (h) => {
        const on = snap(h).exclusiveActive;
        return `<p><strong>NOCO Exclusive</strong> = Premium-Paket (Glas-Boost, Apps, Deep Scan, <strong>unbegrenzte NOCO AI</strong>). Bei dir: <strong>${on ? "aktiv" : "nicht aktiv"}</strong>.</p>`;
      }
    },
    {
      keys: ["unbegrenzte ai", "ai plus", "20 nachrichten", "tageslimit ai"],
      answer: (h) => {
        const usage = global.NocoAILimits?.getUsage?.(h.getSettings?.() || {});
        if (usage?.exclusive || usage?.plus) return "<p>Du hast <strong>unbegrenzte NOCO AI</strong> (Exclusive/Plus).</p>";
        return `<p>Kostenlos: <strong>${usage?.remaining ?? 20}/${usage?.limit ?? 20}</strong> Nachrichten/Tag. Unlimited mit <strong>Exclusive</strong>.</p>`;
      }
    },
    {
      keys: ["witz erzaehlen", "lustige antwort", "erzaehl einen witz"],
      answer: () =>
        "<p>Sag einfach <strong>«Witz»</strong> oder <strong>«Erzaehl einen Witz»</strong> — ich habe mehrere zufällige Antworten.</p>"
    },
    {
      keys: ["design aendern", "theme wechseln", "farbe aendern", "look aendern"],
      answer: () =>
        "<p><strong>Design:</strong> «Theme Midnight», «Design aendern», «Oeffne Theme App» — oder App <strong>Themes</strong>.</p>"
    },
    {
      keys: ["sprachbefehl", "sprache", "mikrofon", "nocoai sagen", "wake word", "sag noco ai"],
      answer: () =>
        "<p><strong>Sprache:</strong> Sage <strong>«NOCO AI»</strong> (Wake) — die App oeffnet sich. Im Assistenten: <strong>Mikro</strong> fuer Diktat/Befehle. Toggle <strong>«Hoeren»</strong> fuer Wake im Hintergrund (Browser-Mikro noetig).</p>"
    },
    {
      keys: ["widget pack", "welche widgets", "home widgets", "bento"],
      answer: (h) => {
        const w = (snap(h).widgets || []).join(", ") || "Standard";
        return `<p>Home-Widgets (Bento): <strong>${esc(w)}</strong>. Packs: «Widget Pack AI», «Standard Widgets». Edit: Island → Edit → +.</p>`;
      }
    },
    {
      keys: ["edit modus", "bearbeitungsmodus", "stift home"],
      answer: () =>
        "<p><strong>Edit-Modus:</strong> Island → <strong>Edit</strong>. Dann + (Widgets) und Stift (Schnellzugriff). «Bearbeitungsmodus beenden» zum Schliessen.</p>"
    },
    {
      keys: ["apps bleiben offen", "keep apps alive", "liquid glass apps"],
      answer: (h) => {
        const s = snap(h);
        return `<p><strong>Apps bleiben offen</strong> haelt App-Zustand beim Wechseln. Einstellung in Core. Glas-Boost: <strong>${s.glassBoost ? "an" : "aus"}</strong>.</p>`;
      }
    },
    {
      keys: ["auto lock", "automatisch sperren", "bildschirm sperre einstellung"],
      answer: (h) => {
        const s = snap(h);
        return `<p><strong>Auto-Lock:</strong> ${s.autoLock ? "an" : "aus"} (${s.autoLockSeconds || 60}s). «Auto-Lock aus/an», «Zeige Lock Screen», Core → Sicherheit.</p>`;
      }
    },
    {
      keys: ["lock screen", "sperrbildschirm", "code eingeben"],
      answer: () =>
        "<p><strong>Lock Screen</strong> erscheint nach Sperre/Start. Code in ShieldGate setzen. Vorschau: «Zeige Lock Screen».</p>"
    },
    {
      keys: ["theme wechseln", "design aendern", "aurora midnight", "welches theme"],
      answer: (h) => {
        const s = snap(h);
        return `<p>Aktuelles Theme: <strong>${esc(s.theme)}</strong>. «Theme Midnight/Sunset/Forest» oder App <strong>Themes</strong>.</p>`;
      }
    },
    {
      keys: ["helligkeit", "display heller", "ui brightness"],
      answer: (h) => {
        const b = Math.round((snap(h).uiBrightness || 1) * 100);
        return `<p>UI-Helligkeit: <strong>${b}%</strong>. «Heller», «Dunkler», «Helligkeit 80».</p>`;
      }
    },
    {
      keys: ["animationen", "bewegung", "motion reduzieren"],
      answer: (h) => {
        const s = snap(h);
        return `<p>Motion/Live-Wallpaper: Motion <strong>${s.motion ? "an" : "aus"}</strong>, Live <strong>${s.liveWallpaper ? "an" : "aus"}</strong> — in Core → Deck.</p>`;
      }
    },
    {
      keys: ["notizen speichern", "wo notizen", "noco notes"],
      answer: (h) => {
        const n = snap(h).noteCount ?? 0;
        return `<p><strong>Notizen</strong> liegen lokal (${n} Stueck). «Oeffne Notizen», «Erstelle Notiz mit Titel …», Suche: «Such in Notizen …».</p>`;
      }
    },
    {
      keys: ["aufgaben tasks", "todo liste", "offene aufgaben"],
      answer: () =>
        "<p><strong>Tasks</strong> = Checkliste. «Erstelle Aufgabe …», «Offene Aufgaben», «Erledige Aufgabe Milch».</p>"
    },
    {
      keys: ["timer fokus", "pomodoro", "countdown erklaeren"],
      answer: () =>
        "<p><strong>Timer</strong>: «Starte Timer 10 Minuten», «Fokus Modus» (25 Min), «Wann ist mein Timer rum?».</p>"
    },
    {
      keys: ["memory erinnerung", "reminder app"],
      answer: () =>
        "<p><strong>Memory</strong> = lokale Erinnerungen. «Erinnere mich in 20 Minuten …» — kein Push ohne Browser, aber Anzeige im System.</p>"
    },
    {
      keys: ["arcade spiele", "mini spiele", "dodge run", "runner spiel"],
      answer: () =>
        "<p><strong>Spiele</strong>: Tab Spiele oder Forge — Dodge Run, Runner, Memory Grid, Tap Dash, Color Catch. «Oeffne Arcade».</p>"
    },
    {
      keys: ["device app", "geraet info", "handy status"],
      answer: () =>
        "<p>App <strong>Device</strong> zeigt Geraete-Infos. «Oeffne Device» oder «System Status» fuer KI-Ueberblick.</p>"
    },
    {
      keys: ["performance schlecht", "langsam", "ruckelt", "lag"],
      answer: (h) => {
        const s = snap(h);
        const tips = [];
        if (s.glassBoost && s.motion) tips.push("Glas-Boost + Motion reduzieren");
        if (s.liveWallpaper) tips.push("Live-Wallpaper aus");
        if (!tips.length) tips.push("Exclusive-Animationen pruefen, weniger Widgets");
        return `<p><strong>Performance-Tipps:</strong> ${tips.map((t) => esc(t)).join(" · ")}. «Mehr Performance» oder Core → Deck.</p>`;
      }
    },
    {
      keys: ["cache leeren", "alte version", "build aktualisieren", "sehe altes design"],
      answer: () =>
        "<p>Unten am PC: <strong>Build-Nummer</strong> pruefen. Link <strong>Cache leeren</strong> oder URL <code>?fresh=1</code>. Dann Hard-Reload.</p>"
    },
    {
      keys: ["service worker", "pwa installieren", "homescreen"],
      answer: () =>
        "<p>Als <strong>PWA</strong> installierbar (Safari/Chrome «Zum Home-Bildschirm»). Service Worker cached Assets fuer Offline-Start.</p>"
    },
    {
      keys: ["pc preview", "am computer", "desktop preview"],
      answer: () =>
        "<p>Am PC: Phone-Frame (390×844), kein gestrecktes Vollbild. Optimiert fuer <strong>Handy</strong> — am Desktop nur Vorschau.</p>"
    },
    {
      keys: ["island app modus", "app offen island", "inline nav"],
      answer: () =>
        "<p><strong>App-Modus:</strong> Nur Island + ✧ AI + <strong>Home|Apps</strong> unter der Island — kein grosser Titel. Wischen schliesst zur Seite.</p>"
    },
    {
      keys: ["taschenlampe", "flashlight app"],
      answer: () =>
        "<p><strong>Taschenlampe</strong> — sag klar «Mach Licht an» oder «Oeffne Taschenlampe» (nicht nur «Licht»).</p>"
    },
    {
      keys: ["wetter app", "weather offline"],
      answer: () =>
        "<p><strong>Wetter</strong> = Demo/stilisiert, offline. «Oeffne Wetter».</p>"
    },
    {
      keys: ["rechner mathe", "taschenrechner ki"],
      answer: () =>
        "<p>Rechnen in NOCO AI: «3 plus 3», «15 Prozent von 80», «10 km in Meilen». App: «Oeffne Rechner».</p>"
    },
    {
      keys: ["chat loeschen", "mehrere chats", "chat verlauf"],
      answer: (h) => {
        const c = snap(h).chatCount ?? 0;
        return `<p><strong>${c} Chats</strong> gespeichert. «Neuer Chat», «Loesche diesen Chat», Chats-Button oben, Langdruck = Umbenennen.</p>`;
      }
    },
    {
      keys: ["such ueberall", "globale suche", "finde notiz"],
      answer: () =>
        "<p>Suche: «Such ueberall nach …», «Oeffne Notiz mit …», «Oeffne Chat wo ich …». Beam fuer App-Namen.</p>"
    },
    {
      keys: ["inbox erklaeren", "was bedeutet inbox"],
      answer: () =>
        "<p><strong>Inbox</strong> = live Ueberblick. Sag <strong>Was steht an?</strong> fuer Timer, Memories, Tasks und deinen Ort im System.</p>"
    },
    {
      keys: ["coach modus", "was soll ich tun", "tipp des tages"],
      answer: () =>
        "<p><strong>Coach:</strong> «Was soll ich jetzt tun?», «Gib mir einen Tipp», «Tagesplan» — kontextbasierte Vorschlaege.</p>"
    },
    {
      keys: ["installiere app", "deinstalliere", "app entfernen"],
      answer: () =>
        "<p>«Installiere Dodge Run», «Deinstalliere Sketch» — oder Forge manuell. Exclusive-Apps brauchen Exclusive.</p>"
    },
    {
      keys: ["wo bin ich", "aktuelle seite", "bin ich in app"],
      answer: (h) => {
        const page = h.getCurrentPage?.() === 1 ? "Apps" : "Home";
        const app = h.getCurrentApp?.();
        const edit = h.isEditMode?.() ? " · Edit-Modus" : "";
        if (app) {
          const title = h.getAppTitle?.(app) || app;
          return `<p>Du bist in <strong>${esc(title)}</strong> (Seite <strong>${page}</strong>${edit}).</p>`;
        }
        return `<p>Du bist auf <strong>${page}</strong>${edit} — keine App im Vordergrund.</p>`;
      }
    },
    {
      keys: ["unterschied beam ai", "ai vs beam"],
      answer: () =>
        "<p><strong>NOCO AI</strong> = Assistent (Fragen, erstellen, steuern). <strong>Beam</strong> = schnelle App/Befehl-Suche. Beide offline.</p>"
    },
    {
      keys: ["version 2", "ai update", "doppelt so smart", "intelligenz update"],
      answer: () =>
        "<p><strong>NOCO AI 2.0 Wissen</strong>: hunderte FAQ-Eintraege, System-Aktionen, Wake-Word <strong>«NOCO AI»</strong>, klarere UI mit Kategorien & Mikro.</p>"
    },
    {
      keys: ["fehler melden", "bug", "funktioniert nicht"],
      answer: () =>
        "<p>Probiere: App schliessen → Home → neu oeffnen. «System Status» + Cache leeren. Frag «Warum … Performance?»</p>"
    },
    {
      keys: ["daten export", "alles sichern"],
      answer: () =>
        "<p>Backup via <strong>Sync/Keycard</strong>. Chats/Notizen in localStorage — Browser-Daten nicht loeschen.</p>"
    },
    {
      keys: ["barrierefrei", "schrift groesser", "zoom"],
      answer: () =>
        "<p>Nutze System-Zoom (iOS/Android). UI-Helligkeit in NOCO AI/Core anpassbar.</p>"
    },
    {
      keys: ["tastatur", "eingabe unten", "keyboard ai"],
      answer: () =>
        "<p>Chat-Eingabe unten; auf iOS rutscht die Leiste mit dem Chat hoch. Beam schliesst andere Tastaturen beim Oeffnen.</p>"
    },
    {
      keys: ["haptik", "vibration", "vibrieren"],
      answer: () =>
        "<p>Kurze <strong>Vibration</strong> bei Island-Taps und Langdruck (Chat umbenennen), wenn das Geraet es unterstuetzt.</p>"
    },
    {
      keys: ["exclusive apps", "nur mit exclusive"],
      answer: () =>
        "<p>Manche Forge-Apps sind <strong>Exclusive</strong>-only. «Oeffne Exclusive» zum Freischalten (Demo).</p>"
    },
    {
      keys: ["cloud app", "focus app", "vault app"],
      answer: () =>
        "<p><strong>Cloud/Focus/Vault</strong> = Premium-Style Mini-Apps aus Forge — «Oeffne Cloud» etc.</p>"
    },
    {
      keys: ["toon news", "zeitung app"],
      answer: () =>
        "<p><strong>Toon</strong> = stylisierte News/Demo. «Oeffne Toon».</p>"
    },
    {
      keys: ["web browser", "internet app"],
      answer: () =>
        "<p><strong>Web</strong> = eingebetteter Demo-Browser — kein volles Internet wie Safari.</p>"
    },
    {
      keys: ["atem breath", "meditation"],
      answer: () =>
        "<p><strong>Breath</strong> = Atem-Uebung. «Oeffne Breath» aus Forge.</p>"
    },
    {
      keys: ["sketch zeichnen", "mal app"],
      answer: () =>
        "<p><strong>Sketch</strong> = zeichnen. Forge installieren → «Oeffne Sketch».</p>"
    },
    {
      keys: ["quotes sprueche", "zitat des tages"],
      answer: () =>
        "<p><strong>Quotes</strong> — «Oeffne Quotes» oder «Gib mir einen Tipp».</p>"
    },
    {
      keys: ["radar status", "netz demo"],
      answer: () =>
        "<p><strong>Radar</strong> = Demo-Netzstatus. Forge → Radar.</p>"
    },
    {
      keys: ["transit route", "fahrt app"],
      answer: () =>
        "<p><strong>Transit</strong> = Demo-Routen. «Oeffne Transit».</p>"
    },
    {
      keys: ["rezepte recipes", "kochen app"],
      answer: () =>
        "<p><strong>Recipes</strong> in Forge — «Oeffne Recipes».</p>"
    },
    {
      keys: ["glowcam kamera", "foto app"],
      answer: () =>
        "<p><strong>GlowCam</strong> = Demo-Kamera-UI. «Oeffne GlowCam».</p>"
    },
    {
      keys: ["mood board", "stimmung app"],
      answer: () =>
        "<p><strong>Mood</strong> = Stimmungs-Board. «Oeffne Mood».</p>"
    },
    {
      keys: ["pulse herz", "puls app"],
      answer: () =>
        "<p><strong>Pulse</strong> = Demo-Puls. «Oeffne Pulse».</p>"
    },
    {
      keys: ["farbe color catch", "reaktion spiel"],
      answer: () =>
        "<p><strong>Color Catch</strong> — Mini-Spiel unter Spiele/Forge.</p>"
    },
    {
      keys: ["memory grid", "merk spiel"],
      answer: () =>
        "<p><strong>Memory Grid</strong> — Karten merken. «Oeffne Memory Grid».</p>"
    },
    {
      keys: ["tap dash", "tipp spiel"],
      answer: () =>
        "<p><strong>Tap Dash</strong> — schnelles Tipp-Spiel.</p>"
    },
    {
      keys: ["deep scan", "exclusive scan"],
      answer: () =>
        "<p><strong>Deep Scan</strong> (Exclusive) = erweiterte Security-Animation in ShieldGate.</p>"
    },
    {
      keys: ["fake scan", "scan animation"],
      answer: () =>
        "<p>ShieldGate zeigt eine <strong>Scan-Animation</strong> (Demo) — kein echtes Antivirus.</p>"
    },
    {
      keys: ["code 4 stellen", "pin vergessen"],
      answer: () =>
        "<p>Code ist lokal — bei Vergessen: localStorage zuruecksetzen (verliert Daten) oder neu setzen in Security wenn entsperrt.</p>"
    },
    {
      keys: ["first light", "erster start", "onboarding"],
      answer: () =>
        "<p><strong>First Light</strong> = Erststart-Overlay. Danach normaler Home-Screen mit Coach-Hinweis.</p>"
    },
    {
      keys: ["coach hinweis", "erste hilfe overlay"],
      answer: () =>
        "<p>Einmaliger <strong>Coach</strong> auf Home — kann in Settings abgeschaltet werden.</p>"
    },
    {
      keys: ["build nummer", "welche version", "1.2 build"],
      answer: (h) => {
        const b = h.getBuild?.() || global.document?.documentElement?.dataset?.nocoBuild || "?";
        return `<p>Build <strong>${esc(b)}</strong> · NOCO OS Mobile <strong>1.2</strong> · NOCO AI <strong>FAQ ${bankCount()}+</strong>.</p>`;
      }
    }
  ];

  function bankCount() {
    return (global.NocoAIFaqBank?.COUNT || 0) + BASE_ENTRIES.length;
  }

  function scoreEntry(q, entry) {
    let score = 0;
    (entry.keys || []).forEach((k) => {
      const nk = norm(k);
      if (!nk) return;
      if (q === nk) score += 5;
      else if (q.includes(nk)) score += nk.length >= 10 ? 4 : 3;
      else {
        const parts = nk.split(" ").filter((w) => w.length >= 4);
        parts.forEach((w) => {
          if (q.includes(w)) score += 1;
        });
      }
    });
    if (entry.test && entry.test(q, "")) score += 4;
    return score;
  }

  function pickBest(q) {
    let best = null;
    let bestScore = 0;
    allEntries().forEach((entry) => {
      const s = scoreEntry(q, entry);
      const min = entry.minScore ?? 2;
      if (s >= min && s > bestScore) {
        bestScore = s;
        best = entry;
      }
    });
    return best ? { entry: best, score: bestScore } : null;
  }

  function smartHint(text, helpers) {
    const q = norm(text);
    if (!q || q.length < 4 || hasOpenVerb(q)) return null;
    const hit = pickBest(q);
    if (!hit || hit.score < 2) return null;
    const preview = hit.entry.keys[0];
    return {
      text: `<p>Vielleicht meinst du: <strong>«${esc(preview)}?»</strong> — stell die Frage etwas konkreter, ich habe dazu Wissen.</p>`
    };
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!q || q.length < 3) return null;
    if (/\b(faq liste|alle fragen|fragen katalog|was kann ich fragen)\b/.test(q)) {
      const html = global.NocoAIFaqBank?.buildCatalogHtml?.() || "<p>FAQ-Katalog</p>";
      return { type: "text", text: html, rememberTopic: "faq" };
    }
    if (hasOpenVerb(q) && !isQuestion(q, raw)) return null;
    if (global.NocoAISystemMap?.process && /\b(wo ist|wo sind|wo finde)\b/.test(q)) {
      const map = global.NocoAISystemMap.process(raw, helpers, {});
      if (map) return map;
    }
    const hit = pickBest(q);
    if (!hit) return null;
    const html = hit.entry.answer(helpers, q);
    if (!html) return null;
    const runFn = hit.entry.run?.(helpers);
    if (typeof runFn === "function") {
      const silent = hit.entry.silentAnswer;
      return {
        type: "action",
        silent: !!silent,
        text: silent ? `<p>${String(silent).replace(/</g, "&lt;")}</p>` : html,
        run: runFn,
        rememberTopic: hit.entry.topic || "knowledge"
      };
    }
    return {
      type: "text",
      text: html,
      rememberTopic: hit.entry.topic || "knowledge"
    };
  }

  function scoreQuery(raw) {
    const hit = pickBest(norm(raw));
    return hit?.score || 0;
  }

  global.NocoAIKnowledge = {
    process,
    smartHint,
    pickBest,
    scoreQuery,
    norm,
    getEntryCount: () => allEntries().length,
    ENTRY_COUNT: BASE_ENTRIES.length
  };
})(typeof window !== "undefined" ? window : globalThis);
