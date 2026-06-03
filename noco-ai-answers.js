/**
 * NOCO AI — Direkte Antworten (keine Chip-Menüs bei einfachen Fragen)
 */
(function initNocoAIAnswers(global) {
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

  function isCapabilityQuestion(q) {
    return (
      /^(was kannst du|was kannst du alles|was machst du|was kannst du mir|what can you)(\s|$)/.test(q) ||
      /^wer bist du/.test(q) ||
      /^was bist du/.test(q) ||
      /\b(deine faehigkeiten|was kann die ki)\b/.test(q)
    );
  }

  function isHelpOnly(q) {
    return /^(hilfe|help|\?)$/.test(q);
  }

  function buildCapabilitiesHtml(helpers) {
    const s = helpers.getSystemSnapshot?.() || {};
    return `<p><strong>Das kann ich — offline auf deinem Geraet (Wissen 2.0)</strong></p>
      <ul>
        <li><strong>System-Wissen</strong> — Island, Chrome, Forge, Exclusive, Sprache, Widgets, Spiele, 60+ FAQ</li>
        <li><strong>Sprache</strong> — Sage <strong>«NOCO AI»</strong> · Toggle <strong>Hoeren</strong> · Mikro-Diktat</li>
        <li><strong>Fragen beantworten</strong> — «Was ist Forge?», «Brauche ich Internet?», «Warum ist meine Performance schlecht?»</li>
        <li><strong>Apps & Navigation</strong> — «Oeffne Timer», «Gehe zu Apps», «Wo ist Forge?», «Schliesse App»</li>
        <li><strong>Inbox</strong> — «Was steht an?» (Timer, Memory, Tasks, Ort)</li>
        <li><strong>Erstellen & erledigen</strong> — Notizen, Aufgaben, «Erledige Aufgabe …», Memory in Minuten</li>
        <li><strong>Suche</strong> — «Such in Notizen nach …» in Notizen & AI-Chats</li>
        <li><strong>System</strong> — Fokus Modus, Performance Tipp, Guides mit «Ja»</li>
        <li><strong>Rechnen</strong> — z. B. «3 plus 3» oder «15 Prozent von 80»</li>
      </ul>
      <p><small>Dein Look: Theme <strong>${s.theme || "aurora"}</strong> · Exclusive <strong>${s.exclusiveActive ? "an" : "aus"}</strong>. Frag <strong>Hilfe</strong> fuer alle Befehle.</small></p>`;
  }

  function tryFocusMode(q, raw, helpers) {
    if (/\b(was ist|wie geht|erklar|erklaer|warum)\b/.test(q)) return null;
    if (!/\b(fokus modus|fokusmodus|focus mode|pomodoro start|fokus starten)\b/.test(q)) return null;
    if (q.length > 48) return null;
    return {
      type: "action",
      text: "<p>Starte <strong>Fokus Modus</strong> — 25 Minuten Timer …</p>",
      run: () => {
        if (helpers.applyTimerMinutes) {
          helpers.applyTimerMinutes(25);
          helpers.startTimerCountdown?.();
          helpers.openTimerApp?.();
        } else {
          const res = global.NocoAI?.processMessage?.("Starte Timer 25 Minuten", helpers);
          if (res?.type === "action" && res.run) res.run();
        }
      },
      rememberTopic: "timer"
    };
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!q) return null;

    if (isCapabilityQuestion(q)) {
      return { type: "text", text: buildCapabilitiesHtml(helpers), rememberTopic: "capabilities" };
    }

    if (isHelpOnly(q)) {
      const html = global.NocoAI?.formatHelpHtml?.();
      return html ? { type: "text", text: html, rememberTopic: "help" } : null;
    }

    const focus = tryFocusMode(q, raw, helpers);
    if (focus) return focus;

    return null;
  }

  function shouldSkipIntent(q) {
    return isCapabilityQuestion(q) || isHelpOnly(q) || /^(was kannst|hilfe|fokus modus|fokusmodus)/.test(q);
  }

  global.NocoAIAnswers = {
    process,
    shouldSkipIntent,
    isCapabilityQuestion,
    buildCapabilitiesHtml
  };
})(typeof window !== "undefined" ? window : globalThis);
