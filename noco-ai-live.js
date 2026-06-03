/**
 * NOCO AI Live — Neue System-Aktionen (nur Funktionen die es so noch nicht gab)
 */
(function initNocoAILive(global) {
  const THEME_POOL = ["aurora", "midnight", "sunset", "forest"];

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

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function process(raw, helpers) {
    const q = norm(raw);
    const text = String(raw || "").trim();
    if (!q) return null;

    if (/\b(letzte app|zurueck zur letzten app|oeffne letzte app|vorherige app)\b/.test(q)) {
      const id = helpers.getLastOpenedApp?.();
      if (!id) {
        return {
          type: "text",
          text: "<p>Noch keine <strong>letzte App</strong> in dieser Session — oeffne zuerst eine App.</p>",
          rememberTopic: "lastapp"
        };
      }
      const title = helpers.getAppTitle?.(id) || id;
      return {
        type: "action",
        text: `<p>Zurueck zu <strong>${esc(title)}</strong> …</p>`,
        run: () => helpers.openApp?.(id),
        rememberTopic: "lastapp"
      };
    }

    if (/\b(meeting vorbereitung|meeting prep|termin vorbereitung)\b/.test(q)) {
      const m = text.match(/\b(?:meeting vorbereitung|meeting prep|termin vorbereitung)\s+(.+)/i);
      const topic = m ? m[1].trim().slice(0, 100) : "Meeting";
      return {
        type: "action",
        text: `<p><strong>Meeting-Prep:</strong> Notiz + 15-Min-Timer + Notizen-App …</p>`,
        run: () => {
          helpers.createNote?.({
            title: "Meeting: " + topic.slice(0, 40),
            body: "Vorbereitung:\n- Ziel: " + topic + "\n- Offene Punkte:\n",
            openApp: false
          });
          helpers.applyTimerMinutes?.(15);
          helpers.startTimerCountdown?.();
          helpers.showToast?.("Meeting-Prep");
          void helpers.openApp?.("notes");
        },
        rememberTopic: "meeting"
      };
    }

    if (/\b(nacht routine|night routine|schlaf modus)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>Nacht-Routine:</strong> Midnight, Auto-Lock an, Memory-App …</p>",
        run: () => {
          helpers.setTheme?.("midnight", { syncWallpaper: true });
          helpers.setSettingToggle?.("autoLock", true);
          helpers.setSettingToggle?.("liveWallpaper", false);
          helpers.goToPage?.(0);
          void helpers.openApp?.("memories");
          helpers.showToast?.("Gute Nacht-Routine");
        },
        rememberTopic: "night"
      };
    }

    if (/\b(theme zufall|zufalls theme|shuffle theme|random theme)\b/.test(q)) {
      const id = pick(THEME_POOL);
      return {
        type: "action",
        text: `<p>Zufalls-Theme: <strong>${esc(id)}</strong> …</p>`,
        run: () => {
          helpers.setTheme?.(id, { syncWallpaper: true });
          helpers.showToast?.("Theme: " + id);
        },
        rememberTopic: "theme"
      };
    }

    if (/\b(system tour|os tour|zeig mir noco)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>System-Tour:</strong> Hub → Home → Apps …</p>",
        run: () => {
          helpers.openHub?.();
          helpers.showToast?.("Tour: Hub");
          window.setTimeout(() => {
            helpers.closeCurrentApp?.();
            helpers.goToPage?.(0);
            helpers.showToast?.("Tour: Home");
          }, 2200);
          window.setTimeout(() => {
            helpers.goToPage?.(1);
            helpers.showToast?.("Tour: Apps-Bibliothek");
          }, 4400);
        },
        rememberTopic: "tour"
      };
    }

    if (/\b(inbox als notiz|speichere inbox|inbox notiz)\b/.test(q)) {
      const html = global.NocoAISystem?.buildInboxHtml?.(helpers) || "<p>Inbox</p>";
      const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return {
        type: "action",
        text: "<p>Schreibe deine <strong>Inbox</strong> als Notiz …</p>",
        run: () => {
          helpers.createNote?.({
            title: "Inbox " + new Date().toLocaleDateString("de-DE"),
            body: plain.slice(0, 1200),
            openApp: true
          });
        },
        rememberTopic: "inbox-note"
      };
    }

    if (/\b(ping|kurz erinnern)\s+(in\s+)?(\d+)\s*(min|minute|minuten)?\b/.test(q) || /\bping\s+(.+)/.test(q)) {
      let mins = 5;
      const mMin = q.match(/\b(\d+)\s*(min|minute|minuten)\b/);
      if (mMin) mins = Math.max(1, Math.min(60, Number(mMin[1])));
      const mText = text.match(/\bping\s+(.+)/i);
      const label = mText ? mText[1].replace(/\s+in\s+\d+\s*min.*/i, "").trim().slice(0, 80) : "Ping";
      return {
        type: "action",
        text: `<p><strong>Ping</strong> in ${mins} Min: «${esc(label || "Ping")}» …</p>`,
        run: () => {
          helpers.addReminder?.({ text: label || "Ping", minutes: mins });
          helpers.showToast?.("Ping in " + mins + " Min");
        },
        rememberTopic: "ping"
      };
    }

    if (/\b(noco ai widget|ki widget auf home|ai widget hinzufuegen)\b/.test(q)) {
      const ids = helpers.listHomeWidgets?.() || [];
      const has = ids.some((id) => norm(id) === "nocoai" || norm(String(id)).includes("noco"));
      if (has) {
        return {
          type: "text",
          text: "<p>Das <strong>NOCO-AI-Widget</strong> ist schon auf dem Home.</p>",
          offerRun: () => helpers.goToPage?.(0),
          offerLabel: "Home",
          rememberTopic: "widget"
        };
      }
      return {
        type: "action",
        text: "<p>Fuege <strong>NOCO AI Widget</strong> zum Home hinzu …</p>",
        run: () => {
          helpers.goToPage?.(0);
          window.setTimeout(() => {
            helpers.addHomeWidget?.("nocoai");
            helpers.showToast?.("NOCO AI Widget");
          }, 280);
        },
        rememberTopic: "widget"
      };
    }

    if (/\b(sperrbildschirm mit namen|lock mit namen|zeige sperre mit namen)\b/.test(q)) {
      const name = helpers.getNickname?.() || global.NocoAIProfile?.getNickname?.();
      const label = name ? `Hallo ${name}` : "NOCO OS";
      return {
        type: "action",
        text: name
          ? `<p>Lock Screen mit <strong>${esc(name)}</strong> …</p>`
          : "<p>Setze zuerst einen Nickname — <strong>Ich heisse …</strong></p>",
        run: () => {
          if (name) helpers.showLockScreenPreview?.(label);
          else helpers.showLockScreenPreview?.();
        },
        rememberTopic: "lock-name"
      };
    }

    if (/\b(kitzel|surprise system|system ueberraschung)\b/.test(q)) {
      const actions = [
        () => helpers.setTheme?.(pick(THEME_POOL), { syncWallpaper: true }),
        () => helpers.openBeam?.(""),
        () => helpers.addReminder?.({ text: "System-Kitzel", minutes: 3 }),
        () => {
          helpers.applyTimerMinutes?.(3);
          helpers.startTimerCountdown?.();
        }
      ];
      return {
        type: "action",
        text: "<p><strong>System-Kitzel</strong> — kurze Ueberraschungs-Aktion …</p>",
        run: () => {
          pick(actions)();
          helpers.showToast?.("Kitzel!");
        },
        rememberTopic: "kitzel"
      };
    }

    if (/\b(schnell start|quick launch)\s+(.+)/.test(q)) {
      const m = text.match(/\b(?:schnell start|quick launch)\s+(.+)/i);
      const tail = m ? m[1].trim() : "";
      const hit = global.NocoAI?.resolveAppFromQuery?.(norm(tail), 50);
      if (hit?.appId) {
        const title = helpers.getAppTitle?.(hit.appId) || hit.appId;
        return {
          type: "action",
          text: `<p>Schnellstart <strong>${esc(title)}</strong> + Home …</p>`,
          run: () => {
            helpers.goToPage?.(0);
            window.setTimeout(() => helpers.openApp?.(hit.appId), 200);
          },
          rememberTopic: "quicklaunch"
        };
      }
    }

    return null;
  }

  global.NocoAILive = { process };
})(typeof window !== "undefined" ? window : globalThis);
