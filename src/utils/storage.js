(function attachDanmakuStorage(global) {
  const { AI_PROVIDERS, DEFAULT_SETTINGS } = global.DanmakuCopilotConstants;
  const LEGACY_MODEL_NAMES = new Set([
    "gpt-5.5-mini",
    "gpt-5.5",
    "gpt-4.5-mini"
  ]);

  async function getSettings() {
    const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
    return normalizeSettings(stored);
  }

  async function saveSettings(partialSettings) {
    const normalized = normalizeSettings(partialSettings);
    await chrome.storage.local.set(normalized);
    return normalized;
  }

  async function resetSettings() {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }

  function normalizeSettings(input) {
    const merged = { ...DEFAULT_SETTINGS, ...(input || {}) };
    const cooldownSeconds = Number(merged.cooldownSeconds);

    if (Number.isFinite(cooldownSeconds) && cooldownSeconds > 0) {
      merged.cooldownMs = Math.round(cooldownSeconds * 1000);
    }

    merged.cooldownMs = clampNumber(merged.cooldownMs, 1000, 120000, DEFAULT_SETTINGS.cooldownMs);
    merged.poolWaitMs = clampNumber(merged.poolWaitMs, 0, 15000, DEFAULT_SETTINGS.poolWaitMs);
    merged.maxChars = clampNumber(merged.maxChars, 8, 25, DEFAULT_SETTINGS.maxChars);
    merged.apiProvider = AI_PROVIDERS[merged.apiProvider] ? merged.apiProvider : DEFAULT_SETTINGS.apiProvider;
    merged.apiBaseUrl = String(merged.apiBaseUrl || AI_PROVIDERS[merged.apiProvider]?.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl).replace(/\/+$/, "");
    merged.model = String(merged.model || AI_PROVIDERS[merged.apiProvider]?.model || DEFAULT_SETTINGS.model).trim();
    if (LEGACY_MODEL_NAMES.has(merged.model)) {
      merged.model = DEFAULT_SETTINGS.model;
    }
    merged.style = String(merged.style || DEFAULT_SETTINGS.style);
    merged.apiKey = String(merged.apiKey || "").trim();
    merged.forceNewPoolPerEpisode = merged.forceNewPoolPerEpisode !== false;
    return merged;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  global.DanmakuCopilotStorage = {
    getSettings,
    saveSettings,
    resetSettings,
    normalizeSettings,
    getProviderDefaults: (provider) => AI_PROVIDERS[provider] || AI_PROVIDERS.openai
  };
})(globalThis);
