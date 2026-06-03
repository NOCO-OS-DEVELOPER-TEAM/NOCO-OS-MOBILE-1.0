/**
 * NOCO AI Voice — Mikro-Freigabe, fuzzy Wake «NOCO AI», global inkl. Sperrbildschirm
 */
(function initNocoAIVoice(global) {
  const WAKE_KEY = "noco_ai_wake_v1";
  const MIC_CONSENT_KEY = "noco_ai_mic_consent_v1";
  const MIC_DEFERRED_KEY = "noco_ai_mic_deferred_v1";
  const COOLDOWN_MS = 1400;
  let lastWakeAt = 0;

  let getHelpers = () => ({});
  let wakeRecognition = null;
  let dictationRecognition = null;
  let wakeEnabled = false;
  let micConsented = false;
  let listeningWake = false;
  let listeningDictation = false;
  let statusEl = null;
  let consentRoot = null;
  let onDictationResult = null;

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

  function readMicConsent() {
    try {
      return localStorage.getItem(MIC_CONSENT_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function readMicDeferred() {
    try {
      return localStorage.getItem(MIC_DEFERRED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function writeMicConsent(on) {
    try {
      localStorage.setItem(MIC_CONSENT_KEY, on ? "1" : "0");
      if (on) localStorage.setItem(MIC_DEFERRED_KEY, "0");
    } catch (_) {}
    micConsented = !!on;
  }

  function writeMicDeferred() {
    try {
      localStorage.setItem(MIC_DEFERRED_KEY, "1");
      localStorage.setItem(MIC_CONSENT_KEY, "0");
    } catch (_) {}
    micConsented = false;
  }

  function readWakePref() {
    try {
      return localStorage.getItem(WAKE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function writeWakePref(on) {
    try {
      localStorage.setItem(WAKE_KEY, on ? "1" : "0");
    } catch (_) {}
  }

  function getSpeechRecognition() {
    return global.SpeechRecognition || global.webkitSpeechRecognition || null;
  }

  function isSupported() {
    return !!getSpeechRecognition();
  }

  function setStatus(text, mode) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.dataset.mode = mode || "";
    statusEl.classList.toggle("is-active", mode === "wake" || mode === "dictation");
  }

  /** Fuzzy Wake — nicht nur exakt «NOCO AI» */
  function fuzzyWakeMatch(transcript) {
    const raw = String(transcript || "").trim();
    if (!raw) return null;
    const n = norm(raw);
    const compact = n.replace(/\s+/g, "");

    const strong =
      /\b(noco\s*ai|noko\s*ai|nocoai|nokoai|nocho\s*ai|nochoai|noco\s*i|noko\s*i|no\s*co\s*ai|no\s*ko\s*ai)\b/.test(n) ||
      /\b(hey|hallo|ok|yo|hi|hello)\s+(noco|noko|no co|no ko)\s*(ai|ei|ay|hey|i|assistant)?\b/.test(n) ||
      /\b(noco|noko|no co|no ko)\s*(ai|ei|ay|a i|i|assistant|assistent)\b/.test(n) ||
      /\b(mach|starte|ruf|zeig|open|start|launch)\s+(noco|noko)\s*(ai|ei)?\b/.test(n) ||
      /\b(open|start)\s+noco\b/.test(n) ||
      /\b(noco|noko)\s+(assistent|assistant|help|hilfe)\b/.test(n);

    if (strong) {
      const after = raw
        .replace(/\b(hey|hallo|ok|yo|mach|starte|ruf|zeig)\b/gi, " ")
        .replace(/\b(noco|noko|no\s*co|no\s*ko)\s*(ai|ei|ay|a\.?\s*i\.?|i)?\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { matched: true, command: after };
    }

    if (compact.length >= 5 && compact.length <= 18) {
      const targets = ["nocoai", "nokoai", "nocoay", "noco ei", "nochoai", "nocoi"];
      for (const t of targets) {
        if (compact.includes(t.replace(/\s/g, "")) || levenshtein(compact.slice(0, 8), t.replace(/\s/g, "")) <= 2) {
          return { matched: true, command: "" };
        }
      }
    }

    if (/\b(no|na|nho)\b/.test(n) && /\b(co|ko|go)\b/.test(n) && /\b(ai|ei|ay|i)\b/.test(n)) {
      return { matched: true, command: "" };
    }

    return null;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 0; i < a.length; i++) {
      let prev = i + 1;
      for (let j = 0; j < b.length; j++) {
        const val = a[i] === b[j] ? row[j] : Math.min(row[j], row[j + 1], prev) + 1;
        row[j] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  function parseWakeTranscript(transcript) {
    return fuzzyWakeMatch(transcript);
  }

  function triggerWake(commandTail) {
    const now = Date.now();
    if (now - lastWakeAt < COOLDOWN_MS) return;
    lastWakeAt = now;

    const h = getHelpers();
    h.triggerHaptic?.();
    h.dismissKeyboard?.();

    const focusInput = () => {
      const root = document.querySelector("[data-noco-ai-root]");
      if (global.NocoAI?.focusChatInput && root) global.NocoAI.focusChatInput(root);
      const input = root?.querySelector("[data-noco-ai-input]");
      if (!input) return;
      try {
        input.focus({ preventScroll: true });
        const len = input.value.length;
        if (typeof input.setSelectionRange === "function") input.setSelectionRange(len, len);
      } catch (_) {}
    };

    const open = () => {
      if (h.openNocoAIVoiceWake) h.openNocoAIVoiceWake();
      else if (!h.isInNocoAI?.()) h.openApp?.("nocoai", { force: true });
      const tail = String(commandTail || "").trim();
      if (tail.length >= 2) {
        window.setTimeout(() => {
          global.dispatchEvent?.(
            new CustomEvent("noco-ai-voice-command", { detail: { text: tail, autoSend: true } })
          );
        }, h.isInNocoAI?.() ? 120 : 680);
      } else {
        h.showToast?.(global.NocoAIProfile?.getWakeToast?.() || "NOCO AI — tippe oder sprich weiter");
        window.setTimeout(focusInput, 520);
        window.setTimeout(focusInput, 1100);
      }
    };

    if (h.isLocked?.()) {
      h.openNocoAIVoiceWake?.() || open();
      return;
    }
    open();
  }

  function stopWake() {
    listeningWake = false;
    try {
      wakeRecognition?.stop();
    } catch (_) {}
  }

  function stopDictation() {
    listeningDictation = false;
    document.querySelectorAll("[data-noco-ai-mic].is-recording").forEach((b) => b.classList.remove("is-recording"));
    try {
      dictationRecognition?.stop();
    } catch (_) {}
    setStatus(wakeEnabled ? "Hoere: «NOCO AI» (auch ungenau) …" : "", wakeEnabled ? "wake" : "");
  }

  function startWakeLoop() {
    const SR = getSpeechRecognition();
    if (!SR || !wakeEnabled || !micConsented) return;
    if (listeningWake || listeningDictation) return;

    wakeRecognition = new SR();
    const lang = (navigator.language || "de-DE").toLowerCase().startsWith("en") ? "en-US" : "de-DE";
    wakeRecognition.lang = lang;
    wakeRecognition.continuous = true;
    wakeRecognition.interimResults = true;
    wakeRecognition.maxAlternatives = 3;

    wakeRecognition.onresult = (event) => {
      let combined = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const isFinal = result.isFinal;
        for (let a = 0; a < Math.min(result.length || 1, 4); a++) {
          const alt = result[a]?.transcript || "";
          combined += alt + " ";
          const parsed = parseWakeTranscript(alt);
          if (parsed) {
            stopWake();
            triggerWake(parsed.command);
            window.setTimeout(() => {
              if (wakeEnabled) startWakeLoop();
            }, COOLDOWN_MS);
            return;
          }
        }
        if (isFinal) {
          const parsed = parseWakeTranscript(combined);
          if (parsed) {
            stopWake();
            triggerWake(parsed.command);
            window.setTimeout(() => {
              if (wakeEnabled) startWakeLoop();
            }, COOLDOWN_MS);
            return;
          }
        }
      }
    };

    wakeRecognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setWakeEnabled(false);
        writeMicConsent(false);
        getHelpers().showToast?.("Mikrofon blockiert — in den Browser-Einstellungen erlauben");
      }
      listeningWake = false;
      if (wakeEnabled && event.error !== "aborted") {
        window.setTimeout(startWakeLoop, 2800);
      }
    };

    wakeRecognition.onend = () => {
      listeningWake = false;
      if (wakeEnabled && micConsented) window.setTimeout(startWakeLoop, 700);
    };

    try {
      wakeRecognition.start();
      listeningWake = true;
      setStatus("Hoere: «NOCO AI» (auch ungenau) …", "wake");
    } catch (_) {
      listeningWake = false;
      window.setTimeout(startWakeLoop, 2000);
    }
  }

  function requestMicPermission() {
    return new Promise((resolve) => {
      const SR = getSpeechRecognition();
      if (!SR) {
        resolve(false);
        return;
      }
      const probe = new SR();
      probe.lang = "de-DE";
      probe.continuous = false;
      probe.interimResults = false;
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        try {
          probe.stop();
        } catch (_) {}
        resolve(ok);
      };
      probe.onresult = () => finish(true);
      probe.onerror = (e) => finish(e.error !== "not-allowed");
      probe.onend = () => finish(false);
      try {
        probe.start();
        window.setTimeout(() => finish(true), 2200);
      } catch (_) {
        finish(false);
      }
    });
  }

  function hideMicConsent(root) {
    const scope = root || consentRoot;
    scope?.querySelectorAll?.("[data-noco-ai-mic-consent]")?.forEach((el) => {
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    });
    document.body.classList.remove("noco-ai-mic-open");
  }

  function showMicConsentIfNeeded(root) {
    if (!root || readMicConsent() || readMicDeferred() || !isSupported()) return;
    consentRoot = root;
    const sheet = root.querySelector("[data-noco-ai-mic-consent]");
    if (!sheet) return;
    sheet.classList.remove("hidden");
    sheet.setAttribute("aria-hidden", "false");
    document.body.classList.add("noco-ai-mic-open");
  }

  function initMicConsentUI() {
    if (global.__nocoMicConsentUI) return;
    global.__nocoMicConsentUI = true;

    document.addEventListener(
      "click",
      async (event) => {
        const laterBtn = event.target.closest("[data-noco-ai-mic-later]");
        const allowBtn = event.target.closest("[data-noco-ai-mic-allow]");
        if (!laterBtn && !allowBtn) return;
        const sheet = event.target.closest("[data-noco-ai-mic-consent]");
        if (!sheet || sheet.classList.contains("hidden")) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const root = sheet.closest("[data-noco-ai-root]") || consentRoot;
        if (laterBtn) {
          writeMicDeferred();
          hideMicConsent(root);
          getHelpers().showToast?.("Mikro: spaeter — unter Hoeren oder Mikro aktivieren");
          return;
        }
        if (allowBtn.disabled) return;
        allowBtn.disabled = true;
        allowBtn.textContent = "Mikro wird freigeschaltet …";
        const ok = await requestMicPermission();
        allowBtn.disabled = false;
        if (ok) {
          writeMicConsent(true);
          setWakeEnabled(true);
          hideMicConsent(root);
          getHelpers().showToast?.("Sprache aktiv — sage «NOCO AI»");
          syncWakeToggle(root);
        } else {
          allowBtn.textContent = "Mikrofon erlauben";
          hideMicConsent(root);
          getHelpers().showToast?.("Bitte Mikrofon im Browser erlauben");
        }
      },
      true
    );

    document.addEventListener("click", (event) => {
      const sheet = event.target.closest?.("[data-noco-ai-mic-consent]");
      if (!sheet || sheet.classList.contains("hidden")) return;
      if (event.target !== sheet) return;
      const root = sheet.closest("[data-noco-ai-root]") || consentRoot;
      writeMicDeferred();
      hideMicConsent(root);
    });
  }

  function syncWakeToggle(root) {
    const toggle = root?.querySelector?.("[data-noco-ai-wake-toggle]");
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", wakeEnabled ? "true" : "false");
    toggle.classList.toggle("is-on", wakeEnabled);
  }

  function startDictation(options = {}) {
    const SR = getSpeechRecognition();
    if (!SR) {
      getHelpers().showToast?.("Spracheingabe nicht unterstuetzt");
      return false;
    }
    if (!micConsented) {
      showMicConsentIfNeeded(options.root || consentRoot);
      getHelpers().showToast?.("Zuerst Mikrofon freigeben");
      return false;
    }
    stopDictation();
    stopWake();

    dictationRecognition = new SR();
    const lang = options.lang || ((navigator.language || "de-DE").toLowerCase().startsWith("en") ? "en-US" : "de-DE");
    dictationRecognition.lang = lang;
    dictationRecognition.continuous = true;
    dictationRecognition.interimResults = true;
    dictationRecognition.maxAlternatives = 4;

    dictationRecognition.onresult = (event) => {
      let best = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript?.trim();
        if (piece) best = piece;
      }
      const last = event.results[event.results.length - 1];
      const text = best || last?.[0]?.transcript?.trim() || "";
      if (!text) return;
      setStatus(last?.isFinal ? "Fertig" : "Hoere …", "dictation");
      if (last?.isFinal) {
        onDictationResult?.(text, { final: true });
        stopDictation();
      } else {
        onDictationResult?.(text, { final: false });
      }
    };

    dictationRecognition.onerror = () => stopDictation();
    dictationRecognition.onend = () => {
      listeningDictation = false;
      if (wakeEnabled) {
        setStatus("Hoere: «NOCO AI» (auch ungenau) …", "wake");
        window.setTimeout(startWakeLoop, 500);
      } else setStatus("", "");
    };

    onDictationResult = options.onResult || null;
    options.micBtn?.classList?.add("is-recording");

    try {
      dictationRecognition.start();
      listeningDictation = true;
      setStatus("Sprich jetzt …", "dictation");
      return true;
    } catch (_) {
      return false;
    }
  }

  function setWakeEnabled(on) {
    wakeEnabled = !!on;
    writeWakePref(wakeEnabled);
    if (wakeEnabled && micConsented && isSupported()) {
      startWakeLoop();
      document.body.classList.add("noco-ai-wake-on");
    } else {
      stopWake();
      if (!wakeEnabled) document.body.classList.remove("noco-ai-wake-on");
      if (!wakeEnabled) setStatus("", "");
    }
    global.dispatchEvent?.(new CustomEvent("noco-ai-wake-changed", { detail: { enabled: wakeEnabled } }));
  }

  function getWakeEnabled() {
    return wakeEnabled;
  }

  function hasMicConsent() {
    return micConsented;
  }

  function bindStatusElement(el) {
    statusEl = el;
  }

  function bindMicButton(btn, getInput, onSubmit, root) {
    if (!btn || btn.dataset.nocoVoiceBound === "1") return;
    btn.dataset.nocoVoiceBound = "1";
    btn.addEventListener("click", () => {
      if (!micConsented) {
        showMicConsentIfNeeded(root || consentRoot);
        return;
      }
      if (listeningDictation) {
        stopDictation();
        return;
      }
      getHelpers().dismissKeyboard?.();
      startDictation({
        root: root || consentRoot,
        micBtn: btn,
        onResult: (text, meta) => {
          const input = getInput?.();
          if (!input) return;
          input.value = text;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          if (meta.final && onSubmit) onSubmit(text);
        }
      });
    });
  }

  function bindWakeToggle(toggle, root) {
    if (!toggle || toggle.dataset.nocoWakeBound === "1") return;
    toggle.dataset.nocoWakeBound = "1";
    const sync = () => {
      toggle.setAttribute("aria-pressed", wakeEnabled ? "true" : "false");
      toggle.classList.toggle("is-on", wakeEnabled);
      toggle.title = wakeEnabled ? "«NOCO AI» hoeren — aus" : "«NOCO AI» hoeren — an";
    };
    sync();
    toggle.addEventListener("click", async () => {
      if (!isSupported()) {
        getHelpers().showToast?.("Browser unterstuetzt keine Spracheingabe");
        return;
      }
      if (!micConsented) {
        showMicConsentIfNeeded(root || consentRoot);
        return;
      }
      setWakeEnabled(!wakeEnabled);
      sync();
    });
    global.addEventListener("noco-ai-wake-changed", sync);
  }

  function init(helpersFactory) {
    getHelpers = typeof helpersFactory === "function" ? helpersFactory : () => helpersFactory || {};
    initMicConsentUI();
    micConsented = readMicConsent();
    wakeEnabled = micConsented && readWakePref();
    if (micConsented && wakeEnabled === false) {
      writeWakePref(true);
      wakeEnabled = true;
    }
    if (micConsented && isSupported()) {
      window.setTimeout(startWakeLoop, 900);
      document.body.classList.add("noco-ai-wake-on");
    }
  }

  function stopAll() {
    setWakeEnabled(false);
    stopDictation();
  }

  initMicConsentUI();

  global.NocoAIVoice = {
    init,
    isSupported,
    hasMicConsent,
    isListening: () => listeningWake || listeningDictation,
    getWakeEnabled,
    setWakeEnabled,
    startDictation,
    stopDictation,
    stopAll,
    bindStatusElement,
    bindMicButton,
    bindWakeToggle,
    showMicConsentIfNeeded,
    parseWakeTranscript,
    requestMicPermission
  };
})(typeof window !== "undefined" ? window : globalThis);
