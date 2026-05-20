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
let touchStartX = 0;
let touchStartY = 0;
let touchStartAt = 0;

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
  hapticTap();
  const templates = {
    settings: `
      <p class="eyebrow">NOCO Core Mobile</p>
      <h2>Einstellungen</h2>
      <div class="settings-list">
        <div class="settings-row"><span>Design</span><strong>Liquid Glass</strong></div>
        <div class="settings-row"><span>Version</span><strong>Mobile 1.0</strong></div>
        <div class="settings-row"><span>Installation</span><strong>PWA</strong></div>
        <div class="settings-row"><span>Startseite</span><strong>Home Screen</strong></div>
      </div>
    `,
    web: `
      <p class="eyebrow">NOCO Web</p>
      <h2>Web Preview</h2>
      <p class="muted">Hier entsteht der mobile NOCO Browser. Fuer jetzt ist das ein stabiler Platzhalter.</p>
    `,
    security: `
      <p class="eyebrow">NOCO Security</p>
      <h2>Mobile Schutz</h2>
      <p class="muted">PWA laeuft lokal im Browser-Sandbox-Modus. Keine echten Systemrechte, aber perfekt fuer NOCO-Demos.</p>
    `,
    forge: `
      <p class="eyebrow">NOCO Forge</p>
      <h2>App Store</h2>
      <p class="muted">Hier kommen spaeter mobile Apps, Widgets und Designs rein.</p>
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
  ["Naechster Schritt", "Lockscreen, echte App-Fenster und mehr Einstellungen koennen darauf aufbauen."]
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

document.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartAt = Date.now();
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const fastEnough = Date.now() - touchStartAt < 620;
  if (!fastEnough || Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  setPage(dx < 0 ? currentPage + 1 : currentPage - 1);
}, { passive: true });

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
updateClock();
window.setInterval(updateClock, 1000);
