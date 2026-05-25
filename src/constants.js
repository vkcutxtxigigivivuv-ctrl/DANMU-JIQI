(function attachDanmakuConstants(global) {
  const DANMAKU_STYLES = {
    natural: "自然观众型",
    roast: "吐槽型",
    emotion: "情绪型",
    detail: "细节型",
    atmosphere: "氛围型",
    praise: "夸赞型"
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    autoGenerateOnFocus: true,
    autoFill: true,
    apiProvider: "openai",
    apiKey: "",
    apiBaseUrl: "https://api.openai.com/v1",
    model: "gpt-5.5-mini",
    style: "natural",
    cooldownMs: 10000,
    maxChars: 18,
    avoidSpoiler: true,
    avoidAdTone: true,
    enableHotkeys: true,
    showToast: true
  };

  const MESSAGE_TYPES = {
    getSettings: "GET_SETTINGS",
    saveSettings: "SAVE_SETTINGS",
    generateDanmaku: "GENERATE_DANMAKU",
    getLastResult: "GET_LAST_RESULT"
  };

  global.DanmakuCopilotConstants = {
    DANMAKU_STYLES,
    DEFAULT_SETTINGS,
    MESSAGE_TYPES
  };
})(globalThis);
