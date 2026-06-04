/**
 * NOCO AI FAQ Bank — 100+ vorgefertigte Fragen, Antworten & Befehle
 */
(function initNocoAIFaqBank(global) {
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function txt(keys, html, run, topic, silentAnswer) {
    const entry = {
      keys,
      answer: typeof html === "function" ? html : () => html,
      run: run ? (h) => run(h) : null,
      topic
    };
    if (silentAnswer) entry.silentAnswer = typeof silentAnswer === "string" ? silentAnswer : "✓";
    return entry;
  }

  function open(keys, appId, label, tip) {
    const name = label || appId;
    return {
      keys,
      answer: () =>
        `<p><strong>${esc(name)}</strong>${tip ? ` — ${tip}` : ""}</p><p>Befehl: <strong>Oeffne ${esc(name)}</strong></p>`,
      run: (h) => () => h.openApp?.(appId),
      topic: appId
    };
  }

  /** Frage-Form → kurze Antwort, App oeffnet still */
  function qopen(keys, appId, label, hint) {
    const name = label || appId;
    return {
      keys,
      answer: () => {
        const lead = hint || `«Oeffne ${esc(name)}»`;
        return `<p>${lead} — in der App-Bibliothek unter <strong>${esc(name)}</strong>.</p>`;
      },
      run: (h) => () => h.openApp?.(appId),
      topic: appId,
      silentAnswer: `✓ ${name}`
    };
  }

  function how(keys, steps, cmd, run, topic) {
    return {
      keys,
      answer: () => `<p>${steps}</p>${cmd ? `<p>Befehl: <strong>${esc(cmd)}</strong></p>` : ""}`,
      run,
      topic: topic || "howto"
    };
  }

  const ENTRIES = [
    open(["wie oeffne ich forge", "forge starten", "zum app store"], "forge", "Forge", "App-Store fuer Mini-Apps"),
    open(["wie oeffne ich beam", "systemsuche starten", "spotlight noco"], "beam", "NOCO Beam", null),
    open(["wie oeffne ich hub", "schnellmenu hub"], "hub", "NOCO Hub", null),
    open(["wie oeffne ich notizen", "notiz app oeffnen", "wo sind notizen"], "notes", "Notizen", null),
    open(["wie oeffne ich tasks", "aufgaben app", "todo app oeffnen"], "tasks", "Tasks", null),
    open(["wie oeffne ich timer", "countdown app", "stoppuhr app"], "timer", "Timer", null),
    open(["wie oeffne ich memories", "erinnerungen app", "reminder app"], "memories", "Memory", null),
    open(["wie oeffne ich themes", "design app oeffnen", "farben app"], "themes", "Themes", null),
    open(["wie oeffne ich security", "shieldgate oeffnen", "sicherheit app"], "security", "ShieldGate", null),
    open(["wie oeffne ich sync", "backup app", "keycard app"], "sync", "Sync", null),
    open(["wie oeffne ich pay", "wallet oeffnen", "geld app"], "pay", "NOCO Pay", null),
    open(["wie oeffne ich exclusive", "premium oeffnen", "abo app"], "exclusive", "Exclusive", null),
    open(["wie oeffne ich arcade", "spiele hub", "game center"], "arcade", "Arcade", null),
    open(["wie oeffne ich calculator", "rechner app", "taschenrechner app"], "calculator", "Rechner", null),
    open(["wie oeffne ich weather", "wetter app"], "weather", "Wetter", null),
    open(["wie oeffne ich device", "geraete app", "handy info app"], "device", "Device", null),
    open(["wie oeffne ich core", "einstellungen oeffnen", "settings app"], "settings", "Core", null),
    open(["wie oeffne ich dodge run", "ausweich spiel"], "dodgerun", "Dodge Run", null),
    open(["wie oeffne ich runner", "lauf spiel"], "runner", "Runner", null),
    open(["wie oeffne ich memory grid", "merk spiel oeffnen"], "memorygrid", "Memory Grid", null),
    open(["wie oeffne ich tap dash", "tipp spiel oeffnen"], "tapdash", "Tap Dash", null),
    open(["wie oeffne ich color catch", "farben spiel"], "colorcatch", "Color Catch", null),
    open(["wie oeffne ich breath", "atem app", "meditation app"], "breath", "Breath", null),
    open(["wie oeffne ich sketch", "zeichnen app", "mal app"], "sketch", "Sketch", null),
    open(["wie oeffne ich quotes", "sprueche app", "zitate app"], "quotes", "Quotes", null),
    open(["wie oeffne ich vault", "tresor app"], "vault", "Vault", null),
    open(["wie oeffne ich cloud", "cloud app noco"], "cloud", "Cloud", null),
    open(["wie oeffne ich focus", "fokus app"], "focus", "Focus", null),
    open(["wie oeffne ich mood", "stimmung board app"], "mood", "Mood", null),
    open(["wie oeffne ich pulse", "puls app"], "pulse", "Pulse", null),
    open(["wie oeffne ich radar", "netz status app"], "radar", "Radar", null),
    open(["wie oeffne ich transit", "route app"], "transit", "Transit", null),
    open(["wie oeffne ich recipes", "rezept app", "kochen app"], "recipes", "Recipes", null),
    open(["wie oeffne ich glowcam", "kamera app noco"], "glowcam", "GlowCam", null),
    qopen(
      ["kannst du die kamera oeffnen", "mach die kamera auf", "ich will die kamera"],
      "glowcam",
      "GlowCam",
      "Kamera-Demo — ich oeffne GlowCam."
    ),
    qopen(
      ["mach ein foto", "foto machen bitte", "selfie machen", "ich will ein foto machen"],
      "glowcam",
      "GlowCam",
      "Foto = GlowCam oeffnen."
    ),
    txt(
      ["letzte app wieder", "zurueck zur letzten app", "wo war ich gerade"],
      "✓",
      (h) => () => {
        const id = h.getLastOpenedApp?.();
        if (id) h.openApp?.(id);
      },
      "lastapp",
      true
    ),
    txt(
      ["meeting vorbereiten", "ich habe gleich ein meeting", "termin vorbereiten"],
      "✓",
      (h) => () => {
        const res = global.NocoAILive?.process?.("Meeting vorbereitung Team", h);
        if (res?.run) res.run();
      },
      "meeting",
      true
    ),
    txt(
      ["system tour", "zeig mir noco", "rundgang durchs system"],
      "✓",
      (h) => () => {
        const res = global.NocoAILive?.process?.("System Tour", h);
        if (res?.run) res.run();
      },
      "tour",
      true
    ),
    txt(
      ["raeum den bildschirm auf", "nur home zeigen", "zen modus"],
      "✓",
      (h) => () => h.focusDesk?.(),
      "zen",
      true
    ),
    txt(
      ["speicher status als notiz", "status snapshot", "tagesstatus notiz"],
      "✓",
      (h) => () => {
        h.saveStatusNote?.();
        h.openApp?.("notes");
      },
      "status",
      true
    ),
    open(["wie oeffne ich toon", "news app", "zeitung app"], "toon", "Toon", null),
    open(["wie oeffne ich web", "browser app noco"], "web", "Web", null),
    open(["wie oeffne ich taschenlampe", "licht app", "flashlight app"], "flashlight", "Taschenlampe", null),

    how(
      ["wie erstelle ich eine notiz", "neue notiz anlegen", "notiz schreiben"],
      "Sag <strong>Erstelle Notiz</strong> (leer) oder <strong>Erstelle Notiz mit Titel Einkauf</strong>.",
      "Erstelle Notiz mit Titel Ideen",
      (h) => () => h.createNote?.({ title: "Ideen", openApp: true }),
      "notes"
    ),
    how(
      ["wie erstelle ich eine aufgabe", "neue task anlegen", "todo erstellen"],
      "Sag <strong>Erstelle Aufgabe Milch kaufen</strong> oder nur <strong>Erstelle Aufgabe</strong>.",
      "Erstelle Aufgabe",
      (h) => () => h.createTask?.({ text: "Neue Aufgabe", openApp: true }),
      "tasks"
    ),
    how(
      ["wie starte ich einen timer", "countdown starten", "timer 10 minuten"],
      "Sag <strong>Starte Timer 10 Minuten</strong> oder <strong>Fokus Modus</strong> (25 Min).",
      "Starte Timer 5 Minuten",
      (h) => () => {
        h.applyTimerMinutes?.(5);
        h.startTimerCountdown?.();
        h.openTimerApp?.();
      },
      "timer"
    ),
    how(
      ["wie setze ich eine erinnerung", "reminder erstellen", "erinnere mich"],
      "Beispiel: <strong>Erinnere mich in 20 Minuten, Muell rausbringen</strong>.",
      "Erinnere mich in 15 Minuten, Pause",
      (h) => () => h.addReminder?.({ text: "Pause", minutes: 15 }),
      "memory"
    ),
    how(
      ["wie wechsle ich das theme", "design wechseln", "aussehen aendern"],
      "Sag <strong>Theme Midnight</strong>, <strong>Theme Sunset</strong> oder <strong>Oeffne Theme App</strong>.",
      "Theme Forest",
      (h) => () => h.setTheme?.("forest"),
      "themes"
    ),
    how(
      ["wie installiere ich apps", "app aus forge holen", "neue app laden"],
      "Forge oeffnen → Installieren. Oder: <strong>Installiere Dodge Run</strong>.",
      "Oeffne Forge",
      (h) => () => h.openForge?.(),
      "forge"
    ),
    how(
      ["wie aktiviere ich sprache", "mikrofon noco ai", "sprachsteuerung"],
      "Beim ersten Mal: <strong>Mikrofon erlauben</strong>. Dann «NOCO AI» sagen oder <strong>Sprachmodus an</strong>.",
      "Sprachmodus an",
      (h) => () => global.NocoAIVoice?.setWakeEnabled?.(true),
      "voice"
    ),
    how(
      ["wie bearbeite ich widgets", "widget hinzufuegen home", "neues widget home"],
      "Island → <strong>Edit</strong> → <strong>+</strong>. Oder: <strong>Widget Pack AI</strong>.",
      "Widget Pack AI",
      (h) => () => h.setHomeWidgetPack?.("ai"),
      "widgets"
    ),
    how(
      ["wie gehe ich zu home", "zur startseite", "home screen"],
      "Wische rechts oder Island-Punkt links. Befehl: <strong>Gehe zu Home</strong>.",
      "Gehe zu Home",
      (h) => () => h.goToPage?.(0),
      "nav"
    ),
    how(
      ["wie komme ich zur app bibliothek", "zu apps wechseln", "app liste"],
      "Wische links oder Island → Apps. Befehl: <strong>Gehe zu Apps</strong>.",
      "Gehe zu Apps",
      (h) => () => h.goToPage?.(1),
      "nav"
    ),
    how(
      ["wie schliesse ich eine app", "app beenden", "zurueck aus app"],
      "Wische zur Seite oder <strong>Schliesse App</strong>.",
      "Schliesse die App",
      (h) => () => h.closeCurrentApp?.(),
      "nav"
    ),
    how(
      ["wie sehe ich den sperrbildschirm", "lock screen anzeigen", "sperre vorschau"],
      "Befehl: <strong>Zeige Lock Screen</strong>.",
      "Zeige Lock Screen",
      (h) => () => h.showLockScreenPreview?.(),
      "lock"
    ),
    how(
      ["wie bekomme ich mehr glas", "liquid glass aktivieren", "glas effekt an"],
      "Befehl: <strong>Mehr Liquid Glass</strong>.",
      "Mehr Liquid Glass",
      (h) => () => h.enableGlassMode?.(),
      "glass"
    ),
    how(
      ["wie mache ich es schneller", "performance verbessern", "weniger lag"],
      "Befehl: <strong>Mehr Performance</strong> — reduziert Glas/Motion.",
      "Mehr Performance",
      (h) => () => {
        h.setSettingToggle?.("glassBoost", false);
        h.setSettingToggle?.("motion", false);
      },
      "perf"
    ),

    txt(
      ["was ist noco ai genau", "wofuer ist der assistent", "ki in noco"],
      "<p><strong>NOCO AI</strong> ist dein <strong>offline</strong> Helfer: Fragen, Apps steuern, Notizen/Tasks, Timer, Sprache — alles lokal.</p>",
      null,
      "nocoai"
    ),
    txt(
      ["wie viele befehle gibt es", "was kann ich alles sagen", "befehls liste"],
      "<p>Ueber <strong>150 FAQ-Antworten</strong> + App-Befehle. Tippe <strong>FAQ Liste</strong> oder <strong>Hilfe</strong>.</p>",
      null,
      "help"
    ),
    txt(
      ["faq liste", "alle fragen", "fragen katalog", "was kann ich fragen"],
      () => global.NocoAIFaqBank?.buildCatalogHtml?.() || "<p>FAQ-Katalog geladen.</p>",
      null,
      "faq"
    ),
    txt(
      ["kannst du rechnen", "mathe aufgaben", "rechnen lassen"],
      "<p>Ja — z. B. <strong>3 plus 3</strong>, <strong>15 Prozent von 80</strong>, <strong>10 km in Meilen</strong>.</p>",
      null,
      "math"
    ),
    txt(
      ["kannst du bilder malen", "bilder generieren", "fotos erstellen ki"],
      "<p><strong>Bilder</strong> noch nicht — aber Apps, Notizen, Design, Spiele & Sprache.</p>",
      null,
      "limits"
    ),
    txt(
      ["speicherst du meine daten", "cloud upload", "server senden"],
      "<p><strong>Nein.</strong> Alles in <strong>localStorage</strong> auf deinem Geraet — privat & offline.</p>",
      null,
      "privacy"
    ),
    txt(
      ["loescht du chats", "chat daten weg", "verlauf loeschen"],
      "<p>Du kannst Chats loeschen: <strong>Loesche diesen Chat</strong> (mindestens einer bleibt).</p>",
      null,
      "chat"
    ),
    txt(
      ["wie benenne ich chat um", "chat umbenennen", "chat name aendern"],
      "<p>In NOCO AI: <strong>Chats</strong> → Langdruck auf einen Chat → Umbenennen.</p>",
      null,
      "chat"
    ),
    txt(
      ["mehrere chats", "verschiedene gespraeche", "chat wechseln"],
      "<p>Oben <strong>Chats</strong> — mehrere Verlaeufe parallel. <strong>Neuer Chat</strong> fuer neues Thema.</p>",
      null,
      "chat"
    ),
    txt(
      ["was ist inbox", "tages ueberblick", "alles auf einen blick"],
      "<p><strong>Inbox</strong> = Tasks + Timer + Memory + Notizen-Hinweis. Befehl: <strong>Was steht an?</strong></p>",
      (h) => () => global.NocoAI?.processMessage?.("Was steht an?", h)?.run?.(),
      "inbox"
    ),
    txt(
      ["was ist fokus modus", "pomodoro noco", "25 minuten arbeit"],
      "<p><strong>Fokus Modus</strong> = 25-Min-Timer. Befehl: <strong>Fokus Modus</strong>.</p>",
      (h) => () => global.NocoAI?.processMessage?.("Fokus Modus", h)?.run?.(),
      "timer"
    ),
    txt(
      ["wie lange laeuft timer", "timer status", "wie viel timer noch"],
      "<p>Frag: <strong>Wann ist mein Timer rum?</strong></p>",
      null,
      "timer"
    ),
    txt(
      ["naechste erinnerung", "wann erinnert du", "memory zeit"],
      "<p>Frag: <strong>Wann ist meine Erinnerung?</strong></p>",
      null,
      "memory"
    ),
    txt(
      ["offene aufgaben", "was muss ich noch tun", "task liste anzeigen"],
      "<p>Befehl: <strong>Offene Aufgaben</strong> oder <strong>Oeffne Tasks</strong>.</p>",
      (h) => () => h.openApp?.("tasks"),
      "tasks"
    ),
    txt(
      ["erledige aufgabe", "task abhaken", "aufgabe fertig"],
      "<p>Sag <strong>Erledige Aufgabe</strong> + Stichwort, z. B. <strong>Erledige Aufgabe Milch</strong>.</p>",
      null,
      "tasks"
    ),
    txt(
      ["such in notizen", "notiz finden", "notiz suchen"],
      "<p><strong>Such in Notizen nach …</strong> oder <strong>Oeffne Notiz mit Aufgaben</strong>.</p>",
      null,
      "notes"
    ),
    txt(
      ["such in chats", "chat finden", "alte frage finden"],
      "<p><strong>Oeffne Chat wo ich …</strong> + Stichwort aus deiner Frage.</p>",
      null,
      "chat"
    ),
    txt(
      ["pay aufladen", "geld hinzufuegen demo", "plus guthaben"],
      "<p>Demo: <strong>Pay +10 EUR</strong>. Befehl: <strong>Zeig Guthaben</strong>.</p>",
      (h) => () => {
        h.addPayBalance?.(10);
        h.openPay?.();
      },
      "pay"
    ),
    txt(
      ["was kostet exclusive", "preis premium", "abo kosten"],
      "<p><strong>Exclusive</strong> ist Demo-Paket im Projekt — oeffne <strong>Exclusive</strong> fuer Details.</p>",
      (h) => () => h.openExclusive?.(),
      "exclusive"
    ),
    txt(
      ["unbegrenzte nachrichten", "ai limit umgehen", "mehr ki nachrichten"],
      "<p>Kostenlos: 20/Tag. <strong>Exclusive</strong> = unbegrenzte NOCO AI.</p>",
      (h) => () => h.openExclusive?.(),
      "exclusive"
    ),
    txt(
      ["was ist widget pack ai", "ki widgets home", "ai widget pack"],
      "<p>Setzt Home-Widgets mit NOCO-AI-Fokus. Befehl: <strong>Widget Pack AI</strong>.</p>",
      (h) => () => h.setHomeWidgetPack?.("ai"),
      "widgets"
    ),
    txt(
      ["standard widgets", "widgets zuruecksetzen", "default widgets"],
      "<p>Befehl: <strong>Standard Widgets</strong>.</p>",
      (h) => () => h.resetHomeWidgets?.(),
      "widgets"
    ),
    txt(
      ["welche widgets habe ich", "meine home widgets", "widget liste"],
      "<p>Befehl: <strong>Liste Home Widgets</strong>.</p>",
      null,
      "widgets"
    ),
    txt(
      ["helligkeit erhoehen", "bildschirm heller", "display aufhellen", "kannst du heller machen", "mach es heller", "wird es heller"],
      "✓",
      (h) => () => h.adjustUiBrightness?.("up"),
      "ui",
      true
    ),
    txt(
      ["helligkeit senken", "bildschirm dunkler machen", "display abdunkeln", "kannst du dunkler machen", "zu hell"],
      "✓",
      (h) => () => h.adjustUiBrightness?.("down"),
      "ui",
      true
    ),
    txt(
      ["wo finde ich die helligkeit", "wo stelle ich helligkeit ein", "wo ist die helligkeit", "wie andert man die helligkeit"],
      "<p><strong>Core</strong> → Deck · UI-Helligkeit. Oder sag <strong>«Heller»</strong> / <strong>«Dunkler»</strong> — ich stelle es sofort ein.</p>",
      null,
      "ui"
    ),
    txt(
      ["auto lock ausschalten", "automatische sperre aus", "kein auto lock"],
      "<p>Befehl: <strong>Auto-Lock aus</strong> (in Core pruefen).</p>",
      (h) => () => h.setSettingToggle?.("autoLock", false),
      "settings"
    ),
    txt(
      ["auto lock einschalten", "automatische sperre an"],
      "<p>Befehl: <strong>Auto-Lock an</strong>.</p>",
      (h) => () => h.setSettingToggle?.("autoLock", true),
      "settings"
    ),
    txt(
      ["passkey face id", "biometrie sperre", "face id einrichten"],
      "<p>In <strong>ShieldGate</strong> / Core — Passkey & Code. «Oeffne Security».</p>",
      (h) => () => h.openSecurity?.(),
      "security"
    ),
    txt(
      ["code lock 4 stellen", "pin setzen", "sperrcode einrichten"],
      "<p><strong>ShieldGate</strong> → Code aktivieren. «Oeffne Security».</p>",
      (h) => () => h.openSecurity?.(),
      "security"
    ),
    txt(
      ["backup machen", "daten exportieren", "keycard erstellen"],
      "<p><strong>Sync</strong> = Keycard Export/Import. «Oeffne Sync».</p>",
      (h) => () => h.openSync?.(),
      "sync"
    ),
    txt(
      ["daten importieren", "backup wiederherstellen", "keycard import"],
      "<p>«Oeffne Sync» → Import. Achtung: ueberschreibt lokale Daten.</p>",
      (h) => () => h.openSync?.(),
      "sync"
    ),
    txt(
      ["was ist keep apps alive", "apps offen lassen", "app zustand speichern"],
      "<p>In <strong>Core</strong>: Apps bleiben im Speicher beim Wechseln — schneller, etwas mehr RAM.</p>",
      null,
      "settings"
    ),
    txt(
      ["live wallpaper", "bewegter hintergrund", "animierter hintergrund"],
      "<p>Core → Deck: <strong>Live Wallpaper</strong> + Motion. «Mehr Liquid Glass».</p>",
      null,
      "settings"
    ),
    txt(
      ["compact tiles", "kleine kacheln", "kompakte apps"],
      "<p>Einstellung in Core fuer kleinere App-Kacheln in der Bibliothek.</p>",
      (h) => () => h.openApp?.("settings"),
      "settings"
    ),
    txt(
      ["native feel", "ios feeling", "haptik einstellung"],
      "<p><strong>Native Feel</strong> in Core — staerkere Mobile-Optik & Haptik.</p>",
      null,
      "settings"
    ),
    txt(
      ["was ist noco beam vs ai", "unterschied beam und ki", "beam oder ai"],
      "<p><strong>Beam</strong> = Suche · <strong>NOCO AI</strong> = Assistent mit FAQ & Aktionen.</p>",
      null,
      "help"
    ),
    txt(
      ["was ist forge vs core", "unterschied forge core"],
      "<p><strong>Core</strong> = System-Apps · <strong>Forge</strong> = zusaetzliche Mini-Apps laden.</p>",
      null,
      "help"
    ),
    txt(
      ["was ist home vs apps seite", "unterschied home apps"],
      "<p><strong>Home</strong> = Widgets · <strong>Apps</strong> = Bibliothek mit Tabs.</p>",
      null,
      "help"
    ),
    txt(
      ["swipe gesten", "wischen hilfe", "gesten steuerung"],
      "<p>Horizontal: Home ↔ Apps. App schliessen: <strong>×</strong> oder Island. Lock: <strong>Entsperren</strong> tippen.</p>",
      null,
      "nav"
    ),
    txt(
      ["island menu", "insel menu", "was ist im island menu"],
      "<p>Home, Apps, Beam, Hub, Edit — per Tipp auf die Island.</p>",
      null,
      "island"
    ),
    txt(
      ["uhr gross", "grosse uhr widget", "clock widget"],
      "<p>Standard auf Home im Bento. Per Edit-Modus Widgets anpassen.</p>",
      null,
      "widgets"
    ),
    txt(
      ["akku widget", "batterie anzeige", "akku labor"],
      "<p>Widget <strong>Akku Labor</strong> — im Widget-Panel hinzufuegen.</p>",
      (h) => () => h.openWidgetPanel?.(),
      "widgets"
    ),
    txt(
      ["wetter widget", "wetter auf home"],
      "<p>Wetter-Widget + App «Oeffne Wetter» — Demo-Wetter offline.</p>",
      (h) => () => h.openApp?.("weather"),
      "weather"
    ),
    txt(
      ["0 euro guthaben", "kein geld pay", "leeres wallet"],
      "<p>Pay ist Demo — «Pay +10 EUR» zum Testen. «Zeig Guthaben».</p>",
      null,
      "pay"
    ),
    txt(
      ["arcade alle spiele", "welche spiele gibt es", "spiele liste"],
      "<p>Tab <strong>Spiele</strong> + Forge: Runner, Dodge, Memory Grid, Tap Dash, Color Catch, …</p>",
      (h) => () => {
        h.goToPage?.(1);
        window.setTimeout(() => h.openLibraryTab?.("games"), 300);
      },
      "games"
    ),
    txt(
      ["bester tipp produktiv", "produktivitaet tipp", "fokus tipp"],
      "<p><strong>Fokus Modus</strong> + Tasks + «Was steht an?» morgens.</p>",
      null,
      "coach"
    ),
    txt(
      ["tagesplan erstellen", "plan fuer heute", "heute planen"],
      "<p>Befehl: <strong>Tagesplan</strong> oder <strong>Coach</strong>.</p>",
      null,
      "coach"
    ),
    txt(
      ["was soll ich jetzt tun", "naechster schritt", "coach frage"],
      "<p>Befehl: <strong>Was soll ich jetzt tun?</strong></p>",
      null,
      "coach"
    ),
    txt(
      ["gib mir einen tipp", "zufaelliger tipp", "empfehlung"],
      "<p>Befehl: <strong>Gib mir einen Tipp</strong> — ich rotiere Vorschlaege.</p>",
      null,
      "coach"
    ),
    txt(
      ["witz erzaehlen", "lustige antwort", "humor modus"],
      "<p>Befehl: <strong>Witz</strong> — mehrere Antworten.</p>",
      null,
      "fun"
    ),
    txt(
      ["erzaehl eine geschichte", "story erzaehlen", "erzaehl was"],
      "<p>Befehl: <strong>Erzaehl was</strong> — kurze NOCO-Stories.</p>",
      null,
      "fun"
    ),
    txt(
      ["wer hat noco gebaut", "wer macht noco os", "entwickler noco"],
      "<p><strong>NOCO OS Mobile</strong> ist ein Demo-/Starter-UI-Projekt — offline PWA mit Forge-Apps.</p>",
      null,
      "meta"
    ),
    txt(
      ["funktioniert auf pc", "desktop browser", "am computer nutzen"],
      "<p>Ja als <strong>Vorschau</strong> im Phone-Frame — optimiert fuer echtes Handy.</p>",
      null,
      "meta"
    ),
    txt(
      ["funktioniert auf iphone", "safari pwa", "homescreen ios"],
      "<p>Ja — «Zum Home-Bildschirm» in Safari. Mikro/Sprache: iOS-Browser noetig.</p>",
      null,
      "meta"
    ),
    txt(
      ["funktioniert auf android", "chrome android"],
      "<p>Ja — Chrome PWA + Sprache oft gut unterstuetzt.</p>",
      null,
      "meta"
    ),
    txt(
      ["seite neu laden", "app haengt", "freeze hilfe"],
      "<p>Hard-Reload oder <strong>Cache leeren</strong> (?fresh=1). App schliessen & neu oeffnen.</p>",
      null,
      "help"
    ),
    txt(
      ["alte version angezeigt", "update fehlt", "build alt"],
      "<p>Build-Nummer unten pruefen. Link <strong>Cache leeren</strong> oder ?fresh=1.</p>",
      null,
      "help"
    ),
    txt(
      ["service worker", "offline cache", "pwa cache"],
      "<p>SW cached Dateien fuer Offline. Bei Problemen: Cache leeren.</p>",
      null,
      "help"
    ),
    txt(
      ["styles fehlen", "css kaputt", "layout kaputt"],
      "<p>Alle CSS mit ?v=Build laden. Cache leeren & Build pruefen.</p>",
      null,
      "help"
    ),
    txt(
      ["sprache geht nicht", "mikro funktioniert nicht", "wake word klappt nicht"],
      "<p>Mikro im Browser erlauben, HTTPS/localhost nutzen. «Sprachmodus an» + «Hoeren».</p>",
      null,
      "voice"
    ),
    txt(
      ["noco ai hoeren aus", "sprache ausschalten", "mikro aus"],
      "<p>Befehl: <strong>Sprachmodus aus</strong> oder Toggle <strong>Hoeren</strong>.</p>",
      (h) => () => global.NocoAIVoice?.setWakeEnabled?.(false),
      "voice"
    ),
    txt(
      ["nur island sichtbar", "kein titel in app", "app modus leiste"],
      "<p><strong>App-Modus</strong>: Island + Inline Home/Apps — bewusst minimal.</p>",
      null,
      "ui"
    ),
    txt(
      ["bearbeitungsmodus apps", "schnellzugriff bearbeiten", "apps sortieren"],
      "<p>Apps-Seite → Island → <strong>Edit</strong> → Stift.</p>",
      (h) => () => {
        h.goToPage?.(1);
        window.setTimeout(() => h.enableEditMode?.(), 250);
      },
      "edit"
    ),
    txt(
      ["bearbeitungsmodus beenden", "edit aus", "fertig bearbeiten"],
      "<p>Befehl: <strong>Bearbeitungsmodus beenden</strong> oder Edit nochmal tippen.</p>",
      (h) => () => h.disableEditMode?.(),
      "edit"
    ),
    txt(
      ["system status", "status report", "geraete status ki"],
      "<p>Befehl: <strong>System Status</strong> — Theme, Widgets, Apps, Chats.</p>",
      null,
      "status"
    ),
    txt(
      ["liste apps", "alle apps anzeigen", "installierte apps"],
      "<p>Befehl: <strong>Liste Apps</strong>.</p>",
      null,
      "status"
    ),
    txt(
      ["wo bin ich", "aktuelle position", "bin ich in einer app"],
      "<p>Befehl: <strong>Wo bin ich?</strong></p>",
      null,
      "status"
    ),
    txt(
      ["theme aurora", "aurora theme", "standard theme"],
      "<p>Setzt helles Standard-Theme. Befehl: <strong>Theme Aurora</strong>.</p>",
      (h) => () => h.setTheme?.("aurora"),
      "themes"
    ),
    txt(
      ["theme midnight", "midnight theme", "dunkles theme"],
      "<p>Befehl: <strong>Theme Midnight</strong>.</p>",
      (h) => () => h.setTheme?.("midnight"),
      "themes"
    ),
    txt(
      ["theme sunset", "sunset theme", "warmes theme"],
      "<p>Befehl: <strong>Theme Sunset</strong>.</p>",
      (h) => () => h.setTheme?.("sunset"),
      "themes"
    ),
    txt(
      ["theme forest", "forest theme", "gruenes theme"],
      "<p>Befehl: <strong>Theme Forest</strong>.</p>",
      (h) => () => h.setTheme?.("forest"),
      "themes"
    ),
    txt(
      ["deinstalliere app", "app entfernen", "app loeschen forge"],
      "<p>Sag <strong>Deinstalliere</strong> + Name, z. B. <strong>Deinstalliere Sketch</strong>.</p>",
      null,
      "forge"
    ),
    txt(
      ["installiere dodge", "hol dodge run", "dodge installieren"],
      "<p>Befehl: <strong>Installiere Dodge Run</strong>.</p>",
      (h) => () => h.installForgeApp?.("dodgerun"),
      "forge"
    ),
    txt(
      ["installiere runner", "runner holen"],
      "<p>Befehl: <strong>Installiere Runner</strong>.</p>",
      (h) => () => h.installForgeApp?.("runner"),
      "forge"
    ),
    txt(
      ["oeffne spiele ordner", "spiele tab", "games bibliothek"],
      "<p>Befehl: <strong>Spiele Bibliothek</strong> oder Tab Spiele.</p>",
      (h) => () => {
        h.goToPage?.(1);
        window.setTimeout(() => h.openLibraryTab?.("games"), 300);
      },
      "games"
    ),
    txt(
      ["oeffne forge tab", "forge bibliothek tab"],
      "<p>Befehl: <strong>Forge Bibliothek</strong>.</p>",
      (h) => () => {
        h.goToPage?.(1);
        window.setTimeout(() => h.openLibraryTab?.("forge"), 300);
      },
      "forge"
    ),
    txt(
      ["oeffne core tab", "core bibliothek tab"],
      "<p>Befehl: <strong>Core Bibliothek</strong>.</p>",
      (h) => () => {
        h.goToPage?.(1);
        window.setTimeout(() => h.openLibraryTab?.("core"), 300);
      },
      "core"
    ),
    txt(
      ["mach licht an", "lampe an", "taschenlampe an"],
      "<p>Befehl: <strong>Mach Licht an</strong> oder <strong>Oeffne Taschenlampe</strong>.</p>",
      (h) => () => h.openApp?.("flashlight"),
      "flashlight"
    ),
    txt(
      ["3 plus 3", "rechnung beispiel", "mathe beispiel"],
      "<p>Probier: <strong>3 plus 3</strong> oder <strong>15 Prozent von 200</strong>.</p>",
      null,
      "math"
    ),
    txt(
      ["km in meilen", "einheiten umrechnen", "umrechnung"],
      "<p>Sag z. B. <strong>10 km in Meilen</strong> — ich rechne offline.</p>",
      null,
      "math"
    ),
    txt(
      ["such ueberall", "globale suche", "alles durchsuchen"],
      "<p><strong>Such ueberall nach …</strong> + Stichwort (Notizen, Chats).</p>",
      null,
      "search"
    ),
    txt(
      ["neuer ki chat", "chat starten", "gespraech beginnen"],
      "<p>Befehl: <strong>Neuer Chat</strong>.</p>",
      (h) => () => h.startNewChat?.({}),
      "chat"
    ),
    txt(
      ["hilfe befehle", "command list", "befehls hilfe"],
      "<p>Befehl: <strong>Hilfe</strong> — volle Liste.</p>",
      null,
      "help"
    ),
    txt(
      ["was ist neu 1.2", "changelog 1.2", "neue features"],
      "<p>Befehl: <strong>Was ist neu in 1.2?</strong></p>",
      null,
      "version"
    ),
    txt(
      ["smart 3", "faq bank", "wissen 4"],
      "<p><strong>FAQ Bank 100+</strong> — frag «FAQ Liste» oder stell einfache Fragen zu Apps & System.</p>",
      null,
      "meta"
    ),
    how(
      ["was steht an", "inbox", "mein ueberblick", "was ist offen"],
      "Zeigt Timer, Memories, offene Tasks und wo du gerade bist.",
      "Was steht an?",
      null,
      "inbox"
    ),
    how(
      ["fokus modus", "pomodoro", "konzentration starten"],
      "Startet einen <strong>25-Minuten-Timer</strong> und oeffnet die Timer-App.",
      "Fokus Modus",
      (h) => () => {
        h.applyTimerMinutes?.(25);
        h.startTimerCountdown?.();
        h.openApp?.("timer");
      },
      "focus"
    ),
    how(
      ["erinnere mich", "memory setzen", "erinnerung in minuten"],
      "Z. B. <strong>Erinnere mich in 20 Minuten, Tee</strong> — legt eine Memory an und oeffnet die App.",
      "Erinnere mich in 15 Minuten, Pause",
      null,
      "memory"
    ),
    how(
      ["erledige aufgabe", "task erledigen", "aufgabe abhaken"],
      "Sag <strong>Erledige Aufgabe</strong> + Stichwort aus deiner Tasks-Liste.",
      "Erledige Aufgabe Milch",
      null,
      "tasks"
    ),
    how(
      ["such in notizen", "suche in chats", "finde notiz"],
      "<strong>Such in Notizen nach …</strong> durchsucht Notizen und AI-Chats — erstes Ergebnis per «Ja» oeffnen.",
      "Such in Notizen nach Aufgaben",
      null,
      "search"
    ),
    how(
      ["performance tipp", "weniger lag", "warum langsam"],
      "Analysiert Glas, Wallpaper und Motion — bietet <strong>Performance-Modus</strong> an.",
      "Performance Tipp",
      null,
      "perf"
    ),
    how(
      ["tagesbriefing", "guten morgen briefing", "morgen report"],
      "Begruessung + live <strong>Inbox</strong> (Timer, Memory, Tasks).",
      "Tagesbriefing",
      null,
      "briefing"
    ),
    how(
      ["merke dir", "schnell notieren", "gedanke speichern"],
      "Legt eine <strong>Notiz</strong> an — mit «Aufgabe» im Text auch ein Task.",
      "Merke dir Einkaufsliste Milch",
      null,
      "capture"
    ),
    how(
      ["arbeitsmodus", "work mode", "konzentration arbeit"],
      "Midnight-Theme + 25-Min-Fokus-Timer + Home.",
      "Arbeitsmodus",
      (h) => () => {
        const res = global.NocoAISystem?.processCommand?.("arbeitsmodus", h);
        if (res?.run) res.run();
      },
      "scene"
    ),
    how(
      ["chillmodus", "entspann modus", "relax"],
      "Sunset-Theme, ruhiger Look — optional Breath-App.",
      "Chillmodus",
      null,
      "scene"
    ),
    how(
      ["ueberrasch mich", "zufalls app", "surprise"],
      "Oeffnet eine zufaellige installierte Mini-App oder Forge-Hit.",
      "Ueberrasch mich",
      (h) => () => {
        const res = global.NocoAISystem?.processCommand?.("ueberrasch mich", h);
        if (res?.run) res.run();
      },
      "fun"
    ),
    how(
      ["beam suche nach", "spotlight suche"],
      "Oeffnet <strong>NOCO Beam</strong> mit vorausgefuellter Suche.",
      "Beam suche nach Timer",
      null,
      "beam"
    ),
    how(
      ["ich heisse", "mein name ist", "nenn mich", "my name is"],
      "Speichert deinen <strong>Nickname</strong> — danach: «Hey Noah» statt generischem «Hilfe».",
      "Ich heisse Noah",
      null,
      "nickname"
    ),
    how(
      ["wie heisse ich", "kennst du mich", "wer bin ich"],
      "Zeigt deinen gespeicherten Nickname (nur wenn gesetzt).",
      "Wie heisse ich?",
      null,
      "nickname"
    ),
    how(
      ["letzte app", "vorherige app"],
      "Oeffnet die zuletzt gestartete App in dieser Session.",
      "Letzte App oeffnen",
      null,
      "lastapp"
    ),
    how(
      ["system tour", "os tour"],
      "Hub → Home → Apps mit Toasts.",
      "System Tour",
      null,
      "tour"
    ),
    how(
      ["meeting vorbereitung", "meeting prep"],
      "Notiz + 15-Min-Timer + Notizen-App.",
      "Meeting Vorbereitung Team",
      null,
      "meeting"
    )
  ];

  /** Jeder Eintrag bekommt keys aus erstem how/open/txt-Aufruf — bereits in keys gesetzt */

  const CATALOG = [
    { title: "Apps oeffnen", samples: ["Oeffne Forge", "Oeffne Themes", "Oeffne Timer"] },
    { title: "Erstellen", samples: ["Erstelle Notiz", "Erstelle Aufgabe", "Starte Timer 10 Minuten"] },
    { title: "Design", samples: ["Theme Midnight", "Mehr Liquid Glass", "Heller"] },
    { title: "Navigation", samples: ["Gehe zu Home", "Gehe zu Apps", "Wo bin ich?"] },
    { title: "Widgets", samples: ["Widget Pack AI", "Liste Home Widgets"] },
    { title: "Sprache", samples: ["Sprachmodus an", "Witz", "FAQ Liste"] },
    { title: "System & Inbox", samples: ["Tagesbriefing", "Was steht an?", "Arbeitsmodus", "Ueberrasch mich", "Merke dir …"] },
    { title: "Nachfragen", samples: ["und der Timer?", "und Aufgaben?", "nochmal Inbox"] }
  ];

  function buildCatalogHtml() {
    const blocks = CATALOG.map(
      (c) =>
        `<li><strong>${esc(c.title)}</strong><br><small>${c.samples.map((s) => `«${esc(s)}»`).join(" · ")}</small></li>`
    ).join("");
    return `<p><strong>FAQ-Katalog (${ENTRIES.length}+ Antworten)</strong></p><ul>${blocks}</ul><p><small>Stell eine Frage wie «Wie oeffne ich Forge?» — oft mit direktem Ausfuehren.</small></p>`;
  }

  function getSuggestionSamples(limit = 24) {
    const pool = [
      "Ich heisse …",
      "Mach ein Foto",
      "Ueberrasch mich",
      "Raeum den Bildschirm auf",
      "Speicher Status als Notiz",
      "Zurueck zur letzten App",
      "Was kann ich Neues?",
      "Letzte App oeffnen",
      "System Tour",
      "Tagesbriefing",
      "Was steht an?",
      "Arbeitsmodus",
      "Merke dir Idee",
      "System Status",
      "Fokus Modus",
      "Erinnere mich in 15 Minuten, Pause",
      "Erledige Aufgabe",
      "Such in Notizen nach",
      "Wo bin ich?",
      "Performance Tipp",
      "Wie oeffne ich Forge?",
      "Erstelle Notiz mit Titel Ideen",
      "Theme Midnight",
      "FAQ Liste",
      "Liste Erinnerungen",
      "Sprachmodus an",
      "Oeffne Beam",
      "Witz",
      "Gib mir einen Tipp"
    ];
    return pool.slice(0, limit);
  }

  global.NocoAIFaqBank = {
    ENTRIES,
    buildCatalogHtml,
    getSuggestionSamples,
    COUNT: ENTRIES.length
  };
})(typeof window !== "undefined" ? window : globalThis);
