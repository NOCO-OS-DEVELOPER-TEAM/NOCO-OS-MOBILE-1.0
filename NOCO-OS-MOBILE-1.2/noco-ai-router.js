/**
 * NOCO AI Router 5.0 — Intent, beste Antwort waehlen, Cache, schnellere Reaktion
 */
(function initNocoAIRouter(global) {
  const CACHE_MAX = 48;
  const cache = new Map();
  const cacheOrder = [];

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

  function hasOpenVerb(q) {
    return /\b(oeffne|offne|open|starte|installier|deinstallier|erinnere|merke|setze|wechsel|gehe zu)\b/.test(q);
  }

  function analyze(text, raw) {
    const q = norm(text);
    const r = String(raw || "").trim();
    const isQuestion =
      r.endsWith("?") ||
      /^(was|wie|wo|wann|warum|wieso|welche|welcher|wer|kann ich|kannst du|gibt es|brauche ich|soll ich|bedeutet|unterschied|erklaer|erklaere|funktioniert|unterschied zwischen)\b/.test(q) ||
      /\b(was ist|wie funktioniert|wie nutze ich|wo finde ich|brauche ich)\b/.test(q);
    const isCommand =
      hasOpenVerb(q) ||
      /\b(fokus modus|arbeitsmodus|theme |system status|was steht an|erledige|ping |hilfe)\b/.test(q) ||
      q.length < 36 && /\b(timer|notizen|forge|beam|hub|inbox)\b/.test(q) && !isQuestion;
    const isChat = /^(hallo|hi|hey|danke|moin|wie geht)/.test(q) && !isCommand;
    const isMath = /^[\d\s+\-*/.,]+(plus|mal|minus|geteilt|\*|\+|\-|\/|durch)[\d\s+\-*/.,]+$/i.test(r.replace(/\s+/g, " "));
    const isMeta =
      global.NocoAIMeta?.matches?.(q) ||
      global.NocoAIEveryday?.matches?.(q) ||
      /^(was kann ich|was soll ich|was kannst du|wer bin ich|wer bist du|was bist du|was magst|what can i|what should i|what can you|who am i|who are you)\b/.test(q);

    let intent = "general";
    if (isMath) intent = "math";
    else if (isMeta) intent = "meta";
    else if (isCommand && !isQuestion) intent = "command";
    else if (isQuestion) intent = "question";
    else if (isChat) intent = "chat";
    else if (/\b(faq|fragen katalog)\b/.test(q)) intent = "faq";

    return { q, raw: r, intent, isQuestion, isCommand, isChat, isMath };
  }

  function scoreResult(result, analyzed) {
    if (!result?.text) return 0;
    const t = norm(result.text.replace(/<[^>]+>/g, " "));
    let score = result.type === "action" ? 6 : 4;
    if (result._routerScore != null) score += result._routerScore;
    if (analyzed.isQuestion && t.length > 40) score += 2;
    if (analyzed.isQuestion && /\b(oeffne|schreib hilfe|frag mich hilfe)\b/.test(t) && score < 8) score -= 2;
    if (result.type === "action" && analyzed.isQuestion && !hasOpenVerb(analyzed.q)) score -= 3;
    return score;
  }

  function tryModule(name, fn) {
    try {
      const res = fn();
      if (res?.text || res?.type === "action") {
        res._routerSource = name;
        return res;
      }
    } catch (_) {}
    return null;
  }

  function tryMath(raw) {
    const r = String(raw || "").trim();
    const m = r.match(
      /^(\d+(?:[.,]\d+)?)\s*(plus|\+|mal|\*|x|minus|\-|geteilt|durch|\/)\s*(\d+(?:[.,]\d+)?)$/i
    );
    if (!m) return null;
    const a = Number(String(m[1]).replace(",", "."));
    const b = Number(String(m[3]).replace(",", "."));
    const op = m[2].toLowerCase();
    let v;
    if (op === "plus" || op === "+") v = a + b;
    else if (op === "mal" || op === "*" || op === "x") v = a * b;
    else if (op === "minus" || op === "-") v = a - b;
    else v = b !== 0 ? a / b : NaN;
    if (!Number.isFinite(v)) return null;
    return {
      type: "text",
      text: `<p><strong>${esc(m[1])} ${esc(m[2])} ${esc(m[3])} = ${v}</strong></p>`,
      rememberTopic: "math",
      _routerScore: 8
    };
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function resolveQuestion(text, raw, helpers, ctx) {
    const analyzed = analyze(text, raw);
    const candidates = [];

    const math = tryMath(raw);
    if (math) candidates.push(math);

    const everyday = tryModule("everyday", () => global.NocoAIEveryday?.process?.(text, raw, helpers));
    if (everyday) {
      everyday._routerScore = everyday.silent ? 9 : 7;
      candidates.push(everyday);
    }

    const knowledge = tryModule("knowledge", () => global.NocoAIKnowledge?.process?.(text, helpers));
    if (knowledge) {
      knowledge._routerScore = global.NocoAIKnowledge?.scoreQuery?.(text) || 5;
      candidates.push(knowledge);
    }

    const answers = tryModule("answers", () => global.NocoAIAnswers?.process?.(text, helpers));
    if (answers) {
      answers._routerScore = 6;
      candidates.push(answers);
    }

    const systemLive = tryModule("system", () => {
      const cmd = global.NocoAISystem?.processCommand?.(text, helpers);
      if (cmd && analyzed.isQuestion) return cmd;
      return null;
    });
    if (systemLive) {
      systemLive._routerScore = 7;
      candidates.push(systemLive);
    }

    const map = tryModule("systemmap", () => global.NocoAISystemMap?.process?.(text, helpers, ctx || {}));
    if (map) {
      map._routerScore = 4;
      candidates.push(map);
    }

    const brain = tryModule("brain", () => global.NocoAIBrain?.process?.(text, helpers, ctx || {}));
    if (brain) {
      brain._routerScore = 3;
      candidates.push(brain);
    }

    const diag = tryModule("diagnostics", () => global.NocoAIDiagnostics?.process?.(text, helpers));
    if (diag) candidates.push(diag);

    const chatCmd = tryModule("chatcmd", () => global.NocoAIChatCmd?.process?.(text, helpers));
    if (chatCmd) candidates.push(chatCmd);

    if (!candidates.length) return null;

    let best = candidates[0];
    let bestScore = scoreResult(best, analyzed);
    for (let i = 1; i < candidates.length; i++) {
      const s = scoreResult(candidates[i], analyzed);
      if (s > bestScore) {
        bestScore = s;
        best = candidates[i];
      }
    }
    if (bestScore < 3) return null;

    if (candidates.length >= 2 && bestScore < 6) {
      const ranked = candidates
        .map((c) => ({ c, s: scoreResult(c, analyzed) }))
        .sort((a, b) => b.s - a.s);
      const gap = ranked[0].s - ranked[1].s;
      if (gap <= 1 && ranked[0].c.rememberTopic && ranked[1].c.rememberTopic) {
        const a = esc(ranked[0].c.rememberTopic);
        const b = esc(ranked[1].c.rememberTopic);
        return {
          type: "text",
          text: `<p>Meinst du <strong>${a}</strong> oder <strong>${b}</strong>? Formuliere es etwas genauer — oder sag <strong>Ja</strong>, wenn du die erste Variante meinst.</p>`,
          rememberTopic: "clarify",
          _routerScore: 4
        };
      }
    }

    return best;
  }

  function getCached(text) {
    const key = norm(text);
    if (!key) return null;
    const hit = cache.get(key);
    if (!hit) return null;
    return { ...hit, fromCache: true };
  }

  function setCached(text, result) {
    const key = norm(text);
    if (!key || !result?.text) return;
    const copy = {
      type: result.type,
      text: result.text,
      rememberTopic: result.rememberTopic,
      offerRun: result.offerRun,
      offerLabel: result.offerLabel
    };
    if (cache.has(key)) cache.delete(key);
    cache.set(key, copy);
    cacheOrder.push(key);
    while (cacheOrder.length > CACHE_MAX) {
      const old = cacheOrder.shift();
      if (old) cache.delete(old);
    }
  }

  function getTypingMs(result, options = {}) {
    if (result?.fromCache) return options.widget ? 40 : 90;
    if (result?.type === "action") return options.widget ? 70 : 120;
    const len = String(result?.text || "").replace(/<[^>]+>/g, "").length;
    if (len < 60) return options.widget ? 120 : 160;
    if (len < 180) return options.widget ? 160 : 210;
    if (len < 400) return options.widget ? 200 : 260;
    return options.widget ? 220 : 300;
  }

  function shouldSkipChatLane(analyzed) {
    return (
      analyzed.isQuestion ||
      analyzed.intent === "command" ||
      analyzed.intent === "math" ||
      analyzed.intent === "faq" ||
      analyzed.intent === "meta"
    );
  }

  function shouldSkipHeavyTail(analyzed, context) {
    if (context?.widget || context?.fast) return true;
    return (
      analyzed.intent === "question" ||
      analyzed.intent === "command" ||
      analyzed.intent === "math" ||
      analyzed.intent === "meta"
    );
  }

  global.NocoAIRouter = {
    analyze,
    resolveQuestion,
    getCached,
    setCached,
    getTypingMs,
    shouldSkipChatLane,
    shouldSkipHeavyTail,
    tryMath,
    scoreResult
  };
})(typeof window !== "undefined" ? window : globalThis);
