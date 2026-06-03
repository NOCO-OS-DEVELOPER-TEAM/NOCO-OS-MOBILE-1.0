/**
 * NOCO AI Interact Fix — Mount sicherstellen, ohne Mikro-/AD-Dialoge zu verstecken.
 */
(function nocoAIInteractFix(global) {
  let micPromptTimer = 0;

  function helpers() {
    return typeof global.__nocoMountHelpers === "function" ? global.__nocoMountHelpers() : null;
  }

  function getRoot() {
    return document.querySelector("[data-noco-ai-root]");
  }

  function ensureMounted() {
    const root = getRoot();
    if (!root || !global.NocoAI?.mount) return null;
    if (!root._nocoApi) {
      const h = helpers();
      if (h) global.NocoAI.mount(root, h);
    }
    return root;
  }

  /** Nur haengende body-Klassen loesen — Overlays nicht per hidden schliessen. */
  function releaseStuckBodyLocks(root) {
    if (!root) return;
    const ad = root.querySelector("[data-noco-ai-ad-feature]");
    const mic = root.querySelector("[data-noco-ai-mic-consent]");
    if (!ad || ad.classList.contains("hidden")) {
      document.body.classList.remove("noco-ai-ad-open");
      root.classList.remove("noco-ai-ad-prompt");
    }
    if (!mic || mic.classList.contains("hidden")) {
      document.body.classList.remove("noco-ai-mic-open");
      root.classList.remove("noco-ai-mic-prompt");
    }
  }

  function scheduleMicPrompt(root) {
    if (!root) return;
    window.clearTimeout(micPromptTimer);
    micPromptTimer = window.setTimeout(() => {
      micPromptTimer = 0;
      if (global.NocoAIVoice?.needsMicPrompt?.()) {
        global.NocoAIVoice.showMicConsentIfNeeded?.(root, { force: true });
      }
    }, 1400);
  }

  function watchSheet() {
    const sheet = document.getElementById("sheetContent");
    if (!sheet || sheet.dataset.nocoInteractWatch === "1") return;
    sheet.dataset.nocoInteractWatch = "1";
    const run = () => {
      const root = getRoot();
      if (!root) return;
      releaseStuckBodyLocks(root);
      ensureMounted();
      scheduleMicPrompt(root);
    };
    const obs = new MutationObserver(() => window.setTimeout(run, 0));
    obs.observe(sheet, { childList: true, subtree: true });
    run();
  }

  function boot() {
    watchSheet();
    document.addEventListener(
      "pointerup",
      (event) => {
        const root = event.target?.closest?.("[data-noco-ai-root]");
        if (!root) return;
        if (!root._nocoApi) ensureMounted();
      },
      true
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.NocoAIInteractFix = { ensureMounted, releaseStuckBodyLocks, getRoot, scheduleMicPrompt };
})(window);
