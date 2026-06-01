/**
 * NOCO AI — natuerliche Fragen (Einstellungen, Alltagssprache, ohne Architektur-Begriffe)
 */
(function initNocoAINatural(global) {
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

  const OFFER = "<p><small>Sag <strong>Ja</strong>, wenn ich es direkt fuer dich oeffnen oder einstellen soll.</small></p>";

  function isSettingsQuestion(q, raw) {
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return false;
    if (global.NocoAITime?.isTimerStartCommand?.(raw, q)) return false;
    const about =
      /\b(einstellung|einstellungen|setting|settings|core|noco core|theme|design|look|auto.?lock|autolog|glas|glass|widget|widgets|code|pin|passkey|schutz|sicherheit|exclusive|pay|guthaben|hintergrund|wallpaper|animation|motion|sperre|bildschirm)\b/.test(
        q
      );
    const asks =
      /\b(wie|kann ich|kann man|wo|wohin|was muss|hilf|hilfe|erklaer|erklar|stell|setz|ander|aendern|aktivier|deaktivier|einschalten|ausschalten|benutz|nutze|finde ich|gibt es)\b/.test(
        q
      );
    const implicit =
      /\b(auto.?lock|theme|design|glas|widget|code.?lock|passkey).{0,20}(einstell|ander|aktivier|an|aus)\b/.test(q) ||
      /\b(einstell|setting).{0,20}(auto.?lock|theme|glas|widget|code)\b/.test(q);
    return (about && asks) || implicit;
  }

  function trySettings(q, raw, helpers) {
    if (!isSettingsQuestion(q, raw)) return null;

    if (/\b(auto.?lock|autolog|autolog|sperre automatisch|sperrt sich)\b/.test(q)) {
      const snap = helpers.getSystemSnapshot?.() || {};
      const on = snap.autoLock;
      return {
        type: "text",
        text: `<p><strong>Auto-Lock</strong> ${on ? "ist <strong>an</strong>" : "ist <strong>aus</strong>"}${on ? ` (${snap.autoLockSeconds || 60} Sekunden Inaktivitaet)` : ""}.</p>
          <p>So gehts: <strong>NOCO Core</strong> → Tab <strong>Lock Screen</strong> → Schalter Auto-Lock → Zeit waehlen.</p>
          <p>Oder sag mir: «Auto-Lock 1 Minute» / «Auto-Lock aus».</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "lock", highlight: "lock-time" }),
        offerLabel: "Core Lock oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(theme|design|look|farbe|stimmung|aurora|midnight|sunset|forest|hintergrund)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Theme & Look</strong> aenderst du in <strong>NOCO Core</strong> (Tab NocoDeck) oder in der App <strong>Themes</strong>.</p>
          <p>Beispiele: «Theme Midnight», «Theme Sunset», «Mehr Liquid Glass».</p>${OFFER}`,
        offerRun: () => helpers.openThemes?.(),
        offerLabel: "Themes oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(liquid\s*glass|glas|glass|blur|boost|wallpaper|live)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Liquid Glass</strong> = mehr Blur und Glow auf dem System.</p>
          <p>In <strong>Core → NocoDeck</strong>: Schalter <strong>Glass Boost</strong> und optional <strong>Live Wallpaper</strong>.</p>
          <p>Kurzbefehl: «Mehr Liquid Glass».</p>${OFFER}`,
        offerRun: () => helpers.enableGlassMode?.(),
        offerLabel: "Glas-Boost aktivieren",
        rememberTopic: "settings"
      };
    }

    if (/\b(widget|widgets|home|startbildschirm|bento)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Widgets</strong> legst du auf dem Home fest:</p>
          <ol><li>Zum <strong>Home</strong> wischen</li><li>Island → <strong>Edit</strong></li><li>Unten <strong>+</strong> → Widget waehlen</li></ol>
          <p>Oder: «Widget Pack AI», «Standard Widgets».</p>${OFFER}`,
        offerRun: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.enableEditMode?.();
            window.setTimeout(() => helpers.openWidgetPanel?.(), 280);
          }, 300);
        },
        offerLabel: "Widget-Auswahl",
        rememberTopic: "settings"
      };
    }

    if (/\b(code|pin|passkey|schutz|sicherheit|shield|sperre|entsperren)\b/.test(q)) {
      const snap = helpers.getSystemSnapshot?.() || {};
      return {
        type: "text",
        text: `<p><strong>Schutz</strong>: ${snap.codeLock ? "Code ist <strong>an</strong>" : "noch <strong>aus</strong>"}.</p>
          <p>App <strong>ShieldGate</strong>: Code (4 Ziffern), Passkey, Scan — alles lokal.</p>${OFFER}`,
        offerRun: () => helpers.openSecurity?.(),
        offerLabel: "ShieldGate oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(exclusive|premium|mitglied|abo|unbegrenzt)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>NOCO Exclusive</strong> ist ein Paket: unbegrenzte Chats mit mir, mehr Glas, Extra-Apps.</p>
          <p>Frag: «Lohnt Exclusive?» oder «Oeffne Exclusive».</p>${OFFER}`,
        offerRun: () => helpers.openExclusive?.(),
        offerLabel: "Exclusive oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(pay|guthaben|wallet|aufladen)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>NOCO Pay</strong> ist dein Demo-Guthaben fuer Exclusive & Aufladungen.</p>
          <p>«Zeig Guthaben», «Pay +10 EUR», «Oeffne Pay».</p>${OFFER}`,
        offerRun: () => helpers.openPay?.(),
        offerLabel: "Pay oeffnen",
        rememberTopic: "settings"
      };
    }

    if (/\b(animation|bewegung|motion)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Animationen</strong> in <strong>Core → NocoDeck</strong> — Schalter <strong>Animationen</strong> / Motion.</p>${OFFER}`,
        offerRun: () => helpers.navigateCore?.({ section: "deck", toggle: "motion", value: true }),
        offerLabel: "Core NocoDeck",
        rememberTopic: "settings"
      };
    }

    return {
      type: "text",
      text: `<p><strong>Einstellungen</strong> findest du vor allem in <strong>NOCO Core</strong> (Glas, Lock, Motion) und in <strong>ShieldGate</strong> (Code).</p>
        <p>Apps & Design: <strong>Themes</strong>, <strong>Forge</strong> fuer Zusatz-Apps.</p>
        <p>Was genau? Z. B. «Wie stelle ich Auto-Lock ein?» oder «Wie aendere ich das Theme?»</p>`,
      rememberTopic: "settings"
    };
  }

  function tryEverydayQuestion(q, raw, helpers) {
    if (isSettingsQuestion(q, raw)) return null;
    if (/\b(was kann ich|was soll ich|was mach ich|langweilig|idee|tipp|rat)\b/.test(q) && q.length < 80) {
      return {
        type: "text",
        text: `<p>Kurz und entspannt — du kannst:</p>
          <ul>
            <li>Fragen stellen («Wie stelle ich …?», «Was ist Forge?»)</li>
            <li>Apps oeffnen («Oeffne Timer»)</li>
            <li>Erledigen lassen («Erstelle Notiz», «Starte Timer 5 Minuten»)</li>
            <li>Ueberblick: «Was steht an?» oder «System Status»</li>
          </ul>
          <p>Ich antworte offline und ohne komplizierte Befehle.</p>`,
        rememberTopic: "help"
      };
    }
    if (/\b(verstanden|kapier|nicht verstanden|was meinst|hae)\b/.test(q) && q.length < 60) {
      return {
        type: "text",
        text: "<p>Alles gut — formuliere es einfach wie im Alltag. Ich verstehe auch «stell timer auf 5 min» oder «wie sperr ich das handy».</p>",
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

  function process(raw, helpers) {
    const q = norm(raw);
    return trySettings(q, raw, helpers) || tryEverydayQuestion(q, raw, helpers);
  }

  function isNaturalQuestion(q, raw) {
    if (isSettingsQuestion(q, raw)) return true;
    if (!/\b(was kann ich|was soll ich|was mach ich|langweilig|verstanden|kapier|nicht verstanden|was meinst|hae)\b/.test(q)) return false;
    return String(raw || "").length < 80;
  }

  global.NocoAINatural = {
    process,
    isSettingsQuestion,
    isNaturalQuestion,
    softenFallback
  };
})(typeof window !== "undefined" ? window : globalThis);
