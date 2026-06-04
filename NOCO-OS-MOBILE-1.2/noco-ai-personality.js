/**
 * NOCO AI Personality — Witze, Abwechslung, lockere Antworten
 */
(function initNocoAIPersonality(global) {
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

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const JOKES = [
    "Warum ist NOCO AI nie offline? — Doch, ist es. Und trotzdem antwortet es sofort.",
    "Ich habe kein WLAN — dafuer habe ich alle deine Apps im Kopf. Forge inklusive.",
    "Liquid Glass ist so klar, dass sogar meine Witze durchscheinen.",
    "Was ist der Lieblings-Sport von NOCO OS? — Swipen zwischen Home und Apps.",
    "Ich bin kein ChatGPT — ich bin der Typ, der dir um 3 Uhr nachts den Timer startet.",
    "Zwei Widgets gehen in eine Bar. Eine sagt: «Ich bin zu gross fuer Bento.»",
    "Exclusive fragt: «Bist du Premium?» — Ich: «Ich bin lokal und stolz.»",
    "Beam sucht Apps. NOCO AI sucht Antworten. Zusammen: Party auf dem Home-Screen.",
    "Der Timer und ich haben etwas gemeinsam: Wir zaehlen runter, bis du produktiv wirkst.",
    "Was sagt die Island zum Home-Screen? — «Ich habe alles im Blick.»",
    "Ich kenne alle Themes — Aurora ist mein Morgengrauen, Midnight mein Drama."
  ];

  const STORIES = [
    "Stell dir vor: Du sagst «NOCO AI», und schwups — ich bin da. Kein Laden, kein Server, nur du und dein Phone.",
    "Heute koenntest du eine Notiz anlegen, den Look mit Sunset aendern, und noch einen Mini-Game-Run in Forge — alles offline.",
    "Kleine Geschichte: Einmal hat jemand «Oeffne App» geschrieben. Ich habe nachgefragt — und dann lief alles."
  ];

  const CAPABILITY_INTROS = [
    "Klar — hier ist, was ich fuer dich tun kann:",
    "Gute Frage! Kurz und knapp:",
    "Ich bin dein Offline-Copilot. Das geht bei mir:",
    "Alles lokal, alles schnell. Schau mal:"
  ];

  const REACT_PHRASES = [
    "Alles klar — ich schau mir das an …",
    "Verstanden — einen Moment …",
    "Okay, das mache ich …",
    "Passt — ich kuemmere mich drum …",
    "Roger — offline und direkt …"
  ];

  function isJokeRequest(q) {
    return (
      /\b(witz|witze|lach|lacher|lustig|humor|joke|funny)\b/.test(q) ||
      /^(erzaehl|erzahl)\s+(mir\s+)?(einen\s+)?(witz|was lustiges)/.test(q) ||
      /\b(kannst du).*witz/.test(q)
    );
  }

  function isWhatCanYouDo(q) {
    return (
      /^(was kannst du|was kannst du alles|was machst du|was kann die ki|what can you)/.test(q) ||
      /\b(was kannst du mir|deine faehigkeiten|was kann ich dich fragen)\b/.test(q) ||
      /^was kann ich (hier |bei noco )?fragen/.test(q)
    );
  }

  function isCasualChat(q) {
    return (
      /^(wie geht|wie gehts|was geht|alles klar|na und|und bei dir)/.test(q) ||
      /\b(erzaehl was|erzahl was|sag was|laber|quatsch)\b/.test(q)
    );
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!q) return null;

    if (isJokeRequest(q)) {
      return {
        type: "text",
        text: `<p>${pick(JOKES)}</p><p><small>Noch einer? Schreib <strong>Witz</strong> — ich habe mehrere.</small></p>`,
        rememberTopic: "joke"
      };
    }

    if (isWhatCanYouDo(q)) {
      const cap = global.NocoAIAnswers?.buildCapabilitiesHtml?.(helpers);
      const body = cap || "<p>Apps oeffnen, Fragen, Notizen, Timer, Sprache — alles offline.</p>";
      return {
        type: "text",
        text: `<p>${pick(CAPABILITY_INTROS)}</p>${body}`,
        rememberTopic: "capabilities"
      };
    }

    if (isCasualChat(q) || /\b(erzaehl was|erzahl was|sag was|laber was)\b/.test(q)) {
      if (global.NocoAIProfile?.process?.(raw, raw, helpers)) return null;
      if (/\b(erzaehl|erzahl|sag|laber)\b/.test(q) && !isJokeRequest(q)) {
        return {
          type: "text",
          text: `<p>${pick(STORIES)}</p><p><small>Willst du Action? <strong>System Tour</strong> oder <strong>Witz</strong>.</small></p>`,
          rememberTopic: "story"
        };
      }
      const name = helpers?.getNickname?.() || global.NocoAIProfile?.getNickname?.();
      if (name) return null;
      const replies = [
        "Mir geht's glasig-gut — null Lag. Sag <strong>Ich heisse …</strong> fuer persoenliche Anrede.",
        "Alles smooth. <strong>Was steht an?</strong> zeigt deinen Tag im System.",
        "Bestens! <strong>Meeting Vorbereitung</strong> oder <strong>Theme Zufall</strong> sind neu."
      ];
      return { type: "text", text: `<p>${pick(replies)}</p>`, rememberTopic: "chat" };
    }

    if (/\b(wer bist du|was bist du|bist du echt|bist du ki)\b/.test(q)) {
      return {
        type: "text",
        text: `<p>Ich bin <strong>NOCO AI</strong> — dein lokaler Assistent fuer NOCO OS Mobile. Kein Cloud-Modell, aber viele Befehle, Wissen & Sprache.</p>`,
        rememberTopic: "identity"
      };
    }

    return null;
  }

  function reactionPrefix() {
    return pick(REACT_PHRASES);
  }

  global.NocoAIPersonality = { process, reactionPrefix, pick, isJokeRequest };
})(typeof window !== "undefined" ? window : globalThis);
