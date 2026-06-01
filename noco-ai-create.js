/**
 * NOCO AI — «Erstellen»-Befehle (leere Beispiele, keine Suche in Bestehendem)
 */
(function initNocoAICreate(global) {
  const EXAMPLE = "Beispiel";

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

  const BLOCK_OPEN = /\b(oeffne|offne|open|zeig|such|finde|goto|geh zu|wechsel|wo finde|where)\b/;
  const BLOCK_HOW = /\b(wie\s+(kann|mache|geht)|how\s+(do|to|can))\b/;
  const CREATE =
    /\b(erstell(?:e|en|t)?|leg(?:e)?\s+an|leg\s+mir|mach(?:e)?\s+(?:mir\s+)?(?:eine|einen|ein)|neue|neuen|neues|new|create|add|anleg(?:en|e)?|schreib\s+eine|write\s+a|make\s+a|make\s+an)\b/;

  function hasCreateVerb(q) {
    return CREATE.test(q);
  }

  function isCreateIntent(raw, q) {
    const text = String(raw || "").trim();
    const n = q || norm(text);
    if (!text || text.length > 200) return false;
    if (BLOCK_OPEN.test(n) || BLOCK_HOW.test(n)) return false;
    if (global.NocoAIMath?.looksLikeMath?.(text)) return false;
    if (!hasCreateVerb(n)) {
      if (/^(neue?|new)\s+(notiz|note|aufgabe|task|chat|timer|erinnerung)\b/.test(n)) return true;
      return false;
    }
    return (
      /\b(notiz|notizen|note|notes|notepad|memo|tagebuch)\b/.test(n) ||
      /\b(aufgabe|aufgaben|task|tasks|todo|to do|checkliste)\b/.test(n) ||
      /\b(chat|gespraech|unterhaltung|conversation)\b/.test(n) ||
      /\b(timer|countdown|stoppuhr)\b/.test(n) ||
      (/\b(erinnerung|memory|reminder|wecker)\b/.test(n) && !/\bin\s+\d+\b/.test(n) && !/\b(erinnere mich)\b/.test(n))
    );
  }

  function parseNotePayload(raw, n) {
    const mTitle =
      raw.match(
        /(?:erstell|leg|mach|schreib|neue?|new|create|make).{0,30}(?:eine\s+)?notiz.{0,35}(?:mit\s+(?:dem\s+)?|)(?:titel|ueberschrift|überschrift|headline|betreff)\s+([^.,!?\n]+)/i
      ) ||
      raw.match(/notiz.{0,25}(?:titel|ueberschrift|überschrift|headline)\s+([^.,!?\n]+)/i) ||
      raw.match(/(?:erstell|leg).{0,20}notiz\s+["«]?([^"»,!?\n]+)["»]?/i);
    const mBody =
      raw.match(/(?:erstell|leg|mach).{0,30}notiz.{0,40}(?:inhalt|text|body)\s+(.+)/i) ||
      raw.match(/notiz.{0,25}(?:inhalt|text|body)\s+(.+)/i);
    if (mTitle || mBody) {
      let title = (mTitle?.[1] || EXAMPLE).trim().slice(0, 60);
      let body = (mBody?.[1] || "").trim();
      const split = title.match(/^(.+?)\s+(?:mit|inhalt|text)\s+(.+)$/i);
      if (split) {
        title = split[1].trim().slice(0, 60);
        body = body || split[2].trim();
      }
      return { title, body, example: false };
    }
    return { title: EXAMPLE, body: "", example: true };
  }

  function parseTaskPayload(raw, n) {
    const m =
      raw.match(
        /(?:erstell|leg|mach|neue?|new|create|add).{0,28}(?:eine\s+)?(?:aufgabe|task|todo).{0,20}(?:mit|namens|titel|text)?\s+([^.,!?\n]+)/i
      ) ||
      raw.match(/(?:aufgabe|task)\s+["«]?([^"»,!?\n]+)["»]?/i);
    if (m?.[1]?.trim()) {
      return { text: m[1].trim().slice(0, 120), example: false };
    }
    return { text: EXAMPLE, example: true };
  }

  function parseChatPayload(raw) {
    const m = raw.match(
      /(?:erstell|leg|mach|neue?|new|create|starte).{0,24}(?:chat|gespraech|unterhaltung).{0,20}(?:mit|namens|titel)?\s+([^.,!?\n]+)/i
    );
    if (m?.[1]?.trim()) return { name: m[1].trim().slice(0, 40), example: false };
    return { name: EXAMPLE, example: true };
  }

  function parseTimerPayload(raw) {
    const m =
      raw.match(/(?:erstell|leg|mach|starte|neue?|new).{0,20}timer.{0,16}(\d+)\s*(minuten|min|minute|stunden|std|h)?/i) ||
      raw.match(/timer.{0,14}(\d+)\s*(minuten|min)/i);
    if (m) {
      const n = Math.max(1, Math.floor(Number(m[1]) || 5));
      const u = String(m[2] || "min").toLowerCase();
      const minutes = /stund|std|hour|^h$/.test(u) ? Math.min(180, n * 60) : Math.min(180, n);
      return { minutes, example: false };
    }
    return { minutes: 5, example: true };
  }

  function parseCreateSpec(raw) {
    const n = norm(raw);
    if (!isCreateIntent(raw, n)) return null;

    if (/\b(notiz|notizen|note|notes|notepad|memo|tagebuch)\b/.test(n)) {
      return { kind: "note", ...parseNotePayload(raw, n) };
    }
    if (/\b(aufgabe|aufgaben|task|tasks|todo|to do|checkliste)\b/.test(n)) {
      return { kind: "task", ...parseTaskPayload(raw, n) };
    }
    if (/\b(chat|gespraech|unterhaltung|conversation)\b/.test(n)) {
      return { kind: "chat", ...parseChatPayload(raw) };
    }
    if (/\b(timer|countdown|stoppuhr)\b/.test(n)) {
      return { kind: "timer", ...parseTimerPayload(raw) };
    }
    if (/\b(erinnerung|memory|reminder|wecker)\b/.test(n)) {
      const m = raw.match(
        /(?:erstell|leg|mach|neue?|new).{0,24}(?:erinnerung|memory|reminder).{0,20}(?:mit|text)?\s+([^.,!?\n]+)/i
      );
      if (m?.[1]?.trim()) {
        return { kind: "memory", text: m[1].trim().slice(0, 200), minutes: 15, example: false };
      }
      return { kind: "memory-open", example: true };
    }
    return null;
  }

  function exampleHint(example) {
    return example
      ? "<p><small>Leeres <strong>Beispiel</strong> — nur zum Ausprobieren, nichts vorausgefuellt.</small></p>"
      : "";
  }

  function process(raw, helpers) {
    const spec = parseCreateSpec(raw);
    if (!spec || !helpers) return null;

    if (spec.kind === "note" && helpers.createNote) {
      const label = spec.example ? EXAMPLE : spec.title;
      return {
        type: "action",
        text: `<p>Neue leere Notiz <strong>${label}</strong> wird angelegt …</p>${exampleHint(spec.example)}`,
        run: () =>
          helpers.createNote({
            title: spec.title,
            body: spec.body,
            example: spec.example,
            openApp: true
          })
      };
    }

    if (spec.kind === "task" && helpers.createTask) {
      return {
        type: "action",
        text: `<p>Neue Aufgabe <strong>${spec.text}</strong> in Tasks …</p>${exampleHint(spec.example)}`,
        run: () => helpers.createTask({ text: spec.text, example: spec.example, openApp: true })
      };
    }

    if (spec.kind === "chat" && helpers.startNewChat) {
      return {
        type: "action",
        text: `<p>Neuer AI-Chat <strong>${spec.name}</strong> — leerer Start.</p>${exampleHint(spec.example)}`,
        run: () => helpers.startNewChat({ name: spec.name, example: spec.example })
      };
    }

    if (spec.kind === "timer" && helpers.applyTimerMinutes) {
      return {
        type: "action",
        text: `<p>Timer auf <strong>${spec.minutes} Min</strong> vorbereitet (noch nicht gestartet).</p>${exampleHint(spec.example)}`,
        run: () => {
          helpers.applyTimerMinutes(spec.minutes);
          helpers.openTimerApp?.();
        }
      };
    }

    if (spec.kind === "memory" && helpers.addReminder) {
      return {
        type: "action",
        text: `<p><strong>Memory</strong> in ${spec.minutes} Min: «${spec.text}»</p>`,
        run: () => {
          helpers.addReminder({ text: spec.text, minutes: spec.minutes });
          helpers.openMemories?.();
        }
      };
    }

    if (spec.kind === "memory-open" && helpers.openMemories) {
      return {
        type: "action",
        text: `<p>Oeffne <strong>Memory</strong> — lege dort deine Erinnerung an.</p>${exampleHint(true)}`,
        run: () => helpers.openMemories()
      };
    }

    return null;
  }

  global.NocoAICreate = {
    EXAMPLE,
    isCreateIntent,
    parseCreateSpec,
    process
  };
})(typeof window !== "undefined" ? window : globalThis);
