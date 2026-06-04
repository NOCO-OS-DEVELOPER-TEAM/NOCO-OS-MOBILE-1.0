/**
 * NOCO AI Voice — Mikro-Freigabe, fuzzy Wake «NOCO AI», global inkl. Sperrbildschirm
 */
(function initNocoAIVoice(global) {
  const WAKE_KEY = "noco_ai_wake_v1";
  const MIC_CONSENT_KEY = "noco_ai_mic_consent_v2";
  const MIC_DEFERRED_KEY = "noco_ai_mic_deferred_v2";
  const AD_PRIVACY_KEY = "noco_ai_ad_privacy_v1";
  const STT_CONSENT_KEY = "noco_ai_stt_consent_v1";
  const STT_DEFERRED_KEY = "noco_ai_stt_deferred_v1";
  const COOLDOWN_MS = 1400;
  let lastWakeAt = 0;

  let getHelpers = () => ({});
  let wakeEngine = null;
  let dictationRecognition = null;
  let wakeEnabled = false;
  let micConsented = false;
  let sttConsented = false;
  let sttMicReady = false;
  let listeningWake = false;
  let listeningDictation = false;
  let statusEl = null;
  let consentRoot = null;
  let onDictationResult = null;
  let pendingMicStart = null;

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

  function readSttConsent() {
    try {
      return localStorage.getItem(STT_CONSENT_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function readSttDeferred() {
    try {
      return localStorage.getItem(STT_DEFERRED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function writeSttConsent(on) {
    try {
      localStorage.setItem(STT_CONSENT_KEY, on ? "1" : "0");
      if (on) localStorage.setItem(STT_DEFERRED_KEY, "0");
    } catch (_) {}
    sttConsented = !!on;
  }

  function writeSttDeferred() {
    try {
      localStorage.setItem(STT_DEFERRED_KEY, "1");
      localStorage.setItem(STT_CONSENT_KEY, "0");
    } catch (_) {}
    sttConsented = false;
  }

  function writeAdPrivacyAccepted() {
    try {
      localStorage.setItem(AD_PRIVACY_KEY, "1");
    } catch (_) {}
  }

  function adPrivacyCheckedIn(root) {
    const sheet = root?.querySelector?.("[data-noco-ai-mic-consent]:not(.hidden)");
    const box = sheet?.querySelector?.("[data-noco-ai-ad-privacy-check]");
    return !!box?.checked;
  }

  function syncAdAllowButton(root) {
    const sheet = root?.querySelector?.("[data-noco-ai-mic-consent]");
    if (!sheet) return;
    const box = sheet.querySelector("[data-noco-ai-ad-privacy-check]");
    const btn = sheet.querySelector("[data-noco-ai-mic-allow]");
    if (btn) btn.disabled = !(box?.checked);
  }

  function syncSttAllowButton(root) {
    const sheet = root?.querySelector?.("[data-noco-ai-stt-consent]");
    if (!sheet) return;
    const box = sheet.querySelector("[data-noco-ai-stt-privacy-check]");
    const btn = sheet.querySelector("[data-noco-ai-stt-allow]");
    if (btn) btn.disabled = !(box?.checked);
  }

  function readWakePref() {
    try {
      const v = localStorage.getItem(WAKE_KEY);
      if (v === null) return true;
      return v === "1";
    } catch (_) {
      return true;
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
    return !!(getSpeechRecognition() || navigator.mediaDevices?.getUserMedia);
  }

  function hasSpeechRecognition() {
    return !!getSpeechRecognition();
  }

  function setStatus(text, mode) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.dataset.mode = mode || "";
    statusEl.classList.toggle("is-active", mode === "wake" || mode === "dictation");
  }

  function parseWakeTranscript(transcript) {
    return (
      global.NocoAudioDetection?.fuzzyWakeMatch?.(transcript) ||
      global.NocoWakeEngine?.fuzzyWakeMatch?.(transcript) ||
      null
    );
  }

  function focusInputForDictation(root) {
    const h = getHelpers();
    const run = () => {
      const scope = root || document.querySelector("[data-noco-ai-root]");
      const input = scope?.querySelector("[data-noco-ai-input]");
      if (!input) return;
      try {
        input.removeAttribute("readonly");
        input.focus({ preventScroll: true });
        const len = input.value?.length || 0;
        if (typeof input.setSelectionRange === "function") input.setSelectionRange(len, len);
      } catch (_) {}
    };
    if (!h.isInNocoAI?.()) {
      if (h.openNocoAIVoiceWake) h.openNocoAIVoiceWake();
      else h.openApp?.("nocoai", { force: true });
    }
    run();
    window.setTimeout(run, 380);
    window.setTimeout(run, 820);
    window.setTimeout(run, 1400);
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
            new CustomEvent("noco-ai-voice-command", { detail: { text: tail, autoSend: false } })
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
    wakeEngine?.stop();
  }

  function stopDictation() {
    listeningDictation = false;
    document.querySelectorAll("[data-noco-ai-mic].is-recording").forEach((b) => b.classList.remove("is-recording"));
    try {
      dictationRecognition?.stop();
    } catch (_) {}
    setStatus(wakeEnabled ? "NOCO AD 1.0 — Aktivierungswort" : "", wakeEnabled ? "wake" : "");
  }

  function rebuildWakeEngine() {
    const AD = global.NocoAudioDetection || global.NocoWakeEngine;
    if (!AD?.create) return null;
    try {
      wakeEngine?.release?.();
    } catch (_) {}
    wakeEngine = AD.create({
      onStatus: (text, mode) => setStatus(text, mode === "listen" ? "wake" : mode === "hit" ? "wake" : "wake"),
      onWake: (hit) => {
        if (hit?.soft && Number(global.NocoAudioDetection?.getWakeConfig?.().sensitivity) < 2) return;
        triggerWake(hit?.command || "");
      }
    });
    return wakeEngine;
  }

  let wakePausedForApp = false;
  let resumeWakeTimer = null;

  function pauseWakeForApp() {
    wakePausedForApp = true;
    stopWake();
  }

  function resumeWakeForApp() {
    wakePausedForApp = false;
    if (wakeEnabled && micConsented && !getHelpers().isInNocoAI?.()) {
      window.setTimeout(startWakeLoop, 400);
    }
  }

  function startWakeLoop() {
    if (!wakeEnabled || !micConsented) return;
    if (wakePausedForApp || getHelpers().isInNocoAI?.()) return;
    if (listeningDictation) return;
    const AD = global.NocoAudioDetection || global.NocoWakeEngine;
    if (!AD?.create) {
      getHelpers().showToast?.("NOCO Audio Detection 1.0 nicht geladen");
      return;
    }

    if (!wakeEngine) rebuildWakeEngine();

    wakeEngine
      .start()
      .then((ok) => {
        listeningWake = !!ok;
        if (!ok) {
          rebuildWakeEngine();
          return wakeEngine?.start?.().then((retry) => {
            listeningWake = !!retry;
            if (!retry) {
              getHelpers().showToast?.("NOCO AD 1.0 — Mikro nicht bereit (Tab neu laden)");
              setWakeEnabled(false);
            }
          });
        }
      })
      .catch(() => {
        listeningWake = false;
        rebuildWakeEngine();
        window.setTimeout(() => {
          if (wakeEnabled && micConsented) startWakeLoop();
        }, 1200);
      });
  }

  async function requestMicPermission() {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err) {
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") return false;
      }
    }

    getHelpers().showToast?.("Mikrofon-Zugriff nicht verfuegbar — HTTPS oder Live Server nutzen");
    return false;
  }

  function runPendingMicStart() {
    const pending = pendingMicStart;
    pendingMicStart = null;
    if (!pending || !micConsented) return;
    window.setTimeout(() => {
      toggleMicDictation(pending.btn, pending.getInput, pending.onSubmit, pending.root);
    }, 320);
  }

  function hideMicConsent(root) {
    const scope = root || consentRoot;
    scope?.querySelectorAll?.("[data-noco-ai-mic-consent]")?.forEach((el) => {
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    });
    scope?.classList?.remove?.("noco-ai-mic-prompt");
    document.body.classList.remove("noco-ai-mic-open");
  }

  async function handleMicAllow(root, allowBtn) {
    if (!allowBtn || allowBtn.disabled) return;
    if (!adPrivacyCheckedIn(root)) {
      getHelpers().showToast?.("Bitte Datenschutz fuer NOCO AD bestaetigen");
      return;
    }
    allowBtn.disabled = true;
    allowBtn.textContent = "NOCO AD wird aktiviert …";
    const ok = await requestMicPermission();
    allowBtn.disabled = false;
    syncAdAllowButton(root);
    if (ok) {
      writeAdPrivacyAccepted();
      writeMicConsent(true);
      setWakeEnabled(true);
      hideMicConsent(root);
      getHelpers().showToast?.("NOCO AD aktiv — Hey Noko hoert nur Aktivierungswoerter");
      syncWakeToggle(root);
      global.NocoAI?.showAdIntroIfNeeded?.(root);
      const pending = pendingMicStart;
      pendingMicStart = null;
      if (pending?.kind === "dictation") {
        showSttConsentIfNeeded(root || consentRoot, { force: true });
      }
    } else {
      allowBtn.textContent = "NOCO AD aktivieren";
      pendingMicStart = null;
      getHelpers().showToast?.("Mikro blockiert — in iPhone/Android Einstellungen erlauben");
    }
  }

  async function handleSttAllow(root, allowBtn) {
    if (!allowBtn || allowBtn.disabled) return;
    const sheet = root?.querySelector?.("[data-noco-ai-stt-consent]:not(.hidden)");
    const box = sheet?.querySelector?.("[data-noco-ai-stt-privacy-check]");
    if (!box?.checked) {
      getHelpers().showToast?.("Bitte Diktat-Hinweise (Browser) bestaetigen");
      return;
    }
    allowBtn.disabled = true;
    allowBtn.textContent = "Wird vorbereitet …";
    let micOk = micConsented;
    if (!micOk) {
      micOk = await requestMicPermission();
      if (micOk) sttMicReady = true;
    }
    allowBtn.disabled = false;
    syncSttAllowButton(root);
    if (!micOk) {
      allowBtn.textContent = "Diktat-Hinweise akzeptieren";
      pendingMicStart = null;
      getHelpers().showToast?.("Mikro fuer Diktat blockiert — Einstellungen pruefen");
      return;
    }
    writeSttConsent(true);
    hideSttConsent(root);
    getHelpers().showToast?.("Diktat 🎤 — Browser-Spracherkennung, nicht NOCO AD");
    runPendingMicStart();
  }

  function allowMicClick(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const allowBtn = event?.target?.closest?.("[data-noco-ai-mic-allow]");
    const sheet = event?.target?.closest?.("[data-noco-ai-mic-consent]");
    if (!allowBtn || !sheet || sheet.classList.contains("hidden")) return;
    const root = sheet.closest("[data-noco-ai-root]") || consentRoot;
    void handleMicAllow(root, allowBtn);
  }

  function needsMicPrompt() {
    if (!isSupported()) return false;
    return !readMicConsent();
  }

  function hideSttConsent(root) {
    const scope = root || consentRoot;
    scope?.querySelectorAll?.("[data-noco-ai-stt-consent]")?.forEach((el) => {
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    });
    scope?.classList?.remove?.("noco-ai-stt-prompt");
    document.body.classList.remove("noco-ai-stt-open");
  }

  function showSttConsentIfNeeded(root, options = {}) {
    const force = !!options.force;
    if (!root) return;
    if (!hasSpeechRecognition()) {
      getHelpers().showToast?.("Browser-Spracherkennung nicht verfuegbar");
      return;
    }
    if (!force && readSttConsent()) return;
    if (!force && readSttDeferred()) return;
    hideMicConsent(root);
    consentRoot = root;
    const sheet = root.querySelector("[data-noco-ai-stt-consent]");
    if (!sheet) return;
    sheet.classList.remove("hidden");
    sheet.setAttribute("aria-hidden", "false");
    root.classList.add("noco-ai-stt-prompt");
    document.body.classList.add("noco-ai-stt-open");
    const box = sheet.querySelector("[data-noco-ai-stt-privacy-check]");
    const allowBtn = sheet.querySelector("[data-noco-ai-stt-allow]");
    if (box) box.checked = false;
    if (allowBtn) allowBtn.textContent = "Diktat-Hinweise akzeptieren";
    syncSttAllowButton(root);
  }

  function showMicConsentIfNeeded(root, options = {}) {
    const force = !!options.force;
    if (!root) return;
    if (!isSupported()) {
      getHelpers().showToast?.("NOCO AD wird hier nicht unterstuetzt (HTTPS/localhost noetig)");
      return;
    }
    if (!force && readMicConsent()) return;
    if (!force && readMicDeferred()) return;
    hideSttConsent(root);
    consentRoot = root;
    const sheet = root.querySelector("[data-noco-ai-mic-consent]");
    if (!sheet) return;
    sheet.classList.remove("hidden");
    sheet.setAttribute("aria-hidden", "false");
    root.classList.add("noco-ai-mic-prompt");
    document.body.classList.add("noco-ai-mic-open");
    const box = sheet.querySelector("[data-noco-ai-ad-privacy-check]");
    const allowBtn = sheet.querySelector("[data-noco-ai-mic-allow]");
    if (box) box.checked = false;
    if (allowBtn) allowBtn.textContent = "NOCO AD aktivieren";
    syncAdAllowButton(root);
  }

  function wireSttPrivacyGates(root) {
    if (!root || root.dataset.nocoSttPrivacyWired === "1") return;
    root.dataset.nocoSttPrivacyWired = "1";
    const sheet = root.querySelector("[data-noco-ai-stt-consent]");
    const box = sheet?.querySelector("[data-noco-ai-stt-privacy-check]");
    if (!box) return;
    box.addEventListener("change", () => syncSttAllowButton(root));
    syncSttAllowButton(root);
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

        const root = sheet.closest("[data-noco-ai-root]") || consentRoot;
        if (laterBtn) {
          pendingMicStart = null;
          writeMicDeferred();
          hideMicConsent(root);
          getHelpers().showToast?.("NOCO AD: spaeter — Aktivierungswort in Einstellungen");
          return;
        }
        await handleMicAllow(root, allowBtn);
      },
      false
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

  function initSttConsentUI() {
    if (global.__nocoSttConsentUI) return;
    global.__nocoSttConsentUI = true;

    document.addEventListener(
      "click",
      async (event) => {
        const laterBtn = event.target.closest("[data-noco-ai-stt-later]");
        const allowBtn = event.target.closest("[data-noco-ai-stt-allow]");
        if (!laterBtn && !allowBtn) return;
        const sheet = event.target.closest("[data-noco-ai-stt-consent]");
        if (!sheet || sheet.classList.contains("hidden")) return;

        event.preventDefault();
        event.stopPropagation();

        const root = sheet.closest("[data-noco-ai-root]") || consentRoot;
        if (laterBtn) {
          pendingMicStart = null;
          writeSttDeferred();
          hideSttConsent(root);
          getHelpers().showToast?.("Diktat: spaeter — oder NOCO AD nutzen");
          return;
        }
        await handleSttAllow(root, allowBtn);
      },
      false
    );

    document.addEventListener("click", (event) => {
      const sheet = event.target.closest?.("[data-noco-ai-stt-consent]");
      if (!sheet || sheet.classList.contains("hidden")) return;
      if (event.target !== sheet) return;
      const root = sheet.closest("[data-noco-ai-root]") || consentRoot;
      writeSttDeferred();
      hideSttConsent(root);
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
      getHelpers().showToast?.("Spracherkennung nicht verfuegbar — Browser aktualisieren");
      return false;
    }
    if (!readSttConsent()) {
      showSttConsentIfNeeded(options.root || consentRoot, { force: true });
      getHelpers().showToast?.("Zuerst Diktat-Hinweise (Browser) bestaetigen");
      return false;
    }
    if (!micConsented && !sttMicReady) {
      getHelpers().showToast?.("Mikro fuer Diktat nicht bereit — 🎤 nochmal tippen");
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
      if (wakeEnabled && !getHelpers().isInNocoAI?.()) {
        setStatus("NOCO AD 1.0 — Hey Noko · NOCO · AI", "wake");
        window.setTimeout(startWakeLoop, 500);
      } else if (getHelpers().isInNocoAI?.()) {
        setStatus("", "");
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
    if (wakeEnabled && micConsented) {
      stopDictation();
      startWakeLoop();
      document.body.classList.add("noco-ai-wake-on");
    } else {
      stopWake();
      stopDictation();
      wakeEngine?.release?.();
      wakeEngine = null;
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

  function toggleMicDictation(btn, getInput, onSubmit, root) {
    if (!getHelpers().isInNocoAI?.()) {
      getHelpers().showToast?.("Diktat nur in NOCO AI — Hey Noko (NOCO AD) oeffnet die App");
      return;
    }
    if (!readSttConsent()) {
      pendingMicStart = { kind: "dictation", btn, getInput, onSubmit, root: root || consentRoot };
      showSttConsentIfNeeded(root || consentRoot, { force: true });
      return;
    }
    if (listeningDictation) {
      stopDictation();
      return;
    }
    const scope = root || consentRoot;
    focusInputForDictation(scope);
    window.setTimeout(() => {
      getHelpers().triggerHaptic?.();
      const started = startDictation({
        root: scope,
        micBtn: btn,
        onResult: (text, meta) => {
          const input = getInput?.();
          if (!input) return;
          input.value = text;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          if (!meta.final) focusInputForDictation(scope);
          if (meta.final && onSubmit) onSubmit(text);
        }
      });
      if (!started && micConsented) {
        getHelpers().showToast?.("Mikro nicht bereit — nochmal tippen");
      }
    }, 280);
  }

  function bindMicButton(btn, getInput, onSubmit, root) {
    if (!btn || btn.dataset.nocoVoiceBound === "1") return;
    btn.dataset.nocoVoiceBound = "1";
    btn.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isSupported()) {
          getHelpers().showToast?.("Spracheingabe nicht unterstuetzt");
          return;
        }
        if (!readSttConsent()) {
          pendingMicStart = { kind: "dictation", btn, getInput, onSubmit, root: root || consentRoot };
          showSttConsentIfNeeded(root || consentRoot, { force: true });
          return;
        }
        if (!micConsented && !sttMicReady) {
          pendingMicStart = { kind: "dictation", btn, getInput, onSubmit, root: root || consentRoot };
          void requestMicPermission().then((ok) => {
            if (!ok) {
              pendingMicStart = null;
              getHelpers().showToast?.("Mikro fuer Diktat blockiert");
              return;
            }
            sttMicReady = true;
            toggleMicDictation(btn, getInput, onSubmit, root || consentRoot);
          });
          return;
        }
        toggleMicDictation(btn, getInput, onSubmit, root || consentRoot);
      },
      false
    );
  }

  function bindWakeToggle(toggle, root) {
    if (!toggle || toggle.dataset.nocoWakeBound === "1") return;
    toggle.dataset.nocoWakeBound = "1";
    const sync = () => {
      toggle.setAttribute("aria-pressed", wakeEnabled ? "true" : "false");
      toggle.classList.toggle("is-on", wakeEnabled);
      toggle.title = wakeEnabled ? "NOCO AD 1.0 aus" : "NOCO AD 1.0 an — Hey Noco / NOCO / AI";
    };
    sync();
    toggle.addEventListener("click", async () => {
      if (!isSupported()) {
        getHelpers().showToast?.("Browser unterstuetzt keine Spracheingabe");
        return;
      }
      if (!micConsented) {
        showMicConsentIfNeeded(root || consentRoot, { force: true });
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
    initSttConsentUI();
    bindGlobalWakeLifecycle();
    const fileProto = global.location?.protocol === "file:";
    micConsented = readMicConsent();
    sttConsented = readSttConsent();
    if (micConsented) sttMicReady = true;
    const prefOn = readWakePref();
    wakeEnabled = micConsented && prefOn !== false && !fileProto;
    if (micConsented && prefOn === false) wakeEnabled = false;
    if (micConsented && wakeEnabled && !fileProto) {
      window.setTimeout(startWakeLoop, 700);
      window.setTimeout(resumeWakeListening, 2400);
      document.body.classList.add("noco-ai-wake-on");
    }
  }

  function resumeWakeListening() {
    if (!micConsented || !wakeEnabled || wakePausedForApp) return;
    if (getHelpers().isInNocoAI?.()) return;
    if (resumeWakeTimer) window.clearTimeout(resumeWakeTimer);
    resumeWakeTimer = window.setTimeout(() => {
      resumeWakeTimer = null;
      startWakeLoop();
    }, 800);
  }

  function applyWakeSettings(cfg = {}) {
    const AD = global.NocoAudioDetection || global.NocoWakeEngine;
    if (AD?.setWakeConfig) {
      AD.setWakeConfig({
        sensitivity: cfg.sensitivity,
        enabledProfiles: cfg.phrases
      });
    }
    if (cfg.enabled != null) {
      if (!micConsented && cfg.enabled) {
        if (global.location?.protocol === "file:") {
          getHelpers().showToast?.("Hey Noco: Datei-Modus — GitHub Pages oder Live Server nutzen");
          return;
        }
        showMicConsentIfNeeded(consentRoot || document.querySelector("[data-noco-ai-root]"), { force: true });
        return;
      }
      setWakeEnabled(!!cfg.enabled);
    } else if (micConsented && wakeEnabled) {
      resumeWakeListening();
    }
  }

  function bindGlobalWakeLifecycle() {
    if (global.__nocoWakeLifecycle) return;
    global.__nocoWakeLifecycle = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        wakeEngine?.stop?.();
        listeningWake = false;
        return;
      }
      resumeWakeListening();
    });
    global.addEventListener("pageshow", () => resumeWakeListening());
    global.addEventListener("focus", () => resumeWakeListening());
  }

  function stopAll() {
    setWakeEnabled(false);
    stopDictation();
    wakeEngine?.release?.();
    wakeEngine = null;
  }

  initMicConsentUI();
  initSttConsentUI();

  global.NocoAIVoice = {
    init,
    isSupported,
    needsMicPrompt,
    needsSttPrompt: () => hasSpeechRecognition() && !readSttConsent(),
    allowMicClick,
    hasMicConsent,
    hasSttConsent: () => sttConsented || readSttConsent(),
    isListening: () => listeningWake || listeningDictation,
    getWakeEnabled,
    setWakeEnabled,
    startDictation,
    stopDictation,
    stopAll,
    resumeWakeListening,
    pauseWakeForApp,
    resumeWakeForApp,
    applyWakeSettings,
    bindStatusElement,
    bindMicButton,
    bindWakeToggle,
    showMicConsentIfNeeded,
    hideMicConsent,
    showSttConsentIfNeeded,
    hideSttConsent,
    wireSttPrivacyGates,
    parseWakeTranscript,
    requestMicPermission,
    hasSpeechRecognition,
    focusInputForDictation
  };
})(typeof window !== "undefined" ? window : globalThis);
