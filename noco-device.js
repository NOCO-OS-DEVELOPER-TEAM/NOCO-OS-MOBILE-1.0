/**
 * NOCO Device — iPhone / PWA hardware bridges (torch, camera, wake lock, share).
 */
(function () {
  const state = {
    torchStream: null,
    torchTrack: null,
    cameraStream: null,
    wakeLock: null,
    nativeTorch: false
  };

  function isIOS() {
    return (
      /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  function hasMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  async function stopTorch() {
    state.nativeTorch = false;
    if (state.torchTrack) {
      try {
        await state.torchTrack.applyConstraints({ advanced: [{ torch: false }] });
      } catch (_) {}
      try {
        await state.torchTrack.applyConstraints({ torch: false });
      } catch (_) {}
    }
    state.torchTrack = null;
    if (state.torchStream) {
      state.torchStream.getTracks().forEach((t) => t.stop());
      state.torchStream = null;
    }
  }

  async function setTorch(on) {
    if (!on) {
      await stopTorch();
      return { ok: true, mode: "off" };
    }
    if (!hasMedia()) {
      return { ok: false, mode: "unsupported", reason: "no-media" };
    }
    await stopTorch();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach((t) => t.stop());
        return { ok: false, mode: "unsupported", reason: "no-track" };
      }
      let native = false;
      const caps = track.getCapabilities?.() || {};
      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: true }] });
        native = true;
      } else {
        try {
          await track.applyConstraints({ torch: true });
          native = true;
        } catch (_) {
          native = false;
        }
      }
      state.torchStream = stream;
      state.torchTrack = track;
      state.nativeTorch = native;
      return { ok: native, mode: native ? "native" : "fallback", reason: native ? "" : "ios-torch-blocked" };
    } catch (err) {
      return { ok: false, mode: "denied", reason: err?.name || "error" };
    }
  }

  function isNativeTorchOn() {
    return state.nativeTorch && !!state.torchTrack;
  }

  async function stopCamera() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((t) => t.stop());
      state.cameraStream = null;
    }
  }

  async function startCamera(videoEl) {
    if (!hasMedia()) throw new Error("Kamera nicht verfügbar");
    await stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    state.cameraStream = stream;
    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.setAttribute("playsinline", "");
      videoEl.muted = true;
      await videoEl.play();
    }
    return stream;
  }

  async function captureFromVideo(videoEl) {
    if (!videoEl || !videoEl.videoWidth) throw new Error("Kein Kamerabild");
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.88);
  }

  async function setWakeLock(on) {
    if (!on) {
      if (state.wakeLock) {
        try {
          await state.wakeLock.release();
        } catch (_) {}
        state.wakeLock = null;
      }
      return false;
    }
    if (!("wakeLock" in navigator)) return false;
    try {
      state.wakeLock = await navigator.wakeLock.request("screen");
      state.wakeLock.addEventListener?.("release", () => {
        state.wakeLock = null;
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function isWakeLockActive() {
    return !!state.wakeLock;
  }

  function openShare(data) {
    if (navigator.share) {
      return navigator.share(data);
    }
    return Promise.reject(new Error("share-unavailable"));
  }

  function buildTemplate(options = {}) {
    const settings = options.settings || {};
    const uiOn = document.body.classList.contains("flashlight-on");
    const nativeOn = isNativeTorchOn();
    const wakeOn = isWakeLockActive() || !!settings.keepScreenAwake;
    const passkey = !!settings.passkeyEnabled;
    const ios = isIOS();

    return `
    <div class="device-hub" data-device-hub>
      <p class="app-lead">${ios ? "Kamera, Taschenlampe und Display — was Safari auf dem iPhone erlaubt." : "Geräte-Funktionen hängen vom Browser ab."}</p>

      <section class="device-block">
        <h3 class="device-block-title">Taschenlampe</h3>
        <p class="device-hint">${nativeOn ? "Native LED aktiv (Kamera-Berechtigung)." : uiOn ? "NOCO-Lichtmodus aktiv." : "Versucht zuerst die echte LED — sonst heller NOCO-Rahmen."}</p>
        <div class="device-torch-row">
          <button type="button" class="primary-action" data-device-torch-toggle>${nativeOn || uiOn ? "Ausschalten" : "Einschalten"}</button>
          <span class="device-pill ${nativeOn ? "on" : ""}">${nativeOn ? "LED" : uiOn ? "NOCO" : "Aus"}</span>
        </div>
      </section>

      <section class="device-block">
        <h3 class="device-block-title">Kamera</h3>
        <div class="device-camera-wrap">
          <video class="device-camera-video hidden" data-device-camera-video playsinline muted></video>
          <div class="device-camera-placeholder" data-device-camera-placeholder>Kamera starten oder Foto wählen</div>
          <img class="device-camera-shot hidden" data-device-camera-shot alt="Aufnahme" />
        </div>
        <div class="device-camera-actions">
          <button type="button" class="settings-row" data-device-camera-start><span>Live-Kamera</span><strong>Start</strong></button>
          <button type="button" class="settings-row" data-device-camera-capture><span>Foto</span><strong>Aufnehmen</strong></button>
          <label class="settings-row device-file-pick">
            <span>Aus Bibliothek</span>
            <strong>Wählen</strong>
            <input type="file" accept="image/*" capture="environment" data-device-camera-file hidden />
          </label>
        </div>
      </section>

      <section class="device-block">
        <h3 class="device-block-title">Display &amp; Sicherheit</h3>
        <button type="button" class="settings-row" data-device-wake-toggle>
          <span>Bildschirm wach halten</span>
          <strong>${wakeOn ? "An" : "Aus"}</strong>
        </button>
        <button type="button" class="settings-row" data-app="security">
          <span>Passkey / Face ID</span>
          <strong>${passkey ? "Aktiv" : "Einrichten"}</strong>
        </button>
        <button type="button" class="settings-row" data-device-share>
          <span>NOCO teilen</span>
          <strong>Share Sheet</strong>
        </button>
      </section>
    </div>
  `;
  }

  function mount(root, hooks = {}) {
    if (!root) return;
    const video = root.querySelector("[data-device-camera-video]");
    const placeholder = root.querySelector("[data-device-camera-placeholder]");
    const shot = root.querySelector("[data-device-camera-shot]");

    root.querySelector("[data-device-camera-start]")?.addEventListener("click", async () => {
      try {
        await startCamera(video);
        video?.classList.remove("hidden");
        shot?.classList.add("hidden");
        placeholder?.classList.add("hidden");
        hooks.onToast?.("Kamera aktiv");
      } catch (_) {
        hooks.onToast?.("Kamera-Zugriff verweigert");
      }
    });

    root.querySelector("[data-device-camera-capture]")?.addEventListener("click", async () => {
      try {
        if (!state.cameraStream) await startCamera(video);
        const dataUrl = await captureFromVideo(video);
        if (shot) {
          shot.src = dataUrl;
          shot.classList.remove("hidden");
        }
        video?.classList.add("hidden");
        hooks.onToast?.("Foto gespeichert (Session)");
      } catch (_) {
        hooks.onToast?.("Aufnahme fehlgeschlagen");
      }
    });

    root.querySelector("[data-device-camera-file]")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (shot && typeof reader.result === "string") {
          shot.src = reader.result;
          shot.classList.remove("hidden");
          video?.classList.add("hidden");
          placeholder?.classList.add("hidden");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function unmount() {
    void stopCamera();
  }

  window.NocoDevice = {
    isIOS,
    hasMedia,
    setTorch,
    stopTorch,
    isNativeTorchOn,
    startCamera,
    stopCamera,
    captureFromVideo,
    setWakeLock,
    isWakeLockActive,
    openShare,
    buildTemplate,
    mount,
    unmount
  };
})();
