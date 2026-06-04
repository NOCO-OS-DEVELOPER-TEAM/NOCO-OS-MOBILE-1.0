/**
 * NOCO AI Pulse — Kleiner Vorschlaege-Button: Ueberraschung, Neuigkeiten, System-Ueberblick (rotierend)
 */
(function initNocoAIPulse(global) {
  const LAST_KEY = "noco_ai_pulse_last_v1";
  const BUILD = "127";

  const SURPRISES = [
    { id: "surprise-app", cmd: "Ueberrasch mich", icon: "🎲", title: "Zufalls-App", teaser: "Ueberraschung — zufaellige App starten" },
    { id: "surprise-kitzel", cmd: "System Kitzel", icon: "✨", title: "System-Kitzel", teaser: "Kleine Ueberraschungs-Aktion im OS" },
    { id: "surprise-theme", cmd: "Theme Zufall", icon: "🎨", title: "Theme-Wuerfel", teaser: "Zufalls-Theme — schau mal" }
  ];

  const DISCOVER = [
    { id: "disc-tour", cmd: "System Tour", icon: "🆕", title: "Neu: System-Tour", teaser: "Hub → Home → Apps — gefuehrte Tour" },
    { id: "disc-meeting", cmd: "Meeting Vorbereitung Team", icon: "📅", title: "Neu: Meeting-Prep", teaser: "Notiz + Timer + Notizen in einem Schritt" },
    { id: "disc-inbox-note", cmd: "Inbox als Notiz", icon: "📝", title: "Neu: Inbox → Notiz", teaser: "Speichert deinen Ueberblick als Notiz" },
    { id: "disc-last-app", cmd: "Letzte App oeffnen", icon: "↩", title: "Neu: Letzte App", teaser: "Zurueck zur zuletzt geoeffneten App" },
    { id: "disc-ping", cmd: "Ping in 5 Minuten Pause", icon: "🔔", title: "Neu: Ping", teaser: "Kurze Erinnerung in 5 Minuten" },
    { id: "disc-widget", cmd: "NOCO AI Widget hinzufuegen", icon: "⌂", title: "Neu: AI-Widget", teaser: "NOCO AI direkt auf dem Home" },
    { id: "disc-night", cmd: "Nacht Routine", icon: "🌙", title: "Neu: Nacht-Routine", teaser: "Midnight + Auto-Lock + Memories" },
    { id: "disc-beam", cmd: "Beam suche nach Timer", icon: "⌕", title: "Neu: Beam-Suche", teaser: "Beam mit vorausgefuellter Suche" }
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function readLastId() {
    try {
      return localStorage.getItem(LAST_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function writeLastId(id) {
    try {
      localStorage.setItem(LAST_KEY, id);
    } catch (_) {}
  }

  function pickFromPool(pool, helpers) {
    const last = readLastId();
    const nick = helpers?.getNickname?.() || global.NocoAIProfile?.getNickname?.() || "";
    let candidates = pool.slice();
    if (candidates.length > 1) candidates = candidates.filter((p) => p.id !== last);

    const roll = Math.random();
    let bucket;
    if (roll < 0.32) bucket = candidates.filter((p) => SURPRISES.some((s) => s.id === p.id));
    else if (roll < 0.62) bucket = candidates.filter((p) => SHOWCASE.some((s) => s.id === p.id));
    else bucket = candidates.filter((p) => DISCOVER.some((d) => d.id === p.id));
    if (!bucket.length) bucket = candidates;

    const chosen = pick(bucket);
    let teaser = chosen.teaser;
    if (chosen.buildTeaser) teaser = chosen.buildTeaser(helpers, nick) || teaser;
    else if (nick && Math.random() < 0.45) teaser = `${teaser} · ${nick}`;

    writeLastId(chosen.id);
    return {
      ...chosen,
      teaser,
      mode: SURPRISES.some((s) => s.id === chosen.id) ? "surprise" : SHOWCASE.some((s) => s.id === chosen.id) ? "showcase" : "discover"
    };
  }

  function buildShowcaseTeaser(helpers, nick) {
    const s = helpers?.getSystemSnapshot?.() || {};
    const bits = [];
    if (s.timerRunning) bits.push(`Timer ${s.timerDisplay || "läuft"}`);
    if (s.openTaskCount) bits.push(`${s.openTaskCount} Tasks`);
    if (s.nextReminderText) bits.push(`Memory ${s.nextReminderEta || "bald"}`);
    if (s.currentAppTitle) bits.push(`App: ${s.currentAppTitle}`);
    else bits.push(s.currentPage || "Home");
    const core = bits.length ? bits.join(" · ") : "Alles ruhig";
    return nick ? `${core} — fuer dich, ${nick}` : core;
  }

  const SHOWCASE = [
    {
      id: "show-inbox",
      cmd: "Was steht an?",
      icon: "📋",
      title: "Was laeuft?",
      teaser: "Dein Live-Ueberblick",
      buildTeaser: buildShowcaseTeaser
    },
    {
      id: "show-brief",
      cmd: "Tagesbriefing",
      icon: "🌅",
      title: "Tagesbriefing",
      teaser: "Gruess + Inbox in einer Antwort"
    },
    {
      id: "show-status",
      cmd: "System Status",
      icon: "⚡",
      title: "System-Status",
      teaser: "Theme, Apps, Pay, Performance"
    }
  ];

  function getFullPool() {
    return SURPRISES.concat(SHOWCASE, DISCOVER);
  }

  function pickPresentation(helpers) {
    const pool = getFullPool();
    return pickFromPool(pool, helpers);
  }

  /** Zufaellige Chip-Liste — mischt Basis + Pulse-Features, wechselt bei jedem Oeffnen */
  function rotateSuggestions(baseList, helpers, count = 8) {
    const pulseChips = [];
    const used = new Set();
    for (let i = 0; i < 3; i++) {
      const p = pickPresentation(helpers);
      if (!used.has(p.cmd)) {
        used.add(p.cmd);
        pulseChips.push(p.cmd);
      }
    }
    const rest = (baseList || []).filter((s) => !used.has(s));
    const shuffled = rest.sort(() => Math.random() - 0.5);
    return pulseChips.concat(shuffled).slice(0, count);
  }

  function applyPulseUI(root, presentation) {
    const btn = root?.querySelector("[data-noco-ai-pulse]");
    const line = root?.querySelector("[data-noco-ai-pulse-line]");
    if (btn) {
      btn.textContent = presentation.icon || "✦";
      btn.title = presentation.title || "Pulse";
      btn.dataset.pulseCmd = presentation.cmd || "";
      btn.dataset.pulseMode = presentation.mode || "";
      btn.classList.toggle("is-surprise", presentation.mode === "surprise");
      btn.classList.toggle("is-showcase", presentation.mode === "showcase");
      btn.classList.toggle("is-discover", presentation.mode === "discover");
    }
    if (line) {
      line.textContent = presentation.teaser || "";
      line.hidden = !presentation.teaser;
    }
  }

  function bind(root, helpers, runCommand, options = {}) {
    if (!root || root.dataset.nocoPulseBound === "1") return;
    root.dataset.nocoPulseBound = "1";

    const btn = root.querySelector("[data-noco-ai-pulse]");
    const line = root.querySelector("[data-noco-ai-pulse-line]");
    const toggle = root.querySelector("[data-noco-ai-tips-toggle]");
    const panel = root.querySelector("[data-noco-ai-tips-panel]");
    const chipsWrap = root.querySelector("[data-noco-ai-chips]");

    if (!btn) return;

    let presentation = pickPresentation(helpers);
    applyPulseUI(root, presentation);

    const refresh = () => {
      presentation = pickPresentation(helpers);
      applyPulseUI(root, presentation);
    };

    const refreshChips = (baseSuggestions) => {
      if (!chipsWrap || options.widget) return baseSuggestions;
      return rotateSuggestions(baseSuggestions, helpers, options.widget ? 5 : 9);
    };

    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const cmd = btn.dataset.pulseCmd || presentation.cmd;
      if (cmd && runCommand) runCommand(cmd);
      helpers?.triggerHaptic?.();
      refresh();
      if (line) {
        line.classList.add("noco-ai-pulse-line--flash");
        window.setTimeout(() => line.classList.remove("noco-ai-pulse-line--flash"), 520);
      }
    });

    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        window.setTimeout(() => {
          if (!panel.classList.contains("hidden")) refresh();
        }, 80);
      });
    }

    let rotateTimer = null;
    const startRotate = () => {
      if (rotateTimer || options.widget) return;
      rotateTimer = window.setInterval(() => {
        if (panel && !panel.classList.contains("hidden")) refresh();
      }, 38000);
    };
    const stopRotate = () => {
      if (rotateTimer) {
        window.clearInterval(rotateTimer);
        rotateTimer = null;
      }
    };
    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        window.setTimeout(() => {
          if (panel.classList.contains("hidden")) stopRotate();
          else startRotate();
        }, 100);
      });
    }

    return { refresh, refreshChips, getPresentation: () => presentation };
  }

  global.NocoAIPulse = {
    bind,
    pickPresentation,
    rotateSuggestions,
    applyPulseUI,
    BUILD
  };
})(typeof window !== "undefined" ? window : globalThis);
