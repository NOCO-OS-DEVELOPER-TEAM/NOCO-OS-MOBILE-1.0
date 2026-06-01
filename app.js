const noteInput = document.getElementById("noteInput");
const saveState = document.getElementById("saveState");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const demoList = document.getElementById("demoList");
const largeClock = document.getElementById("largeClock");
const largeDate = document.getElementById("largeDate");
const screenTrack = document.getElementById("screenTrack");
const pageStage = document.getElementById("pageStage");
const screenTitle = document.getElementById("screenTitle");
const exclusiveTopBadge = document.getElementById("exclusiveTopBadge");
const editBtn = document.getElementById("editBtn");
const shortcutGrid = document.getElementById("shortcutGrid");
const shortcutPanel = document.getElementById("shortcutPanel");
const shortcutEditor = document.getElementById("shortcutEditor");
const appSheet = document.getElementById("appSheet");
const sheetContent = document.getElementById("sheetContent");
const closeSheet = document.getElementById("closeSheet");
const firstLightPanel = document.getElementById("firstLightPanel");
const firstLightContent = document.getElementById("firstLightContent");
const spotlightPanel = document.getElementById("spotlightPanel");
const spotlightInput = document.getElementById("spotlightInput");
const spotlightResults = document.getElementById("spotlightResults");
const lockScreen = document.getElementById("lockScreen");
const lockClock = document.getElementById("lockClock");
const lockDate = document.getElementById("lockDate");
const lockWidgets = document.getElementById("lockWidgets");
const unlockBtn = document.getElementById("unlockBtn");
const lockEditBtn = document.getElementById("lockEditBtn");
const lockWaitBtn = document.getElementById("lockWaitBtn");
const hubPanel = document.getElementById("hubPanel");
const widgetBtn = document.getElementById("widgetBtn");
const widgetPanel = document.getElementById("widgetPanel");
const widgetLibrary = document.getElementById("widgetLibrary");
const homeEditChrome = document.getElementById("homeEditChrome");
const widgetAddFab = document.getElementById("widgetAddFab");
const homeEditFab = document.getElementById("homeEditFab");
const dynamicIsland = document.getElementById("dynamicIsland");
const islandMenu = document.getElementById("islandMenu");
const islandClock = document.getElementById("islandClock");
const islandStatus = document.getElementById("islandStatus");
const islandZone = document.getElementById("islandZone");
let islandOpen = false;
let bottomGesture = null;
const desktopLayout = document.getElementById("desktopLayout");
const desktopPanel = document.getElementById("desktopPanel");
const desktopLibrary = document.getElementById("desktopLibrary");
const codePanel = document.getElementById("codePanel");
const codeTitle = document.getElementById("codeTitle");
const codeText = document.getElementById("codeText");
const codeInput = document.getElementById("codeInput");
const codeHint = document.getElementById("codeHint");
const codeConfirm = document.getElementById("codeConfirm");

let currentPage = 0;
let editMode = false;
let pageScrollLock = false;
let pageDrag = null;
const appCache = new Map();
let securityScanRunning = false;
let runnerGame = {
  running: false,
  score: 0,
  playerY: 0,
  vy: 0,
  obstacleX: 118,
  timer: null,
  best: Number(localStorage.getItem("noco_mobile_runner_best") || 0)
};
let appSwipe = null;
let reorderDrag = null;
let currentApp = null;
let suppressClickUntil = 0;
let forgeSearch = "";
let codeRequest = null;
let unlockInFlight = null;
let passkeyInFlight = false;
let settingsActiveSection = "deck";
let forgeActiveSection = "discover";
let firstLightStep = 0;
let lockTimer = null;
let isLocked = false;
let lockEditMode = false;
let tapDashScore = 0;
let tapDashBest = Number(localStorage.getItem("noco_mobile_tapdash_best") || 0);
let colorCatchTarget = "Mint";
let colorCatchCombo = 0;
let colorCatchBest = Number(localStorage.getItem("noco_mobile_color_best") || 0);
let memoryState = {
  round: 1,
  sequence: [1, 3, 2],
  playerIndex: 0,
  phase: "input",
  playbackLock: false,
  best: Number(localStorage.getItem("noco_mobile_memory_best") || 0)
};
let timerState = {
  seconds: 5 * 60,
  totalSeconds: 5 * 60,
  running: false,
  mode: "custom",
  customMinutes: 5,
  timerId: null,
  endAt: null
};
let memoryPickMinutes = 10;
let calcState = { display: "0", memory: null, fresh: true };
let dodgeTimer = null;
let dodgeGame = {
  running: false,
  score: 0,
  best: Number(localStorage.getItem("noco_mobile_dodge_best") || 0),
  playerX: 50,
  obstacleX: 50,
  obstacleY: -14
};

const UNLOCK_HOLD_MS = 2000;
let unlockHoldRaf = 0;
let unlockHoldStarted = 0;
let lockSwipeStart = null;

const GESTURE = {
  pageStart: 18,
  pageRatio: 1.28,
  pageSnap: 0.18,
  pageVelocity: 0.52,
  sheetStart: 22,
  sheetRatio: 1.35,
  sheetSnap: 84,
  sheetVelocity: 0.46,
  verticalCancelRatio: 1.08,
  clickSuppressMs: 360
};

const APP_GLYPHS = {
  settings: "⚙",
  security: "⬡",
  forge: "✦",
  sync: "↻",
  hub: "◈",
  toon: "▤",
  focus: "◎",
  cloud: "☁",
  themes: "◐",
  exclusive: "✧",
  web: "⬒",
  notes: "✎",
  pay: "◆",
  pulse: "♡",
  sketch: "✏",
  breath: "○",
  arcade: "▣",
  tapdash: "⚡",
  colorcatch: "◉",
  memorygrid: "▦",
  dodgerun: "➤",
  runner: "▸",
  transit: "⌁",
  mood: "◑",
  wallet: "◎",
  vault: "⛨",
  glowcam: "◌",
  tasks: "☑",
  timer: "◴",
  memories: "◷",
  radar: "◎",
  recipes: "☰",
  calculator: "⊞",
  weather: "☁",
  flashlight: "☼",
  quotes: "❝",
  nocoai: "✧",
  "exclusive-lab": "✧",
  "deep-scan": "◎",
  "pro-themes": "◐",
  beam: "⌕",
  beam_home: "⌂",
  beam_desktop: "▣",
  beam_hub: "◈",
  beam_widgets: "▦",
  beam_edit: "✎",
  beam_scan: "⬡",
  folder_games: "▣",
  folder_design: "◐",
  folder_workspace: "◇"
};

let gestureSafetyTimer = null;

function getAppGlyph(appId) {
  if (!appId) return "◆";
  if (String(appId).startsWith("folder-")) {
    return APP_GLYPHS[`folder_${String(appId).slice(7)}`] || "◆";
  }
  if (String(appId).startsWith("beam:")) {
    const key = String(appId).slice(5).replace(/-/g, "_");
    return APP_GLYPHS[`beam_${key}`] || APP_GLYPHS.beam;
  }
  return APP_GLYPHS[appId] || "◆";
}

function renderIconOrb(meta, className = "", size = "") {
  const id = typeof meta === "object" ? meta.id : meta;
  const cls = typeof meta === "object" ? (meta.className || className) : className;
  const glyph = getAppGlyph(id);
  const sizeClass = size === "sm" ? " icon-orb--sm" : size === "lg" ? " icon-orb--lg" : "";
  const safeCls = cls || "neutral";
  return `<span class="icon-orb${sizeClass} ${safeCls}" data-app-icon="${id}" aria-hidden="true"><span class="icon-orb-shine"></span><span class="icon-orb-glyph">${glyph}</span></span>`;
}

function armGestureSafety(ms = 520) {
  if (gestureSafetyTimer) window.clearTimeout(gestureSafetyTimer);
  gestureSafetyTimer = window.setTimeout(cleanupGestureState, ms);
}

function cleanupGestureState() {
  gestureSafetyTimer = null;
  pageDrag = null;
  appSwipe = null;
  pageStage?.classList.remove("page-swiping");
  appSheet?.classList.remove("app-navigating");
  document.body.classList.remove("noco-transitioning");
  pageScrollLock = false;
  resetSheetGestureTransform();
}

const NOCO_KEY_MAGIC_V2 = "NK3";
const NOCO_KEY_PEPPER = "noco::key::seal::v2::a9f3c2e17d";

const settings = loadSettings();
if (settings.codeLock) {
  sessionStorage.removeItem("noco_mobile_unlocked");
}
if (settings.passkeyEnabled || settings.requireCodeOnLaunch) {
  sessionStorage.removeItem("noco_mobile_launch_unlocked");
}

const shortcutChoices = [
  { id: "hub", title: "NOCO Hub", icon: "N", className: "" },
  { id: "toon", title: "Toon", icon: "T", className: "toon" },
  { id: "focus", title: "Focus", icon: "F", className: "focus" },
  { id: "cloud", title: "Cloud", icon: "C", className: "cloud" },
  { id: "themes", title: "Themes", icon: "T", className: "themes" },
  { id: "sync", title: "Sync", icon: "S", className: "sync" },
  { id: "security", title: "Security", icon: "S", className: "security" },
  { id: "exclusive", title: "Exclusive", icon: "X", className: "exclusive" },
  { id: "settings", title: "Core", icon: "C", className: "core" },
  { id: "web", title: "Web", icon: "W", className: "explorer" }
];

const forgeApps = [
  { id: "pulse", title: "Pulse", icon: "P", className: "security", text: "Mini-App fuer schnelle Systemwerte und Gefuehl." },
  { id: "sketch", title: "Sketch", icon: "S", className: "notes", text: "Kleines Zeichenbrett fuer Ideen auf dem Home-Screen." },
  { id: "breath", title: "Breath", icon: "B", className: "focus", text: "Ruhiger Fokus-Timer mit Glas-Atemanimation." },
  { id: "arcade", title: "Mini Arcade", icon: "A", className: "forge", text: "Zwei winzige Mobile-Spiele als Preview." },
  { id: "tapdash", title: "Tap Dash", icon: "D", className: "forge", text: "Tippe schnell, sammle Punkte und schlage deinen Mobile-Highscore." },
  { id: "colorcatch", title: "Color Catch", icon: "C", className: "themes", text: "Triff die richtige Farbe, bevor NOCO den Vibe wechselt." },
  { id: "memorygrid", title: "Memory Grid", icon: "M", className: "focus", text: "Merke dir die leuchtende Reihenfolge und spiele sie nach." },
  { id: "dodgerun", title: "Dodge Run", icon: "R", className: "forge", text: "Ein echtes kleines Ausweich-Spiel: bewege den Orb und weich den Blöcken aus." },
  { id: "transit", title: "Transit", icon: "T", className: "cloud", text: "Fake-Reiseplaner im NOCO Look." },
  { id: "mood", title: "Mood Board", icon: "M", className: "themes", text: "Sammelt Farben, Vibes und Wallpaper-Ideen fuer dein Setup." },
  { id: "wallet", title: "Wallet Watch", icon: "W", className: "pay", text: "Kleiner NOCO Pay Verlauf mit Budget-Gefuehl." },
  { id: "vault", title: "Vault Mini", icon: "V", className: "security", text: "Private Checkliste fuer sensible Mobile-Sachen." },
  { id: "glowcam", title: "GlowCam", icon: "G", className: "explorer", text: "Fake-Kamera-Look mit Lichtstimmung und Profilkarten." },
  { id: "tasks", title: "Tasks", icon: "K", className: "notes", text: "Schnelle Aufgabenliste mit Mobile-Feeling." },
  { id: "timer", title: "Timer", icon: "Z", className: "focus", text: "Countdown mit eigenen Minuten — startet zuverlaessig im Hintergrund." },
  { id: "memories", title: "Memory", icon: "M", className: "focus", text: "Erinnerungen mit Countdown — z. B. per NOCO AI in 20 Minuten." },
  { id: "radar", title: "Radar", icon: "R", className: "cloud", text: "NOCO Status-Radar fuer Netzwerk, Sync und Systemlaune." },
  { id: "recipes", title: "Recipes", icon: "R", className: "themes", text: "Kleine Rezept- und Ideen-App im Liquid-Glass Look." },
  { id: "calculator", title: "Rechner", icon: "=", className: "core", text: "Glas-Taschenrechner mit Speicher und sauberer Logik." },
  { id: "weather", title: "Wetter", icon: "W", className: "cloud", text: "NOCO Wetter mit Live-Refresh und Stunden-Vorschau." },
  { id: "flashlight", title: "Taschenlampe", icon: "L", className: "explorer", text: "Hellmodus direkt im Phone-Frame." },
  { id: "quotes", title: "Daily", icon: "Q", className: "focus", text: "Taegliche NOCO Sprueche zum Teilen und Merken." },
  { id: "toon", title: "NOCO Toon", icon: "T", className: "toon", text: "Mobile Zeitung mit kurzen NOCO Updates, Workspace-News und Statusmeldungen." },
  { id: "exclusive-lab", title: "Exclusive Lab", icon: "X", className: "exclusive", text: "Premium-Labor mit neuen Glas-Features zuerst.", exclusive: true },
  { id: "deep-scan", title: "Deep Scan", icon: "D", className: "exclusive", text: "Erweiterter Security-Scan fuer Exclusive Member.", exclusive: true },
  { id: "pro-themes", title: "Pro Themes", icon: "T", className: "exclusive", text: "Zwei mobile Premium-Looks mit mehr Tiefe und Glow.", exclusive: true }
];

const widgetDefinitions = {
  hero: { title: "Willkommen", text: "Grosser Liquid-Glass Startbereich." },
  clock: { title: "Riesen-Uhr", text: "Echte aktuelle Uhrzeit und Datum." },
  shortcuts: { title: "Shortcuts", text: "Vier schnelle App-Aktionen." },
  status: { title: "Mobile Status", text: "Version, Design und Sync-Status." },
  notes: { title: "Schnellnotiz", text: "Direkt auf Home schreiben." },
  sync: { title: "NOCO Sync", text: "Keycard Import und Export." },
  feed: { title: "Heute NOCO", text: "Kurzer System-Feed." },
  nocoai: { title: "NOCO AI", text: "Offline-Assistent auf dem Home-Screen — Apps oeffnen und chatten." },
  focusMini: { title: "Focus Mini", text: "Ruhige Schnellsteuerung fuer Fokus." },
  batteryLab: { title: "Akku Labor", text: "Mobile Energie-Uebersicht." },
  forgePick: { title: "Forge Tipp", text: "App-Empfehlung direkt auf Home." },
  payMini: { title: "Pay Mini", text: "NOCO Pay Status als Widget." },
  securityMini: { title: "Shield Mini", text: "Schneller Sicherheitsblick." }
};

let activeShortcuts = loadShortcuts();

const appFolders = {
  games: ["tapdash", "colorcatch", "memorygrid", "dodgerun", "runner", "arcade"],
  design: ["themes", "sketch", "mood", "pro-themes", "glowcam", "quotes"],
  workspace: ["settings", "security", "sync", "nocoai", "notes", "tasks", "memories", "calculator", "timer", "weather", "cloud", "toon", "forge", "pay"]
};

const LIBRARY_CORE_STANDARD = ["settings", "security", "sync", "nocoai"];
let expandedLibraryId = null;
let openAppInFlight = false;
let pendingOpenAppId = null;

const LIBRARY_QUICK_IDS = ["nocoai", "notes", "tasks", "calculator", "weather", "themes"];

function getLibraryFolderApps(folderId) {
  const installed = new Set(getInstalledApps());
  if (folderId === "core") {
    const ids = [...LIBRARY_CORE_STANDARD];
    [...appFolders.workspace, ...appFolders.design].forEach((id) => {
      if (installed.has(id) && !ids.includes(id) && !appFolders.games.includes(id)) ids.push(id);
    });
    return [...new Set(ids)];
  }
  if (folderId === "forge") {
    const ids = ["forge"];
    installed.forEach((id) => {
      if (!LIBRARY_CORE_STANDARD.includes(id) && !appFolders.games.includes(id) && !ids.includes(id)) ids.push(id);
    });
    return ids;
  }
  if (folderId === "games") {
    const ids = [];
    appFolders.games.forEach((id) => {
      if (installed.has(id) || id === "arcade") ids.push(id);
    });
    return [...new Set(ids)];
  }
  return [];
}

function renderLibraryFolderContent(folderId) {
  const appsEl = document.querySelector(`[data-library-apps="${folderId}"]`);
  if (!appsEl) return;
  const ids = getLibraryFolderApps(folderId);
  if (!ids.length) {
    appsEl.innerHTML = `<p class="library-empty">Noch keine Apps hier. Installiere welche in Forge.</p>`;
    return;
  }
  appsEl.innerHTML = ids
    .map((id) => {
      const meta = getAppMeta(id);
      return `<button type="button" class="library-app" data-app="${id}">${renderIconOrb({ id, className: meta.className })}<span>${meta.title}</span></button>`;
    })
    .join("");
}

function toggleLibraryFolder(folderId) {
  const card = document.querySelector(`[data-library-root="${folderId}"]`);
  if (!card || editMode) return;
  const wasOpen = card.classList.contains("is-expanded");
  document.querySelectorAll(".library-card.is-expanded").forEach((c) => c.classList.remove("is-expanded"));
  expandedLibraryId = null;
  if (wasOpen) return;
  renderLibraryFolderContent(folderId);
  card.classList.add("is-expanded");
  expandedLibraryId = folderId;
  hapticTap();
}

function refreshLibraryExpand() {
  if (expandedLibraryId) renderLibraryFolderContent(expandedLibraryId);
}

function renderLibraryGrid() {
  renderLibraryQuick();
  ["core", "forge", "games"].forEach((id) => renderLibraryFolderContent(id));
}

function renderLibraryQuick() {
  const el = document.getElementById("libraryQuick");
  if (!el) return;
  const installed = new Set(getInstalledApps());
  const ids = LIBRARY_QUICK_IDS.filter((id) => {
    if (id === "nocoai" || id === "notes") return true;
    return installed.has(id);
  });
  el.innerHTML = `
    <p class="library-quick-label">Schnellzugriff</p>
    <div class="library-quick-grid">
      ${ids
        .map((id) => {
          const meta = getAppMeta(id);
          return `<button type="button" class="library-quick-app" data-app="${id}">${renderIconOrb({ id, className: meta.className })}<span>${meta.title}</span></button>`;
        })
        .join("")}
    </div>
  `;
}

function syncHomeNoteFromStore() {
  if (!window.NocoNotes) return;
  window.NocoNotes.reload();
  const active = window.NocoNotes.getActiveNote();
  if (active && noteInput) noteInput.value = active.body;
}

const DESKTOP_BLOCKS = {
  beam: { title: "NOCO Beam", text: "Lokale Systemsuche auf dem Geraet" },
  apps: { title: "Haupt-Apps", text: "Core, Security, Forge und Sync" },
  folders: { title: "Ordner", text: "Spiele, Design und Workspace" }
};

const DEFAULT_DESKTOP_LAYOUT = ["beam", "apps", "folders"];

const searchIndex = [
  { id: "nocoai", title: "NOCO AI", type: "App", keywords: "noco ai ki chat assistent offline fragen oeffnen apps dialog hilfe" },
  { id: "settings", title: "Core", type: "App", keywords: "settings core nococore deck einstellungen system toggle glas motion app handling" },
  { id: "settings:shield", app: "settings", title: "ShieldGate", type: "Einstellung", keywords: "shield shieldgate sh sicherheit passkey code face id freigabe schutz" },
  { id: "settings:vault", app: "settings", title: "SessionVault", type: "Einstellung", keywords: "session vault sessionvault keycard daten apps dev exclusive cache" },
  { id: "security", title: "Security", type: "App", keywords: "security schutz passkey code face id scan shieldgate" },
  { id: "sync", title: "Sync / Keycard", type: "App", keywords: "sync keycard import export anmelden workspace verbinden" },
  { id: "forge", title: "Forge", type: "App", keywords: "forge store apps installieren löschen loeschen appstore" },
  { id: "notes", title: "Notizen", type: "App", keywords: "notizen schreiben text note merken schnellnotiz" },
  { id: "themes", title: "Themes", type: "App", keywords: "themes design farben look wallpaper aurora glas" },
  { id: "exclusive", title: "Exclusive", type: "App", keywords: "exclusive abo premium trial plus member geld" },
  { id: "pay", title: "Pay", type: "App", keywords: "pay wallet bezahlen geld euro ausgaben" },
  { id: "toon", title: "Toon", type: "App", keywords: "toon zeitung news workspace meldungen" },
  { id: "focus", title: "Focus", type: "App", keywords: "focus fokus ruhig timer konzentration" },
  { id: "web", title: "Web", type: "App", keywords: "web explorer browser suche" },
  { id: "dodgerun", title: "Dodge Run", type: "Spiel", keywords: "spiel game ausweichen dodge run orb block" },
  { id: "runner", title: "NOCO Runner", type: "Spiel", keywords: "runner springen spiel arcade" },
  { id: "calculator", title: "Rechner", type: "App", keywords: "rechner calculator mathe plus minus" },
  { id: "weather", title: "Wetter", type: "App", keywords: "wetter wetterbericht grad sonne regen" },
  { id: "flashlight", title: "Taschenlampe", type: "App", keywords: "licht lampe hell flashlight" },
  { id: "quotes", title: "Daily", type: "App", keywords: "spruch quote daily motivation" },
  { id: "tasks", title: "Tasks", type: "App", keywords: "aufgaben todo liste tasks erledigen" },
  { id: "timer", title: "Timer", type: "App", keywords: "timer countdown fokus pause" },
  { id: "memories", title: "Memory", type: "App", keywords: "memory erinnerung reminder wecker merken" },
  { id: "beam:calculator", title: "Rechner", type: "Werkzeug", keywords: "rechner calculator mathe" },
  { id: "beam:tasks", title: "Tasks", type: "Werkzeug", keywords: "aufgaben todo tasks liste" },
  { id: "beam:timer", title: "Timer", type: "Werkzeug", keywords: "timer countdown fokus" },
  { id: "folder:games", title: "Ordner Spiele", type: "Ordner", keywords: "spiele games arcade dodge tap memory color" },
  { id: "folder:design", title: "Ordner Design", type: "Ordner", keywords: "design themes look farben sketch mood" },
  { id: "folder:workspace", title: "Ordner Workspace", type: "Ordner", keywords: "workspace core sync security pay notizen" },
  { id: "beam", title: "NOCO Beam", type: "Suche", keywords: "beam suche search finden lokal apps core sync ordner" },
  { id: "beam:home", title: "Zum Home", type: "Navigation", keywords: "home startseite widgets zurueck" },
  { id: "beam:desktop", title: "Zu Apps", type: "Navigation", keywords: "desktop apps icon grid seite" },
  { id: "beam:hub", title: "NOCO Hub", type: "Tool", keywords: "hub schnellmenu core security motion glass" },
  { id: "beam:widgets", title: "Widget-Bibliothek", type: "Tool", keywords: "widgets hinzufuegen home anpassen" },
  { id: "beam:desktop-blocks", title: "Desktop-Bloecke", type: "Tool", keywords: "desktop hinzufuegen layout bloecke" },
  { id: "beam:edit-home", title: "Home anpassen", type: "Tool", keywords: "home bearbeiten stift verschieben widgets" },
  { id: "beam:edit-desktop", title: "Desktop anpassen", type: "Tool", keywords: "desktop bearbeiten stift layout" },
  { id: "beam:security-scan", title: "Security Scan", type: "Werkzeug", keywords: "security scan schutz pruefen shield" },
  { id: "beam:sync", title: "Sync oeffnen", type: "Werkzeug", keywords: "sync keycard import export verbinden" },
  { id: "beam:forge", title: "Forge Store", type: "Werkzeug", keywords: "forge store apps installieren" },
  { id: "beam:themes", title: "Themes", type: "Werkzeug", keywords: "themes design farben wallpaper look" },
  { id: "beam:cloud", title: "Cloud", type: "Werkzeug", keywords: "cloud speicher dateien" },
  { id: "beam:focus", title: "Focus Timer", type: "Werkzeug", keywords: "focus fokus timer konzentration" },
  { id: "beam:arcade", title: "Mini Arcade", type: "Werkzeug", keywords: "arcade spiele games mini" }
];

const BEAM_TOOL_IDS = [
  "beam:home",
  "beam:desktop",
  "beam:hub",
  "beam:widgets",
  "beam:edit-home",
  "beam:security-scan",
  "beam:sync",
  "beam:forge",
  "beam:calculator",
  "beam:tasks",
  "beam:timer"
];

const BEAM_SUGGEST_IDS = ["settings", "security", "sync", "forge", "notes", "themes", "folder:games", "folder:workspace"];

function initSearchIndex() {
  forgeApps.forEach((app) => {
    if (searchIndex.some((entry) => entry.id === app.id)) return;
    searchIndex.push({
      id: app.id,
      title: app.title,
      type: app.exclusive ? "Exclusive" : "Forge App",
      keywords: `${app.title} ${app.text} forge mini app ${app.className}`
    });
  });
}

function showToast(text, duration = 1700) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), duration);
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
      nativeFeel: true,
      compactTiles: false,
      strictSecurity: true,
      autoLock: true,
      autoLockSeconds: 60,
      lockWidgets: ["clock", "security", "sync"],
      codeLock: false,
      passkeyEnabled: false,
      mobileCode: "",
      requireCodeOnLaunch: false,
      nocoExclusive: false,
      exclusiveTrialUsed: false,
      exclusivePlan: "",
      nocoAiPlus: false,
      payBalance: 24,
      paymentMethod: false,
      ...JSON.parse(localStorage.getItem("noco_mobile_settings") || "{}")
    };
  } catch (_) {
    return { theme: "aurora", liveWallpaper: true, glassBoost: true, motion: true, nativeFeel: true, compactTiles: false, keepAppsAlive: true, strictSecurity: true, autoLock: true, autoLockSeconds: 60, lockWidgets: ["clock", "security", "sync"], codeLock: false, passkeyEnabled: false, mobileCode: "", requireCodeOnLaunch: false, nocoExclusive: false, exclusiveTrialUsed: false, exclusivePlan: "", nocoAiPlus: false, payBalance: 24, paymentMethod: false };
  }
}

function saveSettings() {
  localStorage.setItem("noco_mobile_settings", JSON.stringify(settings));
}

function syncExclusiveAiBundle() {
  const wantPlus = isExclusiveActive();
  if (settings.nocoAiPlus !== wantPlus) {
    settings.nocoAiPlus = wantPlus;
    saveSettings();
  }
}

function applySettings() {
  syncExclusiveAiBundle();
  if (settings.codeLock && !settings.mobileCode && !settings.passkeyEnabled) {
    if (!settings.strictSecurity) {
      settings.codeLock = false;
      saveSettings();
    }
  }
  if (settings.nativeFeel === undefined) settings.nativeFeel = true;
  if (settings.glassBoost === undefined) settings.glassBoost = true;
  document.body.dataset.theme = settings.theme;
  document.body.classList.add("noco-native");
  document.body.classList.toggle("no-live-wallpaper", !settings.liveWallpaper);
  document.body.classList.toggle("glass-boost", settings.glassBoost !== false);
  document.body.classList.toggle("reduce-noco-motion", !settings.motion);
  document.body.classList.toggle("native-feel", settings.nativeFeel !== false);
  document.body.classList.toggle("compact-tiles", !!settings.compactTiles);
  applyDeviceLayoutClass();
  const showExclusiveBadge = isExclusiveActive() && settings.exclusivePlan !== "trial";
  exclusiveTopBadge?.classList.toggle("hidden", !showExclusiveBadge);
  if (exclusiveTopBadge) exclusiveTopBadge.textContent = "Exclusive";
  syncCoreToggleStates();
}

function syncCoreToggleStates() {
  const root = sheetContent || document;
  root.querySelectorAll("[data-toggle-setting]").forEach((btn) => {
    const key = btn.dataset.toggleSetting;
    const sw = btn.querySelector(".switch");
    if (key && sw) sw.classList.toggle("active", !!settings[key]);
  });
  root.querySelectorAll("[data-lock-time]").forEach((btn) => {
    const sec = Number(btn.dataset.lockTime || 60);
    btn.classList.toggle("active", Number(settings.autoLockSeconds || 60) === sec);
  });
}

function isExclusiveActive() {
  return !!settings.nocoExclusive;
}

function formatEuro(value) {
  return Number(value || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function loadTransactions() {
  try {
    const entries = JSON.parse(localStorage.getItem("noco_mobile_transactions") || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch (_) {
    return [];
  }
}

function saveTransactions(entries) {
  localStorage.setItem("noco_mobile_transactions", JSON.stringify(entries.slice(0, 24)));
}

function addTransaction(title, amount, type = "system") {
  const entry = { title, amount, type, at: new Date().toISOString() };
  saveTransactions([entry, ...loadTransactions()]);
}

function changeBalance(amount, title, type = "system") {
  settings.payBalance = Math.max(0, Number(settings.payBalance || 0) + amount);
  settings.paymentMethod = true;
  saveSettings();
  addTransaction(title, amount, type);
}

function updateClock() {
  const now = new Date();
  const timeText = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });
  if (largeClock) largeClock.textContent = timeText;
  if (islandClock) islandClock.textContent = timeText;
  if (largeDate) {
    largeDate.textContent = now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long"
    });
  }
}

function setIslandExpanded(open) {
  islandOpen = !!open;
  islandMenu?.classList.toggle("hidden", !islandOpen);
  dynamicIsland?.classList.toggle("is-expanded", islandOpen);
  dynamicIsland?.setAttribute("aria-expanded", islandOpen ? "true" : "false");
  document.body.classList.toggle("island-open", islandOpen);
  updateIslandUI();
}

function closeAllOverlays(options = {}) {
  const { keepApp = false } = options;
  setIslandExpanded(false);
  closeBeam();
  closeHub();
  shortcutPanel?.classList.add("hidden");
  widgetPanel?.classList.add("hidden");
  desktopPanel?.classList.add("hidden");
  codePanel?.classList.add("hidden");
  if (!keepApp && appSheet && !appSheet.classList.contains("hidden")) {
    closeAppSheetVisual();
  }
  if (!keepApp) document.body.classList.remove("sheet-open");
}

function updateIslandUI() {
  const appOpen = !!(currentApp && appSheet && !appSheet.classList.contains("hidden"));
  document.body.classList.toggle("island-app-mode", appOpen);
  document.querySelectorAll(".island-ai-btn").forEach((btn) => {
    btn.classList.toggle("active", currentApp === "nocoai" && appOpen);
  });
  if (islandStatus) {
    if (timerState.running) {
      const rem = formatTimerDisplay(getTimerRemaining());
      islandStatus.textContent = `◴ ${rem}`;
      islandStatus.hidden = false;
      islandStatus.setAttribute("aria-hidden", "false");
      islandStatus.classList.add("is-timer");
    } else if (appOpen) {
      const meta = getAppMeta(currentApp);
      islandStatus.textContent = meta.title;
      islandStatus.hidden = false;
      islandStatus.setAttribute("aria-hidden", "false");
      islandStatus.classList.remove("is-timer");
    } else {
      islandStatus.textContent = "";
      islandStatus.hidden = true;
      islandStatus.setAttribute("aria-hidden", "true");
      islandStatus.classList.remove("is-timer");
    }
  }
  if (islandClock && timerState.running) {
    islandClock.dataset.timerActive = "1";
  } else if (islandClock) {
    delete islandClock.dataset.timerActive;
  }
  document.querySelectorAll(".island-page-tab, [data-island-pip]").forEach((el) => {
    const page = el.dataset.page ?? el.dataset.islandPip;
    if (page == null) return;
    el.classList.toggle("active", Number(page) === currentPage);
  });
}

function refreshHomeStatus() {
  const syncEl = document.querySelector(".bento-status .mini-metrics span:last-child strong");
  if (syncEl) {
    const hasKeycard = !!localStorage.getItem("noco_mobile_last_keycard");
    syncEl.textContent = hasKeycard ? "Sync" : "Lokal";
  }
  const shieldBtn = document.querySelector(".bento-status [data-app='security']");
  if (shieldBtn) {
    shieldBtn.textContent = settings.mobileCode || settings.passkeyEnabled ? "Aktiv" : "Shield";
  }
}

function showCoachIfNeeded() {
  const coach = document.getElementById("coachBanner");
  if (!coach || !hasCompletedFirstLight()) return;
  if (localStorage.getItem("noco_mobile_coach_done")) {
    coach.classList.add("hidden");
    return;
  }
  coach.classList.remove("hidden");
}

function dismissCoach() {
  localStorage.setItem("noco_mobile_coach_done", "1");
  document.getElementById("coachBanner")?.classList.add("hidden");
}

function loadNote() {
  if (window.NocoNotes) {
    window.NocoNotes.reload();
    syncHomeNoteFromStore();
    const active = window.NocoNotes.getActiveNote();
    saveState.textContent = active?.body ? `«${active.title}» geladen.` : "Noch nichts gespeichert.";
    return;
  }
  const saved = localStorage.getItem("noco_mobile_note") || "";
  noteInput.value = saved;
  saveState.textContent = saved ? "Letzte Notiz geladen." : "Noch nichts gespeichert.";
}

function saveNote() {
  const body = noteInput.value.trim();
  if (window.NocoNotes) {
    const active = window.NocoNotes.getActiveNote();
    window.NocoNotes.updateNote(active.id, { body });
  } else {
    localStorage.setItem("noco_mobile_note", body);
  }
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
  if (!shortcutGrid) return;
  shortcutGrid.innerHTML = activeShortcuts.map((id) => {
    const shortcut = shortcutById(id);
    return `
      <button type="button" class="shortcut-btn" data-shortcut="${shortcut.id}">
        ${renderIconOrb({ id: shortcut.id, className: shortcut.className || "neutral" })}
        <span class="shortcut-label">${shortcut.title}</span>
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
        ${renderIconOrb({ id: choice.id, className: choice.className || "neutral" }, "", "sm")}
      </button>
    `;
  }).join("");
}

function hasCompletedFirstLight() {
  return localStorage.getItem("noco_mobile_firstlight_done") === "1";
}

function renderFirstLight() {
  if (!firstLightContent) return;
  const steps = [
    {
      eyebrow: "FirstLight Mobile",
      title: "Willkommen bei NOCO OS Mobile.",
      text: "Richte dein mobiles NOCO ein: Keycard anmelden, Schutz wählen, Design setzen und am Ende direkt eine neue Keycard exportieren.",
      body: `
        <button class="primary-action" data-firstlight-next>Setup starten</button>
        <button class="settings-row" data-firstlight-skip><span>Später</span><strong>Desktop öffnen</strong></button>
      `
    },
    {
      eyebrow: "Keycard",
      title: "Mit Workspace anmelden.",
      text: "Wenn du schon eine NOCO Keycard hast, kannst du sie direkt am Anfang importieren. Ohne Keycard geht es lokal weiter.",
      body: `
        <label class="sync-import-card firstlight-import">
          <input type="file" id="firstLightKeycardInput" accept=".json,.noco,.noco-key,.txt,.html,.keycard" />
          <span><strong>Keycard anmelden</strong><br><small>Workspace-Daten, Code, Apps und Pay übernehmen.</small></span>
        </label>
        <button class="settings-row" data-firstlight-next><span>Ohne Keycard weiter</span><strong>Lokal</strong></button>
      `
    },
    {
      eyebrow: "ShieldGate",
      title: "Schutz festlegen.",
      text: "Empfohlen: Code als Fallback und Passkey/Face ID für Installation, Löschen, Keycards und neues Entsperren.",
      body: `
        <button class="primary-action" data-action="set-mobile-code"><span>Code erstellen</span></button>
        <button class="settings-row" data-action="setup-passkey"><span>Passkey / Face ID</span><strong>${settings.passkeyEnabled ? "Aktiv" : "Einrichten"}</strong></button>
        ${toggleRow("strictSecurity", "Strenger Modus", "Immer für Installieren, Löschen und Keycards fragen")}
        ${toggleRow("autoLock", "Auto-Lock", "Nach 1 Minute Ruhe zum Sperrbildschirm")}
        <button class="settings-row" data-firstlight-next><span>Weiter</span><strong>Design</strong></button>
      `
    },
    {
      eyebrow: "NocoDeck",
      title: "Look wählen.",
      text: "Nimm den Workspace-Vibe mit: Liquid Glass, Motion und ein ruhiges Mobile-Wallpaper.",
      body: `
        ${toggleRow("liveWallpaper", "Live Wallpaper", "Sanfter animierter Hintergrund")}
        ${toggleRow("glassBoost", "Liquid Glass Boost", "Mehr Tiefe und Glow")}
        ${toggleRow("nativeFeel", "App Handling", "Mehr App-Gefühl, weniger Webseite")}
        <button class="primary-action" data-firstlight-next>Fast fertig</button>
      `
    },
    {
      eyebrow: "SessionVault",
      title: "Fertig. Keycard sichern?",
      text: "Exportiere deinen Mobile-Stand direkt: Code, Apps, Widgets, Pay, Exclusive und Toon wandern in die Keycard.",
      body: `
        <button class="primary-action" data-firstlight-export>Mobile Keycard exportieren</button>
        <button class="settings-row" data-firstlight-finish><span>NOCO Mobile starten</span><strong>Bereit</strong></button>
      `
    }
  ];
  const step = steps[Math.max(0, Math.min(firstLightStep, steps.length - 1))];
  firstLightContent.innerHTML = `
    <div class="firstlight-progress">${steps.map((_, index) => `<span class="${index <= firstLightStep ? "active" : ""}"></span>`).join("")}</div>
    <section class="firstlight-hero">
      <p class="eyebrow">${step.eyebrow}</p>
      <h1>${step.title}</h1>
      <p>${step.text}</p>
    </section>
    <div class="firstlight-body">${step.body}</div>
  `;
}

function showFirstLight() {
  if (!firstLightPanel || hasCompletedFirstLight()) return;
  firstLightStep = 0;
  renderFirstLight();
  firstLightPanel.classList.remove("hidden");
}

function finishFirstLight() {
  localStorage.setItem("noco_mobile_firstlight_done", "1");
  if (!firstLightPanel) return;
  firstLightPanel.classList.add("firstlight-finish");
  showToast("Willkommen in NOCO Mobile");
  window.setTimeout(() => {
    firstLightPanel.classList.add("hidden");
    firstLightPanel.classList.remove("firstlight-finish");
    setPage(0);
    resetAutoLockTimer();
    refreshHomeStatus();
    showCoachIfNeeded();
  }, 1050);
}

function lockWidgetDefinitions() {
  return {
    clock: { title: "Uhr", value: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), text: "NOCO Zeit" },
    security: { title: "ShieldGate", value: settings.codeLock || settings.passkeyEnabled ? "Aktiv" : "Offen", text: "Passkey / Code" },
    sync: { title: "Keycard", value: loadSyncInfo() ? "Verbunden" : "Lokal", text: "Workspace Sync" },
    pay: { title: "Pay", value: formatEuro(settings.payBalance), text: "Wallet" },
    exclusive: { title: "Exclusive", value: isExclusiveActive() ? "Member" : "Offen", text: "Premium" },
    focus: { title: "Focus", value: "Ruhig", text: "Mobile Profil" }
  };
}

function updateLockClock() {
  const now = new Date();
  if (lockClock) lockClock.textContent = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (lockDate) lockDate.textContent = now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}

function renderLockWidgets() {
  if (!lockWidgets) return;
  const defs = lockWidgetDefinitions();
  const selected = Array.isArray(settings.lockWidgets) && settings.lockWidgets.length ? settings.lockWidgets : ["clock", "security", "sync"];
  lockWidgets.innerHTML = (lockEditMode ? Object.keys(defs) : selected).map((id) => {
    const item = defs[id];
    if (!item) return "";
    const active = selected.includes(id);
    return `
      <button class="lock-widget ${active ? "active" : ""}" data-lock-widget="${id}">
        <span>${item.title}</span><strong>${item.value}</strong><small>${lockEditMode ? active ? "Aktiv" : "Tippen zum Anzeigen" : item.text}</small>
      </button>
    `;
  }).join("");
}

function showLockScreen(reason = "NOCO Mobile gesperrt") {
  if (!lockScreen || !hasCompletedFirstLight()) return;
  isLocked = true;
  updateLockClock();
  renderLockWidgets();
  lockScreen.classList.remove("hidden");
  showToast(reason);
}

async function unlockFromLockScreen() {
  cancelUnlockHold();
  const ok = await unlockDesktop();
  if (!ok) return;
  isLocked = false;
  lockScreen?.classList.add("hidden");
  sessionStorage.setItem("noco_mobile_launch_unlocked", "1");
  resetAutoLockTimer();
  showToast("Entsperrt");
}

function setUnlockHoldProgress(progress) {
  if (!unlockBtn) return;
  const clamped = Math.max(0, Math.min(1, progress));
  unlockBtn.style.setProperty("--hold-progress", String(clamped));
}

function cancelUnlockHold() {
  if (unlockHoldRaf) window.cancelAnimationFrame(unlockHoldRaf);
  unlockHoldRaf = 0;
  unlockHoldStarted = 0;
  unlockBtn?.classList.remove("is-holding");
  setUnlockHoldProgress(0);
}

function tickUnlockHold() {
  if (!unlockHoldStarted) return;
  const progress = (Date.now() - unlockHoldStarted) / UNLOCK_HOLD_MS;
  setUnlockHoldProgress(progress);
  if (progress >= 1) {
    cancelUnlockHold();
    void unlockFromLockScreen();
    return;
  }
  unlockHoldRaf = window.requestAnimationFrame(tickUnlockHold);
}

function startUnlockHold() {
  if (!unlockBtn || !lockScreen || lockScreen.classList.contains("hidden")) return;
  cancelUnlockHold();
  unlockHoldStarted = Date.now();
  unlockBtn.classList.add("is-holding");
  setUnlockHoldProgress(0);
  unlockHoldRaf = window.requestAnimationFrame(tickUnlockHold);
}

function initLockScreenGestures() {
  if (!unlockBtn) return;
  unlockBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startUnlockHold();
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    unlockBtn.addEventListener(type, cancelUnlockHold);
  });

  lockScreen?.addEventListener("touchstart", (event) => {
    if (event.target.closest("button, input, textarea, .lock-edit")) return;
    const touch = event.touches[0];
    lockSwipeStart = { x: touch.clientX, y: touch.clientY, at: Date.now() };
  }, { passive: true });

  lockScreen?.addEventListener("touchend", (event) => {
    if (!lockSwipeStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - lockSwipeStart.x;
    const dy = touch.clientY - lockSwipeStart.y;
    lockSwipeStart = null;
    if (dy < -70 && Math.abs(dy) > Math.abs(dx) * 1.15) {
      void unlockFromLockScreen();
    }
  }, { passive: true });
}

function resetAutoLockTimer() {
  if (lockTimer) window.clearTimeout(lockTimer);
  if (!settings.autoLock || !hasCompletedFirstLight() || isLocked) return;
  const seconds = Math.max(15, Number(settings.autoLockSeconds || 60));
  lockTimer = window.setTimeout(() => showLockScreen("Auto-Lock nach " + seconds + " Sekunden"), seconds * 1000);
}

function toggleLockWidget(id) {
  const selected = Array.isArray(settings.lockWidgets) ? [...settings.lockWidgets] : ["clock", "security", "sync"];
  const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id].slice(-4);
  settings.lockWidgets = next.length ? next : ["clock"];
  saveSettings();
  renderLockWidgets();
}

function updatePageToggle() {
  updateIslandUI();
}

function getTrackWidth() {
  return screenTrack?.clientWidth || Math.min(window.innerWidth, 430);
}

function setPageStageTransform(page, dragPx = 0, animate = true) {
  if (!pageStage) return;
  const width = getTrackWidth();
  pageStage.classList.toggle("dragging", !animate);
  pageStage.style.transform = `translate3d(${(-page * width) + dragPx}px, 0, 0)`;
}

function scrollTrackToPage(page, smooth = false) {
  pageScrollLock = true;
  setPageStageTransform(page, 0, smooth);
  window.setTimeout(() => {
    pageScrollLock = false;
  }, smooth ? 440 : 0);
}

function applyPageState(page, options = {}) {
  const { scroll = false, smooth = false, haptic = true } = options;
  const previousPage = currentPage;
  currentPage = Math.max(0, Math.min(1, page));
  document.documentElement.style.setProperty("--page", currentPage);
  screenTrack?.style.setProperty("--page", currentPage);
  document.body.classList.toggle("desktop-page", currentPage === 1);
  document.body.classList.toggle("home-page", currentPage === 0);
  updateHomeEditChrome();
  document.querySelectorAll("#pageStage > .screen, .page-stage > .screen").forEach((screen, index) => {
    const active = index === currentPage;
    screen.classList.toggle("is-active", active);
    screen.setAttribute("aria-hidden", active ? "false" : "true");
    if (active && previousPage !== currentPage) {
      screen.scrollTop = 0;
    }
  });
  if (scroll) scrollTrackToPage(currentPage, smooth);
  screenTitle.textContent = currentPage === 0 ? "Home" : "Apps";
  updatePageToggle();
  if (currentPage === 1) {
    renderLibraryGrid();
    refreshLibraryExpand();
  }
  if (editMode) setEditMode(true);
  updateIslandUI();
  if (haptic && previousPage !== currentPage) {
    hapticTap();
    showToast(currentPage === 0 ? "Home" : "Apps", 900);
  }
  updateIslandUI();
}

function setPage(page) {
  applyPageState(page, { scroll: true, smooth: false, haptic: true });
}

function initPageScrollSync() {
  pageStage?.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    document.body.classList.remove("noco-transitioning");
    if (gestureSafetyTimer) {
      window.clearTimeout(gestureSafetyTimer);
      gestureSafetyTimer = null;
    }
    if (currentPage === 1) repairDesktopGrid("page-transition");
  });
}

function isTapTarget(target) {
  return !!target?.closest?.(
    "button, a, input, textarea, select, label, [role='button'], [data-app], [data-folder], [data-library-folder], [data-action], [data-shortcut], [data-open-panel], .app-icon, .folder-tile, .quick-tile, .library-app, .library-head, .shortcut-btn, .mini-action, .beam-strip, .forge-install, .icon-orb, .icon-orb-glyph, [data-app-icon], .widget-add-fab, .edit-fab, .noco-ai-chip, .noco-ai-send"
  );
}

function canStartPageSwipe(event) {
  if (editMode || pageDrag) return false;
  if (document.body.classList.contains("sheet-open")) return false;
  if (!spotlightPanel?.classList.contains("hidden")) return false;
  if (!hubPanel?.classList.contains("hidden")) return false;
  if (document.body.classList.contains("hub-open")) return false;
  if (document.body.classList.contains("island-open")) return false;
  if (!appSheet?.classList.contains("hidden")) return false;
  if (!lockScreen?.classList.contains("hidden")) return false;
  if (!firstLightPanel?.classList.contains("hidden")) return false;
  const target = event.target;
  if (!target?.closest?.(".screen-track")) return false;
  if (target.closest(".mobile-topbar, .page-dots, .island-zone, .island-menu")) return false;
  if (isTapTarget(target)) return false;
  if (target.closest("textarea, input, select, [contenteditable='true']")) return false;
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
    cancelled: false,
    base: currentPage,
    rawDx: 0
  };
}

function movePageDrag(event) {
  if (!pageDrag || pageDrag.cancelled) return;
  const touch = event.touches[0];
  const dx = touch.clientX - pageDrag.x;
  const dy = touch.clientY - pageDrag.y;
  pageDrag.rawDx = dx;
  if (!pageDrag.active) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < GESTURE.pageStart) return;
    const intent = getGestureIntent(dx, dy, GESTURE.pageRatio);
    if (intent === "vertical") {
      pageDrag.cancelled = true;
      pageDrag = null;
      return;
    }
    if (intent !== "horizontal") return;
    pageDrag.active = true;
    pageScrollLock = true;
    pageStage?.classList.add("page-swiping");
  }
  if (event.cancelable) event.preventDefault();
  const width = getTrackWidth();
  const atEdge = (pageDrag.base === 0 && dx > 0) || (pageDrag.base === 1 && dx < 0);
  const followDx = atEdge ? dx * 0.22 : dx;
  const maxDrag = width;
  const clampedDx = Math.max(-maxDrag, Math.min(maxDrag, followDx));
  setPageStageTransform(pageDrag.base, clampedDx, false);
}

function endPageDrag() {
  if (!pageDrag) return;
  const width = getTrackWidth();
  const base = pageDrag.base;
  const wasActive = pageDrag.active;
  const rawDx = pageDrag.rawDx;
  const velocity = Math.abs(rawDx) / Math.max(1, Date.now() - pageDrag.at);
  pageDrag = null;
  pageStage?.classList.remove("page-swiping");
  if (!wasActive) {
    pageScrollLock = false;
    scrollTrackToPage(base, true);
    return;
  }
  if (Math.abs(rawDx) < 10) {
    pageScrollLock = false;
    scrollTrackToPage(base, true);
    return;
  }
  suppressClickUntil = Date.now() + GESTURE.clickSuppressMs;
  let next = base;
  if (Math.abs(rawDx) > width * GESTURE.pageSnap || velocity > GESTURE.pageVelocity) {
    next = rawDx < 0 ? base + 1 : base - 1;
  } else if (Math.abs(rawDx) > width * 0.14) {
    next = rawDx < 0 ? base + 1 : base - 1;
  }
  next = Math.max(0, Math.min(1, next));
  void goToPage(next);
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function searchScore(item, query) {
  const haystack = normalizeSearch([item.title, item.type, item.keywords].join(" "));
  const normalized = normalizeSearch(query);
  if (!normalized) return 0;
  if (haystack.includes(normalized)) return 100 - Math.min(40, haystack.indexOf(normalized));
  return normalized.split(/\s+/).filter((part) => part.length && haystack.includes(part)).length * 18;
}

function resolveBeamTool(id) {
  closeBeam();
  if (id === "beam:home") {
    void goToPage(0);
    return;
  }
  if (id === "beam:desktop") {
    void goToPage(1);
    return;
  }
  if (id === "beam:hub") {
    openHub();
    return;
  }
  if (id === "beam:widgets") {
    void goToPage(0);
    widgetPanel?.classList.remove("hidden");
    return;
  }
  if (id === "beam:desktop-blocks") {
    void goToPage(1);
    desktopPanel?.classList.remove("hidden");
    return;
  }
  if (id === "beam:edit-home") {
    void goToPage(0);
    setEditMode(true);
    return;
  }
  if (id === "beam:edit-desktop") {
    void goToPage(1);
    setEditMode(true);
    return;
  }
  if (id === "beam:security-scan") {
    openApp("security");
    window.setTimeout(() => runSecurityScan(), 320);
    return;
  }
  if (id === "beam:sync") {
    openApp("sync");
    return;
  }
  if (id === "beam:forge") {
    openApp("forge");
    return;
  }
  if (id === "beam:themes") {
    openApp("themes");
    return;
  }
  if (id === "beam:cloud") {
    openApp("cloud");
    return;
  }
  if (id === "beam:focus") {
    openApp("focus");
    return;
  }
  if (id === "beam:arcade") {
    openApp("arcade");
    return;
  }
  if (id === "beam:calculator") {
    openApp("calculator");
    return;
  }
  if (id === "beam:tasks") {
    openApp("tasks");
    return;
  }
  if (id === "beam:timer") {
    openApp("timer");
    return;
  }
}

function resolveSearchItem(item) {
  if (item.id === "beam") {
    openBeam();
    return;
  }
  if (item.id.startsWith("beam:")) {
    resolveBeamTool(item.id);
    return;
  }
  if (item.id.startsWith("folder:")) {
    closeBeam();
    openFolder(item.id.replace("folder:", ""));
    return;
  }
  closeBeam();
  if (item.id === "settings:shield") settingsActiveSection = "shield";
  if (item.id === "settings:vault") settingsActiveSection = "vault";
  openApp(item.app || item.id.split(":")[0]);
}

function beamResultIconFor(item) {
  const appId = item.app || String(item.id).replace(/^beam:/, "") || item.id;
  return renderIconOrb({ id: appId, className: getAppMeta(appId).className }, "", "sm");
}

function renderSpotlightResultButton(item) {
  return `
    <button type="button" class="spotlight-result" data-spotlight-open="${item.id}">
      <span class="beam-result-icon">${beamResultIconFor(item)}</span>
      <span class="spotlight-result-copy"><strong>${item.title}</strong><small>${item.type}</small></span>
      <em>${item.keywords.split(" ").slice(0, 4).join(" ")}</em>
    </button>
  `;
}

function renderSpotlightResults(query = "") {
  if (!spotlightResults) return;
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    const tools = BEAM_TOOL_IDS.map((id) => searchIndex.find((entry) => entry.id === id)).filter(Boolean);
    const suggested = BEAM_SUGGEST_IDS.map((id) => searchIndex.find((entry) => entry.id === id)).filter(Boolean);
    spotlightResults.innerHTML = `
      <div class="beam-section">
        <p class="beam-section-label">Schnellwerkzeuge</p>
        <div class="beam-tool-grid">
          ${tools.map((item) => `
            <button type="button" class="beam-tool" data-spotlight-open="${item.id}">
              <span class="beam-result-icon">${beamResultIconFor(item)}</span>
              <span><strong>${item.title}</strong><small>${item.type}</small></span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="beam-section">
        <p class="beam-section-label">Vorschlaege</p>
        ${suggested.map((item) => renderSpotlightResultButton(item)).join("")}
      </div>
    `;
    return;
  }
  const results = searchIndex
    .map((item) => ({ item, score: searchScore(item, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
  if (!results.length) {
    spotlightResults.innerHTML = `<div class="settings-row"><span>NOCO Beam</span><strong>Keine Treffer</strong></div>`;
    return;
  }
  const groups = new Map();
  results.forEach(({ item }) => {
    const key = item.type || "Treffer";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  spotlightResults.innerHTML = Array.from(groups.entries()).map(([type, items]) => `
    <div class="beam-section">
      <p class="beam-section-label">${type}</p>
      ${items.map((item) => renderSpotlightResultButton(item)).join("")}
    </div>
  `).join("");
}

function openBeam() {
  setIslandExpanded(false);
  closeHub();
  spotlightPanel?.classList.remove("hidden");
  renderSpotlightResults("");
  window.setTimeout(() => spotlightInput?.focus(), 80);
}

function closeBeam() {
  spotlightPanel?.classList.add("hidden");
  if (spotlightInput) spotlightInput.value = "";
}

const openSpotlight = openBeam;
const closeSpotlight = closeBeam;

function getAppMeta(appId) {
  const base = baseDesktopApps.find((item) => item.id === appId);
  if (base) return base;
  const forge = forgeApps.find((item) => item.id === appId);
  if (forge) return { id: forge.id, title: forge.title, icon: forge.icon, className: forge.className };
  const titles = {
    settings: { id: "settings", title: "Core", icon: "C", className: "core" },
    nocoai: { id: "nocoai", title: "NOCO AI", icon: "✧", className: "core" },
    pay: { id: "pay", title: "Pay", icon: "P", className: "pay" },
    notes: { id: "notes", title: "Notizen", icon: "N", className: "notes" },
    web: { id: "web", title: "Web", icon: "W", className: "explorer" },
    exclusive: { id: "exclusive", title: "Exclusive", icon: "X", className: "exclusive" }
  };
  return titles[appId] || { id: appId, title: appId, icon: appId.slice(0, 1).toUpperCase(), className: "forge" };
}

function openFolder(folderId) {
  const ids = appFolders[folderId] || [];
  const titleMap = { games: "Spiele", design: "Design", workspace: "Workspace" };
  const cards = ids.map((id) => {
    const app = getAppMeta(id);
    return `<button type="button" class="folder-app desktop-tile" data-app="${app.id}">${renderIconOrb(app)}<strong>${app.title}</strong></button>`;
  }).join("");
  renderAppSheet("folder-" + folderId, appShell(`
    ${appHero(titleMap[folderId] || "Ordner", "NOCO Folder", "Schneller App-Ordner für deinen Mobile Desktop.")}
    <div class="folder-app-grid">${cards}</div>
  `));
}

function ensureDesktopGridVisible() {
  const appGrid = document.getElementById("appGrid");
  if (!appGrid) return;
  appGrid.hidden = false;
  appGrid.removeAttribute("hidden");
}

function loadDesktopVisible() {
  try {
    const saved = JSON.parse(localStorage.getItem("noco_mobile_desktop_visible") || "null");
    if (Array.isArray(saved) && saved.length) return saved.filter((id) => DESKTOP_BLOCKS[id]);
  } catch (_) {}
  return [...DEFAULT_DESKTOP_LAYOUT];
}

function saveDesktopVisible(ids) {
  localStorage.setItem("noco_mobile_desktop_visible", JSON.stringify(ids));
}

function loadDesktopLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem("noco_mobile_desktop_layout") || "null");
    if (Array.isArray(saved) && saved.length) return saved.filter((id) => DESKTOP_BLOCKS[id]);
  } catch (_) {}
  return [...DEFAULT_DESKTOP_LAYOUT];
}

function saveDesktopLayout(order) {
  localStorage.setItem("noco_mobile_desktop_layout", JSON.stringify(order));
}

function applyDesktopVisible() {
  if (!desktopLayout) return;
  const visible = loadDesktopVisible();
  desktopLayout.querySelectorAll(".desktop-block").forEach((block) => {
    const id = block.dataset.desktopBlock;
    const show = visible.includes(id);
    block.hidden = !show;
    block.classList.toggle("is-hidden-block", !show);
  });
}

function applyDesktopLayout() {
  if (!desktopLayout) return;
  const order = loadDesktopLayout();
  order.forEach((id) => {
    const block = desktopLayout.querySelector(`[data-desktop-block="${id}"]`);
    if (block) desktopLayout.appendChild(block);
  });
  applyDesktopVisible();
}

function renderDesktopLibrary() {
  if (!desktopLibrary) return;
  const visible = loadDesktopVisible();
  desktopLibrary.innerHTML = Object.entries(DESKTOP_BLOCKS).map(([id, meta]) => {
    const active = visible.includes(id);
    return `
      <button type="button" class="widget-choice" data-desktop-add="${id}" ${active ? "disabled" : ""}>
        <span><strong>${meta.title}</strong><br><small>${meta.text}</small></span>
        <strong>${active ? "Aktiv" : "+ Hinzufuegen"}</strong>
      </button>
    `;
  }).join("");
}

function hideDesktopBlock(id) {
  const visible = loadDesktopVisible().filter((item) => item !== id);
  if (!visible.length) {
    showToast("Mindestens ein Bereich bleibt sichtbar");
    return;
  }
  saveDesktopVisible(visible);
  applyDesktopVisible();
  renderDesktopLibrary();
  showToast((DESKTOP_BLOCKS[id]?.title || id) + " entfernt");
}

function showDesktopBlock(id) {
  if (!DESKTOP_BLOCKS[id]) return;
  const visible = loadDesktopVisible();
  if (!visible.includes(id)) visible.push(id);
  saveDesktopVisible(visible);
  applyDesktopVisible();
  applyDesktopLayout();
  renderDesktopLibrary();
  showToast((DESKTOP_BLOCKS[id]?.title || id) + " hinzugefuegt");
}

function refreshWidgetEditButtons() {
  document.querySelectorAll(".home-screen .draggable-widget").forEach((widget) => {
    const existing = widget.querySelector(".edit-remove[data-widget-remove]");
    if (!editMode) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "edit-remove";
    button.dataset.widgetRemove = widget.dataset.widgetId;
    button.setAttribute("aria-label", "Widget entfernen");
    button.textContent = "×";
    widget.appendChild(button);
  });
}

function updateHomeEditChrome() {
  const onHome = currentPage === 0;
  const showChrome = onHome && editMode;
  if (homeEditChrome) homeEditChrome.hidden = !showChrome;
  if (homeEditFab) {
    homeEditFab.setAttribute("aria-label", "Bearbeiten beenden");
  }
}

function setEditMode(value) {
  editMode = !!value;
  if (editMode) setIslandExpanded(false);
  const onDesktop = currentPage === 1;
  document.body.classList.toggle("edit-mode", editMode);
  document.body.classList.toggle("desktop-page", currentPage === 1);
  document.body.classList.toggle("home-page", currentPage === 0);
  editBtn.setAttribute("aria-label", editMode ? "Bearbeiten beenden" : (onDesktop ? "Desktop anpassen" : "Home anpassen"));
  refreshWidgetEditButtons();
  updateHomeEditChrome();
  if (editMode && onDesktop) renderDesktopLibrary();
  showToast(editMode ? (onDesktop ? "Desktop anpassen aktiv" : "Home: verschieben, + fuer Widgets") : "Anpassen beendet");
}

function openWidgetPanelFromHome() {
  renderWidgetLibrary();
  widgetPanel?.classList.remove("hidden");
  document.body.classList.add("sheet-open");
}

function visibleWidgetIds() {
  try {
    const saved = JSON.parse(localStorage.getItem("noco_mobile_visible_widgets") || "null");
    if (Array.isArray(saved) && saved.length) return saved.filter((id) => widgetDefinitions[id]);
  } catch (_) {}
  const fromDom = Array.from(document.querySelectorAll(".home-bento .draggable-widget:not([hidden])")).map((item) => item.dataset.widgetId);
  if (fromDom.length) return fromDom;
  return ["hero", "clock", "status", "shortcuts", "nocoai", "notes", "sync", "feed"];
}

function saveVisibleWidgets(ids) {
  localStorage.setItem("noco_mobile_visible_widgets", JSON.stringify(ids));
}

function createNocoAIWidgetElement() {
  const card = document.createElement("div");
  card.className = "noco-ai-widget widget-card draggable-widget generated-widget bento-nocoai";
  card.dataset.widgetId = "nocoai";
  card.innerHTML = window.NocoAI?.buildWidgetMarkup?.() || "<p>NOCO AI</p>";
  return card;
}

function createWidgetElement(id) {
  if (id === "nocoai") return createNocoAIWidgetElement();
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
      <button type="button" class="mini-action" data-widget-remove="${id}" hidden>Entfernen</button>
    </div>
    <p>${definition.text}</p>
  `;
  return card;
}

function highlightCoreTarget(selector) {
  const sheet = sheetContent || document.getElementById("sheetContent");
  if (!sheet) return;
  const el = sheet.querySelector(selector);
  if (!el) return;
  window.setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ai-core-highlight");
    window.setTimeout(() => el.classList.remove("ai-core-highlight"), 2400);
  }, 220);
}

async function navigateCoreFromAI(opts = {}) {
  const { section = "deck", toggle, value, autoLockSeconds, highlight } = opts;
  if (section) settingsActiveSection = section;

  if (autoLockSeconds != null) {
    settings.autoLockSeconds = autoLockSeconds;
    settings.autoLock = value !== false;
  } else if (toggle != null && value !== undefined) {
    if (toggle === "codeLock" && value && !settings.mobileCode && !settings.passkeyEnabled) {
      await openApp("settings");
      setMobileCode();
      return;
    }
    settings[toggle] = !!value;
    if (toggle === "codeLock" && !settings.codeLock) {
      sessionStorage.removeItem("noco_mobile_unlocked");
      sessionStorage.removeItem("noco_mobile_launch_unlocked");
    }
  }

  saveSettings();
  applySettings();
  if (settings.autoLock) resetAutoLockTimer();

  invalidateAppCache("settings");
  await openApp("settings");
  refreshCoreSection();
  syncCoreToggleStates();

  if (highlight === "lock-time") highlightCoreTarget(".lock-time-grid");
  else if (toggle) highlightCoreTarget(`[data-toggle-setting="${toggle}"]`);
}

function setHomeWidgetsFromAI(ids) {
  const next = (Array.isArray(ids) ? ids : []).filter((id) => widgetDefinitions[id]);
  if (!next.includes("hero")) next.unshift("hero");
  saveVisibleWidgets(next.length ? next : ["hero"]);
  applyVisibleWidgets();
  renderWidgetLibrary();
  saveMobileOrder();
  void goToPage(0);
}

function addHomeWidgetFromAI(id) {
  if (!widgetDefinitions[id]) return;
  const visible = visibleWidgetIds();
  if (!visible.includes(id)) toggleWidget(id);
  else {
    applyVisibleWidgets();
    void goToPage(0);
  }
}

function removeHomeWidgetFromAI(id) {
  const visible = visibleWidgetIds();
  if (!visible.includes(id)) return;
  saveVisibleWidgets(visible.filter((item) => item !== id));
  applyVisibleWidgets();
  renderWidgetLibrary();
  saveMobileOrder();
  refreshWidgetEditButtons();
}

function setThemeFromAI(themeId) {
  const allowed = ["aurora", "midnight", "sunset", "forest"];
  if (!allowed.includes(themeId)) return;
  settings.theme = themeId;
  saveSettings();
  applySettings();
}

const HOME_WIDGET_PACKS = {
  minimal: ["hero", "clock"],
  standard: ["hero", "clock", "status", "shortcuts", "nocoai", "notes"],
  full: ["hero", "clock", "status", "shortcuts", "nocoai", "notes", "sync", "feed"],
  focus: ["hero", "clock", "focusMini", "notes"],
  ai: ["hero", "nocoai", "clock", "notes", "shortcuts"],
  games: ["hero", "clock", "forgePick", "shortcuts"]
};

function enableGlassModeFromAI() {
  settings.glassBoost = true;
  settings.liveWallpaper = true;
  settings.motion = true;
  saveSettings();
  applySettings();
}

function getSystemSnapshotForAI() {
  const widgets = visibleWidgetIds().map((id) => widgetDefinitions[id]?.title || id);
  window.NocoAIChats?.reload?.();
  window.NocoNotes?.reload?.();
  const chatCount = window.NocoAIChats?.listChats?.()?.length ?? 0;
  const noteCount = window.NocoNotes?.listNotes?.()?.length ?? 0;
  return {
    theme: settings.theme,
    autoLock: settings.autoLock,
    autoLockSeconds: settings.autoLockSeconds || 60,
    glassBoost: settings.glassBoost,
    liveWallpaper: settings.liveWallpaper,
    motion: settings.motion,
    codeLock: settings.codeLock,
    payBalance: formatEuro(settings.payBalance),
    exclusiveActive: isExclusiveActive(),
    nocoAiPlus: !!settings.nocoAiPlus,
    widgets,
    installed: getInstalledApps().length,
    chatCount,
    noteCount
  };
}

function getNocoAIHelpers() {
  return {
    openApp: (id) => {
      void openApp(id);
    },
    openBeam: () => openBeam(),
    openHub: () => openHub(),
    goToPage: (page) => {
      void goToPage(page);
    },
    getAppTitle: (id) => getAppMeta(id).title,
    openWidgetPanel: () => openWidgetPanelFromHome(),
    enableEditMode: () => setEditMode(true),
    openLibraryFolder: (folderId) => toggleLibraryFolder(folderId),
    listInstalledApps: () => getInstalledApps().map((id) => getAppMeta(id).title),
    getForgeCatalog: () => forgeApps.map((app) => ({ id: app.id, title: app.title, text: app.text || "", exclusive: !!app.exclusive })),
    getSettings: () => ({ ...settings }),
    isExclusiveActive: () => isExclusiveActive(),
    isAppInstalled: (id) => getInstalledApps().includes(id),
    openExclusive: () => {
      void openApp("exclusive");
    },
    activateNocoAiPlus: () => {
      void openApp("exclusive");
      showToast("Unbegrenzte NOCO AI ist in Exclusive enthalten");
    },
    createNote: ({ title, body, example, openApp: openNotesApp }) => {
      if (!window.NocoNotes) return null;
      const t = example ? "Beispiel" : String(title || "Neue Notiz").trim().slice(0, 60) || "Neue Notiz";
      const b = example ? "" : String(body || "");
      const note = window.NocoNotes.createNote(t, b);
      syncHomeNoteFromStore();
      invalidateAppCache("notes");
      if (openNotesApp) void openApp("notes", { force: true });
      return note;
    },
    createTask: ({ text, example, openApp: openTasksApp }) => {
      const label = example ? "Beispiel" : String(text || "Beispiel").trim().slice(0, 120) || "Beispiel";
      const tasks = loadTasks();
      tasks.unshift({ id: "t_" + Date.now(), text: label, done: false });
      saveTasksList(tasks);
      invalidateAppCache("tasks");
      if (openTasksApp !== false) void openApp("tasks", { force: true });
      return label;
    },
    appendToActiveNote: (text) => {
      if (!window.NocoNotes) return null;
      const active = window.NocoNotes.getActiveNote();
      const next = active.body ? `${active.body}\n${text}` : text;
      window.NocoNotes.updateNote(active.id, { body: next });
      syncHomeNoteFromStore();
      return window.NocoNotes.getActiveNote();
    },
    searchChats: (query, options) => {
      window.NocoAIChats?.reload?.();
      return window.NocoAIChats?.searchChats?.(query, options) || [];
    },
    searchNotes: (query, options) => {
      window.NocoNotes?.reload?.();
      return window.NocoNotes?.searchNotes?.(query, options) || [];
    },
    openChat: (chatId) => {
      if (!window.NocoAIChats?.setActive(chatId)) return false;
      const root = sheetContent?.querySelector("[data-noco-ai-root]");
      if (currentApp === "nocoai" && root && window.NocoAI) {
        const log = root.querySelector("[data-noco-ai-log]");
        window.NocoAI.renderLogFromStore?.(log, false);
        const nameEl = root.querySelector("[data-noco-ai-active-name]");
        if (nameEl) nameEl.textContent = window.NocoAIChats.getActiveChat()?.name || "Chat";
        window.NocoAI.uiRefreshChats?.();
        global.dispatchEvent?.(new CustomEvent("noco-ai-updated"));
      } else {
        void openApp("nocoai");
      }
      return true;
    },
    openNote: (noteId) => {
      if (!window.NocoNotes?.setActive(noteId)) return false;
      syncHomeNoteFromStore();
      void openApp("notes");
      return true;
    },
    summarizeNoteMatch: (match, userQuery) => {
      if (!match) return "";
      const terms = String(userQuery || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3);
      const body = (match.preview || "").toLowerCase();
      const hit = terms.find((t) => body.includes(t));
      return hit ? `Treffer im Text: «${hit}»` : "Passende Notiz gefunden";
    },
    isInNocoAI: () => currentApp === "nocoai" && appSheet && !appSheet.classList.contains("hidden"),
    navigateCore: (opts) => {
      void navigateCoreFromAI(opts || {});
    },
    showLockScreenPreview: () => showLockScreen("Lock Screen Preview"),
    setHomeWidgets: (ids) => setHomeWidgetsFromAI(ids),
    addHomeWidget: (id) => addHomeWidgetFromAI(id),
    removeHomeWidget: (id) => removeHomeWidgetFromAI(id),
    getWidgetTitle: (id) => widgetDefinitions[id]?.title || id,
    installForgeApp: (id) => {
      void installForgeApp(id, { skipReopen: true });
    },
    uninstallForgeApp: (id) => {
      void uninstallForgeApp(id, { skipReopen: true });
    },
    setTheme: (themeId) => setThemeFromAI(themeId),
    getSystemSnapshot: () => getSystemSnapshotForAI(),
    listHomeWidgets: () => visibleWidgetIds(),
    resetHomeWidgets: () => setHomeWidgetsFromAI(HOME_WIDGET_PACKS.standard),
    setHomeWidgetPack: (pack) => {
      const ids = HOME_WIDGET_PACKS[pack];
      if (ids) setHomeWidgetsFromAI(ids);
    },
    enableGlassMode: () => {
      enableGlassModeFromAI();
      void navigateCoreFromAI({ section: "deck", toggle: "glassBoost", value: true });
    },
    addPayBalance: (amount) => {
      changeBalance(Number(amount) || 10, "NOCO AI Aufladung", "ai");
      showToast("+" + (Number(amount) || 10) + " EUR");
    },
    openThemes: () => void openApp("themes"),
    openSecurity: () => void openApp("security"),
    openForge: () => void openApp("forge"),
    openSync: () => void openApp("sync"),
    openPay: () => void openApp("pay"),
    deleteNote: (noteId) => window.NocoNotes?.deleteNote?.(noteId),
    deleteActiveNote: () => {
      const active = window.NocoNotes?.getActiveNote?.();
      if (active?.id) window.NocoNotes.deleteNote(active.id);
      syncHomeNoteFromStore();
    },
    addReminder: ({ text, minutes }) => addMemoryReminder(text, minutes),
    openMemories: () => {
      void openApp("memories");
    },
    applyTimerMinutes: (minutes) => {
      if (timerState.running) stopFocusTimer();
      timerState.mode = "custom";
      timerState.customMinutes = Math.max(1, Math.min(180, Math.floor(Number(minutes) || 1)));
      timerState.totalSeconds = timerState.customMinutes * 60;
      timerState.seconds = timerState.totalSeconds;
      timerState.endAt = null;
      timerState.running = false;
      invalidateAppCache("timer");
      updateTimerLiveSurfaces();
    },
    startTimerCountdown: () => {
      startFocusTimer();
    },
    openTimerApp: () => {
      refreshTimerApp();
    },
    listReminders: () => (window.NocoReminders?.active?.() || []).map((r) => r.text),
    getTimerStatus: () => getTimerStatusForAI(),
    getNextReminder: () => getNextReminderForAI(),
    listRemindersDetailed: () => listRemindersDetailedForAI(),
    getTasks: () => loadTasks(),
    completeTask: (needle) => {
      const q = String(needle || "").toLowerCase().trim();
      if (!q) return null;
      const tasks = loadTasks();
      const hit = tasks.find((t) => !t.done && String(t.text || "").toLowerCase().includes(q));
      if (!hit) return null;
      const next = tasks.map((t) => (t.id === hit.id ? { ...t, done: true } : t));
      saveTasksList(next);
      invalidateAppCache("tasks");
      return hit;
    },
    startNewChat: ({ name, example } = {}) => {
      if (!window.NocoAIChats) return;
      const chatName = example ? "Beispiel" : String(name || "Neuer Chat").trim().slice(0, 40) || "Neuer Chat";
      window.NocoAIChats.createChat(chatName);
      if (currentApp === "nocoai") {
        const root = sheetContent?.querySelector("[data-noco-ai-root]");
        const log = root?.querySelector("[data-noco-ai-log]");
        window.NocoAI?.renderLogFromStore?.(log, false);
        const nameEl = root?.querySelector("[data-noco-ai-active-name]");
        if (nameEl) nameEl.textContent = window.NocoAIChats.getActiveChat()?.name || "Chat";
        window.NocoAI?.uiRefreshChats?.();
      }
    }
  };
}

function mountNocoAIWidgetElement(element) {
  const inner = element?.querySelector("[data-noco-ai-widget]");
  if (inner && window.NocoAI?.mountWidget) {
    window.NocoAI.mountWidget(inner, getNocoAIHelpers());
  }
}

function applyVisibleWidgets() {
  const home = document.querySelector(".home-bento") || document.querySelector(".home-screen");
  if (!home) return;
  const ids = visibleWidgetIds();
  Object.keys(widgetDefinitions).forEach((id) => {
    let element = home.querySelector(`[data-widget-id="${id}"]`);
    if (ids.includes(id)) {
      if (!element) {
        element = createWidgetElement(id);
        if (element) home.appendChild(element);
      }
      if (element) {
        element.hidden = false;
        if (id === "nocoai") mountNocoAIWidgetElement(element);
      }
    } else if (element) {
      element.hidden = true;
    }
  });
  refreshWidgetEditButtons();
}

function renderWidgetLibrary() {
  if (!widgetLibrary) return;
  const visible = visibleWidgetIds();
  const sections = [
    { label: "Highlights", ids: ["nocoai", "hero", "clock", "status", "shortcuts"] },
    { label: "Mehr", ids: ["notes", "sync", "feed", "focusMini", "batteryLab", "forgePick", "payMini", "securityMini"] }
  ];
  widgetLibrary.innerHTML = sections
    .map((section) => {
      const items = section.ids
        .filter((id) => widgetDefinitions[id])
        .map((id) => {
          const definition = widgetDefinitions[id];
          const active = visible.includes(id);
          return `
            <button type="button" class="widget-choice" data-widget-toggle="${id}">
              <span><strong>${definition.title}</strong><br><small>${definition.text}</small></span>
              <strong>${active ? "Entfernen" : "+ Hinzufuegen"}</strong>
            </button>
          `;
        })
        .join("");
      if (!items) return "";
      return `<p class="widget-section-label">${section.label}</p>${items}`;
    })
    .join("");
}

function toggleWidget(id) {
  const visible = visibleWidgetIds();
  const next = visible.includes(id) ? visible.filter((item) => item !== id) : [...visible, id];
  saveVisibleWidgets(next);
  applyVisibleWidgets();
  renderWidgetLibrary();
  saveMobileOrder();
  refreshWidgetEditButtons();
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

function appShell(content, extraClass = "") {
  return `<div class="mobile-app-body noco-glass-scroll ${extraClass}" data-app-scroll-area>${content}</div>`;
}

function nocoAITemplate() {
  const body = window.NocoAI?.buildTemplate?.() || "<p>NOCO AI wird geladen …</p>";
  return appShell(body);
}

function mountNocoAIIfNeeded(appId) {
  if (appId !== "nocoai" || !window.NocoAI) return;
  const root = sheetContent?.querySelector("[data-noco-ai-root]");
  if (!root) return;
  window.NocoAI.mount(root, getNocoAIHelpers());
  window.NocoAI.focusChatInput?.(root);
}

function mountNotesIfNeeded(appId) {
  if (appId !== "notes" || !window.NocoNotes) return;
  const root = sheetContent?.querySelector("[data-notes-app]");
  if (!root) return;
  root.querySelectorAll("[data-note-select]").forEach((btn) => {
    if (btn.dataset.noteLongBound === "1") return;
    btn.dataset.noteLongBound = "1";
    let timer = null;
    const clear = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };
    btn.addEventListener("pointerdown", () => {
      clear();
      timer = window.setTimeout(() => {
        const id = btn.dataset.noteSelect;
        const note = window.NocoNotes.listNotes().find((n) => n.id === id);
        const sheet = root.querySelector("[data-notes-rename-sheet]");
        const input = root.querySelector("[data-notes-rename-input]");
        if (!sheet || !note || !input) return;
        sheet.dataset.renameId = id;
        input.value = note.title;
        sheet.classList.remove("hidden");
        if (navigator.vibrate) navigator.vibrate([8, 36, 8]);
      }, 520);
    });
    btn.addEventListener("pointerup", clear);
    btn.addEventListener("pointerleave", clear);
    btn.addEventListener("pointercancel", clear);
  });
}

function subMenu(title, eyebrow, content, open = false) {
  return `
    <section class="submenu-panel">
      <div class="submenu-title">
        <span><small>${eyebrow}</small><strong>${title}</strong></span>
      </div>
      <div class="submenu-content">${content}</div>
    </section>
  `;
}

function cacheAppState(appId) {
  if (!appId || settings.keepAppsAlive === false) return;
  const card = appSheet.querySelector(".sheet-card");
  appCache.set(appId, {
    html: sheetContent.innerHTML,
    scrollTop: card?.scrollTop || 0
  });
}

const VOLATILE_APP_IDS = new Set([
  "tapdash", "colorcatch", "memorygrid", "dodgerun", "runner",
  "calculator", "timer", "memories", "tasks", "weather", "flashlight", "quotes", "sketch", "breath", "nocoai", "notes"
]);

function invalidateAppCache(appId) {
  if (appId) appCache.delete(appId);
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem("noco_mobile_tasks") || "[]");
    return Array.isArray(saved) ? saved.filter((t) => t && t.text) : [];
  } catch (_) {
    return [];
  }
}

function saveTasksList(tasks) {
  localStorage.setItem("noco_mobile_tasks", JSON.stringify(tasks));
}

function formatTimerDisplay(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
}

const TIMER_MODE_LABELS = { focus: "Fokus", break: "Pause", quick: "Quick", custom: "Custom" };

function playAlarmSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (freq, at, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + dur + 0.05);
    };
    beep(880, 0, 0.12);
    beep(1046, 0.16, 0.12);
    beep(1318, 0.32, 0.18);
    beep(1046, 0.54, 0.2);
    window.setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {}
    }, 1200);
  } catch (_) {}
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate([120, 80, 120, 80, 200]);
  }
}

function getTimerStatusForAI() {
  const remainingSec = getTimerRemaining();
  const endAt = timerState.running && timerState.endAt ? timerState.endAt : null;
  const end = endAt ? new Date(endAt) : null;
  return {
    running: !!timerState.running,
    remainingSec,
    endAt,
    display: formatTimerDisplay(remainingSec),
    endTimeLocale: end ? end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null,
    endDateLocale: end ? end.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" }) : null,
    mode: timerState.mode,
    modeLabel: TIMER_MODE_LABELS[timerState.mode] || "Timer"
  };
}

function getNextReminderForAI() {
  const list = window.NocoReminders?.active?.() || [];
  if (!list.length) return null;
  const sorted = list.slice().sort((a, b) => a.fireAt - b.fireAt);
  const r = sorted[0];
  const end = new Date(r.fireAt);
  return {
    text: r.text,
    fireAt: r.fireAt,
    eta: window.NocoReminders?.formatEta?.(r) || "?",
    remainingSec: Math.max(0, Math.ceil((r.fireAt - Date.now()) / 1000)),
    endTimeLocale: end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    endDateLocale: end.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" })
  };
}

function listRemindersDetailedForAI() {
  return (window.NocoReminders?.active?.() || [])
    .slice()
    .sort((a, b) => a.fireAt - b.fireAt)
    .map((r) => {
      const end = new Date(r.fireAt);
      return {
        text: r.text,
        fireAt: r.fireAt,
        eta: window.NocoReminders?.formatEta?.(r) || "?",
        remainingSec: Math.max(0, Math.ceil((r.fireAt - Date.now()) / 1000)),
        endTimeLocale: end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        endDateLocale: end.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })
      };
    });
}

function updateTimerLiveSurfaces() {
  const rem = getTimerRemaining();
  const running = timerState.running;
  const display = formatTimerDisplay(rem);
  const modeLabel = TIMER_MODE_LABELS[timerState.mode] || "Timer";

  const lockTimer = document.getElementById("lockTimerLive");
  if (lockTimer) {
    if (running) {
      lockTimer.classList.remove("hidden");
      lockTimer.innerHTML = `<span class="timer-live-glyph" aria-hidden="true">◴</span><span><strong>${display}</strong><small>${modeLabel} · laeuft</small></span>`;
    } else {
      lockTimer.classList.add("hidden");
      lockTimer.innerHTML = "";
    }
  }

  const homeTimer = document.getElementById("homeTimerLive");
  if (homeTimer) {
    if (running) {
      homeTimer.classList.remove("hidden");
      homeTimer.innerHTML = `<button type="button" class="timer-live-hit" data-open-timer-live><span class="timer-live-glyph" aria-hidden="true">◴</span><span><strong>Timer ${display}</strong><small>${modeLabel} — tippen</small></span></button>`;
    } else {
      homeTimer.classList.add("hidden");
      homeTimer.innerHTML = "";
    }
  }

  const nextRem = getNextReminderForAI();
  const lockMem = document.getElementById("lockMemoryLive");
  const homeMem = document.getElementById("homeMemoryLive");
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const memoryInner = (text) =>
    `<span class="timer-live-glyph" aria-hidden="true">◷</span><span><strong>${esc(nextRem.eta)}</strong><small>Memory: ${esc(text)}</small></span>`;
  [lockMem, homeMem].forEach((el) => {
    if (!el) return;
    if (nextRem) {
      el.classList.remove("hidden");
      const label = running ? nextRem.text.slice(0, 28) : nextRem.text;
      if (el === homeMem) {
        el.innerHTML = `<button type="button" class="timer-live-hit" data-open-memory-live>${memoryInner(label)}</button>`;
      } else {
        el.innerHTML = memoryInner(label);
      }
    } else {
      el.classList.add("hidden");
      el.innerHTML = "";
    }
  });

  const focusMini = document.querySelector('[data-widget-id="focusMini"]');
  if (focusMini) {
    const p = focusMini.querySelector("p");
    if (p) {
      p.textContent = running
        ? `Timer laeuft: ${display} (${modeLabel})`
        : widgetDefinitions.focusMini?.text || "Ruhige Schnellsteuerung fuer Fokus.";
    }
  }

  if (dynamicIsland) {
    dynamicIsland.classList.toggle("has-timer-live", running);
  }
  updateIslandUI();
}

function handleTimerFinished() {
  const labels = { focus: "Fokus beendet", break: "Pause beendet", quick: "Quick Timer fertig", custom: "Timer fertig" };
  playAlarmSound();
  showToast(labels[timerState.mode] || "Timer fertig");
  hapticTap();
  updateTimerLiveSurfaces();
  void openApp("timer", { force: true });
  refreshTimerApp();
}

function handleReminderFired(reminder) {
  playAlarmSound();
  showToast("Memory: " + (reminder?.text || "Erinnerung"));
  hapticTap();
  invalidateAppCache("memories");
  updateTimerLiveSurfaces();
  void openApp("memories", { force: true });
  if (currentApp === "memories") refreshMemoriesApp();
}

function randomMemorySequence(length) {
  return Array.from({ length }, () => 1 + Math.floor(Math.random() * 4));
}

function flashMemoryCell(id) {
  const btn = sheetContent.querySelector(`[data-memory-choice="${id}"]`);
  if (!btn) return;
  btn.classList.add("lit");
  window.setTimeout(() => btn.classList.remove("lit"), 420);
}

async function playMemorySequence() {
  if (memoryState.playbackLock || currentApp !== "memorygrid") return;
  memoryState.playbackLock = true;
  memoryState.phase = "playback";
  memoryState.playerIndex = 0;
  const status = sheetContent.querySelector("[data-memory-status]");
  if (status) status.textContent = "Merken...";
  sheetContent.querySelectorAll("[data-memory-choice]").forEach((btn) => {
    btn.disabled = true;
  });
  await sleep(500);
  for (const cell of memoryState.sequence) {
    flashMemoryCell(cell);
    await sleep(520);
  }
  memoryState.phase = "input";
  memoryState.playbackLock = false;
  if (status) status.textContent = "Dein Zug";
  sheetContent.querySelectorAll("[data-memory-choice]").forEach((btn) => {
    btn.disabled = false;
  });
}

function startNewMemoryRound() {
  memoryState.sequence = randomMemorySequence(Math.min(8, memoryState.round + 2));
  memoryState.playerIndex = 0;
  memoryState.phase = "playback";
  invalidateAppCache("memorygrid");
  openApp("memorygrid");
  window.setTimeout(() => playMemorySequence(), 120);
}

function timerTotalForMode(mode) {
  if (mode === "focus") return 25 * 60;
  if (mode === "break") return 5 * 60;
  if (mode === "quick") return 15 * 60;
  return Math.max(60, Math.min(180 * 60, (timerState.customMinutes || 5) * 60));
}

function getTimerRemaining() {
  if (timerState.running && timerState.endAt) {
    return Math.max(0, Math.ceil((timerState.endAt - Date.now()) / 1000));
  }
  return Math.max(0, timerState.seconds);
}

function refreshTimerDom() {
  const remaining = getTimerRemaining();
  timerState.seconds = remaining;
  const label = sheetContent?.querySelector("[data-timer-display]");
  const ring = sheetContent?.querySelector("[data-timer-ring]");
  const status = sheetContent?.querySelector("[data-timer-status]");
  const toggleLabel = sheetContent?.querySelector("[data-timer-toggle-label]");
  if (label) label.textContent = formatTimerDisplay(remaining);
  if (status) status.textContent = timerState.running ? "Läuft" : "Bereit";
  if (toggleLabel) toggleLabel.textContent = timerState.running ? "Pause" : "Start";
  if (ring) {
    const total = timerState.totalSeconds || timerTotalForMode(timerState.mode) || 1;
    ring.style.setProperty("--timer-pct", String((remaining / total) * 100));
  }
  updateTimerLiveSurfaces();
}

function refreshTimerApp() {
  invalidateAppCache("timer");
  if (currentApp === "timer" && appSheet && !appSheet.classList.contains("hidden")) {
    renderAppSheet("timer", timerTemplate());
  } else {
    void openApp("timer", { force: true });
  }
}

function stopFocusTimer() {
  timerState.running = false;
  timerState.endAt = null;
  timerState.seconds = getTimerRemaining();
  updateTimerLiveSurfaces();
}

function tickFocusTimer() {
  const remaining = getTimerRemaining();
  timerState.seconds = remaining;
  if (remaining <= 0) {
    stopFocusTimer();
    handleTimerFinished();
    return;
  }
  refreshTimerDom();
}

function startFocusTimer() {
  if (timerState.running) return;
  if (timerState.seconds <= 0) {
    timerState.totalSeconds = timerTotalForMode(timerState.mode);
    timerState.seconds = timerState.totalSeconds;
  }
  timerState.endAt = Date.now() + timerState.seconds * 1000;
  timerState.running = true;
  showToast("Timer laeuft");
  refreshTimerDom();
  updateTimerLiveSurfaces();
}

function setTimerMode(mode) {
  stopFocusTimer();
  timerState.mode = mode;
  timerState.totalSeconds = timerTotalForMode(mode);
  timerState.seconds = timerState.totalSeconds;
  invalidateAppCache("timer");
}

function setTimerMinutes(minutes) {
  stopFocusTimer();
  timerState.mode = "custom";
  timerState.customMinutes = Math.max(1, Math.min(180, Math.floor(Number(minutes) || 1)));
  timerState.totalSeconds = timerState.customMinutes * 60;
  timerState.seconds = timerState.totalSeconds;
  invalidateAppCache("timer");
}

function addMemoryReminder(text, minutes) {
  if (!window.NocoReminders) return null;
  const entry = window.NocoReminders.add({ text, delayMinutes: minutes });
  invalidateAppCache("memories");
  return entry;
}

function refreshMemoriesApp() {
  invalidateAppCache("memories");
  if (currentApp === "memories" && appSheet && !appSheet.classList.contains("hidden")) {
    renderAppSheet("memories", memoriesTemplate());
  } else {
    void openApp("memories", { force: true });
  }
}

function ensureDefaultToolsInstalled() {
  const installed = getInstalledApps();
  const want = ["timer", "memories"];
  const missing = want.filter((id) => !installed.includes(id));
  if (!missing.length) return;
  saveInstalledApps([...installed, ...missing]);
  renderInstalledApps();
  refreshLibraryExpand();
}

function calcSanitizeDisplay(value) {
  if (!Number.isFinite(value)) return "Fehler";
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded).slice(0, 14);
}

function applyCalcKey(key) {
  const d = calcState;
  if (key === "C") {
    d.display = "0";
    d.fresh = true;
    return;
  }
  if (key === "MC") {
    d.memory = null;
    return;
  }
  if (key === "MR" && d.memory != null) {
    d.display = calcSanitizeDisplay(d.memory);
    d.fresh = true;
    return;
  }
  if (key === "M+" && Number.isFinite(Number(d.display))) {
    d.memory = (d.memory || 0) + Number(d.display);
    return;
  }
  if (key === "=") {
    try {
      const expr = String(d.display).replace(/×/g, "*").replace(/÷/g, "/");
      if (!/^[\d.+\-*/()\s]+$/.test(expr)) throw new Error("bad");
      const result = Function(`"use strict"; return (${expr})`)();
      d.display = calcSanitizeDisplay(Number(result));
      d.fresh = true;
    } catch (_) {
      d.display = "Fehler";
      d.fresh = true;
    }
    return;
  }
  if ("0123456789.".includes(key)) {
    if (d.fresh || d.display === "Fehler") {
      d.display = key === "." ? "0." : key;
      d.fresh = false;
    } else if (key === "." && d.display.includes(".")) {
      return;
    } else {
      d.display = d.display === "0" && key !== "." ? key : d.display + key;
    }
    return;
  }
  if ("+-×÷".includes(key)) {
    if (d.display === "Fehler") d.display = "0";
    if (!d.fresh) d.display += key;
    else if (!/[\+\-×÷]$/.test(d.display)) d.display += key;
    else d.display = d.display.slice(0, -1) + key;
    d.fresh = false;
  }
}

const WEATHER_PRESETS = [
  { city: "NOCO City", temp: 19, feel: 18, cond: "Glasregen", icon: "🌧", hours: ["18°", "17°", "16°", "15°"] },
  { city: "Aurora Bay", temp: 22, feel: 21, cond: "Sonnig", icon: "☀", hours: ["23°", "22°", "20°", "18°"] },
  { city: "Mint Valley", temp: 16, feel: 15, cond: "Nebel", icon: "🌫", hours: ["15°", "14°", "13°", "12°"] }
];
let weatherIndex = Number(localStorage.getItem("noco_mobile_weather_idx") || 0) % WEATHER_PRESETS.length;

const QUOTE_POOL = [
  "Liquid Glass ist kein Filter — es ist eine Haltung.",
  "Sync lokal, fühlen global.",
  "Dein Desktop verdient sichtbare Icons.",
  "NOCO Beam findet, was du verlegt hast.",
  "Exclusive ist optional. Style ist nicht."
];
let quoteIndex = Number(localStorage.getItem("noco_mobile_quote_idx") || 0) % QUOTE_POOL.length;

function refreshCoreSection() {
  if (currentApp !== "settings" || !sheetContent) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = settingsTemplateV2();
  const nextContent = wrapper.querySelector(".menu-content");
  const nextTitle = wrapper.querySelector(".core-section-title");
  const picker = sheetContent.querySelector(".menu-picker");
  picker?.querySelectorAll("[data-settings-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsSection === settingsActiveSection);
  });
  const menuContent = sheetContent.querySelector(".menu-content");
  const titleBlock = sheetContent.querySelector(".core-section-title");
  if (nextContent && menuContent) menuContent.innerHTML = nextContent.innerHTML;
  if (nextTitle && titleBlock) titleBlock.innerHTML = nextTitle.innerHTML;
  cacheAppState("settings");
  hapticTap();
}

function renderAppSheet(appId, html, options = {}) {
  const meta = getAppMeta(appId);
  const header =
    appId === "nocoai"
      ? ""
      : `
    <header class="sheet-app-head">
      <div>
        <p class="eyebrow">NOCO App</p>
        <h2 class="sheet-app-title">${meta.title}</h2>
      </div>
    </header>
  `;
  currentApp = appId;
  sheetContent.innerHTML = header + html;
  document.body.classList.toggle("noco-ai-sheet", appId === "nocoai");
  cancelSheetSwipe();
  appSheet.classList.add("app-navigating");
  appSheet.classList.remove("hidden");
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => {
    appSheet.classList.remove("app-navigating");
  });
  armGestureSafety(800);
  setIslandExpanded(false);
  dismissCoach();
  const card = appSheet.querySelector(".sheet-card");
  if (card) {
    card.classList.remove("sheet-dragging");
    card.style.transform = "";
    card.style.opacity = "";
    const scrollTop = options.restore ? Number(options.scrollTop || 0) : 0;
    card.scrollTop = scrollTop;
    requestAnimationFrame(() => {
      card.scrollTop = scrollTop;
    });
  }
  updateIslandUI();
}

function closeAppSheetVisual() {
  if (currentApp) cacheAppState(currentApp);
  appSheet.classList.add("hidden");
  appSheet.classList.remove("app-navigating");
  document.body.classList.remove("sheet-open", "noco-ai-sheet");
  resetSheetGestureTransform();
  cleanupGestureState();
  currentApp = null;
  updateIslandUI();
}

function settingsTemplate() {
  return `
    ${appHero("Core", "NOCO Core Mobile", "Steuere Design, Bewegung und das mobile App-Gefühl direkt auf dem iPhone.")}
    <div class="toggle-list">
      ${toggleRow("liveWallpaper", "Live Wallpaper", "Ruhige animierte Hintergrund-Bubbles")}
      ${toggleRow("glassBoost", "Mehr Liquid Glass", "Stärkerer Glaslook für Karten und Apps")}
      ${toggleRow("motion", "Animationen", "Sanfte Übergänge und App-Start-Animationen")}
    </div>
    <div class="settings-list">
      <div class="settings-row"><span>Version</span><strong>Mobile 1.2</strong></div>
      <div class="settings-row"><span>Installation</span><strong>PWA Fullscreen</strong></div>
      <div class="settings-row"><span>Navigation</span><strong>Swipe + Desktop</strong></div>
      <button class="settings-row" data-action="open-security"><span>Sicherheit</span><strong>Security öffnen</strong></button>
    </div>
  `;
}

function settingsTemplateV2() {
  const sections = {
    deck: {
      title: "NocoDeck",
      text: "System, Look und schnelle mobile Steuerung.",
      content: `
        <div class="overview-grid">
          <div class="overview-tile"><span>Apps</span><strong>${new Set([...getLibraryFolderApps("core"), ...getLibraryFolderApps("forge"), ...getLibraryFolderApps("games")]).size}</strong><small>Bibliothek bereit</small></div>
          <div class="overview-tile"><span>Schutz</span><strong>${settings.codeLock ? "An" : "Aus"}</strong><small>ShieldGate</small></div>
          <div class="overview-tile"><span>Pay</span><strong>${formatEuro(settings.payBalance)}</strong><small>Wallet</small></div>
          <div class="overview-tile"><span>Exclusive</span><strong>${isExclusiveActive() ? "Aktiv" : "Offen"}</strong><small>Premium</small></div>
        </div>
        <div class="settings-mini-grid">
          <div class="settings-row"><span>Version</span><strong>Mobile 1.2</strong></div>
          <div class="settings-row"><span>Installation</span><strong>PWA Fullscreen</strong></div>
          <div class="settings-row"><span>Navigation</span><strong>Home + Desktop</strong></div>
        </div>
        ${toggleRow("liveWallpaper", "Live Wallpaper", "Ruhiger animierter Hintergrund")}
        ${toggleRow("glassBoost", "Mehr Liquid Glass", "Staerkerer Glaslook fuer Karten und Apps")}
        ${toggleRow("motion", "Animationen", "Sanfte Uebergaenge und App-Starts")}
        ${toggleRow("nativeFeel", "App Handling", "Weniger Webseiten-Gefuehl, mehr iPhone-App")}
        ${toggleRow("keepAppsAlive", "Apps behalten", "Core und Apps merken sich die letzte Position")}
        ${toggleRow("compactTiles", "Kompakte Kacheln", "Mehr Platz bei vielen Apps und Listen")}
        ${toggleRow("autoLock", "Auto-Lock", "Nach 1 Minute Ruhe Sperrbildschirm zeigen")}
        <button class="settings-row" data-app="themes"><span>Themes</span><strong>Oeffnen</strong></button>
      `
    },
    lock: {
      title: "Lock Screen",
      text: "Sperrbildschirm, Auto-Lock und Widgets.",
      content: `
        <div class="overview-grid">
          <div class="overview-tile"><span>Auto-Lock</span><strong>${settings.autoLock ? "An" : "Aus"}</strong><small>${settings.autoLockSeconds || 60} Sekunden</small></div>
          <div class="overview-tile"><span>Widgets</span><strong>${(settings.lockWidgets || []).length || 3}</strong><small>Angeheftet</small></div>
        </div>
        ${toggleRow("autoLock", "Auto-Lock aktivieren", "Nach Inaktivitaet automatisch sperren")}
        <div class="settings-row"><span>Inaktivitaet</span><strong>${settings.autoLockSeconds || 60}s</strong></div>
        <div class="lock-time-grid">
          ${[30, 60, 120, 300].map((seconds) => `<button class="${Number(settings.autoLockSeconds || 60) === seconds ? "active" : ""}" data-lock-time="${seconds}">${seconds < 60 ? seconds + "s" : seconds / 60 + "min"}</button>`).join("")}
        </div>
        <div class="core-section-title"><p class="eyebrow">Widgets</p><h3>Auf dem Lockscreen anheften</h3></div>
        <div class="lock-widget-picker">
          ${Object.entries(lockWidgetDefinitions()).map(([id, item]) => `<button class="${(settings.lockWidgets || []).includes(id) ? "active" : ""}" data-lock-widget-core="${id}"><span>${item.title}</span><strong>${item.value}</strong></button>`).join("")}
        </div>
        <button class="settings-row" data-action="preview-lock"><span>Lock Screen ansehen</span><strong>Preview</strong></button>
      `
    },
    shield: {
      title: "ShieldGate",
      text: "Code, Face ID, Keycard und Freigaben.",
      content: `
        <button class="settings-row" data-action="open-security"><span>Code, Face ID und Keycard</span><strong>ShieldGate</strong></button>
        <button class="settings-row" data-app="sync"><span>NOCO Keycard</span><strong>Import/Export</strong></button>
        <div class="settings-row"><span>Nach Neustart</span><strong>${settings.requireCodeOnLaunch || settings.passkeyEnabled ? "Pflicht" : "Aus"}</strong></div>
        <div class="settings-row"><span>Schutzstatus</span><strong>${settings.codeLock ? "Aktiv" : "Offen"}</strong></div>
        ${toggleRow("codeLock", "Schutz aktivieren", "Code fuer sensible Aktionen nutzen")}
        ${toggleRow("passkeyEnabled", "Passkey verwenden", "Face ID / Passkey zuerst versuchen")}
        ${toggleRow("requireCodeOnLaunch", "Login-Code", "Nach Reload wieder Code verlangen")}
        ${toggleRow("strictSecurity", "Strenger Modus", "Installieren, Loeschen und Keycards immer freigeben")}
      `
    },
    vault: {
      title: "SessionVault",
      text: "Apps, Dev, Exclusive und Keycard-Daten.",
      content: `
        <div class="settings-row"><span>Apps nach Installation</span><strong>Im Forge bleiben</strong></div>
        <div class="settings-row"><span>App verlassen</span><strong>Zurueck zum Desktop</strong></div>
        <button class="settings-row" data-app="forge"><span>NOCO Forge</span><strong>Store</strong></button>
        <button class="settings-row" data-go-page="1"><span>App Desktop</span><strong>Anzeigen</strong></button>
        <button class="settings-row" data-app="toon"><span>NOCO Toon</span><strong>Zeitung</strong></button>
        <div class="settings-row"><span>Cache-Version</span><strong>v36</strong></div>
        <button class="settings-row exclusive-row" data-app="exclusive"><span>Exclusive</span><strong>${isExclusiveActive() ? "Member" : "Upgrade ansehen"}</strong></button>
        <button class="settings-row" data-action="exclusive-trial"><span>1 Tag testen</span><strong>${settings.exclusiveTrialUsed ? "Genutzt" : "Gratis"}</strong></button>
      `
    }
  };
  const active = sections[settingsActiveSection] ? settingsActiveSection : "deck";
  return appShell(`
    ${appHero("Core", "NOCO Core Mobile", "Der kleine Bruder von NOCO Workspace: Deck, ShieldGate, SessionVault und Mobile-Systemsteuerung.")}
    <div class="menu-picker">
      ${Object.entries(sections).map(([id, section]) => `
        <button class="${active === id ? "active" : ""}" data-settings-section="${id}">
          <strong>${section.title}</strong><small>${section.text}</small>
        </button>
      `).join("")}
    </div>
    <section class="menu-content">
      <div class="core-section-title"><p class="eyebrow">${sections[active].title}</p><h3>${sections[active].text}</h3></div>
      ${sections[active].content}
    </section>
  `);
}

function syncTemplate() {
  const last = loadSyncInfo();
  return appShell(`
    ${appHero("Sync", "NOCO Link Mobile", "Importiere deine NOCO Keycard vom Desktop und übernimm Daten auf dein iPhone.")}
    ${subMenu("Import", "Keycard reinholen", `
      <label class="sync-import-card">
        <input type="file" id="keycardInput" accept=".json,.noco,.noco-key,.txt,.html,.keycard" />
        <span><strong>Keycard importieren</strong><br><small>Desktop-Keycard auswählen oder teilen und hier einfügen.</small></span>
      </label>
    `, true)}
    ${subMenu("Status", "Letzter Sync", `
      <div class="sync-status">
        <p class="eyebrow">Letzter Sync</p>
        <h2>${last ? last.title : "Noch keine Keycard"}</h2>
        <p>${last ? last.text : "Exportiere auf NOCO Desktop eine Keycard und importiere sie hier. Aktuell ist das der sichere Offline-Sync-Weg."}</p>
      </div>
    `)}
    ${subMenu("Export", "Mobile Keycard", `
      <button class="settings-row" data-action="export-mobile-keycard"><span>Mobile Keycard exportieren</span><strong>Download</strong></button>
      <div class="settings-row"><span>Speichert jetzt</span><strong>Code, Apps, Widgets, Pay, Exclusive</strong></div>
    `)}
  `);
}

function themesTemplate() {
  const themes = [
    ["aurora", "Aurora", "preview-aurora"],
    ["midnight", "Midnight", "preview-midnight"],
    ["sunset", "Sunset Glass", "preview-sunset"],
    ["forest", "Forest Bubble", "preview-forest"]
  ];
  return appShell(`
    ${appHero("Themes", "NOCO Look Studio", "Wähle Wallpaper-Farbe, Glas-Stimmung und Bewegung für dein Mobile-System.")}
    <div class="theme-grid">
      ${themes.map(([id, title, preview]) => `
        <button class="theme-option" data-theme-choice="${id}">
          <span class="theme-preview ${preview}"></span>
          <span><strong>${title}</strong><br><small>${settings.theme === id ? "Aktiv" : "Tippen zum Aktivieren"}</small></span>
        </button>
      `).join("")}
    </div>
  `);
}

function webTemplate() {
  return appShell(`
    ${appHero("Explorer", "NOCO Web", "Eine mobile Web-Preview mit Artikeln, Suche und schnellen Ergebnissen.")}
    <input class="search-glass" value="noco mobile glas update" aria-label="NOCO Web Suche" />
    <div class="app-content-grid">
      <button class="web-result"><span><strong>NOCO Mobile startet als PWA</strong><br><small>So fühlt sich eine Website wie eine echte App an.</small></span></button>
      <button class="web-result"><span><strong>Liquid Glass Designguide</strong><br><small>Transparente Ebenen, weiche Kanten und ruhige Bewegung.</small></span></button>
      <button class="web-result"><span><strong>Desktop Sync Idee</strong><br><small>Mobile kann später Notizen, Freigaben und Codes synchronisieren.</small></span></button>
    </div>
  `);
}

function securityTemplate() {
  return appShell(`
    ${appHero("Security", "NOCO ShieldGate", "Code, Passkey, Keycard und App-Freigaben sauber an einem Ort.")}
    ${subMenu("Status", "Sicherheitslage", `
      <div class="security-status-card">
        <p class="eyebrow">Status</p>
        <h2>${settings.codeLock ? "Geschuetzt" : "Offen"}</h2>
        <p>${settings.codeLock ? "Dein Code schuetzt Neustart, Installationen, Deinstallationen und sensible Einstellungen." : "Aktiviere einen Code, wenn Apps und Einstellungen gesichert werden sollen."}</p>
      </div>
    `, true)}
    ${subMenu("Regeln", "Wann wird gefragt?", `
        <div class="settings-row"><span>Nach Neustart / Ausloggen</span><strong>${settings.requireCodeOnLaunch || settings.passkeyEnabled ? "Pflicht" : "Aus"}</strong></div>
        <div class="settings-row"><span>Apps installieren</span><strong>${settings.codeLock ? "Code/Passkey" : "Aus"}</strong></div>
        <div class="settings-row"><span>Apps deinstallieren</span><strong>${settings.codeLock ? "Code/Passkey" : "Aus"}</strong></div>
        <div class="settings-row"><span>Sensible Einstellungen</span><strong>${settings.codeLock ? "Code/Passkey" : "Aus"}</strong></div>
    `)}
    ${subMenu("Aktionen", "Code und Keycard", `
      <div class="security-action-grid">
        <button class="security-action" data-action="set-mobile-code"><strong>${settings.mobileCode ? "Code neu setzen" : "Code erstellen"}</strong><small>Sauberes Code-Menue mit Sicherheitscheck.</small></button>
        <button class="security-action" data-action="setup-passkey"><strong>${settings.passkeyEnabled ? "Passkey erneuern" : "Face ID / Passkey"}</strong><small>Mit Code als Pflicht-Fallback.</small></button>
        <button class="security-action" data-toggle-setting="codeLock"><strong>${settings.codeLock ? "Schutz deaktivieren" : "Schutz aktivieren"}</strong><small>Schaltet App- und Einstellungsfreigaben.</small></button>
        <button class="security-action" data-toggle-setting="requireCodeOnLaunch"><strong>${settings.requireCodeOnLaunch ? "Login-Code aus" : "Login-Code an"}</strong><small>Nach Reload wieder Code verlangen.</small></button>
        <button class="security-action" data-action="clear-passkey"><strong>Passkey entfernen</strong><small>Code bleibt als Schutz erhalten.</small></button>
        <button class="security-action" data-app="sync"><strong>Keycard</strong><small>Importieren oder exportieren.</small></button>
      </div>
      <div class="security-scan-live" id="securityScanLive" hidden>
        <div class="security-scan-bar"><span id="securityScanProgress"></span></div>
        <p class="muted" id="securityScanStatus">Scan bereit</p>
        <div class="security-threat-list" id="securityThreatList"></div>
      </div>
      <button class="primary-action" data-action="scan" id="securityScanBtn">Security Scan starten</button>
    `)}
  `);
}

function payTemplate() {
  const transactions = loadTransactions().filter((entry) => Number(entry.amount) !== 0);
  return appShell(`
    ${appHero("NOCO Pay", "Mobile Wallet", "Dein Fake-Guthaben, Zahlungen und Exclusive-Kaeufe an einem Ort. Wird komplett in der Keycard gespeichert.")}
    ${subMenu("Wallet", "Guthaben", `
      <div class="pay-card">
      <p class="eyebrow">Guthaben</p>
      <h2>${formatEuro(settings.payBalance)}</h2>
      <p>${settings.paymentMethod ? "Zahlungsmethode verbunden." : "Noch keine Zahlungsmethode eingerichtet."}</p>
      <div class="pay-actions">
        <button class="primary-action" data-action="pay-add-balance">+ 10 EUR aufladen</button>
        <button class="security-action" data-action="pay-method"><strong>Zahlungsmethode</strong><small>Mobile Demo-PIN verbinden</small></button>
      </div>
      </div>
    `, true)}
    ${subMenu("Verlauf", "Letzte Bewegungen", `
      ${transactions.length ? transactions.map((entry) => `
        <div class="settings-row">
          <span>${entry.title}<br><small>${new Date(entry.at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</small></span>
          <strong>${entry.amount > 0 ? "+" : ""}${formatEuro(entry.amount)}</strong>
        </div>
      `).join("") : `<div class="settings-row"><span>Noch keine Zahlungen</span><strong>Bereit</strong></div>`}
    `)}
    ${subMenu("Keycard", "Speichern", `
      <div class="settings-row"><span>Guthaben</span><strong>Wird exportiert</strong></div>
      <div class="settings-row"><span>Zahlungsverlauf</span><strong>Wird exportiert</strong></div>
    `)}
  `);
}

function exclusiveTemplate() {
  const active = isExclusiveActive();
  const plan = settings.exclusivePlan || (active ? "member" : "free");
  const planLabel =
    plan === "trial" ? "Probetag" : plan === "monthly" ? "Monatsmitglied" : plan === "keycard" ? "Keycard" : active ? "Member" : "Guest";
  const exclusiveApps = forgeApps.filter((app) => app.exclusive);
  const installed = getInstalledApps();
  const installedExclusive = exclusiveApps.filter((app) => installed.includes(app.id)).length;
  const progressPct = exclusiveApps.length ? Math.round((installedExclusive / exclusiveApps.length) * 100) : 0;
  const memberId = `NX-${String(settings.mobileCode || "0000").slice(0, 4).padEnd(4, "0")}-${planLabel.slice(0, 3).toUpperCase()}`;

  const appCards = exclusiveApps
    .map((app) => {
      const isInstalled = installed.includes(app.id);
      const locked = !active;
      return `
        <article class="exv2-app-card ${locked ? "is-locked" : ""} ${isInstalled ? "is-installed" : ""}">
          ${renderIconOrb(app)}
          <div class="exv2-app-body">
            <strong>${app.title}</strong>
            <small>${app.text}</small>
            <span class="exv2-app-tag">${locked ? "Gesperrt" : isInstalled ? "Bereit" : "Verfuegbar"}</span>
          </div>
          <button class="forge-install" ${locked ? `data-action="exclusive-subscribe"` : isInstalled ? `data-app="${app.id}"` : `data-install="${app.id}"`}>
            ${locked ? "Freischalten" : isInstalled ? "Oeffnen" : "Installieren"}
          </button>
        </article>
      `;
    })
    .join("");

  return appShell(
    `
    <div class="exv2-wrap">
      <header class="exv2-hero ${active ? "is-member" : ""}">
        <div class="exv2-hero-shine" aria-hidden="true"></div>
        <div class="exv2-hero-inner">
          <div class="exv2-brand-row">
            <span class="exv2-brand">NOCO Exclusive</span>
            <span class="exv2-live-pill ${active ? "" : "is-guest"}">${active ? "Live Member" : "Guest"}</span>
          </div>
          <div class="exv2-pass">
            <div class="exv2-pass-mark" aria-hidden="true">X</div>
            <div class="exv2-pass-meta">
              <strong>${active ? "Premium aktiv" : "Upgrade verfuegbar"}</strong>
              <span>${active ? "Deep Scan · Pro Glas · Member Apps" : "1 Tag gratis testen · danach 12 EUR/Monat"}</span>
              <div class="exv2-pass-id">${memberId}</div>
            </div>
          </div>
          <p class="exv2-hero-tagline">${active ? "Dein Abo laeuft auf diesem Geraet. Exclusive-Apps unten installieren und oeffnen." : "Schalte das volle NOCO-Erlebnis frei — staerkeres Glas, Security Plus und exklusive Forge-Apps."}</p>
        </div>
      </header>

      <section class="exv2-compare" aria-label="Vergleich Free und Exclusive">
        <div class="exv2-tier">
          <div class="exv2-tier-label">NOCO Free</div>
          <div class="exv2-tier-price">0 €</div>
          <ul>
            <li>Standard Liquid Glass</li>
            <li>Basis Security Scan</li>
            <li>Forge Standard-Apps</li>
            <li class="is-no">Exclusive Apps</li>
            <li class="is-no">Deep Scan Pro</li>
          </ul>
        </div>
        <div class="exv2-tier is-pro">
          <div class="exv2-tier-label">Exclusive</div>
          <div class="exv2-tier-price">12 €</div>
          <ul>
            <li><strong>NOCO AI unbegrenzt</strong> (inklusive)</li>
            <li>Liquid Glass Pro</li>
            <li>Deep Scan + Pro Themes</li>
            <li>${exclusiveApps.length} Member-Apps</li>
            <li>Keycard Status-Sync</li>
            <li>1 Tag Probe (Demo)</li>
          </ul>
        </div>
      </section>

      <section class="exv2-progress" aria-label="Installationsfortschritt">
        <div class="exv2-progress-head">
          <span>Member-Apps installiert</span>
          <strong>${installedExclusive} / ${exclusiveApps.length}</strong>
        </div>
        <div class="exv2-progress-track">
          <div class="exv2-progress-fill" style="width:${progressPct}%"></div>
        </div>
      </section>

      <section class="exv2-features" aria-label="Exclusive Vorteile">
        <div class="exv2-feature"><div class="exv2-feature-icon">✧</div><strong>NOCO AI unbegrenzt</strong><small>Kein Extra-Plus — der Assistent ist im Exclusive-Paket enthalten.</small></div>
        <div class="exv2-feature"><div class="exv2-feature-icon">◈</div><strong>Pro Glas</strong><small>Tiefere Blur-Stufen und Premium-Reflexe systemweit.</small></div>
        <div class="exv2-feature"><div class="exv2-feature-icon">⛨</div><strong>Deep Scan</strong><small>Erweiterte ShieldGate-Pruefung nur fuer Member.</small></div>
        <div class="exv2-feature"><div class="exv2-feature-icon">✧</div><strong>Pro Themes</strong><small>Zwei mobile Looks mit mehr Glow und Tiefe.</small></div>
        <div class="exv2-feature"><div class="exv2-feature-icon">⬡</div><strong>Member Apps</strong><small>Exclusive Lab, Deep Scan App & Pro Themes in Forge.</small></div>
      </section>

      <section class="exv2-cta" aria-label="Abo Aktionen">
        ${active
          ? `<button class="primary-action" data-action="exclusive-manage">Mitgliedschaft pausieren</button>`
          : `<button class="primary-action" data-action="exclusive-subscribe">Exclusive aktivieren · 12 EUR/Monat</button>
             <button type="button" class="exv2-trial-row" data-action="exclusive-trial">
               <span><strong>1 Tag kostenlos</strong><br><small>${settings.exclusiveTrialUsed ? "Probetag bereits genutzt" : "Demo ohne Risiko — sofort starten"}</small></span>
               <strong>${settings.exclusiveTrialUsed ? "—" : "Start"}</strong>
             </button>`}
        <p class="exv2-pay-hint">Zahlung ueber <strong>NOCO Pay</strong> · Guthaben & Zahlungsmethode noetig fuer Monatsabo</p>
      </section>

      <div class="exv2-section-head">
        <h2>Member Apps</h2>
        <span>${active ? "Installieren & oeffnen" : "Nach Freischaltung"}</span>
      </div>
      <div class="exv2-apps">${appCards}</div>
    </div>
  `,
    "exv2-app"
  );
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
  const standardApps = apps.filter((app) => !app.exclusive && !installed.includes(app.id));
  const installedStoreApps = apps.filter((app) => installed.includes(app.id));
  const exclusiveStoreApps = apps.filter((app) => app.exclusive);
  const sections = {
    discover: { title: "Entdecken", text: "Neue Apps", items: standardApps },
    installed: { title: "Installiert", text: "Öffnen oder löschen", items: installedStoreApps },
    exclusive: { title: "Exclusive", text: "Member Apps", items: exclusiveStoreApps }
  };
  const active = sections[forgeActiveSection] ? forgeActiveSection : "discover";
  const appCards = (items) => items.map((app) => `
    <div class="app-card ${app.exclusive ? "exclusive-row" : ""}">
      ${renderIconOrb(app)}
      <span><strong>${app.title}</strong>${app.exclusive ? `<em class="exclusive-badge">Exclusive</em>` : ""}<br><small>${app.text}</small></span>
      <span class="forge-actions">
        <button class="forge-install" ${installed.includes(app.id) ? `data-app="${app.id}"` : `data-install="${app.id}"`}>${installed.includes(app.id) ? "Öffnen" : app.exclusive && !isExclusiveActive() ? "Exclusive holen" : "Installieren"}</button>
        ${installed.includes(app.id) ? `<button class="forge-delete" data-uninstall="${app.id}">Löschen</button>` : ""}
      </span>
    </div>
  `).join("") || `<div class="settings-row"><span>Nichts gefunden</span><strong>Suche aendern</strong></div>`;
  return appShell(`
    ${appHero("Forge", "NOCO App Store", "Sauberer Mobile-Store mit Suche, echten Installationskarten und klaren Buttons.")}
    <input class="search-glass" data-forge-search value="${forgeSearch.replace(/"/g, "&quot;")}" placeholder="Apps suchen..." aria-label="NOCO Forge Suche" />
    <div class="menu-picker menu-picker-compact">
      ${Object.entries(sections).map(([id, section]) => `
        <button class="${active === id ? "active" : ""}" data-forge-section="${id}">
          <strong>${section.title}</strong><small>${section.text}</small>
        </button>
      `).join("")}
    </div>
    <section class="menu-content forge-menu-content">
      ${subMenu(sections[active].title, sections[active].text, `<div class="forge-grid">${appCards(sections[active].items)}</div>`, true)}
    </section>
  `);
}

function escapeNoteHtml(text) {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function notesTemplate() {
  window.NocoNotes?.reload?.();
  const active = window.NocoNotes?.getActiveNote?.() || { id: "", title: "Notiz", body: "" };
  const list = window.NocoNotes?.listNotes?.() || [];
  const listHtml = list
    .map((note) => {
      const preview = escapeNoteHtml((note.body || "").replace(/\s+/g, " ").slice(0, 48)) || "Leer";
      return `<li><button type="button" class="notes-list-item${note.id === active.id ? " active" : ""}" data-note-select="${note.id}"><strong>${escapeNoteHtml(note.title)}</strong><span>${preview}</span></button></li>`;
    })
    .join("");
  return appShell(`
    ${appHero("Notizen", "Mobile Notes", "Mehrere Notizen — wie AI-Chats. Langdruck zum Umbenennen.")}
    <div class="notes-app-layout" data-notes-app>
      <div class="notes-toolbar">
        <button type="button" class="notes-toolbar-btn" data-note-new>+ Neu</button>
        <span class="notes-active-label">${escapeNoteHtml(active.title)}</span>
      </div>
      <ul class="notes-list" data-notes-list>${listHtml}</ul>
      <input type="text" class="notes-title-input" data-note-title maxlength="60" value="${escapeNoteHtml(active.title)}" aria-label="Titel" />
      <textarea class="notes-body-input" data-note-body rows="10" placeholder="Deine Notiz …" aria-label="Inhalt">${escapeNoteHtml(active.body)}</textarea>
      <button type="button" class="primary-action" data-note-save>Speichern</button>
      <p class="notes-hint">Tipp: «Erstelle Notiz mit Titel Aufgaben» in NOCO AI.</p>
      <div class="notes-rename-sheet hidden" data-notes-rename-sheet>
        <p>Notiz umbenennen</p>
        <input type="text" data-notes-rename-input maxlength="60" />
        <div class="notes-rename-actions">
          <button type="button" data-notes-rename-cancel>Abbrechen</button>
          <button type="button" data-notes-rename-save>Speichern</button>
        </div>
        <button type="button" class="notes-rename-delete" data-notes-rename-delete>Loeschen</button>
      </div>
    </div>
  `);
}

function toonTemplate() {
  const savedToon = localStorage.getItem("noco_mobile_toon_note") || "";
  return appShell(`
    ${appHero("NOCO Toon", "Mobile Zeitung", "Kurze Workspace- und Mobile-News, die mit deiner Keycard mitwandern.")}
    <div class="toon-stack">
      <button class="toon-headline" data-app="calculator">
        <span><strong>NOCO Mobile 1.2</strong><small>Rechner, Tasks, Timer, Wetter und Daily — im Forge installieren.</small></span>
        <em>Neu</em>
      </button>
      <button class="toon-headline">
        <span><strong>Workspace Sync</strong><small>Keycards speichern Apps, Widgets, Pay, Exclusive und Toon-Notizen.</small></span>
        <em>Sync</em>
      </button>
      <button class="toon-headline">
        <span><strong>Design</strong><small>Core nutzt jetzt Menues statt einer langen Einstellungsrolle.</small></span>
        <em>Neu</em>
      </button>
    </div>
    <div class="notes-app-editor">
      <textarea id="toonNoteInput" rows="6" placeholder="Eigene Toon-Notiz...">${savedToon.replace(/</g, "&lt;")}</textarea>
      <button class="primary-action" data-action="save-toon-note">Toon speichern</button>
      <div class="settings-row"><span>Keycard</span><strong>Wird gespeichert</strong></div>
    </div>
  `);
}

function simpleAppTemplate(title, eyebrow, text, rows) {
  return appShell(`
    ${appHero(title, eyebrow, text)}
    <div class="settings-list">
      ${rows.map(([label, value]) => `<div class="settings-row"><span>${label}</span><strong>${value}</strong></div>`).join("")}
    </div>
  `);
}

function arcadeHubTemplate() {
  return appShell(`
    ${appHero("Arcade", "NOCO Games 1.2", "Drei Mini-Spiele und ein kleiner Runner im Liquid-Glass-Look.")}
    <div class="settings-list">
      <button class="settings-row" data-app="dodgerun"><span>Dodge Run</span><strong>Ausweichen</strong></button>
      <button class="settings-row" data-app="tapdash"><span>Tap Dash</span><strong>Speed Tap</strong></button>
      <button class="settings-row" data-app="colorcatch"><span>Color Catch</span><strong>Farben</strong></button>
      <button class="settings-row" data-app="memorygrid"><span>Memory Grid</span><strong>Merken</strong></button>
      <button class="settings-row" data-app="runner"><span>NOCO Runner</span><strong>Neu in 1.2</strong></button>
    </div>
  `);
}

function runnerTemplate() {
  return appShell(`
    ${appHero("Runner", "NOCO Run", "Tippe zum Springen und halte den Orb am Leben.")}
    <section class="runner-stage" data-runner-stage>
      <div class="runner-ground"></div>
      <span class="runner-player" data-runner-player style="transform:translateY(0px)"></span>
      <span class="runner-obstacle" data-runner-obstacle style="left:${runnerGame.obstacleX}%"></span>
      <div class="runner-hud"><strong data-runner-score>${runnerGame.score}</strong><small> Best ${runnerGame.best}</small></div>
    </section>
    <div class="game-grid">
      <button class="settings-row" data-action="runner-start"><span>${runnerGame.running ? "Läuft" : "Start"}</span><strong>${runnerGame.running ? "Springen!" : "Los"}</strong></button>
      <button class="settings-row" data-action="runner-reset"><span>Reset</span><strong>0</strong></button>
    </div>
  `);
}

function updateRunnerDom() {
  const player = sheetContent.querySelector("[data-runner-player]");
  const obstacle = sheetContent.querySelector("[data-runner-obstacle]");
  const score = sheetContent.querySelector("[data-runner-score]");
  if (player) player.style.transform = `translateY(${runnerGame.playerY}px)`;
  if (obstacle) obstacle.style.left = runnerGame.obstacleX + "%";
  if (score) score.textContent = String(runnerGame.score);
}

function runnerJump() {
  if (!runnerGame.running || runnerGame.playerY < -2) return;
  runnerGame.vy = -15;
}

function stopRunnerGame(showToastMsg = true) {
  if (runnerGame.timer) window.clearInterval(runnerGame.timer);
  runnerGame.timer = null;
  const wasRunning = runnerGame.running;
  runnerGame.running = false;
  if (runnerGame.score > runnerGame.best) {
    runnerGame.best = runnerGame.score;
    localStorage.setItem("noco_mobile_runner_best", String(runnerGame.best));
  }
  if (showToastMsg && wasRunning) showToast("Runner Score " + runnerGame.score);
}

function startRunnerGame() {
  stopRunnerGame(false);
  runnerGame.running = true;
  runnerGame.score = 0;
  runnerGame.playerY = 0;
  runnerGame.vy = 0;
  runnerGame.obstacleX = 108;
  openApp("runner");
  runnerGame.timer = window.setInterval(() => {
    if (!runnerGame.running || currentApp !== "runner") {
      stopRunnerGame(false);
      return;
    }
    runnerGame.vy += 0.9;
    runnerGame.playerY = Math.min(0, runnerGame.playerY + runnerGame.vy);
    if (runnerGame.playerY >= 0) {
      runnerGame.playerY = 0;
      runnerGame.vy = 0;
    }
    runnerGame.obstacleX -= 2.4 + Math.min(2.2, runnerGame.score * 0.05);
    const hit = runnerGame.obstacleX < 24 && runnerGame.obstacleX > 12 && runnerGame.playerY > -8;
    if (hit) {
      stopRunnerGame(true);
      openApp("runner");
      return;
    }
    if (runnerGame.obstacleX < -8) {
      runnerGame.score += 1;
      runnerGame.obstacleX = 104 + Math.random() * 8;
    }
    updateRunnerDom();
  }, 48);
  showToast("NOCO Runner gestartet");
}

const FAKE_THREATS = [
  "GlassWorm.tmp",
  "BeamTracker.sdk",
  "CacheLeech.bundle",
  "WidgetSpy.dat",
  "FakeUpdate.pkg"
];

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runSecurityScan() {
  if (securityScanRunning) return;
  const panel = document.getElementById("securityScanLive");
  const progress = document.getElementById("securityScanProgress");
  const status = document.getElementById("securityScanStatus");
  const list = document.getElementById("securityThreatList");
  const button = document.getElementById("securityScanBtn");
  if (!panel || !progress || !status || !list) {
    showToast("Security oeffnen und Scan starten");
    return;
  }
  securityScanRunning = true;
  if (button) button.disabled = true;
  panel.hidden = false;
  list.innerHTML = "";
  const foundThreats = Math.random() < 0.72 ? [FAKE_THREATS[Math.floor(Math.random() * FAKE_THREATS.length)]] : [];
  if (Math.random() < 0.22 && foundThreats.length) foundThreats.push(FAKE_THREATS[Math.floor(Math.random() * FAKE_THREATS.length)]);
  const phases = ["Systemdateien lesen...", "Beam-Signaturen pruefen...", "Widget-Cache scannen...", "ShieldGate abstimmen..."];
  for (let i = 0; i < phases.length; i += 1) {
    status.textContent = phases[i];
    progress.style.width = ((i + 1) / phases.length) * 68 + "%";
    await sleep(620 + Math.random() * 380);
  }
  if (foundThreats.length) {
    status.textContent = foundThreats.length + " Bedrohung(en) gefunden";
    list.innerHTML = foundThreats.map((name) => `
      <div class="security-threat" data-threat="${name}">
        <span><strong>${name}</strong><small>Quarantaene ausstehend</small></span>
        <em>!</em>
      </div>
    `).join("");
    await sleep(900);
    for (const name of foundThreats) {
      status.textContent = "Entferne " + name + "...";
      progress.style.width = "88%";
      await sleep(780 + Math.random() * 520);
      const row = list.querySelector(`[data-threat="${name}"]`);
      if (row) row.classList.add("removed");
      if (Math.random() < 0.14) {
        status.textContent = name + " blockiert den Cleaner kurz...";
        await sleep(1100);
      }
    }
    progress.style.width = "100%";
    status.textContent = Math.random() < 0.08 ? "Scan haengt... nochmal versuchen" : "Bedrohungen entfernt";
    showToast(Math.random() < 0.08 ? "Cleaner musste neu starten" : "System wieder sauber");
  } else {
    progress.style.width = "100%";
    status.textContent = "Keine Bedrohungen gefunden";
    showToast("Scan sauber");
  }
  securityScanRunning = false;
  if (button) button.disabled = false;
}

const CODE_PIN_LENGTH = 4;

function renderCodeDots() {
  const dots = document.getElementById("codeDots");
  if (!dots || !codeInput) return;
  const len = codeInput.value.length;
  dots.innerHTML = Array.from({ length: CODE_PIN_LENGTH }, (_, index) => `
    <span class="code-dot ${index < len ? "filled" : ""}"></span>
  `).join("");
}

function initCodeKeypad() {
  const keypad = document.getElementById("codeKeypad");
  if (!keypad || keypad.dataset.ready) return;
  keypad.dataset.ready = "1";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "OK"];
  keypad.innerHTML = keys.map((key) => `
    <button type="button" class="code-key ${key === "OK" ? "wide" : ""}" data-code-key="${key}">${key}</button>
  `).join("");
  keypad.addEventListener("click", (event) => {
    const key = event.target.closest("[data-code-key]");
    if (!key || !codeInput) return;
    const value = key.dataset.codeKey;
    if (value === "←") codeInput.value = codeInput.value.slice(0, -1);
    else if (value === "OK") codeConfirm?.click();
    else if (codeInput.value.length < CODE_PIN_LENGTH) {
      codeInput.value += value;
      if (codeInput.value.length === CODE_PIN_LENGTH) {
        window.setTimeout(() => codeConfirm?.click(), 120);
      }
    }
    renderCodeDots();
    hapticTap();
  });
  codeInput?.addEventListener("input", renderCodeDots);
}

function tapDashTemplate() {
  return appShell(`
    ${appHero("Tap Dash", "NOCO Games", "Tippe schnell — ab 30 Punkten gewinnst du die Runde.")}
    <section class="game-panel">
      <strong>${tapDashScore}</strong>
      <small>Punkte · Best ${tapDashBest}</small>
      <button class="game-big-button" data-action="tapdash-hit">Tap</button>
    </section>
    <div class="game-grid">
      <button class="settings-row" data-action="tapdash-reset"><span>Runde</span><strong>Reset</strong></button>
      <div class="settings-row"><span>Ziel</span><strong>30</strong></div>
    </div>
  `);
}

function colorCatchTemplate() {
  const colors = ["Mint", "Blue", "Pink"];
  return appShell(`
    ${appHero("Color Catch", "NOCO Games", "Triff die Ziel-Farbe. Combo gibt Bonuspunkte.")}
    <section class="game-panel">
      <small>Ziel · Combo ${colorCatchCombo}</small>
      <strong>${colorCatchTarget}</strong>
      <small class="muted">Best ${colorCatchBest}</small>
    </section>
    <div class="color-game-grid">
      ${colors.map((color) => `<button class="color-choice color-${color.toLowerCase()}" data-color-choice="${color}">${color}</button>`).join("")}
    </div>
  `);
}

function memoryGridTemplate() {
  const preview = memoryState.sequence.join(" → ") || "—";
  const status = memoryState.phase === "playback" ? "Merken..." : memoryState.playerIndex ? `Schritt ${memoryState.playerIndex + 1}/${memoryState.sequence.length}` : "Dein Zug";
  return appShell(`
    ${appHero("Memory Grid", "NOCO Games", "Sieh dir die Reihenfolge an, dann tippe sie nach.")}
    <section class="game-panel">
      <small data-memory-status>${status}</small>
      <strong>Runde ${memoryState.round}</strong>
      <small class="muted">Best ${memoryState.best} · ${preview}</small>
    </section>
    <div class="memory-grid">
      ${[1, 2, 3, 4].map((id) => `<button type="button" data-memory-choice="${id}">${id}</button>`).join("")}
    </div>
    <div class="game-grid">
      <button class="settings-row" data-action="memory-replay"><span>Zeigen</span><strong>Nochmal</strong></button>
      <button class="settings-row" data-action="memory-reset"><span>Neu</span><strong>Reset</strong></button>
    </div>
  `);
}

function calculatorTemplate() {
  const keys = ["C", "MC", "MR", "M+", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"];
  return appShell(`
    ${appHero("Rechner", "NOCO Tools", "Taschenrechner mit Speicher — alles bleibt in der Session.")}
    <div class="calc-display" data-calc-display>${calcState.display}</div>
    <div class="calc-keypad">
      ${keys.map((key) => `<button type="button" class="calc-key ${key === "=" ? "wide" : ""}" data-calc-key="${key}">${key}</button>`).join("")}
    </div>
    ${calcState.memory != null ? `<div class="settings-row"><span>Speicher</span><strong>${calcSanitizeDisplay(calcState.memory)}</strong></div>` : ""}
  `);
}

function timerTemplate() {
  const modes = [
    { id: "focus", label: "Fokus", sub: "25 Min" },
    { id: "break", label: "Pause", sub: "5 Min" },
    { id: "quick", label: "Quick", sub: "15 Min" },
    { id: "custom", label: "Custom", sub: `${timerState.customMinutes} Min` }
  ];
  const remaining = getTimerRemaining();
  const total = timerState.totalSeconds || timerTotalForMode(timerState.mode);
  const pct = total ? (remaining / total) * 100 : 0;
  const presets = [1, 5, 10, 15, 20, 25, 30];
  return appShell(`
    ${appHero("Timer", "NOCO Countdown", "Eigene Minuten waehlen, starten — laeuft auch wenn du die App schliesst.")}
    <div class="timer-ring-wrap" data-timer-ring style="--timer-pct:${pct}">
      <div class="timer-ring-core">
        <strong data-timer-display>${formatTimerDisplay(remaining)}</strong>
        <small data-timer-status>${timerState.running ? "Läuft" : "Bereit"} · ${modes.find((m) => m.id === timerState.mode)?.label || "Custom"}</small>
      </div>
    </div>
    <div class="timer-custom-row">
      <input type="number" inputmode="numeric" min="1" max="180" value="${timerState.customMinutes}" data-timer-minutes aria-label="Minuten" />
      <button type="button" class="timer-preset-btn" data-action="timer-apply-minutes">Setzen</button>
    </div>
    <div class="timer-preset-row">
      ${presets.map((m) => `<button type="button" class="timer-preset-btn ${timerState.mode === "custom" && timerState.customMinutes === m ? "active" : ""}" data-timer-preset="${m}">${m} min</button>`).join("")}
    </div>
    <div class="menu-picker menu-picker-compact">
      ${modes.map((m) => `<button type="button" class="${timerState.mode === m.id ? "active" : ""}" data-timer-mode="${m.id}"><strong>${m.label}</strong><small>${m.sub}</small></button>`).join("")}
    </div>
    <div class="game-grid">
      <button class="settings-row" data-action="timer-toggle"><span data-timer-toggle-label>${timerState.running ? "Pause" : "Start"}</span><strong>${timerState.running ? "||" : "▶"}</strong></button>
      <button class="settings-row" data-action="timer-reset"><span>Zurück</span><strong>↺</strong></button>
    </div>
  `);
}

function escapeMemoryHtml(text) {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function memoriesTemplate() {
  const list = window.NocoReminders?.active?.() || [];
  const chips = [5, 10, 15, 20, 30, 60];
  const rows = list.length
    ? list
        .map((entry) => {
          const soon = window.NocoReminders.remainingMs(entry) < 60000;
          return `
            <article class="memory-card ${soon ? "is-soon" : ""}" data-memory-id="${entry.id}">
              <div>
                <strong>${escapeMemoryHtml(entry.text)}</strong>
                <small>In ${entry.delayMinutes} Min geplant</small>
              </div>
              <div class="memory-card-actions">
                <time data-memory-eta="${entry.id}">${window.NocoReminders.formatEta(entry)}</time>
                <button type="button" class="task-delete" data-memory-delete="${entry.id}" aria-label="Loeschen">×</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="memory-empty">Noch keine Erinnerungen.<br>Sag z. B. in <strong>NOCO AI</strong>: «Erinnere mich in 20 Minuten, Muell rausbringen».</div>`;
  return appShell(`
    ${appHero("Memory", "NOCO Erinnerungen", "Countdown-Erinnerungen — offline auf deinem Geraet.")}
    <section class="memory-compose" data-memory-compose>
      <label for="memoryText">Woran soll ich dich erinnern?</label>
      <textarea id="memoryText" data-memory-text rows="2" placeholder="z. B. Muell rausbringen"></textarea>
      <label>In wie vielen Minuten?</label>
      <div class="memory-minute-row">
        ${chips.map((m) => `<button type="button" class="memory-minute-chip ${memoryPickMinutes === m ? "active" : ""}" data-memory-minutes="${m}">${m} min</button>`).join("")}
      </div>
      <input type="number" inputmode="numeric" min="1" max="1440" value="${memoryPickMinutes}" data-memory-minutes-input aria-label="Minuten" />
      <button type="button" class="primary-action" data-action="memory-add">Erinnerung setzen</button>
    </section>
    <div class="section-title section-title-tight">
      <div><p class="eyebrow">Aktiv</p><h2>Deine Timer</h2></div>
      <span>${list.length}</span>
    </div>
    <div class="memory-list" data-memory-list>${rows}</div>
  `);
}

function updateMemoryEtas() {
  if (currentApp !== "memories" || !sheetContent) return;
  sheetContent.querySelectorAll("[data-memory-eta]").forEach((el) => {
    const id = el.dataset.memoryEta;
    const list = window.NocoReminders?.load?.() || [];
    const entry = list.find((r) => r.id === id && !r.done);
    if (entry) el.textContent = window.NocoReminders.formatEta(entry);
  });
}

function tasksTemplate() {
  const tasks = loadTasks();
  const rows = tasks.length
    ? tasks.map((task) => `
      <label class="task-row ${task.done ? "done" : ""}">
        <input type="checkbox" data-task-toggle="${task.id}" ${task.done ? "checked" : ""} />
        <span>${task.text.replace(/</g, "&lt;")}</span>
        <button type="button" class="task-delete" data-task-delete="${task.id}" aria-label="Loeschen">×</button>
      </label>
    `).join("")
    : `<div class="settings-row"><span>Keine Aufgaben</span><strong>Unten hinzufuegen</strong></div>`;
  return appShell(`
    ${appHero("Tasks", "NOCO Workspace", "Echte Liste mit Speicher und Keycard-Sync.")}
    <div class="task-list">${rows}</div>
    <div class="task-compose">
      <input type="text" data-task-input maxlength="120" placeholder="Neue Aufgabe..." />
      <button type="button" class="primary-action" data-action="task-add">Hinzufuegen</button>
    </div>
    <div class="settings-row"><span>Offen</span><strong>${tasks.filter((t) => !t.done).length}</strong></div>
  `);
}

function weatherTemplate() {
  const w = WEATHER_PRESETS[weatherIndex % WEATHER_PRESETS.length];
  return appShell(`
    ${appHero("Wetter", "NOCO Cloud", "Demo-Wetter mit Refresh — Daten wechseln lokal.")}
    <section class="weather-hero">
      <span class="weather-icon">${w.icon}</span>
      <div>
        <strong>${w.temp}°</strong>
        <small>${w.city}</small>
        <p>${w.cond} · Gefuehlt ${w.feel}°</p>
      </div>
    </section>
    <div class="weather-hours">
      ${w.hours.map((h, i) => `<span><em>+${i + 1}h</em><strong>${h}</strong></span>`).join("")}
    </div>
    <button class="primary-action" data-action="weather-refresh">Aktualisieren</button>
  `);
}

function flashlightTemplate() {
  const on = document.body.classList.contains("flashlight-on");
  return appShell(`
    ${appHero("Taschenlampe", "NOCO Tools", "Schaltet einen hellen Lichtmodus im Phone-Frame.")}
    <section class="flashlight-stage ${on ? "on" : ""}" data-flashlight-stage>
      <span class="flashlight-beam" aria-hidden="true"></span>
      <strong>${on ? "An" : "Aus"}</strong>
    </section>
    <button class="primary-action" data-action="flashlight-toggle">${on ? "Ausschalten" : "Einschalten"}</button>
  `);
}

function quotesTemplate() {
  const quote = QUOTE_POOL[quoteIndex % QUOTE_POOL.length];
  const saved = localStorage.getItem("noco_mobile_saved_quote") || "";
  return appShell(`
    ${appHero("Daily", "NOCO Quotes", "Sprueche zum Merken und Teilen.")}
    <blockquote class="quote-card" data-quote-text>${quote}</blockquote>
    <div class="game-grid">
      <button class="settings-row" data-action="quote-next"><span>Neu</span><strong>↻</strong></button>
      <button class="settings-row" data-action="quote-save"><span>Merken</span><strong>★</strong></button>
    </div>
    ${saved ? `<div class="settings-row"><span>Gespeichert</span><strong>${saved.slice(0, 42)}${saved.length > 42 ? "…" : ""}</strong></div>` : ""}
  `);
}

function sketchTemplate() {
  const saved = (localStorage.getItem("noco_mobile_sketch") || "").replace(/</g, "&lt;");
  return appShell(`
    ${appHero("Sketch", "NOCO Paint", "Text-Skizzenbuch — wird lokal gespeichert.")}
    <div class="notes-app-editor">
      <textarea id="sketchAppInput" rows="10" placeholder="Kritzle Ideen...">${saved}</textarea>
      <button class="primary-action" data-action="save-sketch">Skizze speichern</button>
    </div>
  `);
}

function breathTemplate() {
  const phase = localStorage.getItem("noco_mobile_breath_phase") || "ein";
  return appShell(`
    ${appHero("Breath", "Focus Atem", "4 Sekunden ein, 4 Sekunden aus — folge dem Glas-Kreis.")}
    <div class="breath-orb ${phase === "aus" ? "exhale" : "inhale"}" data-breath-orb aria-hidden="true"></div>
    <p class="breath-label" data-breath-label>${phase === "aus" ? "Ausatmen" : "Einatmen"}</p>
    <button class="primary-action" data-action="breath-toggle">${localStorage.getItem("noco_mobile_breath_on") === "1" ? "Stoppen" : "Atem starten"}</button>
  `);
}

function pulseTemplate() {
  const tasks = loadTasks();
  const openTasks = tasks.filter((t) => !t.done).length;
  const mem = performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 42;
  return appShell(`
    ${appHero("Pulse", "System Pulse", "Live-Werte aus deinem NOCO Mobile Stand.")}
    <div class="pulse-grid">
      <div class="pulse-tile"><span>Apps</span><strong>${getInstalledApps().length + 4}</strong></div>
      <div class="pulse-tile"><span>Tasks</span><strong>${openTasks}</strong></div>
      <div class="pulse-tile"><span>Heap</span><strong>${mem} MB</strong></div>
      <div class="pulse-tile"><span>Theme</span><strong>${settings.theme}</strong></div>
    </div>
    <button class="settings-row" data-action="pulse-refresh"><span>Aktualisieren</span><strong>↻</strong></button>
  `);
}

function focusTemplateV2() {
  return appShell(`
    ${appHero("Focus", "NOCO Focus", "Profile und direkter Sprung zum Timer.")}
    <div class="settings-list">
      <button class="settings-row" data-app="timer"><span>Fokus-Timer</span><strong>25 Min</strong></button>
      <button class="settings-row" data-app="breath"><span>Atem</span><strong>4-4 Rhythmus</strong></button>
      <button class="settings-row" data-timer-mode="focus"><span>Modus</span><strong>Ruhig</strong></button>
    </div>
    <div class="settings-row"><span>Motion</span><strong>${settings.motion ? "An" : "Aus"}</strong></div>
  `);
}

function dodgeRunTemplate() {
  return appShell(`
    ${appHero("Dodge Run", "NOCO Games", "Zieh den leuchtenden Orb nach links und rechts und weich den fallenden Glas-Blöcken aus.")}
    <section class="dodge-stage" data-dodge-stage>
      <div class="dodge-lane"></div>
      <span class="dodge-player" data-dodge-player style="left:${dodgeGame.playerX}%"></span>
      <span class="dodge-obstacle" data-dodge-obstacle style="left:${dodgeGame.obstacleX}%; top:${dodgeGame.obstacleY}%"></span>
      <div class="dodge-hud">
        <strong data-dodge-score>${dodgeGame.score}</strong>
        <small>Best ${dodgeGame.best}</small>
      </div>
    </section>
    <div class="game-grid">
      <button class="settings-row" data-action="dodge-start"><span>${dodgeGame.running ? "Läuft" : "Runde"}</span><strong>${dodgeGame.running ? "Ausweichen!" : "Start"}</strong></button>
      <button class="settings-row" data-action="dodge-reset"><span>Highscore</span><strong>Reset</strong></button>
    </div>
  `);
}

function toggleRow(id, title, text) {
  return `
    <button class="toggle-card" data-toggle-setting="${id}">
      <span><strong>${title}</strong><br><small>${text}</small></span>
      <span class="switch ${settings[id] ? "active" : ""}" aria-hidden="true"></span>
    </button>
  `;
}

let breathInterval = null;

function extraTemplateForApp(appId) {
  const templates = {
    tasks: tasksTemplate,
    timer: timerTemplate,
    memories: memoriesTemplate,
    calculator: calculatorTemplate,
    weather: weatherTemplate,
    flashlight: flashlightTemplate,
    quotes: quotesTemplate,
    sketch: sketchTemplate,
    breath: breathTemplate,
    pulse: pulseTemplate,
    radar: () => simpleAppTemplate("Radar", "NOCO Status", "Systemradar mit Live-Werten.", [
      ["Sync", loadSyncInfo() ? "Verbunden" : "Lokal"],
      ["Motion", settings.motion ? "Aktiv" : "Reduziert"],
      ["Tasks", String(loadTasks().filter((t) => !t.done).length) + " offen"]
    ]),
    recipes: () => simpleAppTemplate("Recipes", "NOCO Ideen", "Rezepte und Ideen — tippe Forge fuer mehr.", [
      ["Heute", "Glas-Limonade"],
      ["Liste", "3 Ideen"],
      ["Sync", "Keycard"]
    ]),
    mood: () => simpleAppTemplate("Mood Board", "NOCO Mood", "Farben und Vibes — Themes-App fuer Looks.", [
      ["Stimmung", "Ruhig"],
      ["Farbe", settings.theme],
      ["Glass", settings.glassBoost ? "Boost" : "Normal"]
    ]),
    vault: () => simpleAppTemplate("Vault Mini", "NOCO Vault", "Sensible Daten — nutze Security + Code.", [
      ["Eintraege", "3"],
      ["Schutz", settings.mobileCode ? "Code" : "Offen"],
      ["Sync", "Keycard"]
    ]),
    glowcam: () => simpleAppTemplate("GlowCam", "NOCO Kamera", "Portrait-Lichtsimulation.", [
      ["Modus", "Portrait"],
      ["Licht", "Mint"],
      ["Filter", "Glass"]
    ]),
    wallet: () => payTemplate(),
    "exclusive-lab": () => simpleAppTemplate("Exclusive Lab", "NOCO Exclusive", "Premium-Labor mit fruehen Features.", [
      ["Status", isExclusiveActive() ? "Member" : "Gesperrt"],
      ["Lab", "Aktiv"],
      ["Sync", "Keycard"]
    ]),
    "deep-scan": () => simpleAppTemplate("Deep Scan", "NOCO Security", "Erweiterter Security-Scan fuer Exclusive.", [
      ["Scan", "Bereit"],
      ["Risiko", "Niedrig"],
      ["Shield", "Aktiv"]
    ]),
    "pro-themes": () => themesTemplate(),
    tapdash: tapDashTemplate,
    colorcatch: colorCatchTemplate,
    memorygrid: memoryGridTemplate,
    dodgerun: dodgeRunTemplate
  };
  return templates[appId] || null;
}

async function openApp(appId, options = {}) {
  const targetId = String(appId || "").trim();
  const force = !!options.force;
  if (!targetId) return;
  if (openAppInFlight) {
    pendingOpenAppId = targetId;
    return;
  }
  openAppInFlight = true;
  try {
  if (editMode) {
    showToast("Bearbeiten beenden, dann App oeffnen");
    return;
  }
  if (currentApp === targetId && !force && appSheet && !appSheet.classList.contains("hidden")) {
    hapticTap();
    return;
  }
  closeBeam();
  closeHub();
  setIslandExpanded(false);
  widgetPanel?.classList.add("hidden");
  shortcutPanel?.classList.add("hidden");
  desktopPanel?.classList.add("hidden");
  if (currentApp === "dodgerun" && targetId !== "dodgerun") stopDodgeGame(false);
  if (currentApp === "runner" && targetId !== "runner") stopRunnerGame(false);
  if (settings.keepAppsAlive !== false && appCache.has(targetId) && !VOLATILE_APP_IDS.has(targetId)) {
    const cached = appCache.get(targetId);
    hapticTap();
    renderAppSheet(targetId, cached.html, { restore: true, scrollTop: cached.scrollTop });
    if (targetId === "dodgerun" && dodgeGame.running) updateDodgeDom();
    if (targetId === "runner" && runnerGame.running) updateRunnerDom();
    if (targetId === "settings") {
      refreshCoreSection();
      syncCoreToggleStates();
    }
    mountNocoAIIfNeeded(targetId);
    mountNotesIfNeeded(targetId);
    return;
  }
  if (currentPage === 1 && desktopNeedsUnlock(1) && !(await unlockDesktop())) {
    return;
  }
  const forgeApp = forgeApps.find((app) => app.id === targetId);
  if (forgeApp?.exclusive && !isExclusiveActive()) {
    renderAppSheet("exclusive", exclusiveTemplate());
    showToast("NOCO Exclusive benoetigt");
    return;
  }
  if (targetId === "pay" || targetId === "wallet") {
    hapticTap();
    renderAppSheet(targetId, payTemplate());
    mountNocoAIIfNeeded(targetId);
    mountNotesIfNeeded(targetId);
    return;
  }
  currentApp = targetId;
  hapticTap();
  const templates = {
    settings: settingsTemplateV2,
    themes: themesTemplate,
    sync: syncTemplate,
    web: webTemplate,
    toon: toonTemplate,
    security: securityTemplate,
    forge: forgeTemplateV2,
    notes: notesTemplate,
    exclusive: exclusiveTemplate,
    cloud: () => simpleAppTemplate("Cloud", "NOCO Cloud", "Vorbereitung für echten Geräte-Sync zwischen Mobile und Desktop.", [
      ["Status", "Konzept bereit"],
      ["Notizen", "Backend nötig"],
      ["Desktop Unlock", "Pairing möglich"]
    ]),
    focus: focusTemplateV2,
    calculator: calculatorTemplate,
    weather: weatherTemplate,
    flashlight: flashlightTemplate,
    quotes: quotesTemplate,
    tasks: tasksTemplate,
    timer: timerTemplate,
    memories: memoriesTemplate,
    sketch: sketchTemplate,
    breath: breathTemplate,
    pulse: pulseTemplate,
    pay: () => simpleAppTemplate("Pay", "NOCO Pay", "Fake-Pay-Ansicht für spätere NOCO Demos und App-Käufe.", [
      ["Guthaben", "24,00 € Demo"],
      ["Exclusive", "Nicht aktiv"],
      ["Zahlung", "Simuliert"]
    ]),
    arcade: arcadeHubTemplate,
    runner: runnerTemplate,
    nocoai: nocoAITemplate,
    transit: () => simpleAppTemplate("Transit", "NOCO Route", "Fake-Reiseplaner für die mobile Demo-Welt.", [
      ["Nächster Halt", "NOCO Plaza"],
      ["Route", "Glaslinie 1"],
      ["Status", "Pünktlich"]
    ])
  };
  const meta = getAppMeta(targetId);
  const renderer = templates[targetId] || extraTemplateForApp(targetId) || (forgeApp
    ? () => simpleAppTemplate(forgeApp.title, "NOCO Mobile App", forgeApp.text, [["Status", "Installiert"], ["Sync", "Keycard bereit"], ["Exclusive", forgeApp.exclusive ? "Ja" : "Nein"]])
    : () => simpleAppTemplate(meta.title, "NOCO Mobile", "Diese App ist auf deinem Geraet bereit.", [["Status", "Bereit"], ["Sync", "Lokal"], ["Version", "1.2"]]));
  renderAppSheet(targetId, renderer());
  mountNocoAIIfNeeded(targetId);
  mountNotesIfNeeded(targetId);
  if (targetId === "timer") window.setTimeout(() => refreshTimerDom(), 60);
  if (targetId === "memories") window.setTimeout(() => updateMemoryEtas(), 60);
  if (targetId === "memorygrid" && memoryState.phase === "input" && !memoryState.playbackLock && memoryState.playerIndex === 0) {
    window.setTimeout(() => playMemorySequence(), 180);
  }
  } finally {
    window.setTimeout(() => {
      openAppInFlight = false;
      const queued = pendingOpenAppId;
      pendingOpenAppId = null;
      if (queued) void openApp(queued);
    }, 180);
  }
}

async function closeAppToPage(page) {
  if (appSheet.classList.contains("hidden")) return;
  stopDodgeGame(false);
  stopRunnerGame(false);
  const target = Math.max(0, Math.min(1, page));
  if (target === 1 && desktopNeedsUnlock(1) && !(await unlockDesktop())) {
    return;
  }
  cancelSheetSwipe();
  closeAppSheetVisual();
  setPage(target);
}

function runShortcut(id) {
  if (id === "hub") {
    closeAllOverlays();
    openHub();
    return;
  }
  const openable = forgeApps.some((app) => app.id === id)
    || baseDesktopApps.some((app) => app.id === id)
    || ["web", "themes", "cloud", "focus", "notes", "pay", "exclusive", "toon", "tasks", "calculator", "timer", "memories", "arcade", "nocoai"].includes(id)
    || getInstalledApps().includes(id);
  if (openable) {
    void openApp(id);
    return;
  }
  hapticTap();
  showToast(shortcutById(id).title + " nicht installiert — Forge oeffnen");
}

const feedItems = [
  ["NOCO Mobile 1.2", "Rechner, Tasks, Timer und Wetter — im Forge installieren."],
  ["Spiele", "Memory zeigt die Sequenz, Tap Dash und Color Catch speichern Bestwerte."],
  ["Themes", "Aurora, Midnight, Sunset und Forest verändern das ganze System."],
  ["Nächster Schritt", "Cloud-Sync und Mobile Unlock brauchen später ein echtes Backend."]
];

if (demoList) {
  feedItems.forEach(([title, text]) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    demoList.appendChild(row);
  });
}

editBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  setIslandExpanded(false);
  if (currentPage === 1) {
    setEditMode(!editMode);
    return;
  }
  if (currentPage !== 0) {
    void goToPage(0);
    window.setTimeout(() => setEditMode(!editMode), 440);
  } else {
    setEditMode(!editMode);
  }
});

homeEditFab?.addEventListener("click", (event) => {
  event.stopPropagation();
  setEditMode(false);
});

widgetAddFab?.addEventListener("click", (event) => {
  event.stopPropagation();
  hapticTap();
  openWidgetPanelFromHome();
});

widgetBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  setIslandExpanded(false);
  if (currentPage === 1) {
    renderDesktopLibrary();
    desktopPanel?.classList.remove("hidden");
    document.body.classList.add("sheet-open");
    return;
  }
  if (!editMode && currentPage === 0) {
    setEditMode(true);
  }
  openWidgetPanelFromHome();
});
saveBtn.addEventListener("click", saveNote);
closeSheet.addEventListener("click", () => closeAppToPage(currentPage));

document.getElementById("coachDismiss")?.addEventListener("click", dismissCoach);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!appSheet?.classList.contains("hidden")) {
    closeAppToPage(currentPage);
    return;
  }
  if (!hubPanel?.classList.contains("hidden")) {
    closeHub();
    return;
  }
  if (!spotlightPanel?.classList.contains("hidden")) {
    closeBeam();
    return;
  }
  if (islandOpen) setIslandExpanded(false);
});
codeConfirm.addEventListener("click", () => finishCodeRequest(codeInput.value.trim()));
codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") finishCodeRequest(codeInput.value.trim());
  if (event.key === "Escape") finishCodeRequest(null);
});

document.querySelectorAll(".island-page-tab[data-page]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    setIslandExpanded(false);
    void goToPage(Number(btn.dataset.page));
  });
});

function openNocoAIFromIsland(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  setIslandExpanded(false);
  hapticTap();
  openApp("nocoai");
}

document.querySelectorAll("[data-open-nocoai]").forEach((btn) => {
  btn.addEventListener("click", openNocoAIFromIsland);
});

dynamicIsland?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (event.target.closest(".island-menu")) return;
  if (event.target.closest("[data-open-nocoai]")) return;
  setIslandExpanded(!islandOpen);
  hapticTap();
});

document.addEventListener("click", (event) => {
  if (!islandOpen) return;
  if (event.target.closest(".island-zone")) return;
  setIslandExpanded(false);
}, true);

function startIslandSwipe(event) {
  if (!islandZone || editMode) return;
  const point = event.touches ? event.touches[0] : event;
  islandZone._swipe = { y: point.clientY, x: point.clientX, at: Date.now() };
}

function endIslandSwipe(event) {
  const start = islandZone?._swipe;
  islandZone._swipe = null;
  if (!start) return;
  const point = event.changedTouches ? event.changedTouches[0] : event;
  const dy = point.clientY - start.y;
  const dx = Math.abs(point.clientX - start.x);
  if (dy > 42 && dy > dx) {
    setIslandExpanded(false);
    openBeam();
  }
}

islandZone?.addEventListener("touchstart", startIslandSwipe, { passive: true });
islandZone?.addEventListener("touchend", endIslandSwipe, { passive: true });

function startPageDragPointer(event) {
  if (event.pointerType === "touch") return;
  if (!canStartPageSwipe(event)) return;
  pageDrag = {
    x: event.clientX,
    y: event.clientY,
    at: Date.now(),
    active: false,
    cancelled: false,
    base: currentPage,
    rawDx: 0,
    pointerId: event.pointerId
  };
}

function movePageDragPointer(event) {
  if (!pageDrag || pageDrag.pointerId !== event.pointerId) return;
  const dx = event.clientX - pageDrag.x;
  const dy = event.clientY - pageDrag.y;
  pageDrag.rawDx = dx;
  if (!pageDrag.active) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < GESTURE.pageStart) return;
    const intent = getGestureIntent(dx, dy, GESTURE.pageRatio);
    if (intent !== "horizontal") {
      pageDrag.cancelled = true;
      pageDrag = null;
      return;
    }
    pageDrag.active = true;
    pageScrollLock = true;
    pageStage?.classList.add("page-swiping");
  }
  event.preventDefault();
  const width = getTrackWidth();
  const atEdge = (pageDrag.base === 0 && dx > 0) || (pageDrag.base === 1 && dx < 0);
  const followDx = atEdge ? dx * 0.22 : dx;
  setPageStageTransform(pageDrag.base, Math.max(-width, Math.min(width, followDx)), false);
}

function endPageDragPointer(event) {
  if (!pageDrag || pageDrag.pointerId !== event.pointerId) return;
  endPageDrag();
}

screenTrack?.addEventListener("pointerdown", startPageDragPointer);
screenTrack?.addEventListener("pointermove", movePageDragPointer);
screenTrack?.addEventListener("pointerup", endPageDragPointer);
screenTrack?.addEventListener("pointercancel", endPageDragPointer);

document.addEventListener("click", async (event) => {
  resetAutoLockTimer();
  if (Date.now() < suppressClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const firstLightToggle = !firstLightPanel?.classList.contains("hidden") && event.target.closest("[data-toggle-setting]");
  if (firstLightToggle) {
    const key = firstLightToggle.dataset.toggleSetting;
    settings[key] = !settings[key];
    saveSettings();
    applySettings();
    renderFirstLight();
    showToast("FirstLight Einstellung gesetzt");
    return;
  }

  if (event.target.closest("[data-open-timer-live]")) {
    void openApp("timer", { force: true });
    hapticTap();
    return;
  }
  if (event.target.closest("[data-open-memory-live]")) {
    void openApp("memories", { force: true });
    hapticTap();
    return;
  }

  const libraryApp = event.target.closest(".library-app[data-app], .library-quick-app[data-app]");
  if (libraryApp && !editMode) {
    event.stopPropagation();
    event.preventDefault();
    await openApp(libraryApp.dataset.app);
    return;
  }

  const app = event.target.closest("[data-app], .forge-install[data-app]");
  if (app && !editMode) {
    event.stopPropagation();
    event.preventDefault();
    await openApp(app.dataset.app);
    return;
  }

  const pageJump = event.target.closest("[data-go-page]");
  if (pageJump) {
    await goToPage(Number(pageJump.dataset.goPage));
  }

  if (event.target.closest("[data-action='go-apps']") && !editMode) {
    void goToPage(1);
    return;
  }

  const beamOpen = event.target.closest("[data-action='open-beam'], [data-action='open-spotlight']");
  if (beamOpen && !editMode) {
    openBeam();
  }

  if (event.target.closest("[data-close-spotlight]") || event.target === spotlightPanel) {
    closeBeam();
  }

  const desktopRemove = event.target.closest("[data-desktop-remove]");
  if (desktopRemove && editMode) {
    hideDesktopBlock(desktopRemove.dataset.desktopRemove);
    return;
  }

  const desktopAdd = event.target.closest("[data-desktop-add]");
  if (desktopAdd && !desktopAdd.disabled) {
    showDesktopBlock(desktopAdd.dataset.desktopAdd);
    return;
  }

  if (event.target.closest("[data-close-desktop-panel]")) {
    desktopPanel?.classList.add("hidden");
  }

  const spotlightOpen = event.target.closest("[data-spotlight-open]");
  if (spotlightOpen) {
    const item = searchIndex.find((entry) => entry.id === spotlightOpen.dataset.spotlightOpen);
    closeSpotlight();
    if (item) resolveSearchItem(item);
  }

  const libraryFolderBtn = event.target.closest("[data-library-folder]");
  if (libraryFolderBtn && !editMode) {
    toggleLibraryFolder(libraryFolderBtn.dataset.libraryFolder);
    return;
  }

  const folder = event.target.closest("[data-folder]");
  if (folder && !editMode) {
    openFolder(folder.dataset.folder);
    return;
  }

  if (event.target.closest("[data-firstlight-next]")) {
    firstLightStep += 1;
    renderFirstLight();
  }

  if (event.target.closest("[data-firstlight-skip]")) {
    finishFirstLight();
  }

  if (event.target.closest("[data-firstlight-finish]")) {
    finishFirstLight();
  }

  if (event.target.closest("[data-firstlight-export]")) {
    await exportMobileKeycard({ skipAuth: true });
    finishFirstLight();
  }

  if (event.target === lockEditBtn) {
    lockEditMode = !lockEditMode;
    renderLockWidgets();
    showToast(lockEditMode ? "Lock Widgets bearbeiten" : "Lock Widgets gespeichert");
  }

  if (event.target === lockWaitBtn) {
    const seconds = Math.max(15, Number(settings.autoLockSeconds || 60));
    showToast("Auto-Lock in " + seconds + " Sekunden");
    if (lockTimer) window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(() => showLockScreen(seconds + " Sekunden vorbei"), seconds * 1000);
  }

  const lockWidget = event.target.closest("[data-lock-widget]");
  if (lockWidget && lockEditMode) {
    toggleLockWidget(lockWidget.dataset.lockWidget);
  }

  const lockWidgetCore = event.target.closest("[data-lock-widget-core]");
  if (lockWidgetCore) {
    toggleLockWidget(lockWidgetCore.dataset.lockWidgetCore);
    if (currentApp === "settings") openApp("settings");
  }

  const lockTime = event.target.closest("[data-lock-time]");
  if (lockTime) {
    settings.autoLockSeconds = Number(lockTime.dataset.lockTime || 60);
    saveSettings();
    resetAutoLockTimer();
    invalidateAppCache("settings");
    if (currentApp === "settings") {
      refreshCoreSection();
      syncCoreToggleStates();
    } else {
      void openApp("settings");
    }
    showToast("Auto-Lock: " + settings.autoLockSeconds + " Sekunden");
  }

  if (event.target.closest("[data-action='preview-lock']")) {
    showLockScreen("Lock Screen Preview");
  }

  const shortcut = event.target.closest("[data-shortcut]");
  if (shortcut && !editMode) {
    event.stopPropagation();
    event.preventDefault();
    runShortcut(shortcut.dataset.shortcut);
    return;
  }

  const panelOpen = event.target.closest("[data-open-panel='shortcuts']");
  if (panelOpen) {
    event.stopPropagation();
    setIslandExpanded(false);
    renderShortcutEditor();
    shortcutPanel?.classList.remove("hidden");
    document.body.classList.add("sheet-open");
  }

  if (event.target.closest("[data-close-panel]")) {
    shortcutPanel?.classList.add("hidden");
    if (appSheet?.classList.contains("hidden") && widgetPanel?.classList.contains("hidden")) {
      document.body.classList.remove("sheet-open");
    }
  }

  if (event.target.closest("[data-close-widget-panel]")) {
    widgetPanel.classList.add("hidden");
    if (appSheet?.classList.contains("hidden") && shortcutPanel?.classList.contains("hidden")) {
      document.body.classList.remove("sheet-open");
    }
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
    refreshWidgetEditButtons();
    saveMobileOrder();
    hapticTap();
    return;
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
    if (key === "passkeyEnabled") {
      if (!settings.passkeyEnabled) {
        await setupPasskey();
        return;
      }
      if (!(await authorizeSensitiveAction("Passkey deaktivieren? Bitte freigeben."))) return;
      localStorage.removeItem("noco_mobile_passkey_id");
      settings.passkeyEnabled = false;
      saveSettings();
      applySettings();
      openApp(currentApp === "security" ? "security" : "settings");
      showToast("Passkey deaktiviert");
      return;
    }
    const sensitiveToggle = ["codeLock", "requireCodeOnLaunch", "strictSecurity"].includes(key);
    if (sensitiveToggle && (settings.strictSecurity || settings.codeLock || settings.passkeyEnabled) && !(await authorizeSensitiveAction("Sicherheitseinstellung aendern? Bitte freigeben."))) {
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
    sessionStorage.removeItem("noco_mobile_launch_unlocked");
  }
    saveSettings();
    applySettings();
    invalidateAppCache("settings");
    if (currentApp === "security") {
      await openApp("security");
      syncCoreToggleStates();
    } else if (currentApp === "settings") {
      refreshCoreSection();
      syncCoreToggleStates();
    } else {
      await openApp("settings");
      refreshCoreSection();
    }
    showToast("Einstellung geändert");
  }

  if (event.target.closest("[data-action='open-security']")) {
    await openApp("security");
  }

  const settingsSection = event.target.closest("[data-settings-section]");
  if (settingsSection) {
    settingsActiveSection = settingsSection.dataset.settingsSection || "deck";
    if (currentApp === "settings") {
      refreshCoreSection();
      return;
    }
    openApp("settings");
  }

  const forgeSection = event.target.closest("[data-forge-section]");
  if (forgeSection) {
    forgeActiveSection = forgeSection.dataset.forgeSection || "discover";
    openApp("forge");
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

  const noteSaveBtn = event.target.closest("[data-note-save]");
  if (noteSaveBtn && window.NocoNotes) {
    const root = noteSaveBtn.closest("[data-notes-app]");
    const title = root?.querySelector("[data-note-title]")?.value?.trim();
    const body = root?.querySelector("[data-note-body]")?.value ?? "";
    const active = window.NocoNotes.getActiveNote();
    window.NocoNotes.updateNote(active.id, { title, body });
    syncHomeNoteFromStore();
    showToast("Notiz gespeichert");
    openApp("notes");
    return;
  }

  const noteNew = event.target.closest("[data-note-new]");
  if (noteNew && window.NocoNotes) {
    window.NocoNotes.createNote(`Notiz ${window.NocoNotes.listNotes().length + 1}`);
    syncHomeNoteFromStore();
    openApp("notes");
    return;
  }

  const noteSelect = event.target.closest("[data-note-select]");
  if (noteSelect && window.NocoNotes) {
    window.NocoNotes.setActive(noteSelect.dataset.noteSelect);
    openApp("notes");
    return;
  }

  const notesRenameSave = event.target.closest("[data-notes-rename-save]");
  if (notesRenameSave && window.NocoNotes) {
    const sheet = document.querySelector("[data-notes-rename-sheet]");
    const id = sheet?.dataset.renameId;
    const val = document.querySelector("[data-notes-rename-input]")?.value?.trim();
    if (id && val) window.NocoNotes.updateNote(id, { title: val });
    sheet?.classList.add("hidden");
    openApp("notes");
    return;
  }

  if (event.target.closest("[data-notes-rename-cancel]")) {
    document.querySelector("[data-notes-rename-sheet]")?.classList.add("hidden");
    return;
  }

  if (event.target.closest("[data-notes-rename-delete]") && window.NocoNotes) {
    const sheet = document.querySelector("[data-notes-rename-sheet]");
    const id = sheet?.dataset.renameId;
    if (id) window.NocoNotes.deleteNote(id);
    sheet?.classList.add("hidden");
    syncHomeNoteFromStore();
    openApp("notes");
    return;
  }

  if (event.target.closest("[data-action='save-toon-note']")) {
    const toonInput = document.getElementById("toonNoteInput");
    if (toonInput) {
      localStorage.setItem("noco_mobile_toon_note", toonInput.value);
      openApp("toon");
      showToast("Toon gespeichert");
    }
  }

  if (event.target.closest("[data-action='setup-passkey']")) {
    setupPasskey();
  }

  if (event.target.closest("[data-action='export-mobile-keycard']")) {
    await exportMobileKeycard();
  }

  if (event.target.closest("[data-action='exclusive-trial']")) {
    if (settings.exclusiveTrialUsed && !settings.nocoExclusive) {
      showToast("Probetag wurde schon genutzt");
      return;
    }
    settings.nocoExclusive = true;
    settings.exclusiveTrialUsed = true;
    settings.exclusivePlan = "trial";
    saveSettings();
    applySettings();
    openApp("exclusive");
    showToast("NOCO Exclusive Probetag aktiv");
  }

  if (event.target.closest("[data-action='exclusive-subscribe']")) {
    if (!settings.paymentMethod) {
      showToast("Bitte zuerst Zahlungsmethode verbinden");
      openApp("pay");
      return;
    }
    if (Number(settings.payBalance || 0) < 12) {
      showToast("Zu wenig Guthaben");
      openApp("pay");
      return;
    }
    settings.nocoExclusive = true;
    settings.exclusivePlan = "monthly";
    changeBalance(-12, "NOCO Exclusive Monat", "exclusive");
    saveSettings();
    applySettings();
    openApp("exclusive");
    showToast("NOCO Exclusive aktiviert");
  }

  if (event.target.closest("[data-action='exclusive-manage']")) {
    settings.nocoExclusive = false;
    settings.exclusivePlan = "";
    saveSettings();
    applySettings();
    openApp("exclusive");
    showToast("Exclusive pausiert");
  }

  if (event.target.closest("[data-action='pay-add-balance']")) {
    changeBalance(10, "NOCO Pay Aufladung", "topup");
    openApp("pay");
    showToast("+10 EUR aufgeladen");
  }

  if (event.target.closest("[data-action='pay-method']")) {
    settings.paymentMethod = true;
    saveSettings();
    openApp("pay");
    showToast("Zahlungsmethode aktiv");
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
    void runSecurityScan();
  }

  if (event.target.closest("[data-action='runner-start']") || event.target.closest("[data-runner-stage]")) {
    if (!runnerGame.running) startRunnerGame();
    else runnerJump();
  }

  if (event.target.closest("[data-action='runner-reset']")) {
    stopRunnerGame(false);
    runnerGame.score = 0;
    runnerGame.best = 0;
    localStorage.setItem("noco_mobile_runner_best", "0");
    openApp("runner");
  }

  if (event.target.closest("[data-action='tapdash-hit']")) {
    tapDashScore += 1;
    if (tapDashScore > tapDashBest) {
      tapDashBest = tapDashScore;
      localStorage.setItem("noco_mobile_tapdash_best", String(tapDashBest));
    }
    invalidateAppCache("tapdash");
    openApp("tapdash");
    if (tapDashScore >= 30) {
      showToast("Tap Dash gewonnen!");
      tapDashScore = 0;
    }
  }

  if (event.target.closest("[data-action='tapdash-reset']")) {
    tapDashScore = 0;
    invalidateAppCache("tapdash");
    openApp("tapdash");
  }

  const colorChoice = event.target.closest("[data-color-choice]");
  if (colorChoice) {
    const colors = ["Mint", "Blue", "Pink"];
    const picked = colorChoice.dataset.colorChoice;
    if (picked === colorCatchTarget) {
      colorCatchCombo += 1;
      const gain = 1 + Math.min(5, colorCatchCombo);
      colorCatchBest = Math.max(colorCatchBest, colorCatchCombo);
      localStorage.setItem("noco_mobile_color_best", String(colorCatchBest));
      showToast("Treffer +" + gain + " Combo");
    } else {
      colorCatchCombo = 0;
      showToast("Daneben — Combo weg");
    }
    colorCatchTarget = colors[Math.floor(Math.random() * colors.length)];
    invalidateAppCache("colorcatch");
    openApp("colorcatch");
  }

  const memoryChoice = event.target.closest("[data-memory-choice]");
  if (memoryChoice && memoryState.phase === "input" && !memoryState.playbackLock) {
    const picked = Number(memoryChoice.dataset.memoryChoice);
    const expected = memoryState.sequence[memoryState.playerIndex];
    flashMemoryCell(picked);
    if (picked === expected) {
      memoryState.playerIndex += 1;
      if (memoryState.playerIndex >= memoryState.sequence.length) {
        memoryState.best = Math.max(memoryState.best, memoryState.round);
        localStorage.setItem("noco_mobile_memory_best", String(memoryState.best));
        memoryState.round += 1;
        showToast("Runde " + (memoryState.round - 1) + " geschafft");
        startNewMemoryRound();
        return;
      }
      invalidateAppCache("memorygrid");
      openApp("memorygrid");
    } else {
      memoryState.round = 1;
      memoryState.best = memoryState.best;
      memoryState.sequence = randomMemorySequence(3);
      memoryState.playerIndex = 0;
      showToast("Falsch — von vorn");
      invalidateAppCache("memorygrid");
      openApp("memorygrid");
      window.setTimeout(() => playMemorySequence(), 200);
    }
  }

  if (event.target.closest("[data-action='memory-replay']")) {
    void playMemorySequence();
  }

  if (event.target.closest("[data-action='memory-reset']")) {
    memoryState.round = 1;
    memoryState.sequence = randomMemorySequence(3);
    memoryState.playerIndex = 0;
    memoryState.phase = "input";
    invalidateAppCache("memorygrid");
    openApp("memorygrid");
    window.setTimeout(() => playMemorySequence(), 200);
  }

  const calcKey = event.target.closest("[data-calc-key]");
  if (calcKey) {
    applyCalcKey(calcKey.dataset.calcKey);
    invalidateAppCache("calculator");
    openApp("calculator");
    hapticTap();
  }

  const timerMode = event.target.closest("[data-timer-mode]");
  if (timerMode) {
    setTimerMode(timerMode.dataset.timerMode);
    refreshTimerApp();
    hapticTap();
  }

  const timerPreset = event.target.closest("[data-timer-preset]");
  if (timerPreset) {
    setTimerMinutes(Number(timerPreset.dataset.timerPreset));
    refreshTimerApp();
    hapticTap();
  }

  if (event.target.closest("[data-action='timer-apply-minutes']")) {
    const input = sheetContent.querySelector("[data-timer-minutes]");
    setTimerMinutes(Number(input?.value || timerState.customMinutes));
    refreshTimerApp();
    showToast(timerState.customMinutes + " Minuten eingestellt");
    hapticTap();
  }

  if (event.target.closest("[data-action='timer-toggle']")) {
    if (timerState.running) {
      stopFocusTimer();
      refreshTimerApp();
    } else {
      startFocusTimer();
      refreshTimerApp();
    }
    hapticTap();
  }

  if (event.target.closest("[data-action='timer-reset']")) {
    stopFocusTimer();
    setTimerMode(timerState.mode);
    refreshTimerApp();
    hapticTap();
  }

  const memoryMinChip = event.target.closest("[data-memory-minutes]");
  if (memoryMinChip) {
    memoryPickMinutes = Number(memoryMinChip.dataset.memoryMinutes) || 10;
    const input = sheetContent.querySelector("[data-memory-minutes-input]");
    if (input) input.value = String(memoryPickMinutes);
    refreshMemoriesApp();
    hapticTap();
  }

  if (event.target.closest("[data-action='memory-add']")) {
    const text = (sheetContent.querySelector("[data-memory-text]")?.value || "").trim();
    const minInput = sheetContent.querySelector("[data-memory-minutes-input]");
    const mins = Number(minInput?.value || memoryPickMinutes);
    if (!text) {
      showToast("Text eingeben");
      return;
    }
    addMemoryReminder(text, mins);
    showToast("Erinnerung in " + mins + " Min");
    refreshMemoriesApp();
    hapticTap();
  }

  const memoryDelete = event.target.closest("[data-memory-delete]");
  if (memoryDelete) {
    window.NocoReminders?.remove?.(memoryDelete.dataset.memoryDelete);
    refreshMemoriesApp();
    hapticTap();
  }

  if (event.target.closest("[data-action='task-add']")) {
    const input = sheetContent.querySelector("[data-task-input]");
    const text = (input?.value || "").trim();
    if (!text) {
      showToast("Text eingeben");
      return;
    }
    const tasks = loadTasks();
    tasks.unshift({ id: "t_" + Date.now(), text, done: false });
    saveTasksList(tasks);
    invalidateAppCache("tasks");
    openApp("tasks");
    showToast("Aufgabe hinzugefuegt");
  }

  const taskToggle = event.target.closest("[data-task-toggle]");
  if (taskToggle) {
    const tasks = loadTasks().map((t) => (t.id === taskToggle.dataset.taskToggle ? { ...t, done: taskToggle.checked } : t));
    saveTasksList(tasks);
    invalidateAppCache("tasks");
    openApp("tasks");
  }

  const taskDelete = event.target.closest("[data-task-delete]");
  if (taskDelete) {
    saveTasksList(loadTasks().filter((t) => t.id !== taskDelete.dataset.taskDelete));
    invalidateAppCache("tasks");
    openApp("tasks");
    showToast("Geloescht");
  }

  if (event.target.closest("[data-action='weather-refresh']")) {
    weatherIndex = (weatherIndex + 1) % WEATHER_PRESETS.length;
    localStorage.setItem("noco_mobile_weather_idx", String(weatherIndex));
    invalidateAppCache("weather");
    openApp("weather");
    showToast("Wetter aktualisiert");
  }

  if (event.target.closest("[data-action='flashlight-toggle']")) {
    const on = document.body.classList.toggle("flashlight-on");
    invalidateAppCache("flashlight");
    openApp("flashlight");
    showToast(on ? "Licht an" : "Licht aus");
  }

  if (event.target.closest("[data-action='quote-next']")) {
    quoteIndex = (quoteIndex + 1) % QUOTE_POOL.length;
    localStorage.setItem("noco_mobile_quote_idx", String(quoteIndex));
    invalidateAppCache("quotes");
    openApp("quotes");
  }

  if (event.target.closest("[data-action='quote-save']")) {
    const text = sheetContent.querySelector("[data-quote-text]")?.textContent || QUOTE_POOL[quoteIndex];
    localStorage.setItem("noco_mobile_saved_quote", text);
    showToast("Spruch gemerkt");
    invalidateAppCache("quotes");
    openApp("quotes");
  }

  if (event.target.closest("[data-action='save-sketch']")) {
    const val = sheetContent.querySelector("#sketchAppInput")?.value || "";
    localStorage.setItem("noco_mobile_sketch", val);
    showToast("Skizze gespeichert");
    invalidateAppCache("sketch");
  }

  if (event.target.closest("[data-action='breath-toggle']")) {
    const running = localStorage.getItem("noco_mobile_breath_on") === "1";
    if (running) {
      localStorage.setItem("noco_mobile_breath_on", "0");
      if (breathInterval) window.clearInterval(breathInterval);
      breathInterval = null;
      showToast("Atem gestoppt");
    } else {
      localStorage.setItem("noco_mobile_breath_on", "1");
      let inhale = true;
      breathInterval = window.setInterval(() => {
        inhale = !inhale;
        localStorage.setItem("noco_mobile_breath_phase", inhale ? "ein" : "aus");
        const orb = sheetContent.querySelector("[data-breath-orb]");
        const label = sheetContent.querySelector("[data-breath-label]");
        if (orb) orb.classList.toggle("exhale", !inhale);
        if (orb) orb.classList.toggle("inhale", inhale);
        if (label) label.textContent = inhale ? "Einatmen" : "Ausatmen";
        if (currentApp !== "breath") return;
      }, 4000);
      showToast("4-4 Atemrhythmus");
    }
    invalidateAppCache("breath");
    openApp("breath");
  }

  if (event.target.closest("[data-action='pulse-refresh']")) {
    invalidateAppCache("pulse");
    openApp("pulse");
    showToast("Pulse aktualisiert");
  }

  if (event.target.closest("[data-action='dodge-start']")) {
    startDodgeGame();
  }

  if (event.target.closest("[data-action='dodge-reset']")) {
    stopDodgeGame(false);
    dodgeGame.score = 0;
    dodgeGame.best = 0;
    localStorage.setItem("noco_mobile_dodge_best", "0");
    openApp("dodgerun");
    showToast("Dodge Run zurueckgesetzt");
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
  resetAutoLockTimer();
  if (event.target.matches("[data-forge-search]")) {
    forgeSearch = event.target.value;
    openApp("forge");
    const input = sheetContent.querySelector("[data-forge-search]");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
  if (event.target === spotlightInput) {
    renderSpotlightResults(spotlightInput.value);
  }
});

document.addEventListener("pointermove", (event) => {
  resetAutoLockTimer();
  const stage = event.target.closest?.("[data-dodge-stage]");
  if (!stage || !dodgeGame.running) return;
  const rect = stage.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
  dodgeGame.playerX = Math.max(8, Math.min(92, x));
  updateDodgeDom();
});

document.addEventListener("change", async (event) => {
  resetAutoLockTimer();
  if (event.target?.id === "keycardInput") {
    await importKeycard(event.target.files?.[0]);
  }
  if (event.target?.id === "firstLightKeycardInput") {
    await importKeycard(event.target.files?.[0], { skipAuth: true, stayInFirstLight: true });
    firstLightStep = Math.max(firstLightStep, 2);
    renderFirstLight();
  }
});

function desktopNeedsUnlock(nextPage) {
  return false;
}

function launchNeedsUnlock() {
  return (settings.passkeyEnabled || settings.requireCodeOnLaunch) && !sessionStorage.getItem("noco_mobile_launch_unlocked");
}

function isWeakCode(code) {
  return !/^\d{4}$/.test(code)
    || /^(\d)\1+$/.test(code)
    || ["0000", "1111", "1234", "4321", "9876"].includes(code)
    || "0123".includes(code)
    || "3210".includes(code);
}

function requestCode({ title, text, setup = false }) {
  return new Promise((resolve) => {
    codeRequest = { resolve, setup };
    codeTitle.textContent = title;
    codeText.textContent = text;
    codeHint.textContent = setup ? "Genau 4 Ziffern — keine Reihen wie 1234 oder 0000." : "4-stelliger NOCO Mobile Code.";
    codeInput.value = "";
    renderCodeDots();
    initCodeKeypad();
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
  const protectedMode = settings.strictSecurity || settings.codeLock || settings.passkeyEnabled;
  if (!protectedMode) return true;
  if (settings.passkeyEnabled && await tryPasskeyUnlock()) {
    showToast("Face ID akzeptiert");
    return true;
  }
  if (!settings.mobileCode) {
    showToast("Bitte zuerst Code oder Passkey einrichten");
    await setMobileCode();
    return !!settings.mobileCode || !!settings.passkeyEnabled;
  }
  const entered = await requestCode({
    title: "Freigabe erforderlich",
    text: reason
  });
  if (entered && entered === settings.mobileCode) {
    showToast("Freigegeben");
    return true;
  }
  showToast("Code nicht korrekt");
  return false;
}

async function unlockDesktop() {
  if (!settings.passkeyEnabled && !settings.requireCodeOnLaunch) return true;
  if (unlockInFlight) return unlockInFlight;
  unlockInFlight = (async () => {
  if (settings.passkeyEnabled && await tryPasskeyUnlock()) {
    sessionStorage.setItem("noco_mobile_launch_unlocked", "1");
    sessionStorage.setItem("noco_mobile_unlocked", "1");
    showToast("Face ID akzeptiert");
    return true;
  }
  if (!settings.mobileCode && !settings.passkeyEnabled) {
    showToast("Bitte erst Code oder Passkey einrichten");
    return false;
  }
  const ok = await authorizeSensitiveAction("NOCO Mobile wurde neu gestartet. Bitte entsperren.");
  return ok;
  })().finally(() => { unlockInFlight = null; });
  return unlockInFlight;
}

async function unlockOnLaunch() {
  if (!launchNeedsUnlock()) return;
  window.setTimeout(async () => {
    if (hasCompletedFirstLight()) {
      showLockScreen("NOCO Mobile neu gestartet");
      return;
    }
    const ok = await unlockDesktop();
    if (ok) sessionStorage.setItem("noco_mobile_launch_unlocked", "1");
  }, 260);
}

async function goToPage(page) {
  const target = Math.max(0, Math.min(1, page));
  if (target === currentPage && !pageScrollLock) return;
  if (desktopNeedsUnlock(target) && !(await unlockDesktop())) {
    applyPageState(0, { scroll: true, smooth: true, haptic: false });
    return;
  }
  document.body.classList.add("noco-transitioning");
  armGestureSafety(560);
  applyPageState(target, { scroll: true, smooth: true, haptic: true });
}

function getGestureIntent(dx, dy, ratio) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absY > absX * GESTURE.verticalCancelRatio) return "vertical";
  if (absX > ratio * absY) return "horizontal";
  return "undecided";
}

function resetSheetGestureTransform() {
  const card = appSheet.querySelector(".sheet-card");
  if (!card) return;
  card.classList.remove("sheet-dragging");
  card.style.transform = "";
  card.style.opacity = "";
}

function openHub() {
  setIslandExpanded(false);
  closeBeam();
  if (!appSheet?.classList.contains("hidden")) closeAppSheetVisual();
  hapticTap();
  hubPanel?.classList.remove("hidden");
  document.body.classList.add("hub-open");
  dismissCoach();
}

function closeHub() {
  hubPanel?.classList.add("hidden");
  document.body.classList.remove("hub-open");
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

function startSheetSwipe(event) {
  if (editMode || appSheet.classList.contains("hidden")) return;
  if (event.target.closest("textarea, input, select, .code-keypad, .code-key, .runner-stage, .dodge-stage, .memory-grid, .color-game-grid")) return;
  const touch = event.touches[0];
  appSwipe = {
    x: touch.clientX,
    y: touch.clientY,
    at: Date.now(),
    active: false,
    cancelled: false,
    basePage: currentPage,
    rawDx: 0,
    card: appSheet.querySelector(".sheet-card")
  };
}

function moveSheetSwipe(event) {
  if (!appSwipe || appSwipe.cancelled) return;
  const touch = event.touches[0];
  const dx = touch.clientX - appSwipe.x;
  const dy = touch.clientY - appSwipe.y;
  appSwipe.rawDx = dx;
  if (!appSwipe.active) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < GESTURE.sheetStart) return;
    const intent = getGestureIntent(dx, dy, GESTURE.pageRatio);
    if (intent === "vertical") {
      appSwipe.cancelled = true;
      return;
    }
    if (intent !== "horizontal") return;
    appSwipe.active = true;
    appSheet.classList.add("app-navigating");
    pageStage?.classList.add("page-swiping");
    appSwipe.card?.classList.add("sheet-dragging");
  }
  if (event.cancelable) event.preventDefault();
  if (appSwipe.active) {
    suppressClickUntil = Date.now() + GESTURE.clickSuppressMs;
  }
  const width = getTrackWidth();
  const atEdge = (appSwipe.basePage === 0 && dx > 0) || (appSwipe.basePage === 1 && dx < 0);
  const followDx = atEdge ? dx * 0.22 : dx;
  const clampedDx = Math.max(-width, Math.min(width, followDx));
  setPageStageTransform(appSwipe.basePage, clampedDx, false);
  const progress = Math.min(1, Math.abs(clampedDx) / Math.max(1, width * 0.92));
  const card = appSwipe.card;
  if (card) {
    card.style.transform = `translate3d(${clampedDx * 0.28}px, 0, 0)`;
    card.style.opacity = String(Math.max(0.55, 1 - progress * 0.5));
  }
}

async function endSheetSwipe(event) {
  if (!appSwipe) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - appSwipe.x;
  const dy = touch.clientY - appSwipe.y;
  const wasActive = appSwipe.active && !appSwipe.cancelled;
  const velocity = Math.abs(dx) / Math.max(1, Date.now() - appSwipe.at);
  const width = getTrackWidth();
  const base = appSwipe.basePage;
  appSwipe = null;
  appSheet.classList.remove("app-navigating");
  pageStage?.classList.remove("page-swiping");
  resetSheetGestureTransform();
  if (!wasActive) return;
  let targetPage = base;
  if (Math.abs(dx) > width * GESTURE.pageSnap || velocity > GESTURE.pageVelocity || Math.abs(dx) > width * 0.14) {
    if (dx > 0) targetPage = 0;
    else if (dx < 0) targetPage = 1;
  }
  if (Math.abs(dx) <= Math.abs(dy) * GESTURE.pageRatio) return;
  stopDodgeGame(false);
  stopRunnerGame(false);
  closeAppSheetVisual();
  await goToPage(targetPage);
  showToast(targetPage === 0 ? "Zum Home gewechselt" : "Zum Desktop gewechselt");
}

function cancelSheetSwipe() {
  appSwipe = null;
  resetSheetGestureTransform();
}

screenTrack?.addEventListener("touchstart", startPageDrag, { passive: true });
document.addEventListener("touchmove", movePageDrag, { passive: false });
document.addEventListener("touchend", endPageDrag, { passive: true });
document.addEventListener("touchcancel", endPageDrag, { passive: true });

appSheet.addEventListener("touchstart", startSheetSwipe, { passive: true });
appSheet.addEventListener("touchmove", moveSheetSwipe, { passive: false });
appSheet.addEventListener("touchend", endSheetSwipe, { passive: true });
appSheet.addEventListener("touchcancel", cancelSheetSwipe, { passive: true });

function saveMobileOrder() {
  const widgetOrder = Array.from(document.querySelectorAll(".draggable-widget:not([hidden])")).map((item) => item.dataset.widgetId);
  const appOrder = Array.from(document.querySelectorAll("#appGrid .app-icon")).map((item) => item.dataset.app);
  const desktopBlockOrder = Array.from(desktopLayout?.querySelectorAll(".desktop-block:not([hidden])") || []).map((item) => item.dataset.desktopBlock);
  const folderOrder = Array.from(document.querySelectorAll("#folderStrip .folder-tile")).map((item) => item.dataset.folder);
  localStorage.setItem("noco_mobile_widget_order", JSON.stringify(widgetOrder));
  localStorage.setItem("noco_mobile_app_order", JSON.stringify(appOrder));
  if (desktopBlockOrder.length) saveDesktopLayout(desktopBlockOrder);
  if (folderOrder.length) localStorage.setItem("noco_mobile_folder_order", JSON.stringify(folderOrder));
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
  const existingIds = new Set(items.map(idGetter).filter(Boolean));
  if (storageKey === "noco_mobile_app_order" && baseDesktopApps.some((app) => !existingIds.has(app.id))) {
    localStorage.removeItem(storageKey);
    ensureBaseDesktopApps();
    return;
  }
  order.forEach((id) => {
    const item = items.find((candidate) => idGetter(candidate) === id);
    if (item) parent.appendChild(item);
  });
}

function applyMobileOrder() {
  applyOrder(".draggable-widget", "noco_mobile_widget_order", (item) => item.dataset.widgetId);
  ensureBaseDesktopApps();
  applyOrder("#appGrid .app-icon", "noco_mobile_app_order", (item) => item.dataset.app);
  ensureBaseDesktopApps();
  applyDesktopLayout();
  applyOrder("#folderStrip .folder-tile", "noco_mobile_folder_order", (item) => item.dataset.folder);
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

const baseDesktopApps = [
  { id: "settings", title: "Core", icon: "C", className: "core" },
  { id: "security", title: "Security", icon: "S", className: "security" },
  { id: "forge", title: "Forge", icon: "F", className: "forge" },
  { id: "sync", title: "Sync", icon: "S", className: "sync" }
];

function createDesktopAppButton(app) {
  const button = document.createElement("button");
  button.className = "app-icon desktop-tile";
  button.dataset.app = app.id;
  button.type = "button";
  button.innerHTML = `${renderIconOrb(app)}<strong>${app.title}</strong>`;
  return button;
}

function desktopAppsToRender() {
  const installedApps = getInstalledApps()
    .map((id) => forgeApps.find((app) => app.id === id))
    .filter(Boolean)
    .filter((app) => !baseDesktopApps.some((base) => base.id === app.id));
  return [...baseDesktopApps, ...installedApps];
}

function forceRenderDesktopGrid(reason = "render") {
  renderLibraryGrid();
  refreshLibraryExpand();
  const appGrid = document.getElementById("appGrid");
  if (appGrid) appGrid.dataset.rendered = reason;
}

function ensureBaseDesktopApps() {
  renderLibraryGrid();
}

function renderInstalledApps() {
  const appGrid = document.getElementById("appGrid");
  if (!appGrid) return;
  ensureDesktopGridVisible();
  forceRenderDesktopGrid("installed");
  ensureBaseDesktopApps();
}

function repairDesktopGrid(reason = "repair") {
  renderLibraryGrid();
  refreshLibraryExpand();
  const appGrid = document.getElementById("appGrid");
  if (appGrid) appGrid.dataset.repaired = reason;
}

async function installForgeApp(id, options = {}) {
  const app = forgeApps.find((item) => item.id === id);
  if (!app) return;
  if (app.exclusive && !isExclusiveActive()) {
    await openApp("exclusive");
    showToast("Diese App ist in NOCO Exclusive");
    return;
  }
  if (!(await authorizeSensitiveAction(app.title + " installieren? Bitte freigeben."))) return;
  const installed = getInstalledApps();
  if (!installed.includes(id)) {
    installed.push(id);
    saveInstalledApps(installed);
    renderInstalledApps();
    refreshLibraryExpand();
    saveMobileOrder();
  }
  if (!options.skipReopen) openApp("forge");
  showToast(app.title + " installiert");
}

async function uninstallForgeApp(id, options = {}) {
  const app = forgeApps.find((item) => item.id === id);
  if (!app) return;
  if (!(await authorizeSensitiveAction(app.title + " deinstallieren? Bitte freigeben."))) return;
  saveInstalledApps(getInstalledApps().filter((item) => item !== id));
  renderInstalledApps();
  refreshLibraryExpand();
  saveMobileOrder();
  if (options.skipReopen) showToast(app.title + " deinstalliert");
  else {
    openApp("forge");
    showToast(app.title + " deinstalliert");
  }
}

function updateDodgeDom() {
  const player = sheetContent.querySelector("[data-dodge-player]");
  const obstacle = sheetContent.querySelector("[data-dodge-obstacle]");
  const score = sheetContent.querySelector("[data-dodge-score]");
  if (player) player.style.left = dodgeGame.playerX + "%";
  if (obstacle) {
    obstacle.style.left = dodgeGame.obstacleX + "%";
    obstacle.style.top = dodgeGame.obstacleY + "%";
  }
  if (score) score.textContent = String(dodgeGame.score);
}

function resetDodgeObstacle() {
  dodgeGame.obstacleY = -14;
  dodgeGame.obstacleX = 12 + Math.round(Math.random() * 76);
}

function stopDodgeGame(showCrash = true) {
  if (dodgeTimer) window.clearInterval(dodgeTimer);
  dodgeTimer = null;
  const wasRunning = dodgeGame.running;
  dodgeGame.running = false;
  if (dodgeGame.score > dodgeGame.best) {
    dodgeGame.best = dodgeGame.score;
    localStorage.setItem("noco_mobile_dodge_best", String(dodgeGame.best));
  }
  if (showCrash && wasRunning) showToast("Crash! Score " + dodgeGame.score);
}

function startDodgeGame() {
  stopDodgeGame(false);
  dodgeGame.running = true;
  dodgeGame.score = 0;
  dodgeGame.playerX = 50;
  resetDodgeObstacle();
  openApp("dodgerun");
  dodgeTimer = window.setInterval(() => {
    if (!dodgeGame.running || currentApp !== "dodgerun") {
      stopDodgeGame(false);
      return;
    }
    dodgeGame.obstacleY += 4.8 + Math.min(3.2, dodgeGame.score * 0.14);
    const hitZone = dodgeGame.obstacleY > 70 && dodgeGame.obstacleY < 92;
    const hitDistance = Math.abs(dodgeGame.obstacleX - dodgeGame.playerX);
    if (hitZone && hitDistance < 13) {
      stopDodgeGame(true);
      openApp("dodgerun");
      return;
    }
    if (dodgeGame.obstacleY > 108) {
      dodgeGame.score += 1;
      resetDodgeObstacle();
    }
    updateDodgeDom();
  }, 72);
  showToast("Dodge Run gestartet");
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

async function importKeycard(file, options = {}) {
  if (!file) return;
  if (!options.skipAuth && !(await authorizeSensitiveAction("Keycard importieren? Bitte freigeben."))) return;
  try {
    const text = await file.text();
    const data = parseKeycard(text);
    const applied = applyKeycardData(data, file.name);
    localStorage.setItem("noco_mobile_sync_info", JSON.stringify({
      title: file.name,
      text: applied.length ? "Übernommen: " + applied.join(", ") : "Keycard gespeichert, aber keine direkt passenden Mobile-Daten gefunden.",
      at: Date.now()
    }));
    if (!options.stayInFirstLight) openApp("sync");
    refreshHomeStatus();
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

  const possibleToon = source.toonNote || source.nocoToon || source.mobileToon || source?.toon?.note || mobileState.toonNote;
  if (typeof possibleToon === "string") {
    localStorage.setItem("noco_mobile_toon_note", possibleToon);
    applied.push("Toon");
  }

  const possibleTasks = mobileState.tasks || source.tasks;
  if (Array.isArray(possibleTasks) && possibleTasks.length) {
    saveTasksList(possibleTasks.filter((t) => t && t.text).slice(0, 80));
    applied.push("Tasks");
  }

  const possibleSketch = mobileState.sketch || source.sketch;
  if (typeof possibleSketch === "string") {
    localStorage.setItem("noco_mobile_sketch", possibleSketch);
    applied.push("Sketch");
  }

  const possibleTheme = source.theme || source.activeTheme || source.currentTheme || source.design || data?.settings?.theme;
  const themeMap = { midnight: "midnight", aurora: "aurora", sunset: "sunset", forest: "forest", glass: "aurora", neon: "aurora", default: "aurora" };
  if (themeMap[possibleTheme]) {
    settings.theme = themeMap[possibleTheme];
    saveSettings();
    applySettings();
    applied.push("Theme");
  }

  const exclusiveValue = source.nocoExclusive ?? source.exclusiveActive ?? source?.exclusive?.active ?? source.nocoPlus ?? source.plusActive ?? source.subscriptionActive ?? source?.subscription?.active ?? source.exclusive;
  if (exclusiveValue !== undefined) {
    settings.nocoExclusive = ["true", "1", "active", "member", "monthly", "trial"].includes(String(exclusiveValue).toLowerCase()) || exclusiveValue === true;
    settings.exclusivePlan = source.exclusivePlan || source.subscriptionPlan || source?.subscription?.plan || (settings.nocoExclusive ? "keycard" : "");
    saveSettings();
    applySettings();
    applied.push("Exclusive");
  }

  const possibleBalance = source.payBalance ?? source.nocoPayBalance ?? source.balance ?? source.walletBalance ?? source?.wallet?.balance ?? source?.nocoPay?.balance;
  if (possibleBalance !== undefined && !Number.isNaN(Number(possibleBalance))) {
    settings.payBalance = Number(possibleBalance);
    settings.paymentMethod = true;
    saveSettings();
    applied.push("Kontostand");
  }

  const importedTransactions = source.transactions || source.payTransactions || source?.wallet?.transactions || source?.nocoPay?.transactions;
  if (Array.isArray(importedTransactions)) {
    saveTransactions(importedTransactions.slice(0, 24));
    applied.push("Zahlungsverlauf");
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

async function exportMobileKeycard(options = {}) {
  if (!options.skipAuth && !(await authorizeSensitiveAction("Mobile Keycard exportieren? Bitte freigeben."))) return;
  const note = localStorage.getItem("noco_mobile_note") || "";
  const toonNote = localStorage.getItem("noco_mobile_toon_note") || "";
  const installedApps = getInstalledApps();
  const visibleWidgets = visibleWidgetIds();
  const widgetOrder = JSON.parse(localStorage.getItem("noco_mobile_widget_order") || "[]");
  const appOrder = JSON.parse(localStorage.getItem("noco_mobile_app_order") || "[]");
  const transactions = loadTransactions();
  const exportedAt = new Date().toISOString();
  const owner = localStorage.getItem("noco_mobile_owner") || "NOCO Mobile User";
  const vaultKey = randomVaultKey();
  const mobileState = {
    platform: "mobile",
    version: "1.2",
    owner,
    code: settings.mobileCode || "",
    mobileCode: settings.mobileCode || "",
    nocoCode: settings.mobileCode || "",
    settings: Object.assign({}, settings),
    theme: settings.theme,
    nocoExclusive: settings.nocoExclusive,
    exclusiveActive: settings.nocoExclusive,
    exclusivePlan: settings.exclusivePlan,
    payBalance: Number(settings.payBalance || 0),
    nocoPayBalance: Number(settings.payBalance || 0),
    paymentMethod: !!settings.paymentMethod,
    transactions,
    wallet: {
      balance: Number(settings.payBalance || 0),
      currency: "EUR",
      transactions
    },
    note,
    notes: note,
    toonNote,
    nocoToon: toonNote,
    tasks: loadTasks(),
    sketch: localStorage.getItem("noco_mobile_sketch") || "",
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
    nocoExclusive: settings.nocoExclusive,
    exclusiveActive: settings.nocoExclusive,
    exclusivePlan: settings.exclusivePlan,
    payBalance: Number(settings.payBalance || 0),
    nocoPayBalance: Number(settings.payBalance || 0),
    transactions,
    toonNote,
    nocoToon: toonNote,
    wallet: {
      balance: Number(settings.payBalance || 0),
      currency: "EUR",
      transactions
    },
    settings,
    snapshot: {
      accountName: owner,
      sessionCode: settings.mobileCode || "",
      protection: { login: true, install: true, delete: true, sessionReset: true, hardReset: true },
      currentTheme: settings.theme,
      currentMode: "dark",
      systemVersion: "1.2",
      installedApps,
      mobileApps: installedApps,
      nocoExclusive: settings.nocoExclusive,
      exclusiveActive: settings.nocoExclusive,
      exclusivePlan: settings.exclusivePlan,
      payBalance: Number(settings.payBalance || 0),
      nocoPayBalance: Number(settings.payBalance || 0),
      transactions,
      wallet: {
        balance: Number(settings.payBalance || 0),
        currency: "EUR",
        transactions
      },
      pinnedApps: [],
      notesText: note,
      note,
      notes: note,
      toonNote,
      nocoToon: toonNote,
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
  sessionStorage.setItem("noco_mobile_launch_unlocked", "1");
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
    sessionStorage.setItem("noco_mobile_launch_unlocked", "1");
    openApp("security");
    showToast("Face ID / Passkey aktiv");
  } catch (_) {
    showToast("Passkey wurde abgebrochen");
  }
}

async function tryPasskeyUnlock() {
  const id = localStorage.getItem("noco_mobile_passkey_id");
  if (!id || !window.PublicKeyCredential || !navigator.credentials) return false;
  if (passkeyInFlight) return false;
  passkeyInFlight = true;
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
  } finally {
    passkeyInFlight = false;
  }
}

function startReorder(event) {
  if (!editMode) return;
  if (event.target.closest(".edit-remove, .beam-glyph, [data-widget-remove]")) return;
  const target = event.target.closest(".draggable-widget, .app-icon, .folder-tile")
    || event.target.closest(".draggable-desktop");
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
    .map((node) => node.closest?.(".draggable-widget, .app-icon, .folder-tile, .draggable-desktop"))
    .find((node) => node && node !== reorderDrag.item && node.parentElement === reorderDrag.parent);
  document.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
  if (over) {
    over.classList.add("drop-target");
    const rect = over.getBoundingClientRect();
    const horizontal = reorderDrag.parent.id === "appGrid" || reorderDrag.parent.id === "folderStrip";
    const after = horizontal
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

document.addEventListener("keydown", (event) => {
  const beamStrip = event.target.closest?.("[data-action='open-beam']");
  if (beamStrip && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    if (!editMode) openBeam();
  }
});

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

function applyDeviceLayoutClass() {
  const touchPrimary = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const phoneWidth = window.matchMedia("(max-width: 520px)").matches;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const handset = touchPrimary && (phoneWidth || standalone);
  document.body.classList.toggle("device-handset", handset);
  document.body.classList.toggle("desktop-preview", !handset);
}

initSearchIndex();
initPageScrollSync();
setPage(0);

applySettings();
applyDeviceLayoutClass();
updateIslandUI();
refreshHomeStatus();
showCoachIfNeeded();
window.addEventListener("resize", () => {
  applyDeviceLayoutClass();
  pageScrollLock = true;
  setPageStageTransform(currentPage, 0, false);
  pageScrollLock = false;
});
initLockScreenGestures();
initCodeKeypad();
loadNote();
renderShortcuts();
ensureBaseDesktopApps();
applyVisibleWidgets();
refreshWidgetEditButtons();
updateHomeEditChrome();
applyMobileOrder();
ensureBaseDesktopApps();
ensureDefaultToolsInstalled();
renderLibraryGrid();
updatePageToggle();
updateClock();
window.NocoReminders?.startTicker?.();
window.addEventListener("noco-reminder-fired", (event) => {
  const reminder = event.detail?.reminder;
  if (!reminder) return;
  handleReminderFired(reminder);
});
window.NocoReminders?.onChange?.(() => {
  updateMemoryEtas();
  updateTimerLiveSurfaces();
  if (currentApp === "memories") invalidateAppCache("memories");
});
window.setInterval(() => {
  if (timerState.running) tickFocusTimer();
  else updateTimerLiveSurfaces();
  if (currentApp === "memories") updateMemoryEtas();
}, 1000);
updateLockClock();
renderLockWidgets();
updateTimerLiveSurfaces();
showFirstLight();
if (hasCompletedFirstLight()) {
  unlockOnLaunch();
  resetAutoLockTimer();
}
window.setInterval(updateClock, 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") cleanupGestureState();
});
window.setInterval(() => {
  updateLockClock();
  if (isLocked) renderLockWidgets();
}, 1000);
window.addEventListener("pageshow", () => {
  if (currentPage === 1) repairDesktopGrid("pageshow");
});
