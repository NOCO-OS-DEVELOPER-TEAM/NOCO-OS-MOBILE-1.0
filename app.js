const noteInput = document.getElementById("noteInput");
const saveState = document.getElementById("saveState");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const demoList = document.getElementById("demoList");
const largeClock = document.getElementById("largeClock");
const largeDate = document.getElementById("largeDate");
const screenTrack = document.getElementById("screenTrack");
const screenTitle = document.getElementById("screenTitle");
const editBtn = document.getElementById("editBtn");
const shortcutGrid = document.getElementById("shortcutGrid");
const shortcutPanel = document.getElementById("shortcutPanel");
const shortcutEditor = document.getElementById("shortcutEditor");
const appSheet = document.getElementById("appSheet");
const sheetContent = document.getElementById("sheetContent");
const closeSheet = document.getElementById("closeSheet");

let currentPage = 0;
let editMode = false;
let pageDrag = null;
let reorderDrag = null;

const shortcutChoices = [
  { id: "hub", title: "NOCO Hub", icon: "N", className: "" },
  { id: "focus", title: "Focus", icon: "F", className: "focus" },
  { id: "cloud", title: "Cloud", icon: "C", className: "cloud" },
  { id: "glass", title: "Glass", icon: "G", className: "" },
  { id: "settings", title: "Core", icon: "C", className: "core" },
  { id: "web", title: "Web", icon: "W", className: "explorer" }
];

let activeShortcuts = loadShortcuts();

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function hapticTap() {
  if (navigator.vibrate) navigator.vibrate(12);
}

function updateClock() {
  const now = new Date();
  largeClock.textContent = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });
  largeDate.textContent = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
}

function loadNote() {
  const saved = localStorage.getItem("noco_mobile_note") || "";
  noteInput.value = saved;
  saveState.textContent = saved ? "Letzte Notiz geladen." : "Noch nichts gespeichert.";
}

function saveNote() {
  localStorage.setItem("noco_mobile_note", noteInput.value.trim());
  saveState.textContent = "Gespeichert um " + new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });
  hapticTap();
  showToast("Notiz gespeichert");
}

function loadShortcuts() {
  try {
    const saved = JSON.parse(localStorage.getItem("noco_mobile_shortcuts") || "[]");
    if (Array.isArray(saved) && saved.length === 4) return saved;
  } catch (_) {}
  return ["hub", "focus", "cloud", "settings"];
}

function saveShortcuts() {
  localStorage.setItem("noco_mobile_shortcuts", JSON.stringify(activeShortcuts));
}

function shortcutById(id) {
  return shortcutChoices.find((item) => item.id === id) || shortcutChoices[0];
}

function renderShortcuts() {
  shortcutGrid.innerHTML = activeShortcuts.map((id) => {
    const shortcut = shortcutById(id);
    return `
      <button class="shortcut-btn" data-shortcut="${shortcut.id}">
        <span class="icon-orb ${shortcut.className}">${shortcut.icon}</span>
        <strong>${shortcut.title}</strong>
      </button>
    `;
  }).join("");
}

function renderShortcutEditor() {
  shortcutEditor.innerHTML = shortcutChoices.map((choice) => {
    const selected = activeShortcuts.includes(choice.id);
    return `
      <button class="shortcut-option" data-shortcut-choice="${choice.id}">
        <span><strong>${choice.title}</strong><br><small>${selected ? "Aktiv" : "Tippen zum Ersetzen"}</small></span>
        <span class="icon-orb ${choice.className}">${choice.icon}</span>
      </button>
    `;
  }).join("");
}

function setPage(page) {
  currentPage = Math.max(0, Math.min(1, page));
  screenTrack.classList.remove("dragging");
  screenTrack.style.transform = "";
  document.documentElement.style.setProperty("--page", currentPage);
  screenTrack.style.setProperty("--page", currentPage);
  screenTitle.textContent = currentPage === 0 ? "Home" : "Desktop";
  document.querySelectorAll(".dot").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.page) === currentPage);
  });
  hapticTap();
}

function setEditMode(value) {
  editMode = !!value;
  document.body.classList.toggle("edit-mode", editMode);
  editBtn.setAttribute("aria-label", editMode ? "Anpassen beenden" : "Home-Screen anpassen");
  showToast(editMode ? "Home anpassen aktiv" : "Anpassen beendet");
}

function openApp(appId) {
  if (editMode) return;
  hapticTap();
  const templates = {
    settings: `
      <p class="eyebrow">NOCO Core Mobile</p>
      <h2>Einstellungen</h2>
      <p class="muted">Mobile Einstellungen im neuen NOCO Glasdesign.</p>
      <div class="settings-list">
        <div class="settings-row"><span>Designmodus</span><strong>Liquid Glass</strong></div>
        <div class="settings-row"><span>Version</span><strong>Mobile 1.0</strong></div>
        <div class="settings-row"><span>Installation</span><strong>Home-App PWA</strong></div>
        <div class="settings-row"><span>Navigation</span><strong>Swipe + Dock</strong></div>
      </div>
    `,
    web: `
      <p class="eyebrow">NOCO Web</p>
      <h2>Explorer</h2>
      <input class="search-glass" value="noco mobile glas update" aria-label="NOCO Web Suche" />
      <div class="app-content-grid">
        <button class="web-result"><span><strong>NOCO Mobile startet als PWA</strong><br><small>So fühlt sich eine Website wie eine echte App an.</small></span></button>
        <button class="web-result"><span><strong>Liquid Glass Designguide</strong><br><small>Transparente Ebenen, weiche Kanten und ruhige Bewegung.</small></span></button>
        <button class="web-result"><span><strong>Desktop Sync Idee</strong><br><small>Mobile kann später Notizen, Freigaben und Codes synchronisieren.</small></span></button>
      </div>
    `,
    security: `
      <p class="eyebrow">NOCO Security</p>
      <h2>Mobile Schutz</h2>
      <div class="scan-ring" aria-hidden="true"></div>
      <div class="settings-list">
        <div class="settings-row"><span>PWA Sandbox</span><strong>Aktiv</strong></div>
        <div class="settings-row"><span>Lokale Notizen</span><strong>Geschützt</strong></div>
        <div class="settings-row"><span>Desktop Pairing</span><strong>Vorbereitet</strong></div>
      </div>
    `,
    forge: `
      <p class="eyebrow">NOCO Forge</p>
      <h2>App Store</h2>
      <p class="muted">Mobile Apps als Glas-Karten. Installation bleibt erstmal Demo, aber die UI ist bereit.</p>
      <div class="app-content-grid">
        <div class="app-card"><span><strong>Widgets Pack</strong><br><small>Neue Homescreen Module.</small></span><strong>Installiert</strong></div>
        <div class="app-card"><span><strong>NOCO Cloud</strong><br><small>Sync Konzept für Desktop und Mobile.</small></span><strong>Bald</strong></div>
        <div class="app-card"><span><strong>Security Plus</strong><br><small>Freigaben und Pairing.</small></span><strong>Preview</strong></div>
      </div>
    `
  };
  sheetContent.innerHTML = templates[appId] || `<h2>${appId}</h2><p class="muted">Diese App startet bald.</p>`;
  appSheet.classList.remove("hidden");
}

function runShortcut(id) {
  if (id === "settings" || id === "web") {
    openApp(id);
    return;
  }
  hapticTap();
  showToast(shortcutById(id).title + " aktiviert");
}

const feedItems = [
  ["NOCO Mobile 1.0", "Home-Screen, Desktop-Swipe und Liquid Glass laufen als PWA."],
  ["App-Gefuehl", "Auf dem Home-Bildschirm startet NOCO Mobile im Vollbild."],
  ["Widgets", "Uhr, Shortcuts, Notiz und Feed sind die ersten mobilen Widgets."],
  ["Nächster Schritt", "Lockscreen, echte App-Fenster und mehr Einstellungen können darauf aufbauen."]
];

feedItems.forEach(([title, text]) => {
  const row = document.createElement("div");
  row.className = "list-item";
  row.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  demoList.appendChild(row);
});

editBtn.addEventListener("click", () => setEditMode(!editMode));
saveBtn.addEventListener("click", saveNote);
closeSheet.addEventListener("click", () => appSheet.classList.add("hidden"));

document.querySelectorAll("[data-page]").forEach((dot) => {
  dot.addEventListener("click", () => setPage(Number(dot.dataset.page)));
});

document.addEventListener("click", (event) => {
  const app = event.target.closest("[data-app]");
  if (app) openApp(app.dataset.app);

  const shortcut = event.target.closest("[data-shortcut]");
  if (shortcut) runShortcut(shortcut.dataset.shortcut);

  const panelOpen = event.target.closest("[data-open-panel='shortcuts']");
  if (panelOpen) {
    renderShortcutEditor();
    shortcutPanel.classList.remove("hidden");
  }

  if (event.target.closest("[data-close-panel]")) {
    shortcutPanel.classList.add("hidden");
  }

  const choice = event.target.closest("[data-shortcut-choice]");
  if (choice) {
    const picked = choice.dataset.shortcutChoice;
    activeShortcuts = [picked].concat(activeShortcuts.filter((id) => id !== picked)).slice(0, 4);
    while (activeShortcuts.length < 4) {
      const next = shortcutChoices.find((item) => !activeShortcuts.includes(item.id));
      if (!next) break;
      activeShortcuts.push(next.id);
    }
    saveShortcuts();
    renderShortcuts();
    renderShortcutEditor();
    showToast("Shortcut aktualisiert");
  }
});

function getTrackWidth() {
  return Math.min(window.innerWidth, 430);
}

function canStartPageSwipe(event) {
  if (editMode) return false;
  if (!appSheet.classList.contains("hidden") || !shortcutPanel.classList.contains("hidden")) return false;
  if (event.target.closest("button, textarea, input, select")) return false;
  return true;
}

function startPageDrag(event) {
  if (!canStartPageSwipe(event)) return;
  const touch = event.touches[0];
  pageDrag = {
    x: touch.clientX,
    y: touch.clientY,
    at: Date.now(),
    active: false,
    base: currentPage,
    dx: 0
  };
}

function movePageDrag(event) {
  if (!pageDrag) return;
  const touch = event.touches[0];
  const dx = touch.clientX - pageDrag.x;
  const dy = touch.clientY - pageDrag.y;
  if (!pageDrag.active) {
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    if (Math.abs(dy) > Math.abs(dx) * 1.15) {
      pageDrag = null;
      return;
    }
    pageDrag.active = true;
    screenTrack.classList.add("dragging");
  }
  event.preventDefault();
  const width = getTrackWidth();
  const atEdge = (pageDrag.base === 0 && dx > 0) || (pageDrag.base === 1 && dx < 0);
  const easedDx = atEdge ? dx * 0.24 : dx;
  pageDrag.dx = easedDx;
  screenTrack.style.transform = `translate3d(${(-pageDrag.base * width) + easedDx}px, 0, 0)`;
}

function endPageDrag() {
  if (!pageDrag) return;
  const width = getTrackWidth();
  const velocity = Math.abs(pageDrag.dx) / Math.max(1, Date.now() - pageDrag.at);
  let next = pageDrag.base;
  if (pageDrag.active && (Math.abs(pageDrag.dx) > width * 0.28 || velocity > 0.72)) {
    next = pageDrag.dx < 0 ? pageDrag.base + 1 : pageDrag.base - 1;
  }
  pageDrag = null;
  setPage(next);
}

function closeAppToHome() {
  if (appSheet.classList.contains("hidden")) return;
  appSheet.classList.add("hidden");
  setPage(0);
  showToast("Zurück zum Home");
}

function startSheetSwipe(event) {
  const touch = event.touches[0];
  appSheet.swipeStart = { x: touch.clientX, y: touch.clientY };
}

function endSheetSwipe(event) {
  if (!appSheet.swipeStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - appSheet.swipeStart.x;
  const dy = touch.clientY - appSheet.swipeStart.y;
  appSheet.swipeStart = null;
  if (Math.abs(dx) > 74 && Math.abs(dx) > Math.abs(dy) * 1.25) closeAppToHome();
}

document.addEventListener("touchstart", startPageDrag, { passive: true });
document.addEventListener("touchmove", movePageDrag, { passive: false });
document.addEventListener("touchend", endPageDrag, { passive: true });
document.addEventListener("touchcancel", endPageDrag, { passive: true });

appSheet.addEventListener("touchstart", startSheetSwipe, { passive: true });
appSheet.addEventListener("touchend", endSheetSwipe, { passive: true });

function saveMobileOrder() {
  const widgetOrder = Array.from(document.querySelectorAll(".draggable-widget")).map((item) => item.dataset.widgetId);
  const appOrder = Array.from(document.querySelectorAll("#appGrid .app-icon")).map((item) => item.dataset.app);
  localStorage.setItem("noco_mobile_widget_order", JSON.stringify(widgetOrder));
  localStorage.setItem("noco_mobile_app_order", JSON.stringify(appOrder));
}

function applyOrder(selector, storageKey, idGetter) {
  let order = [];
  try {
    order = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (_) {}
  if (!Array.isArray(order) || !order.length) return;
  const items = Array.from(document.querySelectorAll(selector));
  if (!items.length) return;
  const parent = items[0].parentElement;
  order.forEach((id) => {
    const item = items.find((candidate) => idGetter(candidate) === id);
    if (item) parent.appendChild(item);
  });
}

function applyMobileOrder() {
  applyOrder(".draggable-widget", "noco_mobile_widget_order", (item) => item.dataset.widgetId);
  applyOrder("#appGrid .app-icon", "noco_mobile_app_order", (item) => item.dataset.app);
}

function startReorder(event) {
  if (!editMode) return;
  const target = event.target.closest(".draggable-widget, .app-icon");
  if (!target) return;
  if (target.closest(".app-sheet")) return;
  event.preventDefault();
  target.setPointerCapture?.(event.pointerId);
  reorderDrag = {
    item: target,
    parent: target.parentElement,
    started: false,
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    ghost: null
  };
}

function moveReorder(event) {
  if (!reorderDrag || reorderDrag.pointerId !== event.pointerId) return;
  event.preventDefault();
  const distance = Math.hypot(event.clientX - reorderDrag.x, event.clientY - reorderDrag.y);
  if (!reorderDrag.started && distance > 8) {
    reorderDrag.started = true;
    reorderDrag.item.classList.add("is-drag-source");
    reorderDrag.ghost = reorderDrag.item.cloneNode(true);
    reorderDrag.ghost.classList.add("drag-ghost");
    reorderDrag.ghost.style.width = reorderDrag.item.offsetWidth + "px";
    reorderDrag.ghost.style.height = reorderDrag.item.offsetHeight + "px";
    document.body.appendChild(reorderDrag.ghost);
    hapticTap();
  }
  if (!reorderDrag.started) return;
  reorderDrag.ghost.style.left = event.clientX + "px";
  reorderDrag.ghost.style.top = event.clientY + "px";
  const candidates = document.elementsFromPoint(event.clientX, event.clientY);
  const over = candidates
    .map((node) => node.closest?.(".draggable-widget, .app-icon"))
    .find((node) => node && node !== reorderDrag.item && node.parentElement === reorderDrag.parent);
  if (over) {
    const rect = over.getBoundingClientRect();
    const after = reorderDrag.parent.id === "appGrid"
      ? event.clientX > rect.left + rect.width / 2
      : event.clientY > rect.top + rect.height / 2;
    reorderDrag.parent.insertBefore(reorderDrag.item, after ? over.nextSibling : over);
  }
}

function endReorder(event) {
  if (!reorderDrag || reorderDrag.pointerId !== event.pointerId) return;
  reorderDrag.item.classList.remove("is-drag-source");
  reorderDrag.ghost?.remove();
  if (reorderDrag.started) {
    saveMobileOrder();
    showToast("Layout aktualisiert");
  }
  reorderDrag = null;
}

document.addEventListener("pointerdown", startReorder);
document.addEventListener("pointermove", moveReorder);
document.addEventListener("pointerup", endReorder);
document.addEventListener("pointercancel", endReorder);

noteInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveNote();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (_) {
      showToast("Offline-Modus noch nicht aktiv");
    }
  });
}

loadNote();
renderShortcuts();
applyMobileOrder();
updateClock();
window.setInterval(updateClock, 1000);
