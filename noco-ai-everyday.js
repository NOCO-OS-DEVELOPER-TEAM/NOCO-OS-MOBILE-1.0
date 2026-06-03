/**
 * NOCO AI Everyday — Fragen zu NEUEN System-Funktionen (nicht Theme/Timer/Memory)
 * Kurze Antwort + stille Aktion wo sinnvoll
 */
(function initNocoAIEveryday(global) {
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

  function isQ(q, raw) {
    if (String(raw || "").trim().endsWith("?")) return true;
    return /\b(wo|wie|was|kann|kannst|gibt|finde|findest|welche|soll|darf|erklar|erklaer)\b/.test(q);
  }

  function act(text, run, topic) {
    return {
      type: "action",
      silent: true,
      text: text.startsWith("<") ? text : `<p>${text}</p>`,
      run,
      rememberTopic: topic || "discover"
    };
  }

  function say(html, topic) {
    return { type: "text", text: html.startsWith("<") ? html : `<p>${html}</p>`, rememberTopic: topic || "discover" };
  }

  function liveSilent(raw, helpers, patchText) {
    const res = global.NocoAILive?.process?.(raw, helpers);
    if (!res) return null;
    if (res.type === "action") {
      res.silent = true;
      if (patchText) res.text = typeof patchText === "function" ? patchText(res) : patchText;
      else if (!res.silent || res.text?.includes("…")) res.text = "<p>✓</p>";
    }
    return res;
  }

  function openApp(h, appId) {
    h.openApp?.(appId);
  }

  /** @type {{ id: string, test: (q:string, raw:string)=>boolean, handle: (q:string, raw:string, h:object)=>object|null }[]} */
  const RULES = [
    /* —— Foto / Kamera (Demo, kein klassischer Befehl) —— */
    {
      id: "camera-photo",
      test: (q) =>
        /\b(mach|mache|nimm|knips)\s+(ein\s+)?(foto|selfie|bild)\b/.test(q) ||
        /\b(foto machen|selfie|ich will fotografieren|will ein foto)\b/.test(q) ||
        q === "foto",
      handle: () => act("✓ GlowCam", (h) => () => openApp(h, "glowcam"), "glowcam")
    },
    {
      id: "camera-where",
      test: (q) => isQ(q) && /\b(wo|wie)\b/.test(q) && /\b(kamera|foto|glowcam|selfie)\b/.test(q),
      handle: () =>
        say(
          "<p><strong>GlowCam</strong> ist die Foto-App hier. Frag einfach <strong>«Mach ein Foto»</strong> — ich oeffne sie, ohne lange Erklaerung.</p>",
          "glowcam"
        )
    },
    /* —— Nur Info (kein Theme/Timer/Memory) —— */
    {
      id: "brightness-where",
      test: (q) =>
        isQ(q) &&
        /\b(wo finde|wo stelle|wo ist|wo kann)\b/.test(q) &&
        /\b(helligkeit|heller|dunkler|display|bildschirm)\b/.test(q),
      handle: (q, raw, h) => {
        const pct = Math.round((h.getSystemSnapshot?.()?.uiBrightness || 1) * 100);
        return say(
          `<p><strong>Helligkeit</strong> (UI, ${pct}%): <strong>Core</strong> → Deck. Oder sag <strong>«Heller»</strong> — das ist ein anderer Befehl.</p>`,
          "brightness-info"
        );
      }
    },
    {
      id: "wifi-offline",
      test: (q) => isQ(q) && /\b(internet|wlan|wifi|cloud|online)\b/.test(q),
      handle: () =>
        say("<p>NOCO laeuft <strong>offline</strong> auf deinem Geraet — kein echtes WLAN-Menue in der Demo.</p>", "network")
    },
    /* —— Neue Live-Funktionen per Frage —— */
    {
      id: "last-app",
      test: (q) =>
        /\b(letzte app|zuletzt geoeffnet|vorherige app|wo war ich|zurueck zur letzten app)\b/.test(q),
      handle: (q, raw, h) => {
        if (isQ(q) && /\b(wo war|was war)\b/.test(q)) {
          const id = h.getLastOpenedApp?.();
          if (!id) return say("<p>Noch keine <strong>letzte App</strong> in dieser Session.</p>", "lastapp");
          const t = h.getAppTitle?.(id) || id;
          return say(`<p>Zuletzt: <strong>${esc(t)}</strong>. Sag <strong>«Zurueck zur letzten App»</strong> — ich springe hin.</p>`, "lastapp");
        }
        return liveSilent(raw, h, "<p>✓</p>");
      }
    },
    {
      id: "meeting-prep",
      test: (q) =>
        /\b(meeting vorbereitung|meeting prep|gleich meeting|termin vorbereitung|besprechung vorbereiten)\b/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓ Meeting</p>")
    },
    {
      id: "system-tour",
      test: (q) =>
        /\b(system tour|os tour|zeig mir noco|erklaer mir noco|wie funktioniert noco os|rundgang)\b/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓ Tour</p>")
    },
    {
      id: "inbox-note",
      test: (q) =>
        /\b(inbox als notiz|speichere inbox|inbox notiz|schreib inbox auf|inbox in notiz)\b/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓ Notiz</p>")
    },
    {
      id: "ai-widget",
      test: (q) =>
        isQ(q) &&
        /\b(kann|kannst|darf|wie)\b/.test(q) &&
        /\b(ki|noco ai|assistent)\b/.test(q) &&
        /\b(home|startseite|widget|start bildschirm)\b/.test(q),
      handle: (q, raw, h) => {
        const ids = h.listHomeWidgets?.() || [];
        const has = ids.includes("nocoai");
        if (has) return say("<p>Das <strong>NOCO-AI-Widget</strong> ist schon auf dem Home.</p>", "widget");
        return liveSilent(raw, h, "<p>✓ Widget</p>");
      }
    },
    {
      id: "ai-widget-cmd",
      test: (q) => /\b(noco ai widget|ki widget auf home|ai widget hinzufuegen)\b/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓ Widget</p>")
    },
    {
      id: "lock-name",
      test: (q) =>
        /\b(sperrbildschirm mit namen|lock mit namen|sperre mit meinem namen|wie sieht meine sperre)\b/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓</p>")
    },
    {
      id: "surprise",
      test: (q) =>
        /\b(ueberrasch mich|ueberraschung|kitzel|surprise|was kannst du neues)\b/.test(q) &&
        !/\b(theme|timer|memory|erinnerung)\b/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓</p>")
    },
    {
      id: "quick-launch",
      test: (q) => /\b(schnell start|quick launch|bring mich zu|spring zu)\s+(.+)/.test(q),
      handle: (q, raw, h) => liveSilent(raw, h, "<p>✓</p>")
    },
    /* —— Neu in app.js (nicht Live-Datei) —— */
    {
      id: "focus-desk",
      test: (q) =>
        /\b(raeum auf|raeume auf|aufraeumen|bildschirm aufraeumen|nur home|zen modus|ruhe modus|focus desk|clean screen)\b/.test(q),
      handle: () => act("✓ Home", (h) => () => h.focusDesk?.(), "zen")
    },
    {
      id: "status-note",
      test: (q) =>
        /\b(status als notiz|speicher status|system status notiz|tagesstatus notiz|status snapshot)\b/.test(q),
      handle: () =>
        act("✓ Notiz", (h) => () => {
          h.saveStatusNote?.();
          void h.openApp?.("notes");
        }, "status-note")
    },
    {
      id: "find-app-beam",
      test: (q) =>
        /\b(finde app|such app|wo ist die app|wo finde ich die app)\b/.test(q) ||
        (isQ(q) && /\bwo ist\b/.test(q) && /\bapp\b/.test(q)),
      handle: (q, raw, h) => {
        const m = String(raw || "").match(/\b(?:finde|such|wo ist)(?:\s+die)?\s+(?:app\s+)?(.+)/i);
        const tail = m ? norm(m[1]) : q.replace(/.*\b(wo ist|finde|such)\s+(die\s+)?(app\s+)?/i, "").trim();
        const hit = global.NocoAI?.resolveAppFromQuery?.(tail, 46);
        const query = hit?.appId || tail || "app";
        if (isQ(q) && !/\b(oeffne|starte|zeig)\b/.test(q)) {
          const title = hit ? h.getAppTitle?.(hit.appId) || hit.appId : tail;
          return say(
            `<p><strong>${esc(title || "App")}</strong> findest du per <strong>Beam-Suche</strong>. Ich oeffne die Suche — tippe oder waehle.</p>`,
            "beam-find"
          );
        }
        return act("✓ Beam", (helpers) => () => helpers.findInBeam?.(query), "beam-find");
      }
    },
    {
      id: "coach-dismiss",
      test: (q) => /\b(coach weg|hinweis weg|tip weg|overlay weg|erste hilfe aus)\b/.test(q),
      handle: () => act("✓", (h) => () => h.dismissCoach?.(), "coach")
    },
    {
      id: "compact-tiles",
      test: (q) =>
        isQ(q) &&
        /\b(kleinere kacheln|kompakte kacheln|weniger platz apps|apps kleiner)\b/.test(q),
      handle: () =>
        say(
          "<p><strong>Kompakte Kacheln</strong> in <strong>Core</strong> → Layout. Oder sag <strong>«Kompakte Kacheln an»</strong>.</p>",
          "compact-info"
        )
    },
    {
      id: "compact-on",
      test: (q) => /\b(kompakte kacheln an|kleine kacheln an|compact tiles an)\b/.test(q),
      handle: () =>
        act("✓", (h) => () => h.setSettingToggle?.("compactTiles", true), "compact")
    },
    {
      id: "discover-help",
      test: (q) =>
        isQ(q) &&
        /\b(was kann ich neues|neue funktionen|was ist neu|welche tricks)\b/.test(q),
      handle: () =>
        say(
          `<p><strong>Neue Dinge per Frage</strong> (ohne lange Befehle):</p>
          <ul>
            <li><strong>«Mach ein Foto»</strong> — GlowCam</li>
            <li><strong>«Zurueck zur letzten App»</strong></li>
            <li><strong>«Meeting vorbereiten Team»</strong> — Notiz + Ablauf</li>
            <li><strong>«System Tour»</strong></li>
            <li><strong>«Inbox als Notiz»</strong></li>
            <li><strong>«Kann KI auf dem Home?»</strong> — Widget</li>
            <li><strong>«Ueberrasch mich»</strong></li>
            <li><strong>«Raeum den Bildschirm auf»</strong> — nur Home</li>
            <li><strong>«Speicher Status als Notiz»</strong></li>
            <li><strong>«Wo ist die Kamera App?»</strong> — Beam-Suche</li>
          </ul>`,
          "discover"
        )
    }
  ];

  function process(text, raw, helpers) {
    const q = norm(text);
    const r = String(raw || "").trim();
    if (!q || q.length < 2) return null;

    for (const rule of RULES) {
      try {
        if (!rule.test(q, r)) continue;
        const out = rule.handle(q, r, helpers);
        if (out?.text || out?.type === "action") return out;
      } catch (_) {}
    }
    return null;
  }

  function matches(q) {
    const n = norm(q);
    return RULES.some((rule) => {
      try {
        return rule.test(n, n);
      } catch (_) {
        return false;
      }
    });
  }

  global.NocoAIEveryday = { process, matches, RULES };
})(typeof window !== "undefined" ? window : globalThis);
