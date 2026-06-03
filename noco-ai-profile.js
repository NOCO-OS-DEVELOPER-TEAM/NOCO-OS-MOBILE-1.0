/**
 * NOCO AI Profile — Nickname, persoenliche Ansprache (nur wenn gesetzt)
 */
(function initNocoAIProfile(global) {
  const KEY = "noco_mobile_ai_nickname";

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

  function sanitizeName(raw) {
    let n = String(raw || "")
      .trim()
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ");
    n = n.replace(/^(der|die|das|ein|eine|my|the)\s+/i, "").trim();
    if (n.length > 24) n = n.slice(0, 24).trim();
    if (n.length < 2) return "";
    if (!/^[a-zA-ZäöüÄÖÜß][a-zA-ZäöüÄÖÜß0-9\s\-']*$/i.test(n)) return "";
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  function getNickname() {
    try {
      return sanitizeName(localStorage.getItem(KEY) || "");
    } catch (_) {
      return "";
    }
  }

  function setNickname(name, helpers) {
    const n = sanitizeName(name);
    if (!n) return false;
    try {
      localStorage.setItem(KEY, n);
    } catch (_) {}
    if (helpers?.persistNickname) helpers.persistNickname(n);
    return true;
  }

  function clearNickname(helpers) {
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
    if (helpers?.persistNickname) helpers.persistNickname("");
    return true;
  }

  function hasNickname() {
    return !!getNickname();
  }

  function heyHtml(name) {
    return `Hey <strong>${esc(name)}</strong>`;
  }

  function parseNameFromRaw(raw) {
    const t = String(raw || "").trim();
    const patterns = [
      /(?:hey[, ]+)?my name is\s+(.+)/i,
      /(?:i am|i'm|im)\s+([a-z][a-z0-9\s\-']{1,22})$/i,
      /(?:call me|nickname is|nick name is)\s+(.+)/i,
      /(?:ich heisse|ich heiße|i heisse)\s+(.+)/i,
      /(?:mein name ist|nenn mich|nennt mich)\s+(.+)/i,
      /^ich bin\s+([a-z][a-z0-9\s\-']{1,22})$/i,
      /^name\s+(.+)/i,
      /^spitzname\s+(.+)/i
    ];
    for (const re of patterns) {
      const m = t.match(re);
      if (m?.[1]) {
        const n = sanitizeName(m[1].replace(/[.!?]+$/, "").trim());
        if (n) return n;
      }
    }
    return "";
  }

  function isSetNameIntent(q, raw) {
    if (parseNameFromRaw(raw)) return true;
    return (
      /\b(mein name|nenn mich|spitzname|nickname|call me|my name)\b/.test(q) &&
      /\b(ist|is|heißt|heisst|bin|am)\b/.test(q)
    );
  }

  function isClearNameIntent(q) {
    return (
      /\b(vergiss|loesch|delete|entfern)\s+(meinen\s+)?(namen|nickname|spitzname)\b/.test(q) ||
      q === "kein nickname" ||
      q === "name vergessen"
    );
  }

  function isWhoAmI(q) {
    return (
      /\b(wie heisse ich|wie heiße ich|wer bin ich|mein nickname|mein name)\b/.test(q) ||
      q === "wie nennst du mich" ||
      q === "kennst du mich"
    );
  }

  function isPersonalGreeting(q) {
    return (
      /^(hallo|hi|hey|moin|servus|hello|na|yo)\s*$/i.test(q) ||
      /^(hallo|hi|hey)\s+(noco|ki|ai)\s*$/i.test(q) ||
      /\b(guten morgen|guten tag|guten abend)\b/.test(q)
    );
  }

  function isHowAreYou(q) {
    return (
      /^(wie geht|wie gehts|wie geht es|was geht|alles fit|alles klar)\b/.test(q) ||
      /\b(wie geht es dir|wie gehts dir|bist du gut|gehts dir gut|how are you)\b/.test(q) ||
      q === "dir auch" ||
      q === "und dir"
    );
  }

  function isCantHelpPhrase(q) {
    return /\b(kannst du mir nicht helfen|kannst du nicht helfen|hilfst du mir nicht)\b/.test(q);
  }

  function buildGreetingReply(name) {
    const hour = new Date().getHours();
    let time = "Schoen, dass du da bist";
    if (hour >= 5 && hour < 12) time = "Guten Morgen";
    else if (hour >= 12 && hour < 18) time = "Guten Tag";
    else if (hour >= 18 && hour < 23) time = "Guten Abend";
    return pick([
      `<p>${heyHtml(name)} — ${time}! Ich kenne deinen Namen und bleibe dein Offline-Assistent im System.</p>`,
      `<p>${heyHtml(name)}! Schoen dich zu sehen. Sag <strong>Was steht an?</strong> oder nenn eine App — ich handle direkt im OS.</p>`,
      `<p>${time}, <strong>${esc(name)}</strong>! Bereit fuer Befehle, Inbox oder einen <strong>Witz</strong> — ohne Cloud.</p>`
    ]);
  }

  function buildHowAreYouReply(name, helpers) {
    const s = helpers?.getSystemSnapshot?.() || {};
    const bits = [];
    if (s.timerRunning) bits.push("dein Timer laeuft");
    if (s.openTaskCount) bits.push(`du hast ${s.openTaskCount} offene Tasks`);
    if (s.nextReminderText) bits.push("eine Memory wartet");
    const ctx = bits.length ? ` Ich sehe: ${bits.join(", ")}.` : " Alles wirkt ruhig bei dir.";
    return pick([
      `<p>${heyHtml(name)} — mir geht's bestens, danke!${ctx}</p><p>Und dir? Wenn du was brauchst: <strong>Fokus Modus</strong>, <strong>Inbox</strong> oder einfach plaudern.</p>`,
      `<p>Bei mir laeuft's glasig-smooth, <strong>${esc(name)}</strong>.${ctx}</p><p>Was machen wir — System-Aktion oder kurzer <strong>Tipp</strong>?</p>`,
      `<p>${heyHtml(name)}! Alles gut hier — offline und schnell.${ctx}</p><p>Frag mich gern etwas Konkretes statt nur «Hilfe» — ich reagiere lieber mit Aktionen.</p>`
    ]);
  }

  function buildNoNameHowAreYou() {
    return pick([
      "<p>Mir geht's gut — danke der Nachfrage! Wenn ich dich persoenlich ansprechen soll: <strong>Ich heisse Noah</strong> (dein Name).</p>",
      "<p>Alles bestens im Glas-Modus. Tipp: Sag <strong>Mein Name ist …</strong> — dann sage ich dich beim naechsten Mal beim Namen.</p>"
    ]);
  }

  function process(text, raw, helpers) {
    const q = norm(text);
    const r = String(raw || "").trim();
    if (!q) return null;

    if (isSetNameIntent(q, r) || parseNameFromRaw(r)) {
      let name = parseNameFromRaw(r);
      if (!name) {
        const m = r.match(/(?:ist|is|heißt|heisst|bin|am)\s+(.+)/i);
        name = sanitizeName(m ? m[1] : "");
      }
      if (!name) {
        return {
          type: "text",
          text: "<p>Wie soll ich dich nennen? Z. B. <strong>Ich heisse Noah</strong> oder <strong>Nenn mich Alex</strong>.</p>",
          rememberTopic: "nickname"
        };
      }
      return {
        type: "action",
        text: `<p>Alles klar, <strong>${esc(name)}</strong> — ich merke mir deinen Namen.</p><p>Ab jetzt sprich ich dich nur so an, wenn du einen Nickname gesetzt hast.</p>`,
        run: () => {
          setNickname(name, helpers);
          helpers?.showToast?.("Hallo " + name);
          helpers?.refreshAiPlaceholder?.();
        },
        rememberTopic: "nickname"
      };
    }

    if (isClearNameIntent(q)) {
      const had = hasNickname();
      return {
        type: "action",
        text: had
          ? "<p>Okay — ich habe deinen <strong>Nickname</strong> vergessen. Ab jetzt wieder neutral.</p>"
          : "<p>Es war kein Nickname gespeichert.</p>",
        run: () => {
          clearNickname(helpers);
          helpers?.refreshAiPlaceholder?.();
        },
        rememberTopic: "nickname"
      };
    }

    if (isCantHelpPhrase(q)) {
      const name = getNickname();
      if (name) {
        return {
          type: "text",
          text: `<p>${heyHtml(name)} — doch, ich helfe dir! Sag mir konkret was du willst: <strong>Oeffne Timer</strong>, <strong>Was steht an?</strong> oder <strong>Arbeitsmodus</strong>. Ich kann viel im System ausfuehren.</p>`,
          rememberTopic: "help"
        };
      }
      return {
        type: "text",
        text: "<p>Ich helfe gern — formuliere einen Befehl wie <strong>Oeffne Forge</strong> oder <strong>Was steht an?</strong>. Fuer persoenliche Anrede: <strong>Mein Name ist …</strong>.</p>",
        rememberTopic: "help"
      };
    }

    if (isHowAreYou(q)) {
      const name = getNickname();
      return {
        type: "text",
        text: name ? buildHowAreYouReply(name, helpers) : buildNoNameHowAreYou(),
        rememberTopic: "chat"
      };
    }

    if (isPersonalGreeting(q)) {
      const name = getNickname();
      if (name) {
        return { type: "text", text: buildGreetingReply(name), rememberTopic: "hello" };
      }
      return {
        type: "text",
        text: "<p>Hallo! Ich bin <strong>NOCO AI</strong>. Wenn du magst: <strong>Ich heisse …</strong> — dann kenne ich deinen Namen.</p>",
        rememberTopic: "hello"
      };
    }

    return null;
  }

  function wrapFallback(text, helpers) {
    const name = getNickname();
    if (!name || !text || typeof text !== "string") return text;
    if (text.includes(name) || text.includes("Hey <strong>")) return text;
    if (
      /\b(Hilfe|nicht sicher erkannt|Schreib «Hilfe»|frag mich «Hilfe»)\b/.test(text) &&
      !/\b(Ich heisse|Nickname)\b/.test(text)
    ) {
      return `<p>${heyHtml(name)} — ${text.replace(/^<p>/, "").replace(/<\/p>$/, "")}</p>`;
    }
    return text;
  }

  function getInputPlaceholder() {
    const name = getNickname();
    if (!name) return "SCHREIB MIR · HEY NOCO · NOCO AI";
    const short = String(name).slice(0, 12).toUpperCase();
    return `HEY ${short} · SPRICH ODER TIPPE`;
  }

  function getWakeToast() {
    const name = getNickname();
    return name ? `Hey ${name} — NOCO AD 1.0 aktiv` : "Hey Noco — tippe oder nutze Mikro fuer Diktat";
  }

  global.NocoAIProfile = {
    process,
    getNickname,
    setNickname,
    clearNickname,
    hasNickname,
    parseNameFromRaw,
    heyHtml,
    wrapFallback,
    getInputPlaceholder,
    getWakeToast,
    sanitizeName
  };
})(typeof window !== "undefined" ? window : globalThis);
