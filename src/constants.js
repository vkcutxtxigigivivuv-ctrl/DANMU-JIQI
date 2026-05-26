(function attachDanmakuConstants(global) {
  const DANMAKU_STYLES = {
    natural: "自然观众型",
    roast: "吐槽型",
    emotion: "情绪型",
    detail: "细节型",
    atmosphere: "氛围型",
    praise: "夸赞型"
  };

  const AI_PROVIDERS = {
    openai: {
      label: "OpenAI",
      apiBaseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      keyPlaceholder: "sk-..."
    },
    deepseek: {
      label: "DeepSeek",
      apiBaseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      keyPlaceholder: "sk-..."
    },
    qwen: {
      label: "通义千问 DashScope",
      apiBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "qwen-plus",
      keyPlaceholder: "sk-..."
    },
    zhipu: {
      label: "智谱 GLM",
      apiBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-4-flash",
      keyPlaceholder: "填写智谱 API Key"
    },
    custom: {
      label: "自定义兼容接口",
      apiBaseUrl: "",
      model: "",
      keyPlaceholder: "填写兼容接口 API Key"
    }
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    autoGenerateOnFocus: true,
    autoFill: true,
    apiProvider: "openai",
    apiKey: "",
    apiBaseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    style: "natural",
    cooldownMs: 10000,
    poolWaitMs: 4000,
    forceNewPoolPerEpisode: true,
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
    prepareDanmakuPool: "PREPARE_DANMAKU_POOL",
    resetDanmakuPool: "RESET_DANMAKU_POOL",
    testApi: "TEST_API",
    getLastResult: "GET_LAST_RESULT"
  };

  global.DanmakuCopilotConstants = {
    DANMAKU_STYLES,
    AI_PROVIDERS,
    DEFAULT_SETTINGS,
    MESSAGE_TYPES
  };
})(globalThis);
