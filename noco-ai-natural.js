/**
 * NOCO AI — natuerliche Sprache: Einstellungen, Helligkeit, Theme/Hintergrund (ohne Steifheit)
 */
(function initNocoAINatural(global) {
  const THEMES = ["aurora", "midnight", "sunset", "forest"];

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

  const OFFER = "<p><small>Sag <strong>Ja</strong>, wenn ich es direkt machen soll.</small></p>";

  function snap(helpers) {
    return helpers.getSystemSnapshot?.() || {};
  }

  function resolveTheme(q) {
    return THEMES.find((t) => q === t || q.includes(t)) || null;
  }

  function isSettingsRelated(q, raw) {
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return false;
    if (global.NocoAITime?.isTimerStartCommand?.(raw, q)) return false;
    return (
      /\b(einstellung|einstellungen|setting|settings|core|theme|design|look|farbe|stimmung|auto.?lock|glas|glass|widget|code|pin|passkey|schutz|sicherheit|exclusive|pay|guthaben|hintergrund|wallpaper|hintergrundbild|animation|motion|sperre|bildschirm|helligkeit|brightness|hell|dunkel|dunkler|heller|blur|glow|display|ui)\b/.test(
        q
      ) || THEMES.some((t) => q === t || q === `theme ${t}`)
    );
  }

  function isSettingsQuestion(q, raw) {
    const asks =
      /\b(wie|kann ich|kann man|wo|wohin|was muss|hilf|hilfe|erklaer|erklar|stell|setz|ander|aendern|aktivier|deaktivier|einschalten|ausschalten|benutz|nutze|finde ich|gibt es|was ist|was bedeutet)\b/.test(
        q
      );
    const implicit =
      /\b(auto.?lock|theme|design|glas|widget|code.?lock|passkey|helligkeit|brightness|wallpaper|hintergrund).{0,20}(einstell|ander|aktivier|an|aus)\b/.test(
        q
      ) || /\b(einstell|setting).{0,20}(auto.?lock|theme|glas|widget|code|helligkeit|hintergrund)\b/.test(q);
    return isSettingsRelated(q, raw) && (asks || implicit);
  }

  function trySettingsCommand(q, raw, helpers) {
    if (!isSettingsRelated(q, raw)) return null;

    const theme = resolveTheme(q);
    if (theme && (/\b(stell|setz|wechsel|mach|auf|will|moechte|mochte|theme|design|look)\b/.test(q) || q === theme)) {
      return {
        type: "action",
        text: `Theme <strong>${theme}</strong> — der animierte Hintergrund nutzt die gleichen Farben …`,
        run: () => helpers.setTheme?.(theme, { syncWallpaper: true }),
        rememberTopic: "settings"
      };
    }

    if (/\b(heller|hell machen|aufhellen|more bright|brightness up)\b/.test(q) && !/\b(nicht|kein|weniger)\b/.test(q)) {
      return {
        type: "action",
        text: "Alles klar — ich mache das UI <strong>heller</strong> (Glas + Display-Helligkeit im System) …",
        run: () => helpers.adjustUiBrightness?.("up"),
        rememberTopic: "settings"
      };
    }

    if (/\b(dunkler|dunkel machen|abdunkeln|dimmer|brightness down|weniger hell)\b/.test(q)) {
      return {
        type: "action",
        text: "Okay — UI wird <strong>dunkler</strong> …",
        run: () => helpers.adjustUiBrightness?.("down"),
        rememberTopic: "settings"
      };
    }

    if (/\b(live\s*wallpaper|animierter hintergrund|bewegter hintergrund|hintergrund an)\b/.test(q) && !/\b(aus|off)\b/.test(q)) {
      return {
        type: "action",
        text: "Schalte <strong>Live Wallpaper</strong> ein — Hintergrund reagiert auf dein Theme …",
        run: () => helpers.setSettingToggle?.("liveWallpaper", true),
        rememberTopic: "settings"
      };
    }

    if (/\b(hintergrund|wallpaper|live wallpaper).{0,12}(aus|off|statisch|still)\b/.test(q)) {
      return {
        type: "action",
        text: "Hintergrund-Animation <strong>aus</strong> …",
        run: () => helpers.setSettingToggle?.("liveWallpaper", false),
        rememberTopic: "settings"
      };
    }

    if (/\b(mehr|starker|max)\b/.test(q) && /\b(glas|glass|liquid)\b/.test(q)) {
      return {
        type: "action",
        text: "Aktiviere <strong>max Liquid Glass</strong> …",
        run: () => helpers.enableGlassMode?.(),
        rememberTopic: "settings"
      };
    }

    return null;
  }

  function tryCasualSettings(q, raw, helpers) {
    if (!isSettingsRelated(q, raw)) return null;
    if (isSettingsQuestion(q, raw)) return null;
    if (trySettingsCommand(q, raw, helpers)) return null;

    const s = snap(helpers);
    const pct = Math.round((Number(s.uiBrightness) || 1) * 100);

    if (/\b(helligkeit|brightness|display|bildschirm hell)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Helligkeit</strong> — verstanden.</p>
          <p>Die echte iPhone-Lampe steuert iOS. Ich passe dein <strong>NOCO-UI</strong> an:</p>
          <ul>
            <li>UI-Helligkeit jetzt: <strong>${pct}%</strong></li>
            <li>Liquid Glass: <strong>${s.glassBoost ? "an" : "aus"}</strong></li>
            <li>Theme <strong>${escapeHtml(s.theme)}</strong> (Farben + Hintergrund)</li>
          </ul>
          <p>Sag einfach <strong>«Heller»</strong>, <strong>«Dunkler»</strong> oder <strong>«Theme Midnight»</strong>.</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck" }),
        offerLabel: "Core NocoDeck",
        rememberTopic: "settings"
      };
    }

    if (/\b(hintergrund|wallpaper|hintergrundbild|background|bildschirm hintergrund)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Hintergrund</strong> haengt mit deinem <strong>Theme</strong> zusammen (${escapeHtml(s.theme)}).</p>
          <ul>
            <li><strong>Live Wallpaper</strong>: ${s.liveWallpaper ? "<strong>an</strong> — sanfte Animation" : "<strong>aus</strong> — statisch"}</li>
            <li>Beim Theme-Wechsel passen sich Farben & Glow automatisch an.</li>
          </ul>
          <p>Beispiele: «Theme Sunset», «Live Wallpaper an», «Heller».</p>${OFFER}`,
        offerRun: () => {
          helpers.setSettingToggle?.("liveWallpaper", true);
          helpers.navigateCore?.({ section: "deck" });
        },
        offerLabel: "Wallpaper + Core",
        rememberTopic: "settings"
      };
    }

    if (/\b(glas|glass|liquid|blur|glow)\b/.test(q) && q.length < 40) {
      return {
        type: "text",
        text: `<p><strong>Liquid Glass</strong> ist ${s.glassBoost ? "<strong>aktiv</strong>" : "<strong>aus</strong>"}.</p>
          <p>Sag <strong>«Mehr Liquid Glass»</strong>, <strong>«Glas aus»</strong> oder öffne Core.</p>${OFFER}`,
        offerRun: () => helpers.enableGlassMode?.(),
        offerLabel: "Glas-Boost an",
        rememberTopic: "settings"
      };
    }

    const theme = resolveTheme(q);
    if (theme && q.length < 24) {
      return {
        type: "action",
        text: `Theme <strong>${theme}</strong> — Hintergrund & Farben werden angepasst …`,
        run: () => helpers.setTheme?.(theme, { syncWallpaper: true }),
        rememberTopic: "settings"
      };
    }

    if (/\b(theme|design|look|farbe|stimmung)\b/.test(q) && q.length < 36) {
      return {
        type: "text",
        text: `<p><strong>Theme</strong> gerade: <strong>${escapeHtml(s.theme)}</strong> · Live Wallpaper <strong>${s.liveWallpaper ? "an" : "aus"}</strong>.</p>
          <p>Probiere: Aurora, Midnight, Sunset, Forest — z. B. «Theme Forest».</p>${OFFER}`,
        offerRun: () => helpers.openThemes?.(),
        offerLabel: "Themes oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(einstellung|einstellungen|settings|core)\b/.test(q) && q.length < 32) {
      return {
        type: "text",
        text: `<p><strong>Einstellungen</strong> — kurz:</p>
          <ul>
            <li><strong>Core</strong>: Theme, Glas, Wallpaper, Lock, Motion</li>
            <li><strong>Themes</strong>: Farb-Pakete</li>
            <li><strong>ShieldGate</strong>: Code & Schutz</li>
          </ul>
          <p>Frag konkret: Helligkeit, Hintergrund, Auto-Lock, Widgets …</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck" }),
        offerLabel: "Core oeffnen",
        rememberTopic: "settings"
      };
    }

    return null;
  }

  function trySettingsExplain(q, raw, helpers) {
    if (!isSettingsQuestion(q, raw)) return null;
    const s = snap(helpers);

    if (/\b(auto.?lock|autolog|sperre automatisch|sperrt sich)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Auto-Lock</strong> ${s.autoLock ? "ist <strong>an</strong>" : "ist <strong>aus</strong>"}${s.autoLock ? ` (${s.autoLockSeconds || 60} Sek.)` : ""}.</p>
          <p>In <strong>Core → Lock</strong> oder: «Auto-Lock 1 Minute» / «Auto-Lock aus».</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "lock", highlight: "lock-time" }),
        offerLabel: "Core Lock",
        rememberTopic: "settings"
      };
    }

    if (/\b(helligkeit|brightness|hell|dunkel)\b/.test(q)) {
      return tryCasualSettings(q, raw, helpers) || {
        type: "text",
        text: `<p>So gehts: Sag <strong>«Heller»</strong> / <strong>«Dunkler»</strong> — oder in <strong>Core → NocoDeck</strong> den Glass-Schalter.</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck" }),
        offerLabel: "Core oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(hintergrund|wallpaper|hintergrundbild)\b/.test(q)) {
      return tryCasualSettings(q, raw, helpers);
    }

    if (/\b(theme|design|look|farbe|stimmung|aurora|midnight|sunset|forest)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Theme & Hintergrund</strong>: App <strong>Themes</strong> oder «Theme Midnight».</p>
          <p>Der <strong>Live-Hintergrund</strong> nutzt die Theme-Farben automatisch.</p>
          <p>Aktuell: <strong>${escapeHtml(s.theme)}</strong>.</p>${OFFER}`,
        offerRun: () => helpers.openThemes?.(),
        offerLabel: "Themes",
        rememberTopic: "settings"
      };
    }

    if (/\b(liquid\s*glass|glas|glass|blur|boost|live)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Liquid Glass</strong> & <strong>Live Wallpaper</strong> in Core → NocoDeck.</p>
          <p>Kurz: «Mehr Liquid Glass» oder «Live Wallpaper an».</p>${OFFER}`,
        offerRun: () => helpers.enableGlassMode?.(),
        offerLabel: "Glas an",
        rememberTopic: "settings"
      };
    }

    if (/\b(widget|widgets|home|startbildschirm|bento)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Widgets</strong>: Home → Island <strong>Edit</strong> → <strong>+</strong>.</p>
          <p>Oder «Widget Pack AI».</p>${OFFER}`,
        offerRun: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.enableEditMode?.();
            window.setTimeout(() => helpers.openWidgetPanel?.(), 280);
          }, 300);
        },
        offerLabel: "Widgets",
        rememberTopic: "settings"
      };
    }

    if (/\b(code|pin|passkey|schutz|sicherheit|shield)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Schutz</strong>: ${s.codeLock ? "Code <strong>an</strong>" : "noch <strong>aus</strong>"}.</p>
          <p>App <strong>ShieldGate</strong>.</p>${OFFER}`,
        offerRun: () => helpers.openSecurity?.(),
        offerLabel: "ShieldGate",
        rememberTopic: "settings"
      };
    }

    if (/\b(exclusive|premium|mitglied|abo|unbegrenzt)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>NOCO Exclusive</strong>: unbegrenzte AI + Glas + Apps.</p>${OFFER}`,
        offerRun: () => helpers.openExclusive?.(),
        offerLabel: "Exclusive",
        rememberTopic: "settings"
      };
    }

    if (/\b(pay|guthaben|wallet|aufladen)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>NOCO Pay</strong> — Demo-Guthaben.</p>${OFFER}`,
        offerRun: () => helpers.openPay?.(),
        offerLabel: "Pay",
        rememberTopic: "settings"
      };
    }

    if (/\b(animation|bewegung|motion)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Animationen</strong> in Core → NocoDeck.</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck", toggle: "motion", value: true }),
        offerLabel: "Core",
        rememberTopic: "settings"
      };
    }

    return {
      type: "text",
      text: `<p>Zu <strong>Einstellungen</strong> kannst du alles in Kurzform sagen:</p>
        <ul>
          <li>«Helligkeit» / «Heller» / «Dunkler»</li>
          <li>«Hintergrund» / «Theme Sunset»</li>
          <li>«Auto-Lock» / «Widgets» / «Code»</li>
        </ul>${OFFER}`,
      offerRun: () => helpers.navigateCore?.({ section: "deck" }),
      offerLabel: "Core",
      rememberTopic: "settings"
    };
  }

  function tryEverydayQuestion(q, raw) {
    if (isSettingsRelated(q, raw)) return null;
    if (/\b(was kann ich|was soll ich|langweilig|idee|tipp)\b/.test(q) && q.length < 80) {
      return {
        type: "text",
        text: `<p>Du kannst locker reden:</p>
          <ul>
            <li>«Helligkeit» · «Heller» · «Theme Midnight»</li>
            <li>«Erstelle Notiz» · «Was steht an?»</li>
            <li>«Oeffne Timer»</li>
          </ul>`,
        rememberTopic: "help"
      };
    }
    if (/\b(verstanden|kapier|nicht verstanden|was meinst|hae)\b/.test(q) && q.length < 60) {
      return {
        type: "text",
        text: "<p>Kein Problem — ein Wort reicht oft: «Helligkeit», «Hintergrund», «Theme Forest», «Auto-Lock».</p>",
        rememberTopic: "help"
      };
    }
    return null;
  }

  function softenFallback(text) {
    return text
      .replace(/Ultra-Modus/gi, "Kurz gesagt")
      .replace(/Ultra-Tipp/gi, "Vorschlag")
      .replace(/Intelligence Briefing/gi, "Dein Ueberblick")
      .replace(/NOCO AI Ultra/gi, "NOCO AI")
      .replace(/\bBriefing\b/gi, "Was steht an?");
  }

  function tryDeviceCommand(q, raw, helpers) {
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return null;
    const device =
      /\b(kamera|camera|geraet|gerate|iphone|taschenlampe|torch|flashlight|wake\s*lock|display\s*wach)\b/.test(q);
    if (!device) return null;
    if (/\b(taschenlampe|torch|flashlight|licht\s*an|lampe\s*an)\b/.test(q) && /\b(an|ein|start)\b/.test(q)) {
      return {
        type: "action",
        text: "Versuche die <strong>Taschenlampe</strong> (LED oder NOCO-Licht) …",
        run: () => helpers.openDevice?.(),
        rememberTopic: "device"
      };
    }
    return {
      type: "action",
      text: "Öffne <strong>Geräte</strong> — Kamera, Taschenlampe und Passkey …",
      run: () => helpers.openDevice?.(),
      rememberTopic: "device"
    };
  }

  function process(raw, helpers) {
    const q = norm(raw);
    return (
      trySettingsCommand(q, raw, helpers) ||
      tryDeviceCommand(q, raw, helpers) ||
      tryCasualSettings(q, raw, helpers) ||
      trySettingsExplain(q, raw, helpers) ||
      tryEverydayQuestion(q, raw)
    );
  }

  function isNaturalQuestion(q, raw) {
    return isSettingsRelated(q, raw) || isSettingsQuestion(q, raw);
  }

  global.NocoAINatural = {
    process,
    isSettingsQuestion,
    isSettingsRelated,
    isNaturalQuestion,
    softenFallback
  };
})(typeof window !== "undefined" ? window : globalThis);
