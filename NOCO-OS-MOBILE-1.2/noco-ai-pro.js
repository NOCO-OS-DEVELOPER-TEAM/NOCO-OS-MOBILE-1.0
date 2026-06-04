/**
 * NOCO AI Pro — Szenen, Ketten, Coach, Zusammenfassungen, smarter Fallback
 */
(function initNocoAIPro(global) {
  const session = { lastMacro: null, lastCreateSpec: null };

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

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function isProQuery(q, raw) {
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return false;
    return (
      /\b(fokus modus|focus mode|produktiv modus|productivity mode|nacht modus|night mode|morgen routine|glass max|maximal glas)\b/.test(q) ||
      /\b(zusammenfassung|zusammenfassen|kurzfassung|summary)\b/.test(q) ||
      (/\bfass\b/.test(q) && /\bzusammen\b/.test(q)) ||
      /\b(tagesplan|plan fuer heute|mein tag|daily plan)\b/.test(q) ||
      /\b(was soll ich jetzt|naechster schritt|next step|coach|hilf mir planen|was jetzt tun)\b/.test(q) ||
      /\b(statistik|stats|wie produktiv|erledigungsquote)\b/.test(q) ||
      /\b(noch eine|noch eins|nochmal so|gleiches nochmal|same again)\b/.test(q) ||
      /\b(idee|brainstorm|inspiration|zufaellige idee)\b/.test(q) ||
      /\b(prozent von|prozent|%\s*von)\b/.test(q) ||
      /\b(und dann|danach|sowie).{0,30}(erstell|erinnere|starte|oeffne)\b/.test(q) ||
      /\b(erstell).{0,30}(?:und|dann).{0,30}(schreib|text|inhalt|mit)\b/.test(q)
    );
  }

  const SCENES = {
    focus: {
      label: "Fokus-Modus",
      text: `<p><strong>Fokus-Modus</strong> — 25-Min-Timer, Motion an, zur App-Bibliothek.</p>`,
      run: (h) => {
        h.applyTimerMinutes?.(25);
        h.startTimerCountdown?.();
        h.openTimerApp?.();
        h.navigateCore?.({ section: "deck", toggle: "motion", value: true });
      }
    },
    productivity: {
      label: "Produktiv-Modus",
      text: `<p><strong>Produktiv-Modus</strong> — leere Beispiel-Notiz, Tasks, Focus-Widgets.</p>`,
      run: (h) => {
        h.createNote?.({ title: "Beispiel", body: "", example: true, openApp: false });
        h.createTask?.({ text: "Beispiel", example: true, openApp: false });
        h.setHomeWidgetPack?.("focus");
        h.goToPage?.(1);
        void h.openApp?.("tasks");
      }
    },
    night: {
      label: "Nacht-Modus",
      text: `<p><strong>Nacht-Modus</strong> — Theme Midnight, Auto-Lock 30s, weniger Ablenkung.</p>`,
      run: (h) => {
        h.setTheme?.("midnight");
        h.navigateCore?.({ section: "lock", toggle: "autoLock", value: true, autoLockSeconds: 30 });
        h.goToPage?.(0);
      }
    },
    glass: {
      label: "Glas-Max",
      text: `<p><strong>Glas-Max</strong> — Liquid Glass, Wallpaper, Motion.</p>`,
      run: (h) => h.enableGlassMode?.()
    },
    morning: {
      label: "Morgen-Routine",
      text: `<p><strong>Morgen-Routine</strong> — Inbox-Kurzcheck & Standard-Widgets.</p>`,
      run: (h) => {
        h.setHomeWidgetPack?.("standard");
        h.goToPage?.(0);
      }
    }
  };

  function tryScene(raw, q, helpers) {
    let id = null;
    if (/\b(fokus|focus)\s*modus\b/.test(q) || /\bfocus mode\b/.test(q)) id = "focus";
    else if (/\b(produktiv|productivity)\s*modus\b/.test(q)) id = "productivity";
    else if (/\b(nacht|night)\s*modus\b/.test(q) || /\bnight mode\b/.test(q)) id = "night";
    else if (/\b(glass max|maximal glas|max glas)\b/.test(q)) id = "glass";
    else if (/\b(morgen routine|morning routine)\b/.test(q)) id = "morning";
    if (!id || !SCENES[id]) return null;
    const scene = SCENES[id];
    session.lastMacro = id;
    return {
      type: "action",
      text: scene.text,
      run: () => scene.run(helpers)
    };
  }

  function tryChain(raw, helpers) {
    const noteBody =
      raw.match(
        /(?:erstell|leg|mach).{0,24}(?:eine\s+)?notiz.{0,24}(?:und|dann|,)\s*(?:schreib|mit\s+text|inhalt|text)\s+(.+)/i
      ) ||
      raw.match(/(?:erstell|leg).{0,20}notiz\s+mit\s+(.+)/i);
    if (noteBody?.[1]) {
      const body = noteBody[1].trim().slice(0, 500);
      const titleMatch = body.match(/^titel\s+([^:]+):\s*(.+)$/i);
      const title = titleMatch ? titleMatch[1].trim().slice(0, 60) : "Notiz";
      const text = titleMatch ? titleMatch[2].trim() : body;
      return {
        type: "action",
        text: `<p>Erstelle Notiz <strong>${escapeHtml(title)}</strong> mit deinem Text …</p>`,
        run: () => helpers.createNote?.({ title, body: text, openApp: true })
      };
    }

    const taskNote =
      raw.match(/(?:erstell|leg).{0,20}aufgabe\s+(.+?)\s+(?:und|dann)\s+(?:notiz|notizblock)/i) ||
      raw.match(/(?:erstell|leg).{0,20}notiz\s+(.+?)\s+(?:und|dann)\s+(?:aufgabe|task)\s+(.+)/i);
    if (taskNote) {
      const a = (taskNote[1] || "").trim();
      const b = (taskNote[2] || "").trim();
      return {
        type: "action",
        text: "<p>Kette: <strong>Notiz + Aufgabe</strong> werden angelegt …</p>",
        run: () => {
          if (a && b) {
            helpers.createNote?.({ title: a.slice(0, 60), body: b, openApp: false });
            helpers.createTask?.({ text: b.slice(0, 120), openApp: true });
          } else if (a) {
            helpers.createTask?.({ text: a.slice(0, 120), openApp: false });
            helpers.createNote?.({ title: "Beispiel", body: a, openApp: true });
          }
        }
      };
    }

    const remindTimer = raw.match(
      /(?:erinnere mich|remind).{0,40}(?:und|dann)\s*(?:starte|stell).{0,16}timer\s+(\d+)\s*(min|minuten)?/i
    );
    if (remindTimer) {
      const mins = Math.max(1, parseInt(remindTimer[1], 10) || 10);
      const textMatch = raw.match(/(?:erinnere mich|remind me).{0,30}(?:dass|das|zu|um|to)?\s*(.+?)\s+(?:und|dann)\s*timer/i);
      const text = (textMatch?.[1] || "Pause").trim().slice(0, 200);
      return {
        type: "action",
        text: `<p>Kette: <strong>Memory</strong> + <strong>Timer ${mins} Min</strong></p>`,
        run: () => {
          helpers.addReminder?.({ text, minutes: mins });
          helpers.applyTimerMinutes?.(mins);
          helpers.startTimerCountdown?.();
          helpers.openTimerApp?.();
        }
      };
    }
    return null;
  }

  function tryRepeat(raw, q, helpers) {
    if (!/\b(noch eine|noch eins|nochmal so|gleiches nochmal|same again)\b/.test(q)) return null;
    const spec = session.lastCreateSpec;
    if (!spec) {
      return {
        text: "<p>Ich habe noch nichts zum Wiederholen. Sag z. B. <strong>Erstelle Notiz</strong> oder <strong>Erstelle Aufgabe</strong>.</p>"
      };
    }
    return global.NocoAICreate?.process?.(
      spec.kind === "note"
        ? "Erstelle Notiz"
        : spec.kind === "task"
          ? "Erstelle Aufgabe"
          : spec.kind === "chat"
            ? "Erstelle Chat"
            : "Erstelle Timer",
      helpers
    );
  }

  function tryCoach(q, helpers) {
    if (!/\b(was soll ich jetzt|naechster schritt|next step|coach|hilf mir planen|was jetzt tun)\b/.test(q)) {
      return null;
    }
    const tasks = helpers.getTasks?.() || [];
    const open = tasks.filter((t) => !t.done);
    const reminders = window.NocoReminders?.active?.() || [];
    const h = new Date().getHours();
    let action = null;
    let reason = "";

    if (reminders.length) {
      const r = reminders[0];
      const eta = global.NocoReminders?.formatEta?.(r) || "?";
      reason = `Memory «${r.text}» in ${eta}.`;
      action = { label: "Memory oeffnen", run: () => helpers.openMemories?.() };
    } else if (open.length) {
      const t = open[0];
      reason = `Du hast ${open.length} offene Task(s) — starte mit «${t.text}».`;
      action = {
        label: "Task erledigen",
        run: () => {
          helpers.completeTask?.(t.text.slice(0, 20));
          helpers.openApp?.("tasks");
        }
      };
    } else if (h >= 22 || h < 6) {
      reason = "Spaete Stunde — Nacht-Modus oder Auto-Lock?";
      action = { label: "Nacht-Modus", run: () => SCENES.night.run(helpers) };
    } else if (h < 11) {
      const openN = open.length;
      const remN = reminders.length;
      reason = `Guten Start — ${openN} Task(s), ${remN} Memory aktiv. Sag «Inbox» fuer Details.`;
      action = { label: "Morgen-Routine", run: () => SCENES.morning.run(helpers) };
    } else {
      reason = "Alles ruhig — 25 Min Fokus oder leere Notiz anlegen?";
      action = { label: "Fokus-Modus", run: () => SCENES.focus.run(helpers) };
    }

    const btn = action
      ? `<p><small>Sag <strong>Ja</strong> fuer: <strong>${action.label}</strong></small></p>`
      : "";
    return {
      text: `<p><strong>Dein Coach</strong></p><p>${escapeHtml(reason)}</p>${btn}`,
      offerRun: action?.run,
      offerLabel: action?.label
    };
  }

  function tryDayPlan(q, helpers) {
    if (!/\b(tagesplan|plan fuer heute|mein tag|daily plan)\b/.test(q)) return null;
    const tasks = helpers.getTasks?.() || [];
    const open = tasks.filter((t) => !t.done).slice(0, 6);
    const done = tasks.filter((t) => t.done).length;
    const reminders = window.NocoReminders?.active?.() || [];
    const now = new Date();
    const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    let html = `<p><strong>Tagesplan</strong> <small>(${time} Uhr, offline)</small></p><ol>`;
    html += `<li><strong>Jetzt:</strong> ${open.length ? `Task «${escapeHtml(open[0].text)}»` : "Kurz Inbox oder Fokus-Timer"}</li>`;
    open.slice(1, 4).forEach((t, i) => {
      html += `<li><strong>Danach:</strong> ${escapeHtml(t.text)}</li>`;
    });
    reminders.slice(0, 3).forEach((r) => {
      const eta = global.NocoReminders?.formatEta?.(r) || "?";
      html += `<li><strong>Memory (${eta}):</strong> ${escapeHtml(r.text)}</li>`;
    });
    html += `<li><strong>Abends:</strong> ${done} Tasks erledigt — Notizen syncen (Keycard)</li>`;
    html += "</ol>";
    html += "<p><small>Sag «Fokus Modus» oder «Erstelle Notiz» zum Starten.</small></p>";
    return { text: html };
  }

  function trySummarize(raw, q, helpers) {
    if (!/\b(zusammenfassung|zusammenfassen|kurzfassung|summary)\b/.test(q) && !(/\bfass\b/.test(q) && /\bzusammen\b/.test(q))) {
      return null;
    }

    if (/\b(chat|gespraech|unterhaltung|verlauf)\b/.test(q)) {
      window.NocoAIChats?.reload?.();
      const chat = window.NocoAIChats?.getActiveChat?.();
      const msgs = chat?.messages?.filter((m) => m.role === "user") || [];
      if (!msgs.length) {
        return { text: "<p>Im aktiven Chat gibt es noch keine <strong>User-Nachrichten</strong> zum Zusammenfassen.</p>" };
      }
      const last = msgs.slice(-5).map((m) => String(m.html || "").replace(/<[^>]+>/g, " ").trim()).filter(Boolean);
      return {
        text: `<p><strong>Chat «${escapeHtml(chat.name)}» — letzte Themen</strong></p><ul>${last
          .map((l) => `<li>${escapeHtml(l.slice(0, 100))}${l.length > 100 ? "…" : ""}</li>`)
          .join("")}</ul>`
      };
    }

    window.NocoNotes?.reload?.();
    const notes = window.NocoNotes?.listNotes?.() || [];
    if (!notes.length) {
      return { text: "<p>Keine Notizen zum Zusammenfassen.</p>" };
    }
    const bullets = notes.slice(0, 8).map((n) => {
      const preview = (n.body || "").replace(/\s+/g, " ").trim();
      return `<li><strong>${escapeHtml(n.title)}</strong>${preview ? ` — ${escapeHtml(preview.slice(0, 70))}${preview.length > 70 ? "…" : ""}` : " <em>(leer)</em>"}</li>`;
    });
    return {
      text: `<p><strong>Notizen — Kurzüberblick</strong> (${notes.length} gesamt)</p><ul>${bullets.join("")}</ul>`
    };
  }

  function tryStats(q, helpers) {
    if (!/\b(statistik|stats|wie produktiv|erledigungsquote)\b/.test(q)) return null;
    const tasks = helpers.getTasks?.() || [];
    const done = tasks.filter((t) => t.done).length;
    const open = tasks.filter((t) => !t.done).length;
    const total = tasks.length || 1;
    const pct = Math.round((done / total) * 100);
    const snap = helpers.getSystemSnapshot?.() || {};
    return {
      text: `<p><strong>Deine Statistik</strong></p><ul>
        <li>Tasks: <strong>${done}</strong> erledigt · <strong>${open}</strong> offen (${pct}% done)</li>
        <li>Notizen: <strong>${snap.noteCount ?? 0}</strong></li>
        <li>AI-Chats: <strong>${snap.chatCount ?? 0}</strong></li>
        <li>Forge-Apps: <strong>${snap.installed ?? 0}</strong></li>
        <li>Theme: <strong>${snap.theme || "?"}</strong> · Glas: <strong>${snap.glassBoost ? "Boost" : "Standard"}</strong></li>
      </ul>`
    };
  }

  function tryPercent(raw, q) {
    if (!/\b(prozent von|prozent|%\s*von)\b/.test(q)) return null;
    const m =
      q.match(/(\d+(?:[.,]\d+)?)\s*(?:%|prozent)\s*(?:von|of)\s*(\d+(?:[.,]\d+)?)/) ||
      q.match(/(\d+(?:[.,]\d+)?)\s*%\s*(\d+)/);
    if (!m) return null;
    const pct = parseFloat(m[1].replace(",", "."));
    const base = parseFloat(m[2].replace(",", "."));
    if (!Number.isFinite(pct) || !Number.isFinite(base)) return null;
    const result = (base * pct) / 100;
    return {
      text: `<p><strong>${pct}% von ${base}</strong> = <strong>${Math.round(result * 100) / 100}</strong></p>`
    };
  }

  function tryIdeas(q) {
    if (!/\b(idee|brainstorm|inspiration|zufaellige idee)\b/.test(q) || /\b(empfehl|forge|app)\b/.test(q)) {
      return null;
    }
    const ideas = [
      "25 Min Timer + eine Task — Pomodoro offline.",
      "Keycard-Backup in Sync — einmal einrichten.",
      "Exclusive Probetag — unbegrenzte AI testen.",
      "Neues Theme in Core — frischer Look ohne Internet.",
      "Memory fuer heute Abend — «in 3 Stunden …».",
      "Beam: App namen tippen statt Bibliothek scrollen.",
      "Zwei Notizen: «Ideen» und «Einkauf» — per Sprachbefehl anlegen."
    ];
    return {
      text: `<p><strong>Idee</strong></p><p>${pick(ideas)}</p><p><small>Noch eine? Schreib <strong>noch eine Idee</strong>.</small></p>`
    };
  }

  function rememberCreateSpec(raw) {
    const spec = global.NocoAICreate?.parseCreateSpec?.(raw);
    if (spec) session.lastCreateSpec = { kind: spec.kind, at: Date.now() };
  }

  function smartFallback(raw, q, helpers) {
    const suggestions = [];
    if (/\b(notiz|note|schreib)/.test(q)) suggestions.push("Erstelle Notiz", "Meine Notizen", "Fass Notizen zusammen");
    else if (/\b(task|aufgab|todo)/.test(q)) suggestions.push("Offene Aufgaben", "Erstelle Aufgabe", "Statistik");
    else if (/\b(timer|zeit|fokus)/.test(q)) suggestions.push("Fokus Modus", "Starte Timer 10 Minuten", "Inbox");
    else if (/\b(app|oeffne|open)/.test(q)) suggestions.push("Oeffne Beam", "Liste Apps", "Hilfe");
    else if (/\b(glas|glass|theme|design)/.test(q)) suggestions.push("Mehr Liquid Glass", "Theme Midnight", "System Status");
    else suggestions.push("Inbox", "Was kannst du alles?", "Empfehl mir was", "Fokus Modus");

    const chips = suggestions
      .slice(0, 4)
      .map((s) => `<li>«<strong>${escapeHtml(s)}</strong>»</li>`)
      .join("");
    return {
      text: `<p>Das habe ich nicht eindeutig erkannt — aber du klingst nach:</p><ul>${chips}</ul><p><small>Oder «Hilfe» fuer alle Befehle.</small></p>`
    };
  }

  function process(raw, helpers, ctx = {}) {
    const q = norm(raw);
    if (!isProQuery(q, raw) && !global.NocoAICreate?.isCreateIntent?.(raw, q)) {
      if (!/\b(noch eine|noch eins)\b/.test(q)) return null;
    }

    const handlers = [
      () => tryScene(raw, q, helpers),
      () => tryChain(raw, helpers),
      () => tryRepeat(raw, q, helpers),
      () => {
        const coach = tryCoach(q, helpers);
        if (!coach) return null;
        if (coach.offerRun && ctx) {
          ctx.pendingOffer = coach.offerRun;
          ctx.pendingOfferLabel = coach.offerLabel;
        }
        return { type: "text", text: coach.text };
      },
      () => {
        const day = tryDayPlan(q, helpers);
        return day ? { type: "text", text: day.text } : null;
      },
      () => {
        const sum = trySummarize(raw, q, helpers);
        return sum ? { type: "text", text: sum.text } : null;
      },
      () => {
        const st = tryStats(q, helpers);
        return st ? { type: "text", text: st.text } : null;
      },
      () => {
        const p = tryPercent(raw, q);
        return p ? { type: "text", text: p.text } : null;
      },
      () => {
        const id = tryIdeas(q);
        return id ? { type: "text", text: id.text } : null;
      }
    ];

    for (const fn of handlers) {
      const hit = fn();
      if (hit) return hit;
    }
    return null;
  }

  global.NocoAIPro = {
    process,
    smartFallback,
    rememberCreateSpec,
    isProQuery,
    SCENES
  };
})(typeof window !== "undefined" ? window : globalThis);
