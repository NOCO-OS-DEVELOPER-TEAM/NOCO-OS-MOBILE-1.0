/**
 * NOCO AI Time — Timer & Memory (Wann fertig? Wie lange noch?)
 */
(function initNocoAITime(global) {
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

  function isTimerStartCommand(raw, q) {
    const n = q || norm(raw);
    if (/\b(auto\s*lock|autolock|autolog|auto\s+log)\b/.test(n)) return false;
    if (!/\b(timer|countdown|stoppuhr|fokus\s*timer)\b/.test(n)) return false;
    return (
      /\b(starte?|start|stell|setz|mach|los|go|ab)\b/.test(n) ||
      /\b(timer|countdown)\s*\d+\b/.test(n) ||
      /\d+\s*(min|minuten|minute|sek|sekunden)\b/.test(n)
    );
  }

  function parseTimerStartMinutes(raw) {
    const q = norm(raw);
    if (!isTimerStartCommand(raw, q)) return null;
    const patterns = [
      /(?:starte?|start|stell|setz|mach|los|go).{0,28}(?:den\s+)?(?:timer|countdown|stoppuhr|fokus\s*timer).{0,24}(\d+)\s*(minuten|min|minute|min\.|sekunden|sek|sec|s|stunden|std|h|hour)?/i,
      /(?:timer|countdown|stoppuhr).{0,20}(\d+)\s*(minuten|min|minute|min\.|sekunden|sek|sec|s|stunden|std|h)?/i,
      /(\d+)\s*(minuten|min|minute|min\.)\s+(?:timer|countdown)/i
    ];
    for (const re of patterns) {
      const m = String(raw || "").match(re);
      if (!m?.[1]) continue;
      const n = Math.max(1, parseInt(m[1], 10) || 1);
      const unit = String(m[2] || "min").toLowerCase();
      if (/stund|std|hour|^h$/.test(unit)) return Math.min(180, n * 60);
      if (/sek|sec|^s$/.test(unit)) return Math.max(1, Math.min(180, Math.ceil(n / 60) || 1));
      return Math.min(180, n);
    }
    return null;
  }

  function isAutoLockTimeQuery(raw, q) {
    const n = q || norm(raw);
    if (isTimerStartCommand(raw, n)) return false;
    if (/\b(timer|countdown|stoppuhr|erinnere|remind|memory)\b/.test(n)) return false;
    return (
      /\b(auto\s*lock|autolock|autolog|auto\s+log|autosperre|auto\s*sperre|sperre automatisch)\b/.test(n) ||
      (/\b(lock|sperre)\b/.test(n) && /\b(zeit|dauer|nach|sek|min|sekunden)\b/.test(n))
    );
  }

  function buildTimerStartAction(minutes, helpers) {
    const mins = Math.max(1, Math.min(180, Math.floor(Number(minutes) || 1)));
    return {
      type: "action",
      text: `<p>Neuer <strong>${mins} Minuten</strong>-Timer — alter Countdown wird ersetzt.</p><p><small>Piept am Ende und oeffnet die Timer-App.</small></p>`,
      run: () => {
        helpers.applyTimerMinutes?.(mins);
        helpers.startTimerCountdown?.();
        helpers.openTimerApp?.();
      },
      rememberTopic: "timer",
      ultraTopic: "timer"
    };
  }

  function isTimeQuery(q, raw) {
    if (global.NocoAIMath?.looksLikeMath?.(raw)) return false;
    if (isTimerStartCommand(raw, q)) return false;
    return (
      /\b(timer|countdown|stoppuhr)\b/.test(q) &&
      /\b(wann|wie lange|noch|rum|fertig|zuende|ende|endezeit|ablauf|status|laeuft|läuft|um|fertig wird)\b/.test(q)
    ) || (
      /\b(erinnerung|memory|reminder|wecker)\b/.test(q) &&
      /\b(wann|wie lange|noch|rum|fertig|feuert|klingelt|naechste|nächste|status)\b/.test(q)
    ) || /\b(laeuft|läuft)\s+(ein\s+)?(timer|countdown)\b/.test(q) ||
      /\bwann\s+(ist|war|warum)\s+(mein|der|die)\s+(timer|erinnerung)\b/.test(q) ||
      /\b(timer|erinnerung)\s+status\b/.test(q);
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.floor(sec));
    if (s < 60) return `${s} Sekunden`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m < 60) return r ? `${m} Min ${r} Sek` : `${m} Minuten`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm ? `${h} Std ${rm} Min` : `${h} Stunden`;
  }

  function tryTimer(q, helpers) {
    if (!/\b(timer|countdown|stoppuhr)\b/.test(q) && !/\blaeuft\s+(ein\s+)?timer\b/.test(q)) {
      if (!/\bwann\s+(ist|war).{0,12}timer\b/.test(q)) return null;
    }
    const t = helpers.getTimerStatus?.();
    if (!t) {
      return { text: "<p>Timer-Status nicht verfuegbar. Oeffne die <strong>Timer</strong>-App.</p>" };
    }
    if (t.running) {
      return {
        text: `<p><strong>Timer laeuft</strong></p>
          <ul>
            <li>Noch: <strong>${escapeHtml(t.display)}</strong> (${formatDuration(t.remainingSec)})</li>
            <li>Fertig um: <strong>${escapeHtml(t.endTimeLocale)}</strong> — ${escapeHtml(t.endDateLocale)}</li>
            <li>Modus: <strong>${escapeHtml(t.modeLabel || t.mode)}</strong></li>
          </ul>
          <p><small>Beim Ende piept es und die Timer-App oeffnet sich.</small></p>`
      };
    }
    if (t.remainingSec > 0) {
      return {
        text: `<p>Der Timer ist <strong>pausiert/bereit</strong> bei <strong>${escapeHtml(t.display)}</strong>.</p><p>Sag <strong>Starte Timer</strong> oder tippe Start in der App.</p>`
      };
    }
    return {
      text: "<p>Kein aktiver Timer. Sag z. B. <strong>Starte Timer 10 Minuten</strong> oder <strong>Fokus Modus</strong>.</p>"
    };
  }

  function tryReminder(q, helpers) {
    if (!/\b(erinnerung|memory|reminder|wecker)\b/.test(q)) return null;
    const next = helpers.getNextReminder?.();
    const all = helpers.listRemindersDetailed?.() || [];

    if (/\b(welche|alle|liste)\b/.test(q) && /\b(erinnerung|memory)\b/.test(q)) {
      if (!all.length) {
        return { text: "<p>Keine aktiven <strong>Memory</strong>-Erinnerungen.</p>" };
      }
      const rows = all
        .map(
          (r) =>
            `<li><strong>${escapeHtml(r.text)}</strong> — fertig gegen <strong>${escapeHtml(r.endTimeLocale)}</strong> (noch ${escapeHtml(r.eta)})</li>`
        )
        .join("");
      return { text: `<p><strong>Deine Erinnerungen</strong></p><ul>${rows}</ul>` };
    }

    if (!next) {
      return {
        text: "<p>Keine aktive <strong>Erinnerung</strong>. Beispiel: <strong>Erinnere mich in 20 Minuten, Muell</strong>.</p>"
      };
    }
    return {
      text: `<p><strong>Naechste Erinnerung</strong></p>
        <p>«${escapeHtml(next.text)}»</p>
        <ul>
          <li>Noch: <strong>${escapeHtml(next.eta)}</strong> (${formatDuration(next.remainingSec)})</li>
          <li>Fertig um: <strong>${escapeHtml(next.endTimeLocale)}</strong> — ${escapeHtml(next.endDateLocale)}</li>
        </ul>
        <p><small>Beim Ablauf: Ton + Toast — App <strong>Memory</strong> oeffnet sich.</small></p>`
    };
  }

  function tryCombined(q, helpers) {
    if (!/\b(wann|wie lange|was zuerst|beides)\b/.test(q)) return null;
    if (!/\b(timer|erinnerung|memory)\b/.test(q)) return null;
    const t = helpers.getTimerStatus?.();
    const r = helpers.getNextReminder?.();
    if (!t?.running && !r) return null;
    let html = "<p><strong>Zeit-Check</strong></p><ul>";
    if (t?.running) {
      html += `<li><strong>Timer</strong>: noch ${escapeHtml(t.display)} — fertig ${escapeHtml(t.endTimeLocale)}</li>`;
    }
    if (r) {
      html += `<li><strong>Memory</strong>: «${escapeHtml(r.text)}» — noch ${escapeHtml(r.eta)} (${escapeHtml(r.endTimeLocale)})</li>`;
    }
    html += "</ul>";
    if (t?.running && r && t.endAt && r.fireAt) {
      const first = t.endAt < r.fireAt ? "Timer" : "Erinnerung";
      html += `<p>Zuerst fertig: <strong>${first}</strong>.</p>`;
    }
    return { text: html };
  }

  function process(raw, helpers) {
    const q = norm(raw);
    const timerMins = parseTimerStartMinutes(raw);
    if (timerMins != null && helpers?.applyTimerMinutes) {
      return buildTimerStartAction(timerMins, helpers);
    }
    if (!isTimeQuery(q, raw)) return null;

    const handlers = [() => tryCombined(q, helpers), () => tryTimer(q, helpers), () => tryReminder(q, helpers)];
    for (const fn of handlers) {
      const hit = fn();
      if (hit?.text) return { type: "text", text: hit.text };
    }
    return null;
  }

  global.NocoAITime = {
    process,
    isTimeQuery,
    isTimerStartCommand,
    parseTimerStartMinutes,
    isAutoLockTimeQuery,
    buildTimerStartAction
  };
})(typeof window !== "undefined" ? window : globalThis);
