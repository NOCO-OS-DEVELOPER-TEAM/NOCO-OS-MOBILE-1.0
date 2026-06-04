/**
 * Einmaliger Mount-Helfer — kein Dauer-Remount (zerstoert Klick-Handler).
 */
(function nocoAIInteractFix(global) {
  function tryMountOnce() {
    const root = document.querySelector("[data-noco-ai-root]");
    if (!root || !global.NocoAI?.mount || root._nocoApi) return;
    const h = typeof global.__nocoMountHelpers === "function" ? global.__nocoMountHelpers() : null;
    if (h) global.NocoAI.mount(root, h);
  }

  function boot() {
    tryMountOnce();
    window.setTimeout(tryMountOnce, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.NocoAIInteractFix = { tryMountOnce };
})(window);
