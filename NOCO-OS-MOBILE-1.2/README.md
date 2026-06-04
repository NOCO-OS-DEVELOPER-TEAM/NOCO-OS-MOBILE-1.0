# NOCO OS Mobile 1.2

Installierbare **PWA** (Progressive Web App) — Demo-Mobile-OS im Browser, inkl. **NOCO AI** (offline, lokal).

## Schnellstart (lokal)

1. Ordner oeffnen und einen lokalen Server starten, z. B.:
   - `npx --yes serve .`
   - oder VS Code / Cursor: **Live Server**
2. Im Browser `http://localhost:3000` (Port je nach Tool) oeffnen.
3. **NOCO AI**: Island oben (✧) oder App «NOCO AI».

> Ohne HTTPS funktioniert der Service Worker nur eingeschraenkt; fuer iPhone-Tests siehe unten.

## iPhone (Safari)

1. Projekt auf **GitHub Pages** oder einen anderen **HTTPS**-Host legen.
2. In **Safari** die URL oeffnen.
3. **Teilen** → **Zum Home-Bildschirm** — dann startet die App im Vollbild.
4. Nach Updates: App einmal schliessen, Safari-Tab mit der Seite oeffnen, **hart neu laden** (Cache v86), dann wieder zur Home-App.

**Hinweis:** Alles liegt in `localStorage` auf dem Geraet — kein Cloud-Backend, keine echten Zahlungen.

## Struktur (Auszug)

| Datei | Rolle |
|-------|--------|
| `index.html` | Shell, Styles, Script-Reihenfolge |
| `app.js` | OS, Apps, Timer, AI-Helpers |
| `noco-ai.js` | Chat-UI & Pipeline |
| `noco-ai-*.js` | AI-Module (Math, Create, Brain, …) |
| `sw.js` | Offline-Cache (PWA) |

## GitHub Pages

1. Repo erstellen, Dateien pushen.
2. **Settings → Pages → Branch** `main` / Ordner `/ (root)`.
3. URL testen: `https://<user>.github.io/<repo>/`

`.nojekyll` ist bereits vorhanden (Jekyll aus).

## Lizenz / Demo

Privates Projekt — Demo-Software ohne Gewaehr.
