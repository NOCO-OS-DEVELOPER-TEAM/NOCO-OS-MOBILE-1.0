/**
 * NOCO AI Diagnostics — Performance, Geraet, Tipps (offline, personalisiert)
 */
(function initNocoAIDiagnostics(global) {
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

  function isPerformanceQuery(q, raw) {
    if (/\b(performance|leistung|fps|ruckelt|ruckeln|lag|lags|haengt|hangt|langsam|schlecht)\b/.test(q)) {
      if (/\b(warum|wieso|weshalb|was tun|hilfe|fix|verbessern|schlecht|langsam)\b/.test(q)) return true;
      if (/\b(performance|leistung)\b/.test(q)) return true;
    }
    if (/\b(warum ist mein|warum ist die)\b/.test(q) && /\b(schlecht|langsam|haengt)\b/.test(q)) return true;
    return false;
  }

  function buildPerformanceAnswer(helpers) {
    const s = helpers.getSystemSnapshot?.() || {};
    const settings = helpers.getSettings?.() || {};
    const tips = [];
    const good = [];

    if (s.glassBoost) {
      tips.push("<li><strong>Liquid Glass Boost</strong> ist an — mehr Blur kostet GPU. Sag «Weniger Glas» oder schalte Boost in Core aus.</li>");
    } else {
      good.push("Glas-Boost ist aus — gut fuer flüssiges Scrollen.");
    }
    if (s.liveWallpaper) {
      tips.push("<li><strong>Live Wallpaper</strong> laeuft — fuer Ruhe: «Hintergrund aus» oder in Core deaktivieren.</li>");
    }
    if (s.motion !== false) {
      tips.push("<li><strong>Animationen</strong> an — bei Ruckeln: «Animationen aus» in Core.</li>");
    }
    if (settings.keepAppsAlive !== false) {
      tips.push("<li><strong>Apps behalten</strong> speichert jede App im Speicher — bei vielen offenen Apps: in Core «Apps behalten» aus.</li>");
    }
    const widgetCount = (s.widgets || []).length;
    if (widgetCount > 6) {
      tips.push(`<li>Viele Home-Widgets (<strong>${widgetCount}</strong>) — im Edit-Modus welche entfernen.</li>`);
    }
    if (helpers.getTimerStatus?.()?.running) {
      tips.push("<li>Ein <strong>Timer</strong> laeuft — normal, sollte kaum bremsen.</li>");
    }
    const reminders = helpers.listRemindersDetailed?.()?.length || 0;
    if (reminders > 5) {
      tips.push(`<li><strong>${reminders}</strong> aktive Erinnerungen — kein Problem, aber Inbox ist voll.</li>`);
    }

    const tipBlock = tips.length
      ? `<p><strong>Moegliche Ursachen bei dir:</strong></p><ul>${tips.join("")}</ul>`
      : "<p>Deine Einstellungen sehen <strong>schlank</strong> aus — eher kein NOCO-Overload.</p>";

    const goodBlock = good.length ? `<p><small>${good.join(" ")}</small></p>` : "";

    return `<p><strong>Performance (offline)</strong></p>
      <p>NOCO laeuft komplett lokal — kein Server, aber Glass, Animationen und «Apps behalten» kosten Arbeit.</p>
      ${tipBlock}
      ${goodBlock}
      <p><strong>Schnell helfen:</strong></p>
      <ul>
        <li>App schliessen (×) und neu oeffnen</li>
        <li>Hard-Refresh der PWA (Seite neu laden)</li>
        <li>Island → <strong>Home</strong>, weniger Apps gleichzeitig offen lassen</li>
      </ul>
      <p><small>Alles bleibt gespeichert. Frag «System Status» fuer deinen Ueberblick.</small></p>`;
  }

  function process(raw, helpers) {
    const q = norm(raw);
    if (!isPerformanceQuery(q, raw)) return null;
    return {
      type: "text",
      text: buildPerformanceAnswer(helpers),
      rememberTopic: "performance"
    };
  }

  global.NocoAIDiagnostics = {
    process,
    isPerformanceQuery,
    buildPerformanceAnswer
  };
})(typeof window !== "undefined" ? window : globalThis);
