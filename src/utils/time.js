(function attachDanmakuTime(global) {
  function formatSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "";

    const total = Math.floor(seconds);
    const s = String(total % 60).padStart(2, "0");
    const m = String(Math.floor(total / 60) % 60).padStart(2, "0");
    const h = Math.floor(total / 3600);

    if (h > 0) return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  }

  global.DanmakuCopilotTime = {
    formatSeconds
  };
})(globalThis);
