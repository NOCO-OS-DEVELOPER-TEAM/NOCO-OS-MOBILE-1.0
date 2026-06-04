/**
 * NOCO AI Insights — Daten aus deinem Geraet (Notizen, Tasks, Memory, Suche, Tipps)
 */
(function initNocoAIInsights(global) {
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

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const TIPS = [
    "Island aufklappen → <strong>Edit</strong> → <strong>+</strong> fuer Widgets.",
    "«Erstelle Notiz» legt eine leere Beispiel-Notiz an — nicht eine alte oeffnen.",
    "«Unterschied Beam und Forge» erklaert Suche vs. App-Store.",
    "Memory: «Erinnere mich in 20 Minuten, …» — Timer ist nur Countdown.",
    "«Such ueberall nach Urlaub» durchsucht Notizen und AI-Chats.",
    "Exclusive = ein Paket inkl. <strong>unbegrenzter NOCO AI</strong>.",
    "Hard-Refresh (Ctrl+F5) wenn nach Update etwas alt wirkt.",
    "Keycard in Sync sichert Theme, Apps und Guthaben.",
    "«Erledige Aufgabe Milch» hakt Tasks ab — ohne App oeffnen.",
    "Rechnen im Chat: <strong>3 mal 4 plus 5</strong> oder <strong>3*4+5</strong>."
  ];

  const QUOTES = [
    "Kleine Schritte schlagen grosse Plaene — starte mit einer Task.",
    "Offline heisst: deine Daten bleiben deine.",
    "Fokus ist eine App entfernt — Timer 25 Minuten?",
    "Notizen sind Gedanken mit Rueckgabe — leer anfangen ist ok.",
    "Liquid Glass ist kein Filter — ist Stimmung.",
    "Heute reicht ein Beispiel — morgen der echte Inhalt."
  ];

  function isInsightQuery(q, raw) {
    if (global.NocoAICreate?.isCreateIntent?.(raw, q)) return false;
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return false;
    return (
      /\b(inbox|tagesuebersicht|tages briefing|briefing|uebersicht|uberblick|zusammenfassung|was habe ich|was steht an)\b/.test(q) ||
      /\b(liste|zeig|welche|wie viele).{0,20}(notiz|notizen|aufgab|task|erinnerung|memory|reminder)\b/.test(q) ||
      /\b(offene?\s+aufgaben|offene?\s+tasks|meine\s+tasks|meine\s+notizen)\b/.test(q) ||
      /\b(such|suche|durchsuch).{0,12}(ueberall|alles|überall|overall|everywhere)\b/.test(q) ||
      /\b(erledige|hake ab|abgehakt|task erledigt|aufgabe erledigt)\b/.test(q) ||
      /\b(zufallstipp|random tip|gib mir.{0,16}tipp|tipp des tages|überrasch|ueberrasch)\b/.test(q) ||
      /\b(zitat|motivation|inspiration|spruch)\b/.test(q) ||
      /\b(was kannst du alles|alle funktionen|feature liste|faehigkeiten)\b/.test(q) ||
      /\b(in\s+\d+\s+(tagen|wochen|monaten|stunden)|wann ist in|datum in)\b/.test(q) ||
      /\b(\d+)\s*(km|kilometer|celsius|fahrenheit|grad|kg|pfund|mb|gb)\b/.test(q) &&
        /\b(in|zu|nach|umrechn|convert)\b/.test(q)
    );
  }

  function gatherInbox(helpers) {
    window.NocoNotes?.reload?.();
    window.NocoAIChats?.reload?.();
    const notes = (window.NocoNotes?.listNotes?.() || []).slice(0, 12);
    const tasks = helpers.getTasks?.() || [];
    const openTasks = tasks.filter((t) => !t.done);
    const reminders = window.NocoReminders?.active?.() || [];
    const snap = helpers.getSystemSnapshot?.() || {};
    return { notes, openTasks, reminders, snap };
  }

  function tryInbox(q, helpers) {
    if (!/\b(inbox|tagesuebersicht|tages briefing|briefing|uebersicht|uberblick|zusammenfassung|was habe ich|was steht an)\b/.test(q)) {
      return null;
    }
    const { notes, openTasks, reminders, snap } = gatherInbox(helpers);
    const noteLines = notes
      .slice(0, 5)
      .map((n) => `<li><strong>${escapeHtml(n.title)}</strong>${n.body ? ` — <small>${escapeHtml(n.body.slice(0, 40))}…</small>` : " <small>(leer)</small>"}</li>`)
      .join("");
    const taskLines = openTasks
      .slice(0, 6)
      .map((t) => `<li>${escapeHtml(t.text)}</li>`)
      .join("");
    const remLines = reminders
      .slice(0, 4)
      .map((r) => {
        const eta = global.NocoReminders?.formatEta?.(r) || "?";
        return `<li>${escapeHtml(r.text)} <small>(${eta})</small></li>`;
      })
      .join("");

    return {
      text: `<p><strong>Dein Tages-Überblick</strong> <small>— offline aus deinen Apps</small></p>
        <p><em>Notizen (${snap.noteCount ?? notes.length})</em></p>
        <ul>${noteLines || "<li>Keine Notizen — sag «Erstelle Notiz»</li>"}</ul>
        <p><em>Offene Tasks (${openTasks.length})</em></p>
        <ul>${taskLines || "<li>Alles erledigt — oder «Erstelle Aufgabe»</li>"}</ul>
        <p><em>Memory (${reminders.length} aktiv)</em></p>
        <ul>${remLines || "<li>Keine aktiven Erinnerungen</li>"}</ul>
        <p><small>AI-Chats: <strong>${snap.chatCount ?? 0}</strong> · Pay: <strong>${snap.payBalance || "?"}</strong></small></p>`
    };
  }

  function tryListNotes(q, helpers) {
    if (!/\b(liste|zeig|welche|wie viele).{0,20}(notiz|notizen)\b/.test(q) && !/\bmeine\s+notizen\b/.test(q)) {
      return null;
    }
    window.NocoNotes?.reload?.();
    const notes = window.NocoNotes?.listNotes?.() || [];
    if (!notes.length) {
      return { text: "<p>Du hast noch <strong>keine Notizen</strong>. Sag «Erstelle Notiz» fuer ein leeres Beispiel.</p>" };
    }
    const rows = notes
      .slice(0, 10)
      .map((n, i) => {
        const prev = (n.body || "").replace(/\s+/g, " ").trim();
        const hint = prev ? escapeHtml(prev.slice(0, 50)) + (prev.length > 50 ? "…" : "") : "<em>leer</em>";
        return `<li><strong>${i + 1}. ${escapeHtml(n.title)}</strong> — ${hint}</li>`;
      })
      .join("");
    return {
      text: `<p><strong>Deine Notizen</strong> (${notes.length})</p><ul>${rows}</ul><p><small>«Oeffne Notiz mit …» oeffnet einen Treffer.</small></p>`
    };
  }

  function tryListTasks(q, helpers) {
    if (
      !/\b(liste|zeig|welche).{0,20}(aufgab|task)/.test(q) &&
      !/\b(offene?\s+aufgaben|offene?\s+tasks|meine\s+tasks)\b/.test(q)
    ) {
      return null;
    }
    const tasks = helpers.getTasks?.() || [];
    const open = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);
    if (!open.length && !done.length) {
      return { text: "<p><strong>Tasks</strong> sind leer. Sag «Erstelle Aufgabe» oder «Erstelle Aufgabe Einkaufen».</p>" };
    }
    const openHtml = open.slice(0, 8).map((t) => `<li>☐ ${escapeHtml(t.text)}</li>`).join("");
    const doneHtml = done.slice(0, 3).map((t) => `<li><s>${escapeHtml(t.text)}</s></li>`).join("");
    return {
      text: `<p><strong>Tasks</strong> — ${open.length} offen, ${done.length} erledigt</p>
        ${open.length ? `<ul>${openHtml}</ul>` : "<p>Alles erledigt.</p>"}
        ${done.length ? `<p><small>Erledigt:</small></p><ul>${doneHtml}</ul>` : ""}
        <p><small>«Erledige Aufgabe …» zum Abhaken.</small></p>`
    };
  }

  function tryListReminders(q) {
    if (!/\b(liste|zeig|welche).{0,20}(erinnerung|memory|reminder)\b/.test(q) && !/\bmeine\s+erinnerungen\b/.test(q)) {
      return null;
    }
    const list = window.NocoReminders?.active?.() || [];
    if (!list.length) {
      return { text: "<p>Keine aktiven <strong>Memory</strong>-Erinnerungen. Beispiel: «Erinnere mich in 15 Minuten Pause».</p>" };
    }
    const rows = list
      .map((r) => {
        const eta = global.NocoReminders?.formatEta?.(r) || `${Math.max(1, Math.ceil((r.fireAt - Date.now()) / 60000))} Min`;
        return `<li>${escapeHtml(r.text)} — <strong>${eta}</strong></li>`;
      })
      .join("");
    return { text: `<p><strong>Aktive Erinnerungen</strong></p><ul>${rows}</ul>` };
  }

  function trySearchAll(raw, q, helpers) {
    const m =
      raw.match(/(?:such|suche|durchsuch).{0,20}(?:ueberall|überall|alles|overall|everywhere)\s+(?:nach\s+)?(.+)/i) ||
      raw.match(/(?:find|finde)\s+(.+)\s+(?:in\s+)?(?:notizen|chats|überall)/i);
    if (!m?.[1]?.trim()) return null;
    const query = m[1].trim().slice(0, 80);
    const noteHits = helpers.searchNotes?.(query, { limit: 4 }) || [];
    const chatHits = helpers.searchChats?.(query, { limit: 4 }) || [];
    if (!noteHits.length && !chatHits.length) {
      return { text: `<p>Nichts zu <strong>${escapeHtml(query)}</strong> in Notizen oder AI-Chats gefunden.</p>` };
    }
    let html = `<p><strong>Suche «${escapeHtml(query)}»</strong></p>`;
    if (noteHits.length) {
      html += "<p><em>Notizen</em></p><ul>";
      noteHits.forEach((n) => {
        html += `<li><strong>${escapeHtml(n.title)}</strong>${n.preview ? ` — <small>${escapeHtml(n.preview.slice(0, 60))}</small>` : ""}</li>`;
      });
      html += "</ul>";
    }
    if (chatHits.length) {
      html += "<p><em>AI-Chats</em></p><ul>";
      chatHits.forEach((c) => {
        html += `<li><strong>${escapeHtml(c.name)}</strong> <small>(Score ${c.score})</small></li>`;
      });
      html += "</ul>";
    }
    html += "<p><small>Sag «Oeffne Notiz mit …» oder «Oeffne Chat wo ich …» zum Oeffnen.</small></p>";
    return { text: html };
  }

  function tryCompleteTask(raw, q, helpers) {
    if (!/\b(erledige|hake ab|abgehakt|markiere).{0,20}(aufgabe|task)/.test(q) && !/\b(task|aufgabe)\s+erledigt\b/.test(q)) {
      return null;
    }
    const m =
      raw.match(/(?:erledige|hake ab|markiere).{0,24}(?:aufgabe|task)\s+(.+)/i) ||
      raw.match(/(?:aufgabe|task)\s+(.+?)\s+erledigt/i);
    const needle = (m?.[1] || "").trim().toLowerCase();
    if (!needle || needle.length < 2) {
      return { text: "<p>Welche Aufgabe? Z. B. <strong>Erledige Aufgabe Milch</strong>.</p>" };
    }
    const ok = helpers.completeTask?.(needle);
    if (!ok) {
      return { text: `<p>Keine offene Aufgabe mit <strong>${escapeHtml(needle)}</strong> gefunden.</p><p>Sag «Offene Aufgaben» fuer die Liste.</p>` };
    }
    return {
      type: "action",
      text: `<p>Aufgabe <strong>${escapeHtml(ok.text)}</strong> ist erledigt.</p>`,
      run: () => helpers.openApp?.("tasks")
    };
  }

  function tryTip(q) {
    if (!/\b(zufallstipp|random tip|gib mir.{0,16}tipp|tipp des tages|überrasch|ueberrasch)\b/.test(q)) return null;
    return { text: `<p><strong>Tipp</strong></p><p>${pick(TIPS)}</p>` };
  }

  function tryQuote(q) {
    if (!/\b(zitat|motivation|inspiration|spruch des tages)\b/.test(q)) return null;
    return { text: `<p><strong>Spruch</strong></p><p><em>«${pick(QUOTES)}»</em></p>` };
  }

  function tryCapabilities(q) {
    if (!/\b(was kannst du alles|alle funktionen|feature liste|faehigkeiten liste)\b/.test(q)) return null;
    return {
      text: `<p><strong>NOCO AI — Funktionen (offline)</strong></p>
        <ul>
          <li><strong>Steuern:</strong> Apps, Core, Themes, Widgets, Lock, Pay</li>
          <li><strong>Erstellen:</strong> Notiz, Task, Chat, Timer (leere Beispiele)</li>
          <li><strong>Wissen:</strong> Status, Empfehlungen, Vergleiche, «Was ist …?»</li>
          <li><strong>Daten:</strong> Inbox, Notiz-/Task-Listen, Suche überall, Aufgaben abhaken</li>
          <li><strong>Zeit:</strong> Uhrzeit, Timer, Memory, «Wann ist mein Timer rum?»</li>
          <li><strong>Rechnen:</strong> «3 plus 3», Ketten, Worte & Symbole</li>
          <li><strong>Einheiten:</strong> km↔mi, °C↔°F, kg↔lb (Demo)</li>
        <li><strong>Ueberblick:</strong> «Was steht an?», Nachfragen («und der Timer?»)</li>
        <li><strong>Modi:</strong> Fokus, Nacht, Produktiv — Coach & Tagesplan</li>
        <li><strong>Fragen:</strong> Einstellungen, «Was ist …?», Smalltalk</li>
        </ul>
        <p><small>Frag «Hilfe» oder probiere die Vorschlaege unter dem Eingabefeld.</small></p>`
    };
  }

  function tryDateOffset(raw, q) {
    const m = q.match(/\b(in|ueber|über)\s+(\d+)\s+(tagen|tage|wochen|woche|monaten|monat|stunden|std|h)\b/);
    if (!m && !/\bwann ist in\b/.test(q)) return null;
    if (!m) return null;
    const n = Math.max(1, parseInt(m[2], 10) || 1);
    const unit = m[3];
    const now = new Date();
    const d = new Date(now);
    if (/stund|std|^h$/.test(unit)) d.setHours(d.getHours() + n);
    else if (/wochen|woche/.test(unit)) d.setDate(d.getDate() + n * 7);
    else if (/monat/.test(unit)) d.setMonth(d.getMonth() + n);
    else d.setDate(d.getDate() + n);
    const label = d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return {
      text: `<p>In <strong>${n} ${unit}</strong> ist es ungefaehr:</p><p><strong>${label}</strong> — ${time} Uhr (lokal berechnet).</p>`
    };
  }

  function tryConvert(raw, q) {
    const m = q.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometer|celsius|fahrenheit|grad c|grad f|kg|kilo|pfund|lb|mb|gb)\b/);
    if (!m) return null;
    if (!/\b(in|zu|nach|umrechn|convert|equals|ist)\b/.test(q)) return null;
    let val = parseFloat(m[1].replace(",", "."));
    const unit = m[2];
    let out = "";
    if (/km|kilometer/.test(unit)) {
      const mi = val * 0.621371;
      out = `<strong>${val} km</strong> ≈ <strong>${mi.toFixed(2)} Meilen</strong>`;
    } else if (/celsius|grad c/.test(unit)) {
      const f = (val * 9) / 5 + 32;
      out = `<strong>${val} °C</strong> ≈ <strong>${f.toFixed(1)} °F</strong>`;
    } else if (/fahrenheit|grad f/.test(unit)) {
      const c = ((val - 32) * 5) / 9;
      out = `<strong>${val} °F</strong> ≈ <strong>${c.toFixed(1)} °C</strong>`;
    } else if (/kg|kilo/.test(unit)) {
      const lb = val * 2.20462;
      out = `<strong>${val} kg</strong> ≈ <strong>${lb.toFixed(2)} lb</strong>`;
    } else if (/pfund|lb/.test(unit)) {
      const kg = val / 2.20462;
      out = `<strong>${val} lb</strong> ≈ <strong>${kg.toFixed(2)} kg</strong>`;
    } else if (/^mb$/.test(unit) && /\b(gb|gigabyte)\b/.test(q)) {
      out = `<strong>${val} MB</strong> ≈ <strong>${(val / 1024).toFixed(2)} GB</strong>`;
    } else if (/^gb$/.test(unit) && /\b(mb|megabyte)\b/.test(q)) {
      out = `<strong>${val} GB</strong> ≈ <strong>${(val * 1024).toFixed(0)} MB</strong>`;
    } else return null;
    return { text: `<p><strong>Umrechnung</strong></p><p>${out}</p>` };
  }

  function trySmartGreeting(raw, q, helpers) {
    if (!/^(hallo|hi|hey|moin|servus|guten (morgen|tag|abend))[\s!,.\-]*$/i.test(raw.trim())) return null;
    const h = new Date().getHours();
    const part = h < 11 ? "Guten Morgen" : h < 18 ? "Hallo" : "Guten Abend";
    const { openTasks, reminders } = gatherInbox(helpers);
    let hint = "Frag «Was kannst du alles?» oder «Inbox» fuer deinen Ueberblick.";
    if (openTasks.length) hint = `Du hast <strong>${openTasks.length}</strong> offene Tasks — «Offene Aufgaben» zeigt sie.`;
    else if (reminders.length) hint = `<strong>${reminders.length}</strong> Memory-Erinnerung(en) laufen — «Meine Erinnerungen».`;
    return {
      text: `<p>${part}! Ich bin <strong>NOCO AI</strong> — smarter offline Assistent.</p><p>${hint}</p>`
    };
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!isInsightQuery(q, raw) && !/^(hallo|hi|hey|moin|servus|guten (morgen|tag|abend))[\s!,.\-]*$/i.test(String(raw || "").trim())) {
      return null;
    }
    const handlers = [
      () => trySmartGreeting(raw, q, helpers),
      () => tryInbox(q, helpers),
      () => tryListNotes(q, helpers),
      () => tryListTasks(q, helpers),
      () => tryListReminders(q),
      () => trySearchAll(raw, q, helpers),
      () => tryCompleteTask(raw, q, helpers),
      () => tryCapabilities(q),
      () => tryDateOffset(raw, q),
      () => tryConvert(raw, q),
      () => tryTip(q),
      () => tryQuote(q)
    ];
    for (const fn of handlers) {
      const hit = fn();
      if (!hit) continue;
      if (hit.type === "action") return hit;
      return { type: "text", text: hit.text };
    }
    return null;
  }

  function tryAnswer(raw, q, helpers) {
    return process(raw, helpers);
  }

  global.NocoAIInsights = { process, tryAnswer, isInsightQuery };
})(typeof window !== "undefined" ? window : globalThis);
