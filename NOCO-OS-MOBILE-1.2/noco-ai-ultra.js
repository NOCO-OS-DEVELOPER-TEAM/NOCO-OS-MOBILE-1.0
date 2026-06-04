/**
 * NOCO AI Ultra — Kontext, Briefing, Follow-ups, Kombi-Befehle, smarte Fussnoten
 */
(function initNocoAIUltra(global) {
  const memory = {
    turns: [],
    lastTopic: null,
    lastUserText: null,
    lastBotSnippet: null
  };

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

  function isBriefingQuery(q) {
    return /\b(briefing|status komplett|voller status|alles zusammen|intelligenz report|smart report|mega status|komplett ueberblick|full status|was steht an|wie siehts aus|wie sieht es aus|alles auf einen blick|mein tag|heute ueberblick|kurz alles|status von allem|gib mir einen ueberblick|was hab ich heute|wie laeuft es|wie lauft es)\b/.test(
      q
    );
  }

  function isFollowUp(q, raw) {
    if (raw.length > 90) return false;
    if (/^(ja|ok|nein|yes|no)[\s!,.\-]*$/i.test(raw.trim())) return false;
    return (
      (/\b(und|auch|noch|mehr|details|dazu|weiter|genauer|erklaer|erklar)\b/.test(q) && memory.lastTopic) ||
      /\b(was ist mit|wie sieht es aus mit|zeig mir den|zeig mir die)\b/.test(q)
    );
  }

  function rememberTurn(userText, result, ctx) {
    const topic =
      result?.rememberTopic ||
      result?.ultraTopic ||
      detectTopicFromUser(userText) ||
      memory.lastTopic;
    memory.lastTopic = topic;
    memory.lastUserText = userText;
    memory.lastBotSnippet = String(result?.text || "")
      .replace(/<[^>]+>/g, " ")
      .trim()
      .slice(0, 160);
    memory.turns.push({ user: userText, topic, at: Date.now() });
    if (memory.turns.length > 8) memory.turns.shift();
    if (ctx) {
      ctx.lastTopic = topic;
      ctx.lastUltraTopic = topic;
    }
  }

  function detectTopicFromUser(raw) {
    const q = norm(raw);
    if (/\b(timer|countdown)\b/.test(q)) return "timer";
    if (/\b(erinnerung|memory|remind)\b/.test(q)) return "memory";
    if (/\b(notiz|note)\b/.test(q)) return "note";
    if (/\b(task|aufgabe|todo)\b/.test(q)) return "task";
    if (/\b(empfehl|tipp|coach|inbox|briefing)\b/.test(q)) return "insights";
    if (/\b(beam|forge|exclusive|core|theme)\b/.test(q)) return "knowledge";
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return "math";
    return null;
  }

  function buildBriefing(helpers) {
    const snap = helpers.getSystemSnapshot?.() || {};
    const settings = helpers.getSettings?.() || {};
    const usage = global.NocoAILimits?.getUsage?.(settings);
    const timer = helpers.getTimerStatus?.();
    const rem = helpers.getNextReminder?.();
    const tasks = helpers.getTasks?.() || [];
    const openTasks = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done).length;

    let aiLine = `Heute noch <strong>${usage?.remaining ?? "?"}/${usage?.limit ?? "?"}</strong> AI-Nachrichten`;
    if (usage?.exclusive) aiLine = "<strong>Unbegrenzte NOCO AI</strong> (Exclusive aktiv)";
    else if (usage?.plus) aiLine = "<strong>Unbegrenzte NOCO AI</strong>";

    let timerLine = "Kein Timer aktiv — «Starte Timer 10 Minuten» oder «Fokus Modus».";
    if (timer?.running) {
      timerLine = `Timer <strong>laeuft</strong>: noch <strong>${escapeHtml(timer.display)}</strong> — fertig <strong>${escapeHtml(timer.endTimeLocale)}</strong>`;
    } else if (timer?.remainingSec > 0) {
      timerLine = `Timer <strong>bereit</strong> bei ${escapeHtml(timer.display)} (nicht gestartet).`;
    }

    let memLine = "Keine Memory-Erinnerung aktiv.";
    if (rem) {
      memLine = `Memory: «${escapeHtml(rem.text)}» in <strong>${escapeHtml(rem.eta)}</strong> (${escapeHtml(rem.endTimeLocale)})`;
    }

    const steps = [];
    if (timer?.running) steps.push("Timer laufen lassen oder «Wann ist mein Timer rum?»");
    else if (openTasks.length) steps.push(`«Erledige Aufgabe ${openTasks[0].text.slice(0, 20)}»`);
    else steps.push("«Fokus Modus» oder «Erstelle Notiz»");
    if (!usage?.exclusive && (usage?.remaining ?? 20) <= 8) steps.push("Exclusive = unbegrenzte AI");
    steps.push("«Inbox» fuer Notizen + Tasks");

    return `<p><strong>Dein Ueberblick</strong></p>
      <p><em>Jetzt auf deinem Geraet</em></p>
      <ul>
        <li>${aiLine}</li>
        <li>${timerLine}</li>
        <li>${memLine}</li>
        <li>Tasks: <strong>${openTasks.length}</strong> offen · <strong>${done}</strong> erledigt</li>
        <li>Notizen: <strong>${snap.noteCount ?? 0}</strong> · Chats: <strong>${snap.chatCount ?? 0}</strong></li>
        <li>Theme <strong>${escapeHtml(snap.theme)}</strong> · Glas <strong>${snap.glassBoost ? "Boost" : "Standard"}</strong> · Apps <strong>${snap.installed ?? 0}</strong></li>
      </ul>
      <p><strong>Deine naechsten 3 Schritte</strong></p>
      <ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol>`;
  }

  function tryBriefing(q, helpers) {
    if (!isBriefingQuery(q)) return null;
    return { type: "text", text: buildBriefing(helpers), ultraTopic: "briefing", rememberTopic: "briefing" };
  }

  function tryFollowUp(q, raw, helpers) {
    if (!isFollowUp(q, raw)) return null;
    const topic = memory.lastTopic;
    if (/\b(timer|countdown)\b/.test(q) || (topic === "timer" && /\b(und|noch|wie|wann|lange|laenge)\b/.test(q))) {
      const hit = global.NocoAITime?.process?.("wann ist mein timer", helpers);
      if (hit) return hit;
      const t = helpers.getTimerStatus?.();
      if (t) {
        return {
          type: "text",
          text: t.running
            ? `<p>Noch <strong>${escapeHtml(t.display)}</strong> — fertig um <strong>${escapeHtml(t.endTimeLocale)}</strong>.</p>`
            : `<p>Timer steht bei <strong>${escapeHtml(t.display)}</strong> (nicht gestartet).</p>`,
          ultraTopic: "timer"
        };
      }
    }
    if (/\b(erinnerung|memory|remind)\b/.test(q) || (topic === "memory" && /\b(und|noch|wann|lange)\b/.test(q))) {
      const hit = global.NocoAITime?.process?.("wann ist meine erinnerung", helpers);
      if (hit) return hit;
      const r = helpers.getNextReminder?.();
      if (r) {
        return {
          type: "text",
          text: `<p>Erinnerung «${escapeHtml(r.text)}» in <strong>${escapeHtml(r.eta)}</strong> (${escapeHtml(r.endTimeLocale)}).</p>`,
          ultraTopic: "memory"
        };
      }
    }
    if (topic === "note" && /\b(und|notiz|mehr)\b/.test(q)) {
      return global.NocoAIInsights?.process?.("meine notizen", helpers);
    }
    if (topic === "task" && /\b(und|aufgab|task)\b/.test(q)) {
      return global.NocoAIInsights?.process?.("offene aufgaben", helpers);
    }
    if (/\b(inbox|ueberblick)\b/.test(q) || topic === "insights") {
      return global.NocoAIInsights?.process?.("inbox", helpers);
    }
    if (/\b(details|mehr|genauer)\b/.test(q) && memory.lastBotSnippet) {
      return {
        type: "text",
        text: `<p><strong>Mehr Kontext</strong> zum letzten Thema (<em>${escapeHtml(topic || "allgemein")}</em>):</p><p>${escapeHtml(memory.lastBotSnippet)}…</p><p>Frag spezifischer — z. B. «Wann ist mein Timer rum?» oder «Empfehl mir was».</p>`,
        ultraTopic: topic
      };
    }
    return null;
  }

  function tryTeach(q) {
    const m = q.match(/\b(was kann ich mit|was geht mit|wie nutze ich|hilf mir mit)\s+(?:der\s+|die\s+|das\s+)?(.+)/);
    if (!m) return null;
    const t = norm(m[2] || "").slice(0, 30);
    const guides = {
      timer: "<p><strong>Timer:</strong> «Starte Timer 10 Minuten», «Fokus Modus», «Wann ist mein Timer rum?» — Ende: Piepen + App oeffnet sich.</p>",
      memory: "<p><strong>Memory:</strong> «Erinnere mich in 20 Minuten, Text», «Wann ist meine Erinnerung?», «Meine Erinnerungen».</p>",
      notiz: "<p><strong>Notizen:</strong> «Erstelle Notiz» (leer), «Erstelle Notiz mit Titel X», «Fass Notizen zusammen».</p>",
      notes: "<p><strong>Notizen:</strong> «Erstelle Notiz» (leer), «Erstelle Notiz mit Titel X», «Fass Notizen zusammen».</p>",
      task: "<p><strong>Tasks:</strong> «Erstelle Aufgabe», «Offene Aufgaben», «Erledige Aufgabe Milch».</p>",
      noco: "<p><strong>NOCO AI:</strong> Fragen, Einstellungen erklaeren, Rechnen, Apps steuern — «Was kannst du alles?» oder «Was steht an?»</p>",
      exclusive: "<p><strong>Exclusive:</strong> Ein Paket mit unbegrenzter AI + Pro-Glas. «Lohnt Exclusive?»</p>",
      forge: "<p><strong>Forge:</strong> Apps installieren. «Oeffne Forge» oder «Installiere Timer».</p>",
      beam: "<p><strong>Beam:</strong> Schnellsuche. «Oeffne Beam» — findet Apps sofort.</p>"
    };
    for (const [key, html] of Object.entries(guides)) {
      if (t.includes(key)) return { type: "text", text: html, ultraTopic: "teach" };
    }
    return {
      type: "text",
      text: `<p>Zu <strong>${escapeHtml(t)}</strong>: frag «Was ist ${escapeHtml(t)}?» oder «Oeffne ${escapeHtml(t)}».</p>`,
      ultraTopic: "teach"
    };
  }

  function trySmartCombo(raw, helpers) {
    const q = norm(raw);
    const timerM = raw.match(/(?:timer|countdown|starte).{0,24}(\d+)\s*(?:min|minuten)/i);
    const remindMinM = raw.match(/(?:erinnere mich|remind me).{0,24}(\d+)\s*(?:min|minuten)/i);
    if (timerM && remindMinM && /\b(und|sowie|plus|dann)\b/.test(q)) {
      const tMin = Math.max(1, parseInt(timerM[1], 10));
      const rMin = Math.max(1, parseInt(remindMinM[1], 10) || tMin);
      let rText = "Erinnerung";
      const textM = raw.match(/(?:erinnere mich|remind me).{0,30}(?:min|minuten)\s*(?:dass|das|zu|um|to)?\s*(.+)$/i);
      if (textM?.[1]) {
        rText = textM[1].replace(/\s+und\s+.{0,40}(timer|countdown).*/i, "").trim();
      }
      rText = rText.slice(0, 200) || "Erinnerung";
      return {
        type: "action",
        text: `<p><strong>Kombi</strong>: Timer <strong>${tMin} Min</strong> + Memory in <strong>${rMin} Min</strong> («${escapeHtml(rText)}»).</p>`,
        ultraTopic: "combo",
        run: () => {
          helpers.applyTimerMinutes?.(tMin);
          helpers.startTimerCountdown?.();
          helpers.addReminder?.({ text: rText, minutes: rMin });
          helpers.openTimerApp?.();
        }
      };
    }
    if (/\b(fokus|produktiv|nacht)\b/.test(q) && /\b(und|plus|sowie)\b/.test(q) && /\b(erinnere|timer|notiz|aufgabe)\b/.test(q)) {
      return {
        type: "text",
        text: "<p>Mehrere Aktionen auf einmal — starte mit einem <strong>Modus</strong>, dann einzeln:</p><ol><li>«Fokus Modus»</li><li>«Erinnere mich in 15 Minuten …»</li><li>«Erstelle Notiz»</li></ol>",
        ultraTopic: "combo"
      };
    }
    return null;
  }

  function suggestFooter(helpers) {
    const ideas = [];
    const timer = helpers.getTimerStatus?.();
    const rem = helpers.getNextReminder?.();
    if (timer?.running) ideas.push("Wann ist mein Timer rum?");
    else ideas.push("Fokus Modus");
    if (rem) ideas.push("Wann ist meine Erinnerung?");
    else ideas.push("Erinnere mich in 15 Minuten Pause");
    ideas.push("Was steht an?");
    ideas.push("Inbox");
    return pick(ideas.slice(0, 5));
  }

  function enrich(text, userText, helpers) {
    if (!text || text.includes("noco-ai-ultra-footer")) return text;
    const q = norm(userText);
    if (/\b(hilfe|help|danke|tschuss|bye)\b/.test(q) && q.length < 30) return text;
    const tip = suggestFooter(helpers);
    return `${text}<p class="noco-ai-ultra-footer"><small><strong>Vorschlag:</strong> «${escapeHtml(tip)}»</small></p>`;
  }

  function process(raw, helpers, ctx) {
    const q = norm(raw);
    const handlers = [
      () => tryBriefing(q, helpers),
      () => tryFollowUp(q, raw, helpers),
      () => trySmartCombo(raw, helpers),
      () => tryTeach(q)
    ];
    for (const fn of handlers) {
      const hit = fn();
      if (hit) return hit;
    }
    return null;
  }

  function finalize(result, userText, helpers, ctx) {
    if (!result) return result;
    rememberTurn(userText, result, ctx);
    if (result.type === "text" && result.text) {
      result.text = enrich(result.text, userText, helpers);
    }
    return result;
  }

  function smartFallback(raw, helpers) {
    const q = norm(raw);
    const ranked = [];
    if (/\b(timer|zeit|fokus)\b/.test(q)) ranked.push("Wann ist mein Timer rum?", "Fokus Modus");
    if (/\b(erinner|memory)\b/.test(q)) ranked.push("Wann ist meine Erinnerung?", "Erinnere mich in 10 Minuten");
    if (/\b(notiz|schreib)\b/.test(q)) ranked.push("Erstelle Notiz", "Fass Notizen zusammen");
    ranked.push("Was steht an?", "Was kannst du alles?", "Inbox");
    const chips = [...new Set(ranked)]
      .slice(0, 4)
      .map((s) => `«<strong>${escapeHtml(s)}</strong>»`)
      .join(", ");
    let text = `<p>Ich bin mir nicht ganz sicher — meinst du vielleicht:</p><p>${chips}</p><p><small>Oder sag es wie im Alltag: «Oeffne Timer», «Wie stelle ich Auto-Lock ein?», «Erstelle Notiz».</small></p>`;
    if (global.NocoAINatural?.softenFallback) text = global.NocoAINatural.softenFallback(text);
    return { text };
  }

  global.NocoAIUltra = {
    process,
    finalize,
    enrich,
    rememberTurn,
    smartFallback,
    isBriefingQuery,
    isFollowUp: (q, raw) => isFollowUp(q, raw),
    buildBriefing,
    reset: () => {
      memory.turns = [];
      memory.lastTopic = null;
      memory.lastUserText = null;
      memory.lastBotSnippet = null;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
