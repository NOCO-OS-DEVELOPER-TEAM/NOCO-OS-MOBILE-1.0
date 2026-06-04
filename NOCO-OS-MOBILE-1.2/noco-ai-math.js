/**
 * NOCO AI — Rechner im Chat (Worte, Symbole, Ketten)
 * z. B. "3 plus 3", "3*4+5", "3 mal 4 plus 5"
 */
(function initNocoAIMath(global) {
  const OP_WORDS = [
    [/plus/g, "+"],
    [/\bund\b/g, "+"],
    [/minus/g, "-"],
    [/weniger/g, "-"],
    [/mal/g, "*"],
    [/times/g, "*"],
    [/geteilt durch/g, "/"],
    [/geteilt/g, "/"],
    [/dividiert durch/g, "/"],
    [/dividiert/g, "/"],
    [/durch/g, "/"]
  ];

  function looksLikeMath(raw) {
    const s = String(raw || "").trim();
    if (!/\d/.test(s)) return false;
    if (/[\+\-\*\/×÷x]/.test(s)) return true;
    if (/\b(plus|minus|mal|times|geteilt|durch|dividiert|rechne|berechne|was ist|wie viel|prozent von|%\s*von)\b/i.test(s)) return true;
    if (/\d\s+und\s+\d/i.test(s)) return true;
    return false;
  }

  function normalizeExpression(raw) {
    let s = String(raw || "").toLowerCase().trim();
    s = s.replace(/^(was ist|wie viel ist|wie viel|rechne|berechne|calculate|how much is|ergibt)\s*/i, "");
    const pct = s.match(/(\d+(?:[.,]\d+)?)\s*(?:%|prozent)\s*(?:von|of)\s*(\d+(?:[.,]\d+)?)/);
    if (pct) {
      const a = parseFloat(pct[1].replace(",", "."));
      const b = parseFloat(pct[2].replace(",", "."));
      if (Number.isFinite(a) && Number.isFinite(b)) {
        return `${(b * a) / 100}`;
      }
    }
    s = s.replace(/[?,!]+$/g, "");
    s = s.replace(/,/g, ".");
    OP_WORDS.forEach(([re, sym]) => {
      s = s.replace(re, ` ${sym} `);
    });
    s = s.replace(/[×·]/g, "*").replace(/÷/g, "/");
    s = s.replace(/(\d)\s*(\+|\-|\*|\/)\s*(\d)/g, "$1 $2 $3");
    const chunk = s.match(/[\d\.\+\-\*\/\(\)\s]+/);
    if (!chunk) return null;
    s = chunk[0].replace(/\s+/g, " ").trim();
    if (!/\d/.test(s)) return null;
    if (!/[\+\-\*\/]/.test(s)) return null;
    return s;
  }

  function tokenize(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const c = expr[i];
      if (c === " ") {
        i++;
        continue;
      }
      if ("+-*/()".includes(c)) {
        tokens.push(c);
        i++;
        continue;
      }
      if (/[\d.]/.test(c)) {
        let num = "";
        while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
        const val = parseFloat(num);
        if (!Number.isFinite(val)) return null;
        tokens.push(val);
        continue;
      }
      return null;
    }
    return tokens;
  }

  function toRpn(tokens) {
    const output = [];
    const ops = [];
    const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
    const rightAssoc = { "+": false, "-": false, "*": false, "/": false };

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (typeof t === "number") {
        output.push(t);
        continue;
      }
      if (t === "(") {
        ops.push(t);
        continue;
      }
      if (t === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop());
        if (!ops.length) return null;
        ops.pop();
        continue;
      }
      if ("+-*/".includes(t)) {
        if (t === "-" && (i === 0 || (typeof tokens[i - 1] !== "number" && tokens[i - 1] !== ")"))) {
          output.push(0);
        }
        while (
          ops.length &&
          ops[ops.length - 1] !== "(" &&
          (prec[ops[ops.length - 1]] > prec[t] ||
            (prec[ops[ops.length - 1]] === prec[t] && !rightAssoc[t]))
        ) {
          output.push(ops.pop());
        }
        ops.push(t);
        continue;
      }
      return null;
    }
    while (ops.length) {
      const op = ops.pop();
      if (op === "(" || op === ")") return null;
      output.push(op);
    }
    return output;
  }

  function evalRpn(rpn) {
    const stack = [];
    for (const t of rpn) {
      if (typeof t === "number") {
        stack.push(t);
        continue;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return NaN;
      if (t === "+") stack.push(a + b);
      else if (t === "-") stack.push(a - b);
      else if (t === "*") stack.push(a * b);
      else if (t === "/") stack.push(b === 0 ? NaN : a / b);
    }
    return stack.length === 1 ? stack[0] : NaN;
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n * 1e10) / 1e10;
    if (Number.isInteger(rounded)) return String(rounded);
    return String(rounded)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
  }

  function humanExpr(expr) {
    return expr
      .replace(/\*/g, " × ")
      .replace(/\//g, " ÷ ")
      .replace(/\+/g, " + ")
      .replace(/\-/g, " − ");
  }

  function evaluate(raw) {
    if (!looksLikeMath(raw)) return null;
    const expr = normalizeExpression(raw);
    if (!expr) return null;
    const tokens = tokenize(expr);
    if (!tokens || !tokens.length) return null;
    const rpn = toRpn(tokens);
    if (!rpn) return null;
    const result = evalRpn(rpn);
    if (!Number.isFinite(result)) {
      if (expr.includes("/")) {
        return {
          text: "<p><strong>Division durch null</strong> — das geht nicht.</p>",
          topic: "math"
        };
      }
      return null;
    }
    const nice = formatNumber(result);
    if (nice === null) return null;
    const display = humanExpr(expr);
    return {
      text: `<p><strong>Rechnung:</strong> ${display}</p><p><strong>Ergebnis = ${nice}</strong></p><p><small>Tipp: «Oeffne Rechner» fuer die volle Taschenrechner-App.</small></p>`,
      topic: "math",
      result: Number(nice)
    };
  }

  global.NocoAIMath = { evaluate, looksLikeMath, normalizeExpression };
})(window);
