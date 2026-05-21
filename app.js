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
const hubPanel = document.getElementById("hubPanel");
const widgetBtn = document.getElementById("widgetBtn");
const widgetPanel = document.getElementById("widgetPanel");
const widgetLibrary = document.getElementById("widgetLibrary");
const codePanel = document.getElementById("codePanel");
const codeTitle = document.getElementById("codeTitle");
const codeText = document.getElementById("codeText");
const codeInput = document.getElementById("codeInput");
const codeHint = document.getElementById("codeHint");
const codeConfirm = document.getElementById("codeConfirm");

let currentPage = 0;
let editMode = false;
let pageDrag = null;
let reorderDrag = null;
let currentApp = null;
let suppressClickUntil = 0;
let forgeSearch = "";
let codeRequest = null;

const NOCO_KEY_MAGIC_V2 = "NK3";
const NOCO_KEY_PEPPER = "noco::key::seal::v2::a9f3c2e17d";

const settings = loadSettings();
if (settings.codeLock && (settings.passkeyEnabled || settings.requireCodeOnLaunch)) {
  sessionStorage.removeItem("noco_mobile_unlocked");
}

const shortcutChoices = [
  { id: "hub", title: "NOCO Hub", icon: "N", className: "" },
  { id: "focus", title: "Focus", icon: "F", className: "focus" },
  { id: "cloud", title: "Cloud", icon: "C", className: "cloud" },
  { id: "themes", title: "Themes", icon: "T", className: "themes" },
  { id: "sync", title: "Sync", icon: "S", className: "sync" },
  { id: "security", title: "Security", icon: "S", className: "security" },
  { id: "settings", title: "Core", icon: "C", className: "core" },
  { id: "web", title: "Web", icon: "W", className: "explorer" }
];

const forgeApps = [
  { id: "pulse", title: "Pulse", icon: "P", className: "security", text: "Mini-App für schnelle Systemwerte und Gefühl." },
  { id: "sketch", title: "Sketch", icon: "S", className: "notes", text: "Kleines Zeichenbrett für Ideen auf dem Home-Screen." },
  { id: "breath", title: "Breath", icon: "B", className: "focus", text: "Ruhiger Fokus-Timer mit Glas-Atemanimation." },
  { id: "arcade", title: "Mini Arcade", icon: "A", className: "forge", text: "Zwei winzige Mobile-Spiele als Preview." },
  { id: "transit", title: "Transit", icon: "T", className: "cloud", text: "Fake-Reiseplaner im NOCO Look." }
];

const widgetDefinitions = {
  hero: { title: "Willkommen", text: "Grosser Liquid-Glass Startbereich." },
  clock: { title: "Riesen-Uhr", text: "Echte aktuelle Uhrzeit und Datum." },
  shortcuts: { title: "Shortcuts", text: "Vier schnelle App-Aktionen." },
  status: { title: "Mobile Status", text: "Version, Design und Sync-Status." },
  notes: { title: "Schnellnotiz", text: "Direkt auf Home schreiben." },
  sync: { title: "NOCO Sync", text: "Keycard Import und Export." },
  feed: { title: "Heute NOCO", text: "Kurzer System-Feed." },
  focusMini: { title: "Focus Mini", text: "Ruhige Schnellsteuerung fuer Fokus." },
  batteryLab: { title: "Akku Labor", text: "Mobile Energie-Uebersicht." },
  forgePick: { title: "Forge Tipp", text: "App-Empfehlung direkt auf Home." },
  payMini: { title: "Pay Mini", text: "NOCO Pay Status als Widget." },
  securityMini: { title: "Shield Mini", text: "Schneller Sicherheitsblick." }
};

let activeShortcuts = loadShortcuts();

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1700);
}

function hapticTap() {
  if (navigator.vibrate) navigator.vibrate(12);
}

function loadSettings() {
  try {
    return {
      theme: "aurora",
      liveWallpaper: true,
      glassBoost: true,
      motion: true,
      codeLock: false,
      passkeyEnabled: false,
      mobileCode: "",
      requireCodeOnLaunch: false,
      ...JSON.parse(localStorage.getItem("noco_mobile_settings") || "{}")
    };
  } catch (_) {
    return { theme: "aurora", liveWallpaper: true, glassBoost: true, motion: true, codeLock: false, passkeyEnabled: false, mobileCode: "", requireCodeOnLaunch: false };
  }
}

function saveSettings() {
  localStorage.setItem("noco_mobile_settings", JSON.stringify(settings));
}

function applySettings() {
  if (settings.codeLock && !settings.mobileCode && !settings.passkeyEnabled) {
    settings.codeLock = false;
    saveSettings();
  }
  document.body.dataset.theme = settings.theme;
  document.body.classList.toggle("no-live-wallpaper", !settings.liveWallpaper);
  document.body.classList.toggle("glass-boost", !!settings.glassBoost);
  document.body.classList.toggle("reduce-noco-motion", !settings.motion);
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
  return ["hub", "focus", "cloud", "themes"];
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

function visibleWidgetIds() {
  try {
    const saved = JSON.parse(localStorage.getItem("noco_mobile_visible_widgets") || "null");
    if (Array.isArray(saved) && saved.length) return saved.filter((id) => widgetDefinitions[id]);
  } catch (_) {}
  return Array.from(document.querySelectorAll(".draggable-widget")).map((item) => item.dataset.widgetId);
}

function saveVisibleWidgets(ids) {
  localStorage.setItem("noco_mobile_visible_widgets", JSON.stringify(ids));
}

function createWidgetElement(id) {
  const definition = widgetDefinitions[id];
  if (!definition) return null;
  const card = document.createElement("div");
  card.className = `${id.includes("Mini") || id.includes("Lab") || id.includes("Pick") ? "status-widget" : "feed-widget"} widget-card draggable-widget generated-widget`;
  card.dataset.widgetId = id;
  card.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Widget</p>
        <h2>${definition.title}</h2>
      </div>
      <button class="mini-action" data-widget-remove="${id}">Entfernen</button>
    </div>
    <p>${definition.text}</p>
  `;
  return card;
}

function applyVisibleWidgets() {
  const home = document.querySelector(".home-screen");
  const ids = visibleWidgetIds();
  Object.keys(widgetDefinitions).forEach((id) => {
    let element = home.querySelector(`[data-widget-id="${id}"]`);
    if (ids.includes(id)) {
      if (!element) {
        element = createWidgetElement(id);
        if (element) home.appendChild(element);
      }
      if (element) element.hidden = false;
    } else if (element) {
      element.hidden = true;
    }
  });
}

function renderWidgetLibrary() {
  if (!widgetLibrary) return;
  const visible = visibleWidgetIds();
  widgetLibrary.innerHTML = Object.entries(widgetDefinitions).map(([id, definition]) => {
    const active = visible.includes(id);
    return `
      <button class="widget-choice" data-widget-toggle="${id}">
        <span><strong>${definition.title}</strong><br><small>${definition.text}</small></span>
        <strong>${active ? "Entfernen" : "+ Hinzufuegen"}</strong>
      </button>
    `;
  }).join("");
}

function toggleWidget(id) {
  const visible = visibleWidgetIds();
  const next = visible.includes(id) ? visible.filter((item) => item !== id) : [...visible, id];
  saveVisibleWidgets(next);
  applyVisibleWidgets();
  renderWidgetLibrary();
  saveMobileOrder();
  showToast(visible.includes(id) ? "Widget entfernt" : "Widget hinzugefuegt");
}

function appHero(title, eyebrow, text) {
  return `
    <section class="app-hero widget-card">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${text}</p>
    </section>
  `;
}

function settingsTemplate() {
  return `
    ${appHero("Einstellungen", "NOCO Core Mobile", "Steuere Design, Bewegung und das mobile App-Gefühl direkt auf dem iPhone.")}
    <div class="toggle-list">
      ${toggleRow("liveWallpaper", "Live Wallpaper", "Ruhige animierte Hintergrund-Bubbles")}
      ${toggleRow("glassBoost", "Mehr Liquid Glass", "Stärkerer Glaslook für Karten und Apps")}
      ${toggleRow("motion", "Animationen", "Sanfte Übergänge und App-Start-Animationen")}
    </div>
    <div class="settings-list">
      <div class="settings-row"><span>Version</span><strong>Mobile 1.1</strong></div>
      <div class="settings-row"><span>Installation</span><strong>PWA Fullscreen</strong></div>
      <div class="settings-row"><span>Navigation</span><strong>Swipe + Desktop</strong></div>
      <button class="settings-row" data-action="open-security"><span>Sicherheit</span><strong>Security öffnen</strong></button>
    </div>
  `;
}

function settingsTemplateV2() {
  return `
    ${appHero("Einstellungen", "NOCO Core Mobile", "Der kleine Bruder von NOCO Workspace: Deck, ShieldGate, SessionVault und Mobile-Systemsteuerung.")}
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">NocoDeck</p><h3>Systemuebersicht</h3></div>
      <div class="settings-row"><span>Version</span><strong>Mobile 1.1</strong></div>
      <div class="settings-row"><span>Installation</span><strong>PWA Fullscreen</strong></div>
      <div class="settings-row"><span>Navigation</span><strong>Home + Desktop Swipe</strong></div>
    </div>
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">EtherLab</p><h3>Look und Bewegung</h3></div>
      ${toggleRow("liveWallpaper", "Live Wallpaper", "Ruhige animierte Hintergrund-Bubbles")}
      ${toggleRow("glassBoost", "Mehr Liquid Glass", "Staerkerer Glaslook fuer Karten und Apps")}
      ${toggleRow("motion", "Animationen", "Sanfte Uebergaenge und App-Start-Animationen")}
    </div>
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">ShieldGate</p><h3>Sicherheit</h3></div>
      <button class="settings-row" data-action="open-security"><span>Code, Face ID und Keycard</span><strong>Oeffnen</strong></button>
      <button class="settings-row" data-app="sync"><span>NOCO Keycard</span><strong>Import/Export</strong></button>
    </div>
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">SessionVault</p><h3>Apps und Verhalten</h3></div>
      <div class="settings-row"><span>Apps nach Installation</span><strong>Im Forge bleiben</strong></div>
      <div class="settings-row"><span>App verlassen</span><strong>Zurueck zum Desktop</strong></div>
    </div>
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">DevForge</p><h3>Entwickler</h3></div>
      <div class="settings-row"><span>GitHub Pages</span><strong>Aktiv</strong></div>
      <div class="settings-row"><span>Cache-Version</span><strong>v14</strong></div>
    </div>
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">NOCO Exclusive</p><h3>Premium</h3></div>
      <div class="settings-row"><span>Status</span><strong>Vorbereitet</strong></div>
    </div>
    <div class="core-section">
      <div class="core-section-title"><p class="eyebrow">Was ist neu</p><h3>Mobile 1.1</h3></div>
      <div class="settings-row"><span>Neu</span><strong>Widgets, Keycards, Hub, Code-Menue</strong></div>
    </div>
  `;
}

function syncTemplate() {
  const last = loadSyncInfo();
  return `
    ${appHero("Sync", "NOCO Link Mobile", "Importiere deine NOCO Keycard vom Desktop und übernimm Daten auf dein iPhone.")}
    <div class="sync-drop">
      <label class="sync-import-card">
        <input type="file" id="keycardInput" accept=".json,.noco,.txt,.html,.keycard" />
        <span><strong>Keycard importieren</strong><br><small>Desktop-Keycard auswählen oder teilen und hier einfügen.</small></span>
      </label>
      <div class="sync-status">
        <p class="eyebrow">Letzter Sync</p>
        <h2>${last ? last.title : "Noch keine Keycard"}</h2>
        <p>${last ? last.text : "Exportiere auf NOCO Desktop eine Keycard und importiere sie hier. Aktuell ist das der sichere Offline-Sync-Weg."}</p>
      </div>
      <button class="settings-row" data-action="export-mobile-keycard"><span>Mobile Keycard exportieren</span><strong>Download</strong></button>
    </div>
  `;
}

function themesTemplate() {
  const themes = [
    ["aurora", "Aurora", "preview-aurora"],
    ["midnight", "Midnight", "preview-midnight"],
    ["sunset", "Sunset Glass", "preview-sunset"],
    ["forest", "Forest Bubble", "preview-forest"]
  ];
  return `
    ${appHero("Themes", "NOCO Look Studio", "Wähle Wallpaper-Farbe, Glas-Stimmung und Bewegung für dein Mobile-System.")}
    <div class="theme-grid">
      ${themes.map(([id, title, preview]) => `
        <button class="theme-option" data-theme-choice="${id}">
          <span class="theme-preview ${preview}"></span>
          <span><strong>${title}</strong><br><small>${settings.theme === id ? "Aktiv" : "Tippen zum Aktivieren"}</small></span>
        </button>
      `).join("")}
    </div>
  `;
}

function webTemplate() {
  return `
    ${appHero("Explorer", "NOCO Web", "Eine mobile Web-Preview mit Artikeln, Suche und schnellen Ergebnissen.")}
    <input class="search-glass" value="noco mobile glas update" aria-label="NOCO Web Suche" />
    <div class="app-content-grid">
      <button class="web-result"><span><strong>NOCO Mobile startet als PWA</strong><br><small>So fühlt sich eine Website wie eine echte App an.</small></span></button>
      <button class="web-result"><span><strong>Liquid Glass Designguide</strong><br><small>Transparente Ebenen, weiche Kanten und ruhige Bewegung.</small></span></button>
      <button class="web-result"><span><strong>Desktop Sync Idee</strong><br><small>Mobile kann später Notizen, Freigaben und Codes synchronisieren.</small></span></button>
    </div>
  `;
}

function securityTemplate() {
  return `
    ${appHero("Security", "NOCO ShieldGate", "Code, Passkey, Keycard und App-Freigaben sauber an einem Ort.")}
    <div class="security-dashboard">
      <div class="security-status-card">
        <p class="eyebrow">Status</p>
        <h2>${settings.codeLock ? "Geschuetzt" : "Offen"}</h2>
        <p>${settings.codeLock ? "Dein Code schuetzt Neustart, Installationen, Deinstallationen und sensible Einstellungen." : "Aktiviere einen Code, wenn Apps und Einstellungen gesichert werden sollen."}</p>
      </div>
      <div class="core-section">
        <div class="core-section-title"><p class="eyebrow">Code-Regeln</p><h3>Wann wird gefragt?</h3></div>
        <div class="settings-row"><span>Nach Neustart / Ausloggen</span><strong>${settings.requireCodeOnLaunch || settings.passkeyEnabled ? "Pflicht" : "Aus"}</strong></div>
        <div class="settings-row"><span>Apps installieren</span><strong>${settings.codeLock ? "Code/Passkey" : "Aus"}</strong></div>
        <div class="settings-row"><span>Apps deinstallieren</span><strong>${settings.codeLock ? "Code/Passkey" : "Aus"}</strong></div>
        <div class="settings-row"><span>Sensible Einstellungen</span><strong>${settings.codeLock ? "Code/Passkey" : "Aus"}</strong></div>
      </div>
      <div class="security-action-grid">
        <button class="security-action" data-action="set-mobile-code"><strong>${settings.mobileCode ? "Code neu setzen" : "Code erstellen"}</strong><small>Sauberes Code-Menue mit Sicherheitscheck.</small></button>
        <button class="security-action" data-action="setup-passkey"><strong>${settings.passkeyEnabled ? "Passkey erneuern" : "Face ID / Passkey"}</strong><small>Mit Code als Pflicht-Fallback.</small></button>
        <button class="security-action" data-toggle-setting="codeLock"><strong>${settings.codeLock ? "Schutz deaktivieren" : "Schutz aktivieren"}</strong><small>Schaltet App- und Einstellungsfreigaben.</small></button>
        <button class="security-action" data-toggle-setting="requireCodeOnLaunch"><strong>${settings.requireCodeOnLaunch ? "Login-Code aus" : "Login-Code an"}</strong><small>Nach Reload wieder Code verlangen.</small></button>
        <button class="security-action" data-action="clear-passkey"><strong>Passkey entfernen</strong><small>Code bleibt als Schutz erhalten.</small></button>
        <button class="security-action" data-app="sync"><strong>Keycard</strong><small>Importieren oder exportieren.</small></button>
      </div>
      <button class="primary-action" data-action="scan">Security Scan starten</button>
    </div>
  `;
}

function forgeTemplate() {
  const installed = getInstalledApps();
  return `
    ${appHero("Forge", "NOCO App Store", "Neue mobile Apps, Widgets und Designs in einem schnellen Glas-Store.")}
    <div class="forge-grid">
      ${forgeApps.map((app) => `
        <div class="app-card">
          <span><strong>${app.title}</strong><br><small>${app.text}</small></span>
          <button class="forge-install" ${installed.includes(app.id) ? `data-uninstall="${app.id}"` : `data-install="${app.id}"`}>${installed.includes(app.id) ? "Deinstallieren" : "Installieren"}</button>
        </div>
      `).join("")}
    </div>
  `;
}

function forgeTemplateV2() {
  const installed = getInstalledApps();
  const query = forgeSearch.trim().toLowerCase();
  const apps = forgeApps.filter((app) => !query || app.title.toLowerCase().includes(query) || app.text.toLowerCase().includes(query));
  return `
    ${appHero("Forge", "NOCO App Store", "Sauberer Mobile-Store mit Suche, echten Installationskarten und klaren Buttons.")}
    <input class="search-glass" data-forge-search value="${forgeSearch.replace(/"/g, "&quot;")}" placeholder="Apps suchen..." aria-label="NOCO Forge Suche" />
    <div class="forge-grid">
      ${apps.map((app) => `
        <div class="app-card">
          <span class="icon-orb ${app.className}">${app.icon}</span>
          <span><strong>${app.title}</strong><br><small>${app.text}</small></span>
          <button class="forge-install" data-install="${app.id}">${installed.includes(app.id) ? "Installiert" : "Installieren"}</button>
        </div>
      `).join("") || `<div class="settings-row"><span>Nichts gefunden</span><strong>Suche aendern</strong></div>`}
    </div>
  `;
}

function notesTemplate() {
  return `
    ${appHero("Notizen", "Mobile Notes", "Schreibe direkt in der App. Alles landet beim Keycard-Export mit in deinem Stand.")}
    <div class="notes-app-editor">
      <textarea id="notesAppInput" rows="12" placeholder="Deine NOCO Notiz...">${(localStorage.getItem("noco_mobile_note") || "").replace(/</g, "&lt;")}</textarea>
      <button class="primary-action" data-action="save-note-app">Notiz speichern</button>
      <div class="settings-row"><span>Sync</span><strong>Wird in Keycard gespeichert</strong></div>
    </div>
  `;
}

function simpleAppTemplate(title, eyebrow, text, rows) {
  return `
    ${appHero(title, eyebrow, text)}
    <div class="settings-list">
      ${rows.map(([label, value]) => `<div class="settings-row"><span>${label}</span><strong>${value}</strong></div>`).join("")}
    </div>
  `;
}

function toggleRow(id, title, text) {
  return `
    <button class="toggle-card" data-toggle-setting="${id}">
      <span><strong>${title}</strong><br><small>${text}</small></span>
      <span class="switch ${settings[id] ? "active" : ""}" aria-hidden="true"></span>
    </button>
  `;
}

function openApp(appId) {
  if (editMode) return;
  currentApp = appId;
  hapticTap();
  const templates = {
    settings: settingsTemplateV2,
    themes: themesTemplate,
    sync: syncTemplate,
    web: webTemplate,
    security: securityTemplate,
    forge: forgeTemplateV2,
    notes: notesTemplate,
    cloud: () => simpleAppTemplate("Cloud", "NOCO Cloud", "Vorbereitung für echten Geräte-Sync zwischen Mobile und Desktop.", [
      ["Status", "Konzept bereit"],
      ["Notizen", "Backend nötig"],
      ["Desktop Unlock", "Pairing möglich"]
    ]),
    focus: () => simpleAppTemplate("Focus", "NOCO Focus", "Mobile Fokusprofile für ruhige Nutzung und schnellen Zugriff.", [
      ["Ruhig", "Bereit"],
      ["Gaming", "Preview"],
      ["Produktiv", "Preview"]
    ]),
    pay: () => simpleAppTemplate("Pay", "NOCO Pay", "Fake-Pay-Ansicht für spätere NOCO Demos und App-Käufe.", [
      ["Guthaben", "24,00 € Demo"],
      ["Exclusive", "Nicht aktiv"],
      ["Zahlung", "Simuliert"]
    ]),
    pulse: () => simpleAppTemplate("Pulse", "System Pulse", "Ein schneller Blick auf Gefühl, Speicher und App-Zustand.", [
      ["Performance", "Flüssig"],
      ["Speicher", "42% genutzt"],
      ["Akku-Modus", "Mobil optimiert"]
    ]),
    sketch: () => `
      ${appHero("Sketch", "NOCO Paint", "Ein kleines Glas-Zeichenbrett als mobile Kreativ-App.")}
      <textarea rows="8" placeholder="Kritzle hier erstmal als Text-Skizze..."></textarea>
    `,
    breath: () => simpleAppTemplate("Breath", "Focus Atem", "Ruhiger Atem-Timer mit sanftem Pulse-Gefühl.", [
      ["Rhythmus", "4 Sekunden"],
      ["Haptik", "Leicht"],
      ["Stimmung", "Ruhig"]
    ]),
    arcade: () => simpleAppTemplate("Mini Arcade", "NOCO Games", "Kleine Spielecke für mobile Experimente.", [
      ["Runner", "Preview"],
      ["Tiles", "Preview"],
      ["Highscore", "0"]
    ]),
    transit: () => simpleAppTemplate("Transit", "NOCO Route", "Fake-Reiseplaner für die mobile Demo-Welt.", [
      ["Nächster Halt", "NOCO Plaza"],
      ["Route", "Glaslinie 1"],
      ["Status", "Pünktlich"]
    ])
  };
  sheetContent.innerHTML = (templates[appId] || (() => simpleAppTemplate(appId, "NOCO App", "Diese App startet bald.", [])))();
  appSheet.classList.remove("hidden");
}

function closeAppToHome() {
  if (appSheet.classList.contains("hidden")) return;
  appSheet.classList.add("hidden");
  currentApp = null;
  setPage(1);
}

function runShortcut(id) {
  if (["settings", "web", "themes", "cloud", "focus", "sync", "security"].includes(id)) {
    openApp(id);
    return;
  }
  hapticTap();
  showToast(shortcutById(id).title + " aktiviert");
}

const feedItems = [
  ["NOCO Mobile 1.1", "Home-Screen, Desktop-Swipe und Liquid Glass laufen als PWA."],
  ["App-Gefühl", "Apps starten jetzt fullscreen statt als kleines Fenster unten."],
  ["Themes", "Aurora, Midnight, Sunset und Forest verändern das ganze System."],
  ["Nächster Schritt", "Cloud-Sync und Mobile Unlock brauchen später ein echtes Backend."]
];

feedItems.forEach(([title, text]) => {
  const row = document.createElement("div");
  row.className = "list-item";
  row.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  demoList.appendChild(row);
});

editBtn.addEventListener("click", () => setEditMode(!editMode));
widgetBtn.addEventListener("click", () => {
  renderWidgetLibrary();
  widgetPanel.classList.remove("hidden");
});
saveBtn.addEventListener("click", saveNote);
closeSheet.addEventListener("click", () => closeAppToHome());
codeConfirm.addEventListener("click", () => finishCodeRequest(codeInput.value.trim()));
codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") finishCodeRequest(codeInput.value.trim());
  if (event.key === "Escape") finishCodeRequest(null);
});

document.querySelectorAll("[data-page]").forEach((dot) => {
  dot.addEventListener("click", () => goToPage(Number(dot.dataset.page)));
});

document.addEventListener("click", async (event) => {
  if (Date.now() < suppressClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

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

  if (event.target.closest("[data-close-widget-panel]")) {
    widgetPanel.classList.add("hidden");
  }

  if (event.target.closest("[data-code-cancel]")) {
    finishCodeRequest(null);
  }

  const widgetToggle = event.target.closest("[data-widget-toggle]");
  if (widgetToggle) {
    toggleWidget(widgetToggle.dataset.widgetToggle);
  }

  const widgetRemove = event.target.closest("[data-widget-remove]");
  if (widgetRemove) {
    toggleWidget(widgetRemove.dataset.widgetRemove);
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

  const themeChoice = event.target.closest("[data-theme-choice]");
  if (themeChoice) {
    settings.theme = themeChoice.dataset.themeChoice;
    saveSettings();
    applySettings();
    openApp("themes");
    showToast("Theme aktiviert");
  }

  const toggle = event.target.closest("[data-toggle-setting]");
  if (toggle) {
    const key = toggle.dataset.toggleSetting;
    if (settings.codeLock && !sessionStorage.getItem("noco_mobile_unlocked") && !(await unlockDesktop())) {
      return;
    }
    if (key === "codeLock" && !settings.codeLock && !settings.mobileCode && !settings.passkeyEnabled) {
      showToast("Bitte zuerst Code einrichten");
      setMobileCode();
      return;
    }
    settings[key] = !settings[key];
    if (key === "codeLock" && !settings[key]) {
      sessionStorage.removeItem("noco_mobile_unlocked");
    }
    saveSettings();
    applySettings();
    if (currentApp === "security") openApp("security");
    else openApp("settings");
    showToast("Einstellung geändert");
  }

  if (event.target.closest("[data-action='open-security']")) {
    openApp("security");
  }

  if (event.target.closest("[data-action='set-mobile-code']")) {
    setMobileCode();
  }

  if (event.target.closest("[data-action='clear-passkey']")) {
    if (await authorizeSensitiveAction("Passkey entfernen? Bitte bestaetigen.")) {
      localStorage.removeItem("noco_mobile_passkey_id");
      settings.passkeyEnabled = false;
      saveSettings();
      openApp("security");
      showToast("Passkey entfernt");
    }
  }

  if (event.target.closest("[data-action='save-note-app']")) {
    const appInput = document.getElementById("notesAppInput");
    if (appInput) {
      noteInput.value = appInput.value;
      saveNote();
      openApp("notes");
    }
  }

  if (event.target.closest("[data-action='setup-passkey']")) {
    setupPasskey();
  }

  if (event.target.closest("[data-action='export-mobile-keycard']")) {
    exportMobileKeycard();
  }

  const install = event.target.closest("[data-install]");
  if (install) {
    await installForgeApp(install.dataset.install);
  }

  const uninstall = event.target.closest("[data-uninstall]");
  if (uninstall) {
    await uninstallForgeApp(uninstall.dataset.uninstall);
  }

  if (event.target.closest("[data-action='scan']")) {
    showToast("Scan abgeschlossen: alles sauber");
  }

  if (event.target.closest("[data-open-hub]")) {
    openHub();
  }

  if (event.target.closest("[data-close-hub]")) {
    closeHub();
  }

  const hubApp = event.target.closest("[data-hub-app]");
  if (hubApp) {
    closeHub();
    openApp(hubApp.dataset.hubApp);
  }

  const hubAction = event.target.closest("[data-hub-action]");
  if (hubAction) {
    runHubAction(hubAction.dataset.hubAction);
  }

  if (event.target === hubPanel) {
    closeHub();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-forge-search]")) {
    forgeSearch = event.target.value;
    openApp("forge");
    const input = sheetContent.querySelector("[data-forge-search]");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
});

document.addEventListener("change", (event) => {
  if (event.target?.id === "keycardInput") {
    importKeycard(event.target.files?.[0]);
  }
});

function getTrackWidth() {
  return Math.min(window.innerWidth, 430);
}

function desktopNeedsUnlock(nextPage) {
  return nextPage === 1 && settings.codeLock && !sessionStorage.getItem("noco_mobile_unlocked");
}

function isWeakCode(code) {
  return !/^\d{4,8}$/.test(code)
    || /^(\d)\1+$/.test(code)
    || ["0000", "1111", "1234", "12345", "123456", "4321", "9876"].includes(code)
    || "0123456789".includes(code)
    || "9876543210".includes(code);
}

function requestCode({ title, text, setup = false }) {
  return new Promise((resolve) => {
    codeRequest = { resolve, setup };
    codeTitle.textContent = title;
    codeText.textContent = text;
    codeHint.textContent = setup ? "4 bis 8 Zahlen, keine Reihen wie 1234 oder 0000." : "Mit deinem gespeicherten NOCO Mobile Code bestaetigen.";
    codeInput.value = "";
    codePanel.classList.remove("hidden");
    window.setTimeout(() => codeInput.focus(), 80);
  });
}

function finishCodeRequest(value) {
  if (!codeRequest) return;
  const request = codeRequest;
  codeRequest = null;
  codePanel.classList.add("hidden");
  request.resolve(value);
}

async function authorizeSensitiveAction(reason = "Diese Aktion ist geschuetzt.") {
  if (!settings.codeLock) return true;
  if (sessionStorage.getItem("noco_mobile_unlocked")) return true;
  if (settings.passkeyEnabled && await tryPasskeyUnlock()) {
    sessionStorage.setItem("noco_mobile_unlocked", "1");
    showToast("Face ID akzeptiert");
    return true;
  }
  if (!settings.mobileCode) return false;
  const entered = await requestCode({
    title: "Freigabe erforderlich",
    text: reason
  });
  if (entered && entered === settings.mobileCode) {
    sessionStorage.setItem("noco_mobile_unlocked", "1");
    showToast("Freigegeben");
    return true;
  }
  showToast("Code nicht korrekt");
  return false;
}

async function unlockDesktop() {
  if (!settings.codeLock) return true;
  if (settings.passkeyEnabled && await tryPasskeyUnlock()) {
    sessionStorage.setItem("noco_mobile_unlocked", "1");
    showToast("Face ID akzeptiert");
    return true;
  }
  if (!settings.mobileCode) {
    settings.codeLock = false;
    saveSettings();
    showToast("Sperre aus: Bitte erst Code setzen");
    return false;
  }
  return authorizeSensitiveAction("NOCO Mobile wurde neu gestartet. Bitte entsperren.");
}

async function goToPage(page) {
  const target = Math.max(0, Math.min(1, page));
  if (desktopNeedsUnlock(target) && !(await unlockDesktop())) {
    setPage(0);
    return;
  }
  setPage(target);
}

function canStartPageSwipe(event) {
  if (editMode) return false;
  if (!appSheet.classList.contains("hidden") || !shortcutPanel.classList.contains("hidden") || !hubPanel.classList.contains("hidden")) return false;
  if (event.target.closest("textarea, input, select")) return false;
  return true;
}

function openHub() {
  hapticTap();
  hubPanel.classList.remove("hidden");
}

function closeHub() {
  hubPanel.classList.add("hidden");
}

function runHubAction(action) {
  if (action === "toggle-motion") {
    settings.motion = !settings.motion;
    saveSettings();
    applySettings();
    showToast(settings.motion ? "Motion aktiv" : "Motion reduziert");
  }
  if (action === "toggle-glass") {
    settings.glassBoost = !settings.glassBoost;
    saveSettings();
    applySettings();
    showToast(settings.glassBoost ? "Glass Boost aktiv" : "Glass Boost aus");
  }
  if (action === "desktop") {
    closeHub();
    goToPage(1);
  }
}

function startPageDrag(event) {
  if (!canStartPageSwipe(event)) return;
  const touch = event.touches[0];
  pageDrag = { x: touch.clientX, y: touch.clientY, at: Date.now(), active: false, base: currentPage, dx: 0 };
}

function movePageDrag(event) {
  if (!pageDrag) return;
  const touch = event.touches[0];
  const dx = touch.clientX - pageDrag.x;
  const dy = touch.clientY - pageDrag.y;
  if (!pageDrag.active) {
    if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
    if (Math.abs(dy) > Math.abs(dx) * 1.05) {
      pageDrag = null;
      return;
    }
    pageDrag.active = true;
    screenTrack.classList.add("dragging");
  }
  event.preventDefault();
  suppressClickUntil = Date.now() + 420;
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
  if (pageDrag.active && (Math.abs(pageDrag.dx) > width * 0.18 || velocity > 0.48)) {
    next = pageDrag.dx < 0 ? pageDrag.base + 1 : pageDrag.base - 1;
  }
  pageDrag = null;
  goToPage(next);
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
  if (Math.abs(dx) > 78 && Math.abs(dx) > Math.abs(dy) * 1.25) {
    closeAppToHome();
    showToast("Zurück zum Desktop");
  }
}

document.addEventListener("touchstart", startPageDrag, { passive: true });
document.addEventListener("touchmove", movePageDrag, { passive: false });
document.addEventListener("touchend", endPageDrag, { passive: true });
document.addEventListener("touchcancel", endPageDrag, { passive: true });

appSheet.addEventListener("touchstart", startSheetSwipe, { passive: true });
appSheet.addEventListener("touchend", endSheetSwipe, { passive: true });

function saveMobileOrder() {
  const widgetOrder = Array.from(document.querySelectorAll(".draggable-widget:not([hidden])")).map((item) => item.dataset.widgetId);
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

function getInstalledApps() {
  try {
    const installed = JSON.parse(localStorage.getItem("noco_mobile_installed_apps") || "[]");
    return Array.isArray(installed) ? installed : [];
  } catch (_) {
    return [];
  }
}

function saveInstalledApps(installed) {
  localStorage.setItem("noco_mobile_installed_apps", JSON.stringify(installed));
}

function renderInstalledApps() {
  const appGrid = document.getElementById("appGrid");
  const installed = getInstalledApps();
  installed.forEach((id) => {
    if (appGrid.querySelector(`[data-app="${id}"]`)) return;
    const app = forgeApps.find((item) => item.id === id);
    if (!app) return;
    const button = document.createElement("button");
    button.className = "app-icon";
    button.dataset.app = app.id;
    button.innerHTML = `<span class="icon-orb ${app.className}">${app.icon}</span><strong>${app.title}</strong>`;
    appGrid.appendChild(button);
  });
}

async function installForgeApp(id) {
  const app = forgeApps.find((item) => item.id === id);
  if (!app) return;
  if (!(await authorizeSensitiveAction(app.title + " installieren? Bitte freigeben."))) return;
  const installed = getInstalledApps();
  if (!installed.includes(id)) {
    installed.push(id);
    saveInstalledApps(installed);
    renderInstalledApps();
    saveMobileOrder();
  }
  openApp("forge");
  showToast(app.title + " installiert");
}

async function uninstallForgeApp(id) {
  const app = forgeApps.find((item) => item.id === id);
  if (!app) return;
  if (!(await authorizeSensitiveAction(app.title + " deinstallieren? Bitte freigeben."))) return;
  saveInstalledApps(getInstalledApps().filter((item) => item !== id));
  document.querySelector(`#appGrid [data-app="${id}"]`)?.remove();
  saveMobileOrder();
  openApp("forge");
  showToast(app.title + " deinstalliert");
}

function loadSyncInfo() {
  try {
    return JSON.parse(localStorage.getItem("noco_mobile_sync_info") || "null");
  } catch (_) {
    return null;
  }
}

function randomVaultKey() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function xorText(text, key) {
  if (!key) return text;
  let out = "";
  for (let i = 0; i < text.length; i += 1) out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function fromBase64Utf8(base64) {
  const bin = atob(String(base64 || "").replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function quickHashHex(input) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 ^= c + ((i + 17) * 13);
    h2 = Math.imul(h2, 2246822519);
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  const c = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  const d = ((h1 + h2) >>> 0).toString(16).padStart(8, "0");
  return a + b + c + d + a + c + b + d;
}

function sealNocoKeyPayload(payload, vaultKey) {
  const created = new Date().toISOString();
  const nonce = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
  const bodyRaw = JSON.stringify(payload);
  const mask = quickHashHex(NOCO_KEY_PEPPER + "|" + vaultKey + "|" + created + "|" + nonce);
  const blob = toBase64Utf8(xorText(bodyRaw, mask));
  const sig = quickHashHex(NOCO_KEY_MAGIC_V2 + "|" + nonce + "|" + created + "|" + blob + "|" + NOCO_KEY_PEPPER);
  return {
    m: NOCO_KEY_MAGIC_V2,
    c: created,
    n: nonce,
    b: blob,
    s: sig.slice(0, 48),
    k: toBase64Utf8(vaultKey),
    q: toBase64Utf8(bodyRaw)
  };
}

function openNocoKeyPayload(record) {
  const vaultKey = fromBase64Utf8(record.k || "");
  const mask = quickHashHex(NOCO_KEY_PEPPER + "|" + vaultKey + "|" + record.c + "|" + record.n);
  const payload = JSON.parse(xorText(fromBase64Utf8(record.b || ""), mask));
  return Object.assign({}, payload, { sessionVaultKey: vaultKey });
}

async function importKeycard(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const data = parseKeycard(text);
    const applied = applyKeycardData(data, file.name);
    localStorage.setItem("noco_mobile_sync_info", JSON.stringify({
      title: file.name,
      text: applied.length ? "Übernommen: " + applied.join(", ") : "Keycard gespeichert, aber keine direkt passenden Mobile-Daten gefunden.",
      at: Date.now()
    }));
    openApp("sync");
    showToast("Keycard importiert");
  } catch (error) {
    showToast("Keycard konnte nicht gelesen werden");
  }
}

function parseKeycard(text) {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (["NK1", "NK2", "NK3"].includes(String(parsed?.m || ""))) {
      try {
        return openNocoKeyPayload(parsed);
      } catch (_) {}
    }
    if (parsed?.q) {
      try {
        return JSON.parse(decodeURIComponent(escape(atob(String(parsed.q)))));
      } catch (_) {
        try {
          return JSON.parse(atob(String(parsed.q)));
        } catch (_) {}
      }
    }
    if (parsed?.encrypted) {
      try {
        const mobileState = JSON.parse(decodeURIComponent(escape(atob(String(parsed.encrypted)))));
        return Object.assign({}, parsed, { mobileState });
      } catch (_) {}
    }
    return parsed;
  } catch (_) {}

  const jsonBlocks = [
    /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i,
    /NOCO_KEYCARD_DATA\s*=\s*({[\s\S]*?});/i,
    /nocoKeycard\s*=\s*({[\s\S]*?});/i
  ];
  for (const pattern of jsonBlocks) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    try {
      return JSON.parse(match[1]);
    } catch (_) {}
  }

  return { rawText: trimmed };
}

function applyKeycardData(data, fileName) {
  const applied = [];
  const mobileState = data?.mobileState || data?.state?.mobileState || data?.noco?.mobileState || {};
  const source = {
    ...(data?.state || {}),
    ...(data?.snapshot || {}),
    ...(data?.profile || {}),
    ...(data?.noco || {}),
    ...(mobileState || {}),
    ...(data || {}),
    ...(data?.settings || {})
  };

  const possibleName = source.accountName || source.username || source.userName || source.name || source.owner;
  if (possibleName) {
    localStorage.setItem("noco_mobile_owner", String(possibleName));
    applied.push("Benutzer");
  }

  const possibleCode = source.sessionCode || source.mobileCode || source.nocoCode || source.securityCode || source.shieldCode || source.passcode || source.pin || source.code || data?.code;
  if (possibleCode && /^\d{4,8}$/.test(String(possibleCode))) {
    settings.mobileCode = String(possibleCode);
    settings.codeLock = true;
    saveSettings();
    applied.push("Code");
  }

  const possibleNote = source.notesText || source.note || source.notes || source.quickNote || source.mobileNote || data?.note;
  if (typeof possibleNote === "string") {
    localStorage.setItem("noco_mobile_note", possibleNote);
    noteInput.value = possibleNote;
    applied.push("Notiz");
  }

  const possibleTheme = source.theme || source.activeTheme || source.currentTheme || source.design || data?.settings?.theme;
  const themeMap = { midnight: "midnight", aurora: "aurora", sunset: "sunset", forest: "forest", glass: "aurora", neon: "aurora", default: "aurora" };
  if (themeMap[possibleTheme]) {
    settings.theme = themeMap[possibleTheme];
    saveSettings();
    applySettings();
    applied.push("Theme");
  }

  const possibleApps = source.installedApps || source.apps || source.mobileApps || data?.installedApps;
  if (Array.isArray(possibleApps)) {
    const ids = possibleApps
      .map((app) => typeof app === "string" ? app : app?.id)
      .filter(Boolean)
      .filter((id) => forgeApps.some((app) => app.id === id));
    if (ids.length) {
      saveInstalledApps(Array.from(new Set([...getInstalledApps(), ...ids])));
      renderInstalledApps();
      applied.push("Apps");
    }
  }

  const importedShortcuts = source.shortcuts || mobileState.shortcuts;
  if (Array.isArray(importedShortcuts) && importedShortcuts.length) {
    activeShortcuts = importedShortcuts.filter((id) => shortcutChoices.some((choice) => choice.id === id)).slice(0, 4);
    while (activeShortcuts.length < 4) activeShortcuts.push(shortcutChoices.find((item) => !activeShortcuts.includes(item.id))?.id || "hub");
    saveShortcuts();
    renderShortcuts();
    applied.push("Shortcuts");
  }

  const visibleWidgets = source.visibleWidgets || mobileState.visibleWidgets;
  if (Array.isArray(visibleWidgets) && visibleWidgets.length) {
    saveVisibleWidgets(visibleWidgets.filter((id) => widgetDefinitions[id]));
    applyVisibleWidgets();
    applied.push("Widgets");
  }

  const widgetOrder = source.widgetOrder || mobileState.widgetOrder;
  if (Array.isArray(widgetOrder) && widgetOrder.length) {
    localStorage.setItem("noco_mobile_widget_order", JSON.stringify(widgetOrder));
    applyMobileOrder();
    applied.push("Widget-Reihenfolge");
  }

  const appOrder = source.appOrder || mobileState.appOrder;
  if (Array.isArray(appOrder) && appOrder.length) {
    localStorage.setItem("noco_mobile_app_order", JSON.stringify(appOrder));
    applyMobileOrder();
    applied.push("App-Reihenfolge");
  }

  localStorage.setItem("noco_mobile_last_keycard", JSON.stringify({
    fileName,
    importedAt: new Date().toISOString(),
    data
  }));

  return applied;
}

function exportMobileKeycard() {
  const note = localStorage.getItem("noco_mobile_note") || "";
  const installedApps = getInstalledApps();
  const visibleWidgets = visibleWidgetIds();
  const widgetOrder = JSON.parse(localStorage.getItem("noco_mobile_widget_order") || "[]");
  const appOrder = JSON.parse(localStorage.getItem("noco_mobile_app_order") || "[]");
  const exportedAt = new Date().toISOString();
  const owner = localStorage.getItem("noco_mobile_owner") || "NOCO Mobile User";
  const vaultKey = randomVaultKey();
  const mobileState = {
    platform: "mobile",
    version: "1.1",
    owner,
    code: settings.mobileCode || "",
    mobileCode: settings.mobileCode || "",
    nocoCode: settings.mobileCode || "",
    settings: Object.assign({}, settings),
    theme: settings.theme,
    note,
    notes: note,
    installedApps,
    mobileApps: installedApps,
    shortcuts: activeShortcuts,
    visibleWidgets,
    widgetOrder,
    appOrder,
    exportedAt
  };
  const workspacePayload = {
    type: "NOCO_KEY",
    source: "NOCO_OS_MOBILE",
    version: 1,
    createdAt: exportedAt,
    sessionVaultKey: vaultKey,
    accountName: owner,
    sessionCode: settings.mobileCode || "",
    code: settings.mobileCode || "",
    mobileCode: settings.mobileCode || "",
    nocoCode: settings.mobileCode || "",
    protection: { login: true, install: true, delete: true, sessionReset: true, hardReset: true },
    mobileState,
    settings,
    snapshot: {
      accountName: owner,
      sessionCode: settings.mobileCode || "",
      protection: { login: true, install: true, delete: true, sessionReset: true, hardReset: true },
      currentTheme: settings.theme,
      currentMode: "dark",
      systemVersion: "1.1",
      installedApps,
      mobileApps: installedApps,
      pinnedApps: [],
      notesText: note,
      note,
      notes: note,
      shortcutsEnabled: true,
      shortcuts: activeShortcuts,
      visibleWidgets,
      widgetOrder,
      appOrder,
      mobileState
    },
    state: mobileState,
    profile: { owner }
  };
  const sealed = sealNocoKeyPayload(workspacePayload, vaultKey);
  const blob = new Blob([JSON.stringify(sealed, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "NOCO-Mobile-Keycard.noco-key";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  showToast("Mobile Keycard exportiert");
}

async function setMobileCode() {
  if (settings.mobileCode && !sessionStorage.getItem("noco_mobile_unlocked")) {
    const current = await requestCode({
      title: "Aktuellen Code bestaetigen",
      text: "Bevor du den Code neu setzt, bitte den alten Code bestaetigen."
    });
    if (current !== settings.mobileCode) {
      showToast("Code nicht korrekt");
      return;
    }
  }
  const code = await requestCode({
    title: "Code festlegen",
    text: "Lege einen NOCO Mobile Code fest. Den brauchst du als Fallback, wenn Face ID nicht geht.",
    setup: true
  });
  if (code === null) return;
  if (isWeakCode(code)) {
    showToast("Code ist zu unsicher");
    return;
  }
  settings.mobileCode = code;
  settings.codeLock = true;
  saveSettings();
  sessionStorage.setItem("noco_mobile_unlocked", "1");
  openApp("security");
  showToast("Mobile Code aktiviert");
}

function bufferToBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBuffer(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function setupPasskey() {
  if (!settings.mobileCode) {
    showToast("Erst Code als Fallback setzen");
    await setMobileCode();
    if (!settings.mobileCode) return;
  }
  if (!window.PublicKeyCredential || !navigator.credentials) {
    showToast("Passkeys werden hier nicht unterstützt");
    return;
  }
  try {
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "NOCO Mobile" },
        user: {
          id: userId,
          name: "noco-mobile",
          displayName: "NOCO Mobile"
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "none"
      }
    });
    localStorage.setItem("noco_mobile_passkey_id", bufferToBase64Url(credential.rawId));
    settings.passkeyEnabled = true;
    settings.codeLock = true;
    settings.requireCodeOnLaunch = true;
    saveSettings();
    sessionStorage.setItem("noco_mobile_unlocked", "1");
    openApp("security");
    showToast("Face ID / Passkey aktiv");
  } catch (_) {
    showToast("Passkey wurde abgebrochen");
  }
}

async function tryPasskeyUnlock() {
  const id = localStorage.getItem("noco_mobile_passkey_id");
  if (!id || !window.PublicKeyCredential || !navigator.credentials) return false;
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: "public-key", id: base64UrlToBuffer(id) }],
        userVerification: "required",
        timeout: 60000
      }
    });
    return true;
  } catch (_) {
    return false;
  }
}

function startReorder(event) {
  if (!editMode) return;
  const target = event.target.closest(".draggable-widget, .app-icon");
  if (!target || target.closest(".app-sheet")) return;
  event.preventDefault();
  suppressClickUntil = Date.now() + 620;
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
  suppressClickUntil = Date.now() + 620;
  reorderDrag.ghost.style.left = event.clientX + "px";
  reorderDrag.ghost.style.top = event.clientY + "px";
  const candidates = document.elementsFromPoint(event.clientX, event.clientY);
  const over = candidates
    .map((node) => node.closest?.(".draggable-widget, .app-icon"))
    .find((node) => node && node !== reorderDrag.item && node.parentElement === reorderDrag.parent);
  document.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
  if (over) {
    over.classList.add("drop-target");
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
  document.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
  if (reorderDrag.started) {
    suppressClickUntil = Date.now() + 620;
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

applySettings();
loadNote();
renderShortcuts();
renderInstalledApps();
applyVisibleWidgets();
applyMobileOrder();
updateClock();
window.setInterval(updateClock, 1000);
