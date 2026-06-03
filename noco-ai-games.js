/**
 * NOCO AI — Mini-Spiele im Chat (offline, mit Tipps)
 */
(function initNocoAIGames(global) {
  const TIPS = [
    "Tipp: Sage «Oeffne React Tap» fuer ein Forge-Spiel mit Highscore.",
    "Tipp: «Würfel» oder «Wuerfel» wirft einen W6 direkt im Chat.",
    "Tipp: «Rate Zahl» startet ein Zahlenspiel — du hast 6 Versuche.",
    "Tipp: Im Menue (✦) kannst du Vorschlaege antippen — sie werden sofort gesendet.",
    "Tipp: «Spielmodus» wechselt Theme und oeffnet die Spiele-Bibliothek.",
    "Tipp: Nach jedem Mini-Spiel kannst du «nochmal» oder «anderes spiel» sagen."
  ];

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

  function pickTip() {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }

  function diceHtml(value) {
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return `<p class="noco-ai-game-msg"><strong>Würfel:</strong> ${faces[value - 1] || value} <span class="muted">(${value})</span></p><p class="muted">${pickTip()}</p>`;
  }

  function startGuess() {
    return {
      kind: "guess",
      secret: 1 + Math.floor(Math.random() * 20),
      tries: 0,
      max: 6
    };
  }

  function guessPanel(state, hint) {
    const left = state.max - state.tries;
    const nums = Array.from({ length: 10 }, (_, i) => i + 1);
    const btns = nums
      .map(
        (n) =>
          `<button type="button" class="noco-ai-game-btn" data-noco-ai-game="guess-pick" data-noco-ai-game-n="${n}">${n}</button>`
      )
      .join("");
    const more = Array.from({ length: 10 }, (_, i) => i + 11)
      .map(
        (n) =>
          `<button type="button" class="noco-ai-game-btn" data-noco-ai-game="guess-pick" data-noco-ai-game-n="${n}">${n}</button>`
      )
      .join("");
    return `<div class="noco-ai-game-card">
      <p><strong>Rate die Zahl</strong> (1–20) — ${left} Versuche uebrig.</p>
      ${hint ? `<p>${hint}</p>` : ""}
      <div class="noco-ai-game-grid">${btns}${more}</div>
      <p class="muted">Oder tippe eine Zahl ins Feld. ${pickTip()}</p>
    </div>`;
  }

  function startEmoji() {
    const rounds = [
      { word: "Sonne", emoji: "☀️", wrong: ["🌧️", "❄️", "🌙"] },
      { word: "Regen", emoji: "🌧️", wrong: ["☀️", "🔥", "🌈"] },
      { word: "Herz", emoji: "❤️", wrong: ["💎", "⭐", "🎵"] },
      { word: "Blitz", emoji: "⚡", wrong: ["🌊", "🍀", "🎈"] },
      { word: "Pizza", emoji: "🍕", wrong: ["🥗", "🍎", "☕"] }
    ];
    const r = rounds[Math.floor(Math.random() * rounds.length)];
    const opts = [r.emoji, ...r.wrong].sort(() => Math.random() - 0.5);
    return { kind: "emoji", word: r.word, answer: r.emoji, options: opts, score: 0 };
  }

  function emojiPanel(state, msg) {
    const btns = state.options
      .map(
        (e) =>
          `<button type="button" class="noco-ai-game-btn noco-ai-game-emoji" data-noco-ai-game="emoji-pick" data-noco-ai-game-emoji="${escapeHtml(e)}">${e}</button>`
      )
      .join("");
    return `<div class="noco-ai-game-card">
      <p><strong>Emoji-Quiz</strong> — welches Emoji passt zu «${escapeHtml(state.word)}»?</p>
      ${msg ? `<p>${msg}</p>` : ""}
      <div class="noco-ai-game-grid noco-ai-game-grid--emoji">${btns}</div>
      <p class="muted">Punkte: ${state.score}. ${pickTip()}</p>
    </div>`;
  }

  function matchesStart(q, raw) {
    return (
      /\b(mini spiel|minispiel|chat spiel|spiel im chat|rate zahl|rate die zahl|zahl raten)\b/.test(q) ||
      /^spiel[\s!.]*$/i.test(String(raw || "").trim()) ||
      /\b(emoji quiz|emoji raten)\b/.test(q)
    );
  }

  function matchesDice(q) {
    return /\b(wuerfel|wurfel|würfel|dice|w6)\b/.test(q);
  }

  function matchesTip(q) {
    return /\b(gib mir einen tipp|spiel tipp|game tip|zufaelligen tipp)\b/.test(q) && !/\b(hilfe|faq)\b/.test(q);
  }

  function matchesOpenGame(q) {
    return /\b(oeffne|offne|open|starte)\b/.test(q) && /\b(react|blitz|lane|spiel)\b/.test(q);
  }

  function parseGuessNumber(text) {
    const m = String(text || "").match(/\b(\d{1,2})\b/);
    if (!m) return null;
    const n = Number(m[1]);
    if (n < 1 || n > 20) return null;
    return n;
  }

  function processGuessPick(state, n) {
    state.tries += 1;
    if (n === state.secret) {
      const tries = state.tries;
      return {
        clear: true,
        text: `<p><strong>Treffer!</strong> Die Zahl war <strong>${state.secret}</strong> — in ${tries} Versuch${tries === 1 ? "" : "en"}.</p><p>${pickTip()} Sag <strong>nochmal</strong> fuer eine neue Runde.</p>`
      };
    }
    if (state.tries >= state.max) {
      return {
        clear: true,
        text: `<p><strong>Leider vorbei.</strong> Gesucht war <strong>${state.secret}</strong>.</p><p>${pickTip()}</p>`
      };
    }
    const hint =
      n < state.secret
        ? `<span class="muted">Zu niedrig — probier hoeher.</span>`
        : `<span class="muted">Zu hoch — probier niedriger.</span>`;
    return { clear: false, text: guessPanel(state, hint) };
  }

  function continueGame(text, raw, session, helpers) {
    const state = session.chatGame;
    if (!state) return null;
    const q = norm(text);

    if (/\b(abbrechen|stop|ende|fertig)\b/.test(q)) {
      session.chatGame = null;
      return { type: "text", text: "<p>Spiel beendet. Frag mich wieder nach einem <strong>Mini-Spiel</strong> oder «Würfel».</p>" };
    }

    if (state.kind === "guess") {
      const n = parseGuessNumber(raw);
      if (n == null) return null;
      const res = processGuessPick(state, n);
      if (res.clear) session.chatGame = null;
      return { type: "text", text: res.text };
    }

    return null;
  }

  function process(text, rawInput, helpers, session = {}) {
    const q = norm(text);
    const raw = String(rawInput || "").trim();
    if (!q) return null;

    if (/\b(nochmal|neue runde|noch einmal)\b/.test(q) && session.lastGameKind) {
      if (session.lastGameKind === "guess") {
        session.chatGame = startGuess();
        return { type: "text", text: guessPanel(session.chatGame) };
      }
      if (session.lastGameKind === "emoji") {
        session.chatGame = startEmoji();
        return { type: "text", text: emojiPanel(session.chatGame) };
      }
    }

    if (matchesDice(q)) {
      const v = 1 + Math.floor(Math.random() * 6);
      return { type: "text", text: diceHtml(v), rememberTopic: "game" };
    }

    if (matchesTip(q)) {
      return { type: "text", text: `<p>${pickTip()}</p>`, rememberTopic: "game" };
    }

    if (matchesOpenGame(q)) {
      let id = "reacttap";
      if (/\bblitz\b/.test(q)) id = "blitzmath";
      if (/\blane\b/.test(q)) id = "laneswap";
      if (/\breact\b/.test(q)) id = "reacttap";
      const title = helpers.getAppTitle?.(id) || id;
      return {
        type: "action",
        text: `<p>Starte <strong>${escapeHtml(title)}</strong> in Forge …</p><p class="muted">${pickTip()}</p>`,
        run: () => helpers.openApp?.(id),
        rememberTopic: "game"
      };
    }

    if (/\bemoji\b/.test(q) && /\b(quiz|spiel|rätsel|raetsel)\b/.test(q)) {
      session.chatGame = startEmoji();
      session.lastGameKind = "emoji";
      return { type: "text", text: emojiPanel(session.chatGame), rememberTopic: "game" };
    }

    if (matchesStart(q, raw)) {
      session.chatGame = startGuess();
      session.lastGameKind = "guess";
      return {
        type: "text",
        text: `<p><strong>Mini-Spiel:</strong> Ich denke an eine Zahl von 1 bis 20.</p>${guessPanel(session.chatGame)}`,
        rememberTopic: "game"
      };
    }

    if (/\b(spiel|games|arcade)\b/.test(q) && q.length < 48 && !/\b(oeffne|offne|modus)\b/.test(q)) {
      return {
        type: "text",
        text: `<p><strong>Spiele im Chat</strong> (kostenlos & offline):</p>
          <ul class="noco-ai-game-list">
            <li><strong>Rate Zahl</strong> — «Rate Zahl» oder Buttons unten</li>
            <li><strong>Würfel</strong> — «Würfel»</li>
            <li><strong>Emoji-Quiz</strong> — «Emoji Quiz»</li>
          </ul>
          <p>Forge-Spiele: <strong>React Tap</strong>, <strong>Blitz Math</strong>, <strong>Lane Swap</strong> — «Oeffne React Tap».</p>
          <p class="muted">${pickTip()}</p>
          <div class="noco-ai-game-grid">
            <button type="button" class="noco-ai-game-btn" data-noco-ai-game="start-guess">Rate Zahl</button>
            <button type="button" class="noco-ai-game-btn" data-noco-ai-game="dice">Würfel</button>
            <button type="button" class="noco-ai-game-btn" data-noco-ai-game="start-emoji">Emoji Quiz</button>
          </div>`,
        rememberTopic: "game"
      };
    }

    return null;
  }

  function handleClick(btn, root, helpers, api = {}) {
    const log = root?.querySelector?.("[data-noco-ai-log]");
    const session = api.sessionContext;
    if (!log || !session) return;
    const kind = btn.dataset.nocoAiGame || "";
    const appendBot = (html) => {
      if (global.NocoAI?.appendBotMessage) {
        global.NocoAI.appendBotMessage(root, html);
        global.dispatchEvent?.(new CustomEvent("noco-ai-updated"));
        return;
      }
      const row = document.createElement("div");
      row.className = "noco-ai-msg noco-ai-msg--bot";
      row.innerHTML = `<div class="noco-ai-bubble">${html}</div>`;
      log.appendChild(row);
      const scroll = log.closest(".noco-ai-log-scroll") || log;
      scroll.scrollTop = scroll.scrollHeight;
    };

    if (kind === "dice") {
      const v = 1 + Math.floor(Math.random() * 6);
      appendBot(diceHtml(v));
      helpers?.triggerHaptic?.();
      return;
    }
    if (kind === "start-guess") {
      session.chatGame = startGuess();
      session.lastGameKind = "guess";
      appendBot(guessPanel(session.chatGame));
      helpers?.triggerHaptic?.();
      return;
    }
    if (kind === "start-emoji") {
      session.chatGame = startEmoji();
      session.lastGameKind = "emoji";
      appendBot(emojiPanel(session.chatGame));
      helpers?.triggerHaptic?.();
      return;
    }
    if (kind === "guess-pick" && session.chatGame?.kind === "guess") {
      const n = Number(btn.dataset.nocoAiGameN);
      if (!n) return;
      const res = processGuessPick(session.chatGame, n);
      if (res.clear) session.chatGame = null;
      appendBot(res.text);
      helpers?.triggerHaptic?.();
      return;
    }
    if (kind === "emoji-pick" && session.chatGame?.kind === "emoji") {
      const pick = btn.dataset.nocoAiGameEmoji || btn.textContent;
      const ok = pick === session.chatGame.answer;
      if (ok) session.chatGame.score += 1;
      const msg = ok
        ? `<span class="muted">Richtig!</span>`
        : `<span class="muted">Knapp daneben — richtig war ${session.chatGame.answer}</span>`;
      if (session.chatGame.score >= 3) {
        session.chatGame = null;
        appendBot(`<p><strong>Emoji-Quiz geschafft!</strong> 3 Treffer. ${pickTip()}</p>`);
      } else {
        session.chatGame = startEmoji();
        session.lastGameKind = "emoji";
        appendBot(emojiPanel(session.chatGame, msg));
      }
      helpers?.triggerHaptic?.();
    }
  }

  global.NocoAIGames = {
    process,
    continueGame,
    handleClick,
    pickTip,
    BUILD: "145"
  };
})(typeof window !== "undefined" ? window : globalThis);
