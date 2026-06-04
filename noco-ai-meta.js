/**
 * NOCO AI Meta — «Was kann ich?», «Wer bin ich?», «Was magst du?» usw. (frueh & smart)
 */
(function initNocoAIMeta(global) {
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

  function nameLine(helpers) {
    const n = global.NocoAIProfile?.getNickname?.() || helpers?.getSystemSnapshot?.()?.aiNickname || "";
    return n ? global.NocoAIProfile?.heyHtml?.(n) || `Hey <strong>${esc(n)}</strong>` : null;
  }

  function isWhoAmI(q) {
    return (
      /\b(wer bin ich|who am i|wie heisse ich|wie heiße ich|kennst du mich|wie nennst du mich)\b/.test(q) ||
      q === "mein nickname" ||
      q === "mein name"
    );
  }

  function isWhoAreYou(q) {
    return (
      /^(wer bist du|was bist du|who are you|what are you)(\s|$)/.test(q) ||
      /\b(wer bist|was bist du genau|bist du eine ki|bist du echt)\b/.test(q)
    );
  }

  function isWhatCanYouDo(q) {
    return (
      /^(was kannst du|was kannst du alles|was machst du|was kann die ki|what can you)(\s|$)/.test(q) ||
      /\b(was kannst du mir|deine faehigkeiten|was kann ich dich fragen|was weisst du alles)\b/.test(q) ||
      /^was kann ich (hier |bei noco |im system )?fragen/.test(q)
    );
  }

  function isWhatCanIDo(q) {
    return (
      /^(was kann ich|what can i)(\s|$)/.test(q) ||
      /\b(was kann ich tun|was kann ich machen|was kann ich hier|was kann man hier|was geht hier|was gibt es hier)\b/.test(q) ||
      /\b(was kann man|what can we)\b/.test(q) && /\b(tun|machen|hier|noco|system)\b/.test(q)
    );
  }

  function isWhatShouldIDo(q) {
    return (
      /^(was soll ich|what should i)(\s|$)/.test(q) ||
      /\b(was soll ich tun|was soll ich machen|was soll ich jetzt|naechster schritt|next step|coach)\b/.test(q) ||
      /\b(was jetzt|was nun|empfehl mir|empfehle mir)\b/.test(q) && !/\b(theme|farbe)\b/.test(q)
    );
  }

  function isWhatDoYouLike(q) {
    return (
      /\b(was magst du|was gefaellt dir|was liebst du|what do you like|was findest du cool)\b/.test(q) ||
      /\b(magst du mich|magst du noco|liebst du)\b/.test(q) ||
      q === "bist du nett"
    );
  }

  function buildWhoAmI(helpers) {
    const s = helpers?.getSystemSnapshot?.() || {};
    const name = global.NocoAIProfile?.getNickname?.() || s.aiNickname || "";
    if (!name) {
      return {
        type: "text",
        text:
          "<p><strong>Wer bist du?</strong> Das weiss ich erst, wenn du mir einen Namen gibst.</p>" +
          "<p>Sag z. B. <strong>Ich heisse …</strong> — danach antworte ich auf <strong>Wer bin ich?</strong> persoenlich und merke mir den Nickname nur lokal auf deinem Geraet.</p>",
        rememberTopic: "identity"
      };
    }
    const bits = [];
    if (s.currentAppTitle) bits.push(`gerade in <strong>${esc(s.currentAppTitle)}</strong>`);
    else if (s.currentPage) bits.push(`auf <strong>${esc(s.currentPage)}</strong>`);
    if (s.theme) bits.push(`Theme <strong>${esc(s.theme)}</strong>`);
    const ctx = bits.length ? `<p>Status: ${bits.join(" · ")}.</p>` : "";
    return {
      type: "text",
      text:
        `<p>Du bist <strong>${esc(name)}</strong> — so kenne ich dich in NOCO OS.</p>` +
        ctx +
        "<p>Ich speichere das nur offline. Aendern: <strong>Ich heisse …</strong> · Vergessen: <strong>Vergiss meinen Namen</strong>.</p>",
      rememberTopic: "identity"
    };
  }

  function buildWhoAreYou(helpers) {
    const hey = nameLine(helpers);
    const intro = hey
      ? `<p>${hey} — ich bin <strong>NOCO AI</strong>, eine KI in NOCO OS Mobile.</p>`
      : "<p>Ich bin <strong>NOCO AI</strong> — eine KI, aber kein allgemeiner Cloud-Chatbot.</p>";
    return {
      type: "text",
      text:
        intro +
        "<p><strong>Klar gesagt:</strong> Ich bin eine KI, kann aber eher <strong>System-Befehle</strong> und <strong>Smalltalk</strong> als allgemeine Fragen (News, tiefe Recherche, freie Mathe ohne Befehl).</p>" +
        "<p><strong>Stark:</strong> Apps oeffnen, Timer, Notizen, NOCO-FAQ, Witze, Coach. <strong>Schwach:</strong> Weltwissen wie Google.</p>" +
        "<p>Frag: <strong>Was kannst du?</strong> · Sprache: <strong>NOCO AD 1.0</strong> = Aktivierungswort ins Feld · <strong>🎤</strong> = Wort-zu-Text nur bei Klick.</p>",
      rememberTopic: "identity"
    };
  }

  function buildWhatCanYouDo(helpers) {
    const cap = global.NocoAIAnswers?.buildCapabilitiesHtml?.(helpers);
    const body =
      cap ||
      "<p><strong>System:</strong> Apps, Timer, Notizen, Themes, Beam.</p><p><strong>Chat:</strong> Smalltalk, Witze, NOCO-FAQ — <em>nicht</em> allgemeines Weltwissen.</p>";
    const hey = nameLine(helpers);
    const lead = hey
      ? `<p>${hey} — ich bin eine KI, aber eher fuer <strong>Befehle & Smalltalk</strong>:</p>`
      : `<p>Ich bin eine <strong>KI</strong>, kann aber eher <strong>System-Befehle</strong> als Google-Fragen:</p>`;
    return {
      type: "text",
      text: lead + body,
      rememberTopic: "capabilities"
    };
  }

  function buildWhatCanIDo(helpers) {
    const s = helpers?.getSystemSnapshot?.() || {};
    const hey = nameLine(helpers);
    const lead = hey ? `<p>${hey} — auf <strong>deinem</strong> NOCO Phone kannst du:</p>` : "<p><strong>Was du hier tun kannst</strong> — alles offline:</p>";
    const rows = [
      "<li><strong>Apps & Navigation</strong> — «Oeffne Forge», «NOCO Beam», Home-Widgets</li>",
      "<li><strong>Produktiv</strong> — Notizen, Tasks, Timer, Memory, «Was steht an?»</li>",
      "<li><strong>Look & Szenen</strong> — Themes, Arbeitsmodus, Chillmodus, Exclusive</li>",
      "<li><strong>Mit mir reden</strong> — Fragen, Witze, Coach («Was soll ich tun?»), Sprache «NOCO AI»</li>",
      "<li><strong>Entdecken</strong> — Forge-Spiele, System Tour, Pulse ✦ bei Vorschlaege</li>"
    ];
    const live = [];
    if (s.timerRunning) live.push(`Timer <strong>${esc(s.timerDisplay || "laeuft")}</strong>`);
    if (s.openTaskCount) live.push(`<strong>${s.openTaskCount}</strong> offene Tasks`);
    if (s.nextReminderText) live.push(`Memory: <strong>${esc(s.nextReminderText)}</strong>`);
    const liveBlock = live.length
      ? `<p><strong>Gerade bei dir:</strong> ${live.join(" · ")}.</p>`
      : "<p><small>Gerade ruhig? Probier <strong>Tagesbriefing</strong> oder <strong>Oeffne Notizen</strong>.</small></p>";
    return {
      type: "text",
      text: lead + `<ul>${rows.join("")}</ul>${liveBlock}`,
      rememberTopic: "user_actions"
    };
  }

  function buildWhatShouldIDo(helpers) {
    const s = helpers?.getSystemSnapshot?.() || {};
    const hey = nameLine(helpers);
    const steps = [];

    if (s.timerRunning) {
      steps.push({
        t: "Timer laeuft",
        d: `Du bist im Fokus (${esc(s.timerDisplay || "")}). Bleib dran oder «Zeige Timer».`,
        cmd: "Zeige Timer"
      });
    }
    if (s.openTaskCount > 0) {
      const prev = (s.openTasksPreview || []).slice(0, 2).map((x) => esc(x)).join(", ");
      steps.push({
        t: "Tasks erledigen",
        d: prev ? `Offen: ${prev}${s.openTaskCount > 2 ? " …" : ""}.` : `${s.openTaskCount} Aufgabe(n) warten.`,
        cmd: "Was steht an?"
      });
    }
    if (s.nextReminderText && !s.timerRunning) {
      steps.push({
        t: "Memory",
        d: `«${esc(s.nextReminderText)}»${s.nextReminderEta ? ` (${esc(s.nextReminderEta)})` : ""}.`,
        cmd: "Liste Erinnerungen"
      });
    }
    if (!steps.length) {
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 6) {
        steps.push({ t: "Abend", d: "Chillmodus oder Lock — morgen geht's weiter.", cmd: "Chillmodus" });
      } else if (hour < 12) {
        steps.push({ t: "Morgen", d: "Kurz Inbox + ein Fokus-Block.", cmd: "Tagesbriefing" });
      } else {
        steps.push({ t: "Tag", d: "Notiz anlegen oder Forge erkunden.", cmd: "Erstelle Notiz mit Titel Ideen" });
      }
      steps.push({ t: "Alternativ", d: "System-Tour wenn du Neues sehen willst.", cmd: "System Tour" });
    }

    const top = steps[0];
    const alt = steps[1];
    const lead = hey
      ? `<p>${hey} — mein Coach-Tipp <strong>jetzt</strong>:</p>`
      : "<p><strong>Was du jetzt tun solltest</strong> (aus deinem System):</p>";

    return {
      type: "text",
      text:
        lead +
        `<p><strong>1. ${esc(top.t)}</strong> — ${top.d}<br>Befehl: <strong>${esc(top.cmd)}</strong></p>` +
        (alt ? `<p><strong>2. ${esc(alt.t)}</strong> — ${alt.d}<br>Befehl: <strong>${esc(alt.cmd)}</strong></p>` : "") +
        "<p><small>Mehr Ideen? <strong>Was kann ich tun?</strong> · Zufall: <strong>Ueberrasch mich</strong></small></p>",
      rememberTopic: "coach",
      offerRun: top.cmd && global.NocoAI?.processMessage
        ? () => {
            const res = global.NocoAI.processMessage(top.cmd, helpers);
            if (res?.type === "action" && res.run) res.run();
          }
        : null,
      offerLabel: top.cmd
    };
  }

  function buildWhatDoYouLike(helpers) {
    const s = helpers?.getSystemSnapshot?.() || {};
    const hey = nameLine(helpers);
    const likes = [
      "wenn du konkret fragst statt nur «Hilfe» — dann kann ich wirklich handeln",
      "klare Befehle wie «Oeffne Beam» oder «Was steht an?»",
      `dein Theme <strong>${esc(s.theme || "aurora")}</strong> — passt zum Liquid-Glass-Look`,
      "dass alles offline bleibt — schnell, privat, ohne Server",
      "Forge, weil dort Mini-Apps und Spiele wohnen",
      "ein kurzes «Danke» — hoert sich fuer eine lokale KI gut an"
    ];
    const lead = hey
      ? `<p>${hey} — was ich <strong>mag</strong>?</p>`
      : "<p><strong>Was ich mag</strong> (als NOCO AI):</p>";
    const list = pick(likes);
    return {
      type: "text",
      text:
        lead +
        `<p>${list}</p>` +
        "<p>Und dich? Wenn du magst: <strong>Ich heisse …</strong> — dann wird's persoenlicher.</p>" +
        "<p><small>Frag auch: <strong>Was kannst du?</strong> oder <strong>Was soll ich tun?</strong></small></p>",
      rememberTopic: "personality"
    };
  }

  function process(text, helpers) {
    const q = norm(text);
    if (!q) return null;

    if (isWhoAmI(q)) return buildWhoAmI(helpers);
    if (isWhoAreYou(q)) return buildWhoAreYou(helpers);
    if (isWhatCanYouDo(q)) return buildWhatCanYouDo(helpers);
    if (isWhatCanIDo(q)) return buildWhatCanIDo(helpers);
    if (isWhatShouldIDo(q)) return buildWhatShouldIDo(helpers);
    if (isWhatDoYouLike(q)) return buildWhatDoYouLike(helpers);

    return null;
  }

  function matches(q) {
    const n = norm(q);
    return (
      isWhoAmI(n) ||
      isWhoAreYou(n) ||
      isWhatCanYouDo(n) ||
      isWhatCanIDo(n) ||
      isWhatShouldIDo(n) ||
      isWhatDoYouLike(n)
    );
  }

  global.NocoAIMeta = {
    process,
    matches,
    buildWhoAmI,
    buildWhatCanIDo,
    buildWhatShouldIDo,
    buildWhatCanYouDo,
    buildWhatDoYouLike,
    buildWhoAreYou
  };
})(typeof window !== "undefined" ? window : globalThis);
