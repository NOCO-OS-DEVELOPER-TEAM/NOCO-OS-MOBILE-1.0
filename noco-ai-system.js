/**
 * NOCO AI System 3.0 — Inbox, Status, Erinnerungen, Guides, Suche
 */
(function initNocoAISystem(global) {
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

  function snap(h) {
    return h.getSystemSnapshot?.() || {};
  }

  function parseMinutes(q) {
    if (/\bin\s+halbe\s+stunde\b/.test(q) || /\bhalbe\s+stunde\b/.test(q)) return 30;
    if (/\bin\s+(einer\s+)?stunde\b/.test(q) || /\beine\s+stunde\b/.test(q)) return 60;
    if (/\bin\s+zwei\s+stunden\b/.test(q)) return 120;
    let m = q.match(/\bin\s+(\d+)\s*(min|minute|minuten|m)\b/);
    if (m) return Math.max(1, Math.min(24 * 60, Number(m[1])));
    m = q.match(/\bin\s+(\d+)\s*(h|std|stunde|stunden)\b/);
    if (m) return Math.max(1, Math.min(24 * 60, Number(m[1]) * 60));
    m = q.match(/\b(\d+)\s*(min|minute|minuten|m)\b/);
    if (m && /\b(erinner|remind|memory|timer)\b/.test(q)) return Math.max(1, Math.min(24 * 60, Number(m[1])));
    m = q.match(/\b(\d+)\s*(h|std|stunde|stunden)\b/);
    if (m && /\b(erinner|remind|memory)\b/.test(q)) return Math.max(1, Math.min(24 * 60, Number(m[1]) * 60));
    return null;
  }

  function parseReminderText(raw, q) {
    const t = String(raw || "").trim();
    let m = t.match(/erinnere?\s+mich\s+an\s+(.+?)\s+in\s+\d+/i);
    if (m) return m[1].trim().slice(0, 120);
    m = t.match(/erinnere?\s+mich\s+in\s+\d+\s*(?:min(?:ute)?n?|stunde?n?|h|m)\s+(?:an\s+)?(.+)/i);
    if (m) return m[1].trim().slice(0, 120);
    m = t.match(/erinnere?\s+mich\s*,?\s*(.+)/i);
    if (m) {
      let tail = m[1].trim();
      tail = tail.replace(/\s+in\s+\d+\s*(?:min(?:ute)?n?|stunde?n?|h|m).*$/i, "").trim();
      if (tail.length >= 2) return tail.slice(0, 120);
    }
    m = t.match(/remind(?:er)?\s+me\s+(?:to\s+)?(.+)/i);
    if (m) return m[1].trim().slice(0, 120);
    return "Erinnerung";
  }

  function buildInboxHtml(h) {
    const s = snap(h);
    const parts = [];
    if (s.timerRunning) {
      parts.push(`<li><strong>Timer</strong> laeuft — noch <strong>${esc(s.timerDisplay)}</strong>${s.timerEndTime ? ` (bis ${esc(s.timerEndTime)})` : ""}</li>`);
    }
    if (s.nextReminderText) {
      parts.push(`<li><strong>Memory</strong> «${esc(s.nextReminderText)}» — in <strong>${esc(s.nextReminderEta)}</strong></li>`);
    } else if (s.reminderCount > 0) {
      parts.push(`<li><strong>${s.reminderCount}</strong> Erinnerung(en) aktiv</li>`);
    }
    if (s.openTaskCount > 0) {
      const preview = (s.openTasksPreview || []).map((t) => esc(t)).join(" · ");
      parts.push(`<li><strong>${s.openTaskCount}</strong> offene Aufgabe(n): ${preview || "—"}</li>`);
    } else {
      parts.push("<li>Keine offenen <strong>Tasks</strong></li>");
    }
    parts.push(`<li><strong>${s.noteCount ?? 0}</strong> Notizen · <strong>${s.chatCount ?? 0}</strong> AI-Chats</li>`);
    const where = s.currentAppTitle
      ? `App <strong>${esc(s.currentAppTitle)}</strong>`
      : `Seite <strong>${esc(s.currentPage || "Home")}</strong>`;
    parts.push(`<li>Du bist auf: ${where}${s.editMode ? " · <strong>Edit</strong>" : ""}</li>`);
    if (!s.timerRunning && !s.nextReminderText && !s.openTaskCount) {
      parts.push("<li>Alles ruhig — guter Moment fuer <strong>Fokus Modus</strong> oder eine <strong>Notiz</strong>.</li>");
    }
    return `<p><strong>Dein Ueberblick</strong></p><ul>${parts.join("")}</ul>`;
  }

  function buildStatusHtml(h) {
    const s = snap(h);
    const perf =
      s.glassBoost && s.motion && s.liveWallpaper
        ? "Volles Glas (evtl. mehr Last)"
        : s.glassBoost || s.motion
          ? "Ausgewogen"
          : "Performance-Modus";
    const lock = s.codeLock ? "Code-Sperre an" : "Kein Code";
    return `<p><strong>System Status</strong> · Build <strong>${esc(s.build || "?")}</strong></p>
      <ul>
        <li>Theme: <strong>${esc(s.theme)}</strong> · ${perf}</li>
        <li>${lock} · Auto-Lock: <strong>${s.autoLock ? esc(s.autoLockSeconds + "s") : "aus"}</strong></li>
        <li>Apps installiert: <strong>${s.installed}</strong> · Exclusive: <strong>${s.exclusiveActive ? "ja" : "nein"}</strong></li>
        <li>Pay: <strong>${esc(s.payBalance)}</strong> · Helligkeit UI: <strong>${Math.round((s.uiBrightness || 1) * 100)}%</strong></li>
        <li>Widgets: ${(s.widgets || []).map((w) => esc(w)).join(", ") || "—"}</li>
        ${s.timerRunning ? `<li>Timer: <strong>${esc(s.timerDisplay)}</strong></li>` : ""}
        ${s.reminderCount ? `<li>Memories: <strong>${s.reminderCount}</strong> aktiv</li>` : ""}
      </ul>`;
  }

  const GUIDES = [
    {
      test: (q) => /\b(wie|wo).*(auto.?lock|bildschirm sperre|sperre einstellen)\b/.test(q),
      text: "<p><strong>Auto-Lock</strong> findest du in <strong>Core</strong> unter Sicherheit & Display.</p><p>Soll ich Core oeffnen und die Sektion anzeigen?</p>",
      offerLabel: "Core Auto-Lock",
      offerRun: (h) => () => h.navigateCore?.({ section: "security" })
    },
    {
      test: (q) => /\b(wie|wo).*(widget|widgets).*(hinzu|add|neu|einfueg)\b/.test(q),
      text: "<p><strong>Widgets:</strong> Island → <strong>Edit</strong> auf Home → <strong>+</strong> unten rechts.</p><p>Soll ich Edit-Modus und die Auswahl starten?</p>",
      offerLabel: "Widget hinzufuegen",
      offerRun: (h) => () => {
        h.goToPage?.(0);
        window.setTimeout(() => {
          h.enableEditMode?.();
          window.setTimeout(() => h.openWidgetPanel?.(), 280);
        }, 240);
      }
    },
    {
      test: (q) => /\b(wie|wo).*(code|pin|passwort|sperre).*(setzen|aktivieren|einrichten)\b/.test(q),
      text: "<p><strong>Code-Sperre:</strong> App <strong>ShieldGate</strong> oder Core → Sicherheit.</p><p>ShieldGate oeffnen?</p>",
      offerLabel: "ShieldGate",
      offerRun: (h) => () => h.openSecurity?.() || h.openApp?.("security")
    },
    {
      test: (q) => /\b(wie|wo).*(backup|keycard|export|import)\b/.test(q),
      text: "<p><strong>Backup:</strong> <strong>Sync</strong> erstellt/importiert eine Keycard (offline, lokal).</p><p>Sync oeffnen?</p>",
      offerLabel: "Sync",
      offerRun: (h) => () => h.openSync?.() || h.openApp?.("sync")
    },
    {
      test: (q) => /\b(wie|wo).*(theme|design|farbe).*(wechseln|aendern|andern)\b/.test(q),
      text: "<p><strong>Theme:</strong> App <strong>Themes</strong> oder sag <strong>Theme Midnight</strong>.</p><p>Themes-App oeffnen?</p>",
      offerLabel: "Themes",
      offerRun: (h) => () => h.openThemes?.() || h.openApp?.("themes")
    },
    {
      test: (q) => /\b(wie|wo).*(erinnerung|memory|reminder).*(setzen|anlegen)\b/.test(q),
      text: "<p>Sag z. B. <strong>Erinnere mich in 20 Minuten, Muell raus</strong> — oder oeffne die <strong>Memory</strong>-App.</p>",
      offerLabel: "Memory App",
      offerRun: (h) => () => h.openMemories?.() || h.openApp?.("memories")
    },
    {
      test: (q) => /\b(wie|wo).*(island|notch|insel).*(menu|menue|funktion)\b/.test(q),
      text: "<p><strong>Island:</strong> Tippen = Schnellmenu (Beam, Hub, Home, Apps, AI, Edit, Timer, Core). <strong>✧</strong> = NOCO AI. Status zeigt Timer/Memory.</p>",
      offerLabel: null,
      offerRun: null
    }
  ];

  function processGuide(raw, helpers) {
    const q = norm(raw);
    if (!q || q.length < 8) return null;
    if (!/\b(wie|wo|was muss ich|anleitung|schritt|einrichten|einstellen)\b/.test(q)) return null;
    for (const g of GUIDES) {
      if (!g.test(q)) continue;
      return {
        text: g.text,
        offerRun: g.offerRun ? () => g.offerRun(helpers) : null,
        offerLabel: g.offerLabel || null
      };
    }
    return null;
  }

  function extractSearchNeedle(raw, q) {
    let m = String(raw || "").match(/\b(?:such|suche|finde|search)\s+(?:mir\s+)?(?:ueberall|in\s+notizen?|in\s+chats?|nach)\s+(.+)/i);
    if (m) return m[1].trim();
    m = String(raw || "").match(/\b(?:such|suche|finde)\s+(.+)/i);
    if (m && m[1].length >= 2 && !/\b(ueberall|notiz|chat|app|beam)\b/.test(norm(m[1]))) return m[1].trim();
    if (/\bnach\s+(.+)/.test(q)) {
      const tail = q.replace(/^.*\bnach\s+/, "").trim();
      if (tail.length >= 2) return tail;
    }
    return null;
  }

  function processCommand(raw, helpers) {
    const q = norm(raw);
    const text = String(raw || "").trim();
    if (!q) return null;

    if (/\b(was steht an|was hab ich zu tun|tagesplan|mein tag|inbox|ueberblick|was ist offen)\b/.test(q)) {
      const html = buildInboxHtml(helpers);
      const s = snap(helpers);
      const offer =
        s.openTaskCount > 0
          ? () => helpers.openApp?.("tasks")
          : s.nextReminderText
            ? () => helpers.openMemories?.() || helpers.openApp?.("memories")
            : s.timerRunning
              ? () => helpers.openApp?.("timer")
              : null;
      return {
        type: "text",
        text: html,
        offerRun: offer,
        offerLabel: s.openTaskCount ? "Tasks" : s.nextReminderText ? "Memory" : s.timerRunning ? "Timer" : null,
        rememberTopic: "inbox"
      };
    }

    if (
      /\b(system status|status report|geraete status|systemueberblick|wie steht das system)\b/.test(q) ||
      (q === "status" && text.length < 12)
    ) {
      return { type: "text", text: buildStatusHtml(helpers), rememberTopic: "status" };
    }

    if (/\b(erinnere|erinner|remind)\s+mich\b/.test(q) || /\b(memory|erinnerung)\s+in\s+\d+\b/.test(q)) {
      const minutes = parseMinutes(q);
      const label = parseReminderText(raw, q);
      if (minutes == null) {
        return {
          type: "text",
          text: "<p>Wann soll ich erinnern? Z. B. <strong>Erinnere mich in 15 Minuten, Tee</strong> oder <strong>in einer Stunde</strong>.</p>",
          rememberTopic: "memory"
        };
      }
      return {
        type: "action",
        text: `<p>Memory in <strong>${minutes} Min</strong>: «${esc(label)}» …</p>`,
        run: () => {
          helpers.addReminder?.({ text: label, minutes });
          helpers.showToast?.("Memory: " + label);
          helpers.openMemories?.();
        },
        rememberTopic: "memory"
      };
    }

    if (/\b(fokus modus|fokusmodus|pomodoro|konzentration starten|deep work)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>Fokus Modus:</strong> 25-Minuten-Timer startet …</p>",
        run: () => {
          helpers.applyTimerMinutes?.(25);
          helpers.startTimerCountdown?.();
          helpers.showToast?.("Fokus: 25 Min");
          void helpers.openApp?.("timer");
        },
        rememberTopic: "focus"
      };
    }

    if (/\b(offene aufgaben|offene tasks|meine todos|was muss ich erledigen)\b/.test(q)) {
      const tasks = helpers.getTasks?.() || [];
      const open = tasks.filter((t) => !t.done);
      if (!open.length) {
        return {
          type: "text",
          text: "<p>Keine offenen <strong>Tasks</strong>. Sag <strong>Erstelle Aufgabe …</strong> fuer etwas Neues.</p>",
          rememberTopic: "tasks"
        };
      }
      const lines = open
        .slice(0, 8)
        .map((t) => `<li>${esc(t.text)}</li>`)
        .join("");
      return {
        type: "text",
        text: `<p><strong>${open.length}</strong> offene Aufgabe(n):</p><ul>${lines}</ul>`,
        offerRun: () => helpers.openApp?.("tasks"),
        offerLabel: "Tasks",
        rememberTopic: "tasks"
      };
    }

    if (/\b(erledige|erledigt|hake ab|markiere)\s+(aufgabe|task|todo)\b/.test(q) || /\b(erledige|hake ab)\s+/.test(q)) {
      const m = text.match(/\b(?:erledige|erledigt|hake ab|markiere)\s+(?:aufgabe|task|todo)?\s*(.+)/i);
      const needle = m ? m[1].trim() : "";
      if (!needle) {
        return {
          type: "text",
          text: "<p>Was soll erledigt werden? Z. B. <strong>Erledige Aufgabe Milch</strong>.</p>",
          rememberTopic: "tasks"
        };
      }
      const hit = helpers.completeTask?.(needle);
      if (!hit) {
        return {
          type: "text",
          text: `<p>Keine offene Aufgabe mit «${esc(needle)}» gefunden.</p>`,
          rememberTopic: "tasks"
        };
      }
      return {
        type: "action",
        text: `<p>Erledigt: <strong>${esc(hit.text)}</strong> ✓</p>`,
        run: () => helpers.showToast?.("Aufgabe erledigt"),
        rememberTopic: "tasks"
      };
    }

    if (/\b(liste|zeig)\s+(meine\s+)?(erinnerungen|memories|reminder)\b/.test(q)) {
      const list = helpers.listRemindersDetailed?.() || [];
      if (!list.length) {
        return {
          type: "text",
          text: "<p>Keine aktiven <strong>Memories</strong>. Beispiel: <strong>Erinnere mich in 10 Minuten, Pause</strong>.</p>",
          rememberTopic: "memory"
        };
      }
      const lines = list
        .slice(0, 6)
        .map((r) => `<li>«${esc(r.text)}» — <strong>${esc(r.eta)}</strong></li>`)
        .join("");
      return {
        type: "text",
        text: `<p><strong>Erinnerungen:</strong></p><ul>${lines}</ul>`,
        offerRun: () => helpers.openMemories?.(),
        offerLabel: "Memory",
        rememberTopic: "memory"
      };
    }

    if (/\b(wann ist|wann laeuft)\s+(mein\s+)?timer\b/.test(q) || q === "timer status") {
      const t = helpers.getTimerStatus?.();
      if (!t?.running) {
        return {
          type: "text",
          text: "<p>Kein Timer aktiv. <strong>Starte Timer 10 Minuten</strong> oder <strong>Fokus Modus</strong>.</p>",
          offerRun: () => helpers.openApp?.("timer"),
          offerLabel: "Timer",
          rememberTopic: "timer"
        };
      }
      return {
        type: "text",
        text: `<p>Timer (<strong>${esc(t.modeLabel)}</strong>): noch <strong>${esc(t.display)}</strong>${t.endTimeLocale ? ` — Ende ca. <strong>${esc(t.endTimeLocale)}</strong>` : ""}.</p>`,
        offerRun: () => helpers.openApp?.("timer"),
        offerLabel: "Timer",
        rememberTopic: "timer"
      };
    }

    if (/\b(wann ist|wann kommt)\s+(meine\s+)?(erinnerung|memory)\b/.test(q)) {
      const next = helpers.getNextReminder?.();
      if (!next) {
        return {
          type: "text",
          text: "<p>Keine Erinnerung geplant.</p>",
          rememberTopic: "memory"
        };
      }
      return {
        type: "text",
        text: `<p>«<strong>${esc(next.text)}</strong>» in <strong>${esc(next.eta)}</strong>${next.endTimeLocale ? ` (ca. ${esc(next.endTimeLocale)})` : ""}.</p>`,
        offerRun: () => helpers.openMemories?.(),
        offerLabel: "Memory",
        rememberTopic: "memory"
      };
    }

    const needle = extractSearchNeedle(raw, q);
    if (needle && needle.length >= 2) {
      const notes = helpers.searchNotes?.(needle, { limit: 4 }) || [];
      const chats = helpers.searchChats?.(needle, { limit: 4 }) || [];
      const parts = [];
      if (notes.length) {
        parts.push(
          `<p><strong>Notizen</strong> (${notes.length}):</p><ul>${notes.map((n) => `<li>${esc(n.title)}</li>`).join("")}</ul>`
        );
      }
      if (chats.length) {
        parts.push(
          `<p><strong>Chats</strong> (${chats.length}):</p><ul>${chats.map((c) => `<li>${esc(c.name || c.title || "Chat")}</li>`).join("")}</ul>`
        );
      }
      if (!parts.length) {
        return {
          type: "text",
          text: `<p>Nichts zu «<strong>${esc(needle)}</strong>» in Notizen oder AI-Chats.</p>`,
          rememberTopic: "search"
        };
      }
      const firstNote = notes[0];
      const firstChat = chats[0];
      return {
        type: "text",
        text: `<p>Suche «<strong>${esc(needle)}</strong>»:</p>${parts.join("")}`,
        offerRun: () => {
          if (firstNote?.id) helpers.openNote?.(firstNote.id);
          else if (firstChat?.id) helpers.openChat?.(firstChat.id);
        },
        offerLabel: firstNote ? "Notiz oeffnen" : firstChat ? "Chat oeffnen" : null,
        rememberTopic: "search"
      };
    }

    if (/\b(backup status|keycard status|hab ich backup)\b/.test(q)) {
      const has = !!localStorage.getItem("noco_mobile_last_keycard");
      return {
        type: "text",
        text: has
          ? "<p><strong>Keycard</strong> wurde zuletzt genutzt (lokal gespeichert). Fuer neuen Export: <strong>Oeffne Sync</strong>.</p>"
          : "<p>Noch keine <strong>Keycard</strong> importiert. In <strong>Sync</strong> kannst du exportieren/importieren.</p>",
        offerRun: () => helpers.openSync?.(),
        offerLabel: "Sync",
        rememberTopic: "sync"
      };
    }

    if (/\b(performance tip|warum langsam|optimieren|weniger lag)\b/.test(q)) {
      const s = snap(helpers);
      const tips = [];
      if (s.glassBoost) tips.push("«Mehr Performance» — reduziert Glas & Motion");
      if (s.liveWallpaper) tips.push("Live-Wallpaper in Core ausschalten");
      if (s.motion) tips.push("Animationen reduzieren in Core");
      if (!tips.length) tips.push("System laeuft schon im Performance-Modus — «Mehr Liquid Glass» fuer mehr Effekt");
      return {
        type: "text",
        text: `<p><strong>Tipps:</strong></p><ul>${tips.map((t) => `<li>${t}</li>`).join("")}</ul>`,
        offerRun: s.glassBoost
          ? () => {
              helpers.setSettingToggle?.("glassBoost", false);
              helpers.setSettingToggle?.("motion", false);
              helpers.setSettingToggle?.("liveWallpaper", false);
              helpers.showToast?.("Performance-Modus");
            }
          : null,
        offerLabel: s.glassBoost ? "Performance an" : null,
        rememberTopic: "perf"
      };
    }

    if (/\b(schliesse alles|alles schliessen|overlays zu)\b/.test(q)) {
      return {
        type: "action",
        text: "<p>Schliesse Menues und zurueck zum <strong>Home</strong> …</p>",
        run: () => {
          helpers.closeCurrentApp?.();
          helpers.disableEditMode?.();
          helpers.goToPage?.(0);
        },
        rememberTopic: "nav"
      };
    }

    if (/\b(zaehle|wie viele)\s+(notizen|chats|aufgaben|apps)\b/.test(q)) {
      const s = snap(helpers);
      let line = "";
      if (/\bnotiz/.test(q)) line = `<strong>${s.noteCount ?? 0}</strong> Notizen`;
      else if (/\bchat/.test(q)) line = `<strong>${s.chatCount ?? 0}</strong> AI-Chats`;
      else if (/\baufgab|task/.test(q)) line = `<strong>${s.openTaskCount ?? 0}</strong> offene Tasks von ${(helpers.getTasks?.() || []).length} gesamt`;
      else if (/\bapp/.test(q)) line = `<strong>${s.installed ?? 0}</strong> installierte Forge-Apps`;
      if (line) return { type: "text", text: `<p>${line}.</p>`, rememberTopic: "count" };
    }

    if (/\b(gib mir einen tipp|random tipp|was empfiehlst du)\b/.test(q)) {
      const s = snap(helpers);
      const tips = [];
      if (!s.timerRunning && !s.openTaskCount) tips.push("Starte <strong>Fokus Modus</strong> (25 Min)");
      if (s.openTaskCount) tips.push("«Erledige Aufgabe …» fuer deine Tasks");
      if (!s.nextReminderText) tips.push("«Erinnere mich in 20 Minuten …»");
      tips.push("Island-Schnellmenu: Beam, Hub, Timer, Core");
      tips.push("«Such in Notizen nach …» findet Inhalte");
      tips.push("«Ueberrasch mich» oder «Tagesbriefing»");
      const pick = tips[Math.floor(Math.random() * tips.length)];
      return { type: "text", text: `<p>${pick}</p>`, rememberTopic: "tip" };
    }

    if (/\b(tagesbriefing|morgen briefing|daily briefing)\b/.test(q) || /^(guten morgen|guten abend|gute nacht)\b/.test(q)) {
      const hour = new Date().getHours();
      let greet = "Hallo";
      if (/guten morgen/.test(q) || (hour >= 5 && hour < 12)) greet = "Guten Morgen";
      else if (/guten abend/.test(q) || hour >= 18) greet = "Guten Abend";
      else if (/gute nacht/.test(q) || hour >= 22 || hour < 5) greet = "Gute Nacht";
      const inbox = buildInboxHtml(helpers);
      return {
        type: "text",
        text: `<p><strong>${greet}!</strong> Dein NOCO-Tagesbriefing:</p>${inbox}`,
        rememberTopic: "briefing"
      };
    }

    if (/\b(merke dir|merke|notiere schnell|gedanke|schnellnotiz)\b/.test(q)) {
      const m = text.match(/\b(?:merke dir|merke|notiere schnell|gedanke|schnellnotiz)\s+(.+)/i);
      const body = m ? m[1].trim().slice(0, 200) : "";
      if (!body) {
        return {
          type: "text",
          text: "<p>Was soll ich merken? Z. B. <strong>Merke dir Meeting um 15 Uhr vorbereiten</strong>.</p>",
          rememberTopic: "capture"
        };
      }
      const alsoTask = /\b(aufgabe|todo|task|erledigen)\b/.test(norm(body));
      return {
        type: "action",
        text: `<p>Gespeichert: <strong>${esc(body.slice(0, 60))}${body.length > 60 ? "…" : ""}</strong>${alsoTask ? " + Task" : ""}</p>`,
        run: () => {
          helpers.createNote?.({ title: body.slice(0, 48), body, openApp: false });
          if (alsoTask) helpers.createTask?.({ text: body.slice(0, 80), openApp: false });
          helpers.showToast?.("Gespeichert");
        },
        rememberTopic: "capture"
      };
    }

    if (/\b(arbeitsmodus|arbeit modus|work mode)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>Arbeitsmodus:</strong> Fokus-Timer, dunkles Theme, Home …</p>",
        run: () => {
          helpers.setTheme?.("midnight", { syncWallpaper: true });
          helpers.applyTimerMinutes?.(25);
          helpers.startTimerCountdown?.();
          helpers.disableEditMode?.();
          helpers.goToPage?.(0);
          helpers.showToast?.("Arbeitsmodus aktiv");
        },
        rememberTopic: "scene-work"
      };
    }

    if (/\b(chillmodus|chill modus|entspann modus|relax modus)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>Chillmodus:</strong> warmes Theme, weniger Effekte, Breath optional …</p>",
        run: () => {
          helpers.setTheme?.("sunset", { syncWallpaper: true });
          helpers.setSettingToggle?.("liveWallpaper", false);
          helpers.goToPage?.(0);
          helpers.showToast?.("Chillmodus — entspannt");
        },
        offerRun: () => helpers.openApp?.("breath"),
        offerLabel: "Breath",
        rememberTopic: "scene-chill"
      };
    }

    if (/\b(spielmodus|spiel modus|game mode)\b/.test(q)) {
      return {
        type: "action",
        text: "<p><strong>Spielmodus:</strong> Bibliothek → Spiele …</p>",
        run: () => {
          helpers.goToPage?.(1);
          window.setTimeout(() => {
            helpers.openLibraryTab?.("games");
            helpers.openLibraryFolder?.("games");
          }, 320);
        },
        rememberTopic: "scene-game"
      };
    }

    if (/\b(beam suche|spotlight suche|suche in beam)\s+nach\s+(.+)/.test(q)) {
      const m = text.match(/\b(?:beam suche|spotlight suche|suche in beam)\s+nach\s+(.+)/i);
      const needle = m ? m[1].trim() : "";
      if (needle.length >= 1) {
        return {
          type: "action",
          text: `<p><strong>NOCO Beam</strong> sucht «${esc(needle)}» …</p>`,
          run: () => helpers.openBeam?.(needle),
          rememberTopic: "beam"
        };
      }
    }

    if (/\b(ueberrasch mich|überrasch mich|surprise me|zufalls app)\b/.test(q)) {
      const pool = [
        "arcade", "quotes", "breath", "dodgerun", "tapdash", "runner", "memorygrid", "sketch",
        "colorcatch", "mood", "forge", "themes", "timer", "notes", "tasks", "weather", "calculator"
      ];
      const ids = pool.filter((id) => helpers.isAppInstalled?.(id) !== false);
      const pick = (ids.length ? ids : ["forge", "themes", "timer"])[Math.floor(Math.random() * (ids.length || 3))];
      const title = helpers.getAppTitle?.(pick) || pick;
      return {
        type: "action",
        text: `<p>Ueberraschung: <strong>${esc(title)}</strong> — viel Spass!</p>`,
        run: () => helpers.openApp?.(pick),
        rememberTopic: "surprise"
      };
    }

    if (/\b(stimmung notieren|mood log|wie fuehle ich mich)\b/.test(q)) {
      const m = text.match(/\b(?:stimmung notieren|mood log)\s+(.+)/i);
      const mood = m ? m[1].trim().slice(0, 80) : "";
      if (!mood) {
        return {
          type: "text",
          text: "<p>Wie fuehlst du dich? <strong>Stimmung notieren gut</strong> oder <strong>Stimmung notieren muede</strong>.</p>",
          rememberTopic: "mood"
        };
      }
      return {
        type: "action",
        text: `<p>Stimmung gespeichert: <strong>${esc(mood)}</strong></p>`,
        run: () => {
          helpers.createNote?.({
            title: "Stimmung " + new Date().toLocaleDateString("de-DE"),
            body: mood + "\n" + new Date().toLocaleString("de-DE"),
            openApp: false
          });
          if (helpers.isAppInstalled?.("mood")) helpers.openApp?.("mood");
          else helpers.showToast?.("In Notizen gespeichert");
        },
        rememberTopic: "mood"
      };
    }

    if (/\b(starte timer|timer starten)\s+(\d+)/.test(q) && !/\b(fokus|minuten)\b/.test(q)) {
      const m = q.match(/\b(?:starte timer|timer starten)\s+(\d+)/);
      const mins = m ? Number(m[1]) : 5;
      return {
        type: "action",
        text: `<p>Timer <strong>${mins} Min</strong> startet …</p>`,
        run: () => {
          helpers.applyTimerMinutes?.(mins);
          helpers.startTimerCountdown?.();
          void helpers.openApp?.("timer");
        },
        rememberTopic: "timer"
      };
    }

    if (/\b(erstelle aufgabe|neue aufgabe|todo)\s+(.+)/.test(q) && !/\b(wie|was ist)\b/.test(q)) {
      const m = text.match(/\b(?:erstelle aufgabe|neue aufgabe|todo)\s+(.+)/i);
      const label = m ? m[1].trim().slice(0, 120) : "";
      if (label) {
        return {
          type: "action",
          text: `<p>Aufgabe: <strong>${esc(label)}</strong></p>`,
          run: () => {
            helpers.createTask?.({ text: label, openApp: true });
          },
          rememberTopic: "tasks"
        };
      }
    }

    return null;
  }

  function smartHint(text, helpers) {
    const q = norm(text);
    if (q.length < 4) return null;
    const hints = [];
    if (/\b(erinner|memory|wecker)\b/.test(q)) hints.push("«Erinnere mich in 15 Minuten, …»");
    if (/\b(aufgab|task|todo|erledig)\b/.test(q)) hints.push("«Was steht an?» oder «Erledige Aufgabe …»");
    if (/\b(such|finde)\b/.test(q)) hints.push("«Such in Notizen nach …»");
    if (/\b(langsam|lag|haengt)\b/.test(q)) hints.push("«Performance Tipp»");
    if (/\b(island|notch)\b/.test(q)) hints.push("«Was ist die Island?»");
    if (/\b(ueberrasch|zufall)\b/.test(q)) hints.push("«Ueberrasch mich»");
    if (/\b(briefing|morgen)\b/.test(q)) hints.push("«Tagesbriefing» oder «Guten Morgen»");
    if (/\b(merke|notier)\b/.test(q)) hints.push("«Merke dir …»");
    if (!hints.length) return null;
    return { text: `<p>System-Tipp: ${hints.join(" · ")}</p>` };
  }

  global.NocoAISystem = {
    processGuide,
    processCommand,
    smartHint,
    buildInboxHtml,
    buildStatusHtml,
    norm
  };
})(typeof window !== "undefined" ? window : globalThis);
