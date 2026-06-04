/**
 * NOCO AUDIO DETECTION 1.0 — eigenes Aktivierungswort (kein Dauer-STT).
 * VAD + Energie-/Silben-Muster + Heuristik fuer Hey Noco / NOCO / AI / NOCO AI.
 */
(function initNocoAudioDetection(global) {
  const VERSION = "1.0";
  const FRAME_MS = 40;
  const MIN_SPEECH_MS = 260;
  const MAX_CAPTURE_MS = 2600;
  const COOLDOWN_MS = 1600;
  const DEFAULT_PROFILES = ["hey-noko", "hey-noco", "noco-ai", "hey-noco-ai"];

  let wakeConfig = {
    sensitivity: 1,
    enabledProfiles: DEFAULT_PROFILES.slice(),
    allowSoft: false
  };

  function getThresholds() {
    const s = Number(wakeConfig.sensitivity);
    if (s === 0) return { match: 0.54, soft: 0.99, noiseMult: 3.35, minSpeech: 340 };
    if (s === 2) return { match: 0.4, soft: 0.34, noiseMult: 2.35, minSpeech: 280 };
    return { match: 0.5, soft: 0.99, noiseMult: 2.85, minSpeech: 300 };
  }

  const WAKE_PROFILES = [
    { id: "hey-noko", label: "Hey Noko", envelope: [0.06, 0.22, 0.78, 0.52, 0.2, 0.08, 0.12, 0.38, 0.82, 0.58, 0.24, 0.1] },
    { id: "heynoko", label: "HeyNoko", envelope: [0.04, 0.14, 0.48, 0.86, 0.68, 0.38, 0.14, 0.08, 0.2, 0.72, 0.52, 0.22, 0.1] },
    { id: "hey-noco", label: "Hey NOCO", envelope: [0.05, 0.16, 0.52, 0.82, 0.58, 0.22, 0.1, 0.12, 0.4, 0.78, 0.5, 0.18] },
    { id: "heynoco", label: "HeyNoco", envelope: [0.04, 0.12, 0.42, 0.8, 0.65, 0.35, 0.12, 0.08, 0.18, 0.68, 0.48, 0.2] },
    { id: "noco-ai", label: "NOCO AI", envelope: [0.1, 0.35, 0.88, 0.62, 0.28, 0.12, 0.18, 0.42, 0.72, 0.48, 0.2] },
    { id: "hey-noco-ai", label: "Hey NOCO AI", envelope: [0.05, 0.18, 0.55, 0.42, 0.2, 0.08, 0.14, 0.45, 0.9, 0.7, 0.45, 0.2, 0.1, 0.32, 0.75, 0.5, 0.18] },
    { id: "noko-ai", label: "Noko AI", envelope: [0.08, 0.3, 0.8, 0.55, 0.22, 0.1, 0.15, 0.4, 0.78, 0.52, 0.22] },
    { id: "no-co-ai", label: "No Co AI", envelope: [0.07, 0.2, 0.45, 0.35, 0.15, 0.08, 0.12, 0.28, 0.5, 0.38, 0.16, 0.1, 0.25, 0.7, 0.48, 0.18] },
    { id: "noco", label: "NOCO", envelope: [0.1, 0.38, 0.85, 0.6, 0.25, 0.1, 0.14, 0.36, 0.7, 0.45] },
    { id: "noko", label: "Noko", envelope: [0.09, 0.32, 0.82, 0.55, 0.22, 0.1, 0.12, 0.34, 0.68, 0.42] },
    { id: "ai-only", label: "AI", envelope: [0.12, 0.55, 0.92, 0.48, 0.18, 0.08] },
    { id: "ok-noco", label: "OK NOCO", envelope: [0.08, 0.24, 0.5, 0.35, 0.14, 0.1, 0.16, 0.42, 0.8, 0.55, 0.22] }
  ];

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

  function fuzzyWakeMatch(transcript) {
    const raw = String(transcript || "").trim();
    if (!raw) return null;
    const n = norm(raw);
    const compact = n.replace(/\s+/g, "");

    const hasAi = /\b(ai|ei|ay|a i|i|assistant|assistent)\b/.test(n) || /ai|ei|ay/.test(compact);
    const hasNoco =
      /\b(noco|noko|no co|no ko|nocho|nacho)\b/.test(n) ||
      /noco|noko|nocho|nacho/.test(compact);
    const hasHey = /\b(hey|hallo|ok|yo|hi|hello|hei)\b/.test(n) || /^he/.test(compact);

    if (hasNoco || (hasHey && compact.length >= 5)) {
      const after = raw
        .replace(/\b(hey|hallo|ok|yo|hi|hello|hei)\b/gi, " ")
        .replace(/\b(noco|noko|no\s*co|no\s*ko|nocho)\s*(ai|ei|ay|a\.?\s*i\.?|i)?\b/gi, " ")
        .replace(/\b(ai|ei|ay|assistant|assistent)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { matched: true, command: after, phrase: n.slice(0, 48) };
    }

    if (compact.length >= 2 && compact.length <= 20) {
      const targets = [
        "noco",
        "noko",
        "nocoai",
        "nokoai",
        "nocoay",
        "nochoai",
        "nocoi",
        "heynoko",
        "heynoco",
        "oknoco",
        "ai",
        "ei"
      ];
      for (const t of targets) {
        if (compact === t || compact.includes(t)) {
          return { matched: true, command: "", phrase: compact };
        }
      }
      if (hasHey && (compact.includes("co") || compact.includes("ko"))) {
        return { matched: true, command: "", phrase: compact };
      }
    }

    if (/\b(no|na|nho)\b/.test(n) && /\b(co|ko|go)\b/.test(n)) {
      return { matched: true, command: "", phrase: n };
    }

    return null;
  }

  function resampleSeries(series, targetLen) {
    if (!series.length || targetLen < 2) return [];
    if (series.length === targetLen) return series.slice();
    const out = [];
    for (let i = 0; i < targetLen; i++) {
      const pos = (i / (targetLen - 1)) * (series.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(series.length - 1, lo + 1);
      const t = pos - lo;
      out.push(series[lo] * (1 - t) + series[hi] * t);
    }
    return out;
  }

  function normalizeSeries(series) {
    const max = Math.max(...series, 0.001);
    return series.map((v) => v / max);
  }

  function dtwDistance(a, b) {
    const n = a.length;
    const m = b.length;
    if (!n || !m) return 99;
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
    dp[0][0] = 0;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = Math.abs(a[i - 1] - b[j - 1]);
        dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[n][m] / (n + m);
  }

  function countPeaks(series, minGap = 2) {
    let peaks = 0;
    let lastPeak = -99;
    for (let i = 1; i < series.length - 1; i++) {
      if (series[i] > series[i - 1] && series[i] >= series[i + 1] && series[i] > 0.28) {
        if (i - lastPeak >= minGap) {
          peaks++;
          lastPeak = i;
        }
      }
    }
    return peaks;
  }

  function scoreProfile(samples, profile) {
    const env = normalizeSeries(samples.map((s) => s.energy));
    const target = profile.envelope;
    const aligned = resampleSeries(env, target.length);
    const dist = dtwDistance(aligned, target);
    return Math.max(0, 1 - dist * 1.22);
  }

  function scoreHeuristic(samples) {
    if (samples.length < 4) return 0;
    const env = normalizeSeries(samples.map((s) => s.energy));
    const peaks = countPeaks(env);
    const duration = samples.length * FRAME_MS;
    const meanBand = samples.reduce((a, s) => a + (s.band || 0), 0) / samples.length;
    const maxE = Math.max(...env);

    let score = 0;
    if (duration >= MIN_SPEECH_MS && duration <= 2000) score += 0.12;
    if (peaks >= 1 && peaks <= 7) score += 0.1 + peaks * 0.045;
    if (maxE > 0.45) score += 0.1;
    if (meanBand > 0.08 && meanBand < 0.75) score += 0.08;
    if (duration <= 900 && peaks >= 1 && peaks <= 3) score += 0.14;
    if (duration >= 500 && duration <= 1600 && peaks >= 2 && peaks <= 5) score += 0.12;
    return Math.min(0.92, score);
  }

  function activeProfiles() {
    const ids = wakeConfig.enabledProfiles;
    if (!Array.isArray(ids) || !ids.length) return WAKE_PROFILES;
    const set = new Set(ids);
    const filtered = WAKE_PROFILES.filter((p) => set.has(p.id));
    return filtered.length ? filtered : WAKE_PROFILES;
  }

  function matchCapture(samples) {
    if (samples.length < 4) return null;
    const th = getThresholds();
    let best = null;
    activeProfiles().forEach((profile) => {
      const score = scoreProfile(samples, profile);
      if (!best || score > best.score) best = { profile, score };
    });
    const heuristic = scoreHeuristic(samples);
    const top = Math.max(best?.score || 0, heuristic * 0.92);
    const pick =
      best && best.score >= heuristic * 0.92
        ? best
        : { profile: { id: "ad-heuristic", label: "NOCO AD" }, score: heuristic };

    if (top >= th.match) {
      return { profile: pick.profile, score: top, command: "" };
    }
    if (wakeConfig.allowSoft && top >= th.soft) {
      return { profile: pick.profile, score: top, command: "", soft: true };
    }
    return null;
  }

  class NocoAudioDetectionEngine {
    constructor(options = {}) {
      this.onWake = options.onWake || (() => {});
      this.onStatus = options.onStatus || (() => {});
      this.active = false;
      this.stream = null;
      this.ctx = null;
      this.analyser = null;
      this.source = null;
      this.timer = null;
      this.capturing = false;
      this.capture = [];
      this.speechMs = 0;
      this.silenceMs = 0;
      this.lastWakeAt = 0;
      this.noiseFloor = 0.01;
    }

    async ensureStream() {
      const live = this.stream?.getTracks?.().some((t) => t.readyState === "live");
      if (live) return this.stream;
      if (this.stream) {
        this.stream.getTracks?.().forEach((t) => t.stop());
        this.stream = null;
      }
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-mic");
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      return this.stream;
    }

    playChime() {
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, t);
        osc.frequency.exponentialRampToValueAtTime(1180, t + 0.1);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);
      } catch (_) {}
    }

    tick() {
      if (!this.active || !this.analyser) return;
      const buf = new Uint8Array(this.analyser.fftSize);
      this.analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      this.noiseFloor = this.noiseFloor * 0.94 + rms * 0.06;
      const th = getThresholds();
      const threshold = Math.max(0.018, this.noiseFloor * th.noiseMult);
      const speaking = rms > threshold;

      const freq = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(freq);
      let band = 0;
      const start = 6;
      const end = Math.min(freq.length, 72);
      for (let i = start; i < end; i++) band += freq[i];
      band /= end - start;

      if (speaking) {
        this.speechMs += FRAME_MS;
        this.silenceMs = 0;
        if (!this.capturing && this.speechMs > 80) {
          this.capturing = true;
          this.capture = [];
          this.onStatus("NOCO AD 1.0 hoert …", "listen");
        }
        if (this.capturing) {
          this.capture.push({ energy: rms, band: band / 255 });
          if (this.capture.length * FRAME_MS > MAX_CAPTURE_MS) this.finishCapture();
        }
      } else if (this.capturing) {
        this.silenceMs += FRAME_MS;
        this.capture.push({ energy: rms * 0.55, band: band / 255 });
        if (this.silenceMs > 220 || this.capture.length * FRAME_MS > MAX_CAPTURE_MS) this.finishCapture();
      } else {
        this.speechMs = 0;
        this.silenceMs = 0;
        if (!this.capturing) this.onStatus("NOCO AD 1.0 — Hey Noco · NOCO · AI", "idle");
      }
    }

    finishCapture() {
      const samples = this.capture.slice();
      this.capturing = false;
      this.capture = [];
      this.speechMs = 0;
      this.silenceMs = 0;
      const minMs = getThresholds().minSpeech || MIN_SPEECH_MS;
      if (samples.length * FRAME_MS < minMs) {
        this.onStatus("NOCO AD 1.0 — Hey Noco · NOCO · AI", "idle");
        return;
      }
      const now = Date.now();
      if (now - this.lastWakeAt < COOLDOWN_MS) return;

      const hit = matchCapture(samples);
      if (hit) {
        this.lastWakeAt = now;
        this.playChime();
        this.onStatus(`NOCO AD: ${hit.profile.label}`, "hit");
        this.onWake({
          phrase: hit.profile.label,
          command: hit.command || "",
          score: hit.score,
          soft: !!hit.soft
        });
      } else {
        this.onStatus("NOCO AD — weiterhoeren …", "idle");
      }
    }

    async start() {
      if (this.active) return true;
      try {
        await this.ensureStream();
        this.ctx = this.ctx || new (global.AudioContext || global.webkitAudioContext)();
        if (this.ctx.state === "suspended") await this.ctx.resume();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.48;
        this.source = this.ctx.createMediaStreamSource(this.stream);
        this.source.connect(this.analyser);
        this.active = true;
        this.onStatus("NOCO AD 1.0 — Hey Noco · NOCO · AI", "idle");
        this.timer = global.setInterval(() => this.tick(), FRAME_MS);
        return true;
      } catch (_) {
        this.active = false;
        return false;
      }
    }

    stop() {
      this.active = false;
      if (this.timer) global.clearInterval(this.timer);
      this.timer = null;
      this.capturing = false;
      this.capture = [];
      this.onStatus("", "");
    }

    release() {
      this.stop();
      try {
        this.source?.disconnect();
      } catch (_) {}
      this.source = null;
      this.stream?.getTracks?.().forEach((t) => t.stop());
      this.stream = null;
      try {
        this.ctx?.close();
      } catch (_) {}
      this.ctx = null;
    }
  }

  function setWakeConfig(cfg = {}) {
    if (cfg.sensitivity != null) wakeConfig.sensitivity = Number(cfg.sensitivity);
    if (Array.isArray(cfg.enabledProfiles) && cfg.enabledProfiles.length) {
      wakeConfig.enabledProfiles = cfg.enabledProfiles.slice();
    }
    if (cfg.allowSoft != null) wakeConfig.allowSoft = !!cfg.allowSoft;
    if (wakeConfig.sensitivity === 2) wakeConfig.allowSoft = true;
    else wakeConfig.allowSoft = false;
    try {
      localStorage.setItem("noco_ai_wake_cfg_v1", JSON.stringify(wakeConfig));
    } catch (_) {}
  }

  function loadWakeConfig() {
    try {
      const raw = localStorage.getItem("noco_ai_wake_cfg_v1");
      if (raw) setWakeConfig(JSON.parse(raw));
    } catch (_) {}
  }

  loadWakeConfig();

  const api = {
    VERSION,
    create: (opts) => new NocoAudioDetectionEngine(opts),
    fuzzyWakeMatch,
    WAKE_PROFILES,
    setWakeConfig,
    getWakeConfig: () => ({ ...wakeConfig, thresholds: getThresholds() })
  };

  global.NocoAudioDetection = api;
  global.NocoWakeEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
