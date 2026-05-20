const noteInput = document.getElementById("noteInput");
const saveState = document.getElementById("saveState");
const helloBtn = document.getElementById("helloBtn");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");
const demoList = document.getElementById("demoList");
const controlTiles = document.querySelectorAll(".control-tile");
const currentTime = document.getElementById("currentTime");
const networkStatus = document.getElementById("networkStatus");
const batteryStatus = document.getElementById("batteryStatus");
const batteryFill = document.getElementById("batteryFill");

function updateClock() {
  const now = new Date();
  currentTime.textContent = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateNetworkStatus() {
  const connection = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  if (!connection) {
    networkStatus.textContent = "5G";
    return;
  }

  const type = connection.effectiveType || connection.type || "";
  const normalized = String(type).toLowerCase();
  if (normalized.includes("4g")) networkStatus.textContent = "5G";
  else if (normalized.includes("3g")) networkStatus.textContent = "LTE";
  else if (normalized.includes("wifi")) networkStatus.textContent = "Wi-Fi";
  else networkStatus.textContent = "Netz";
}

function setBatteryUi(level, charging = false) {
  const percent = Math.max(0, Math.min(100, Math.round(level * 100)));
  batteryStatus.textContent = charging ? percent + "%+" : percent + "%";
  batteryFill.style.width = percent + "%";
  batteryFill.style.background = percent <= 20
    ? "linear-gradient(90deg, #ff8c8c, #ffd18a)"
    : "linear-gradient(90deg, var(--mint), var(--blue))";
}

async function initBatteryStatus() {
  if (!("getBattery" in navigator)) {
    setBatteryUi(1, false);
    return;
  }

  try {
    const battery = await navigator.getBattery();
    const update = () => setBatteryUi(battery.level, battery.charging);
    update();
    battery.addEventListener("levelchange", update);
    battery.addEventListener("chargingchange", update);
  } catch (_) {
    setBatteryUi(1, false);
  }
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function hapticTap() {
  if (navigator.vibrate) navigator.vibrate(12);
}

function loadNote() {
  const saved = localStorage.getItem("noco_mobile_note") || "";
  noteInput.value = saved;
  saveState.textContent = saved ? "Letzte Notiz geladen." : "Noch nichts gespeichert.";
}

function saveNote() {
  localStorage.setItem("noco_mobile_note", noteInput.value.trim());
  saveState.textContent = "Gespeichert um " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  hapticTap();
  showToast("Notiz gespeichert");
}

const feedItems = [
  ["NOCO Mobile 1.0", "PWA-Start mit Liquid Glass, Hochformat und iPhone-Safe-Areas."],
  ["Home-Bildschirm", "In Safari teilen und als App speichern, ohne IPA oder Xcode."],
  ["Offline bereit", "Service Worker cached die wichtigsten Dateien nach dem ersten Start."],
  ["Notizen", "Die Demo speichert lokal im Browser, damit die Funktion sofort testbar ist."],
  ["Naechster Schritt", "Lockscreen, Seiten-Desktop und Control Center koennen darauf aufbauen."]
];

feedItems.forEach(([title, text]) => {
  const row = document.createElement("div");
  row.className = "list-item";
  row.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  demoList.appendChild(row);
});

controlTiles.forEach((tile) => {
  tile.addEventListener("click", () => {
    controlTiles.forEach((item) => item.classList.remove("active"));
    tile.classList.add("active");
    hapticTap();
    showToast(tile.querySelector("strong").textContent + " aktiviert");
  });
});

document.querySelectorAll(".app-icon").forEach((button) => {
  button.addEventListener("click", () => {
    hapticTap();
    showToast(button.querySelector("strong").textContent + " startet bald");
  });
});

helloBtn.addEventListener("click", () => {
  hapticTap();
  showToast("NOCO OS Mobile laeuft");
});

saveBtn.addEventListener("click", saveNote);

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
updateClock();
updateNetworkStatus();
initBatteryStatus();
window.setInterval(updateClock, 1000);
window.setInterval(updateNetworkStatus, 5000);
