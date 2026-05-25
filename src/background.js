importScripts(
  "constants.js",
  "utils/storage.js",
  "utils/textClean.js",
  "utils/safetyFilter.js",
  "ai/fallbackDanmaku.js",
  "ai/promptBuilder.js",
  "ai/openaiClient.js"
);

const { MESSAGE_TYPES } = globalThis.DanmakuCopilotConstants;
const { getSettings, saveSettings, resetSettings } = globalThis.DanmakuCopilotStorage;
const { generateFallbackDanmaku } = globalThis.DanmakuCopilotFallback;
const { generateWithOpenAI } = globalThis.DanmakuCopilotOpenAI;

let lastResult = null;

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await chrome.storage.local.set(settings);
  updateActionBadge(settings);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.warn("[Danmaku Copilot] message failed:", error.message);
      sendResponse({ error: error.message || "Unknown error" });
    });

  return true;
});

async function handleMessage(message) {
  if (!message || !message.type) {
    return { error: "Missing message type" };
  }

  if (message.type === MESSAGE_TYPES.getSettings) {
    return getSettings();
  }

  if (message.type === MESSAGE_TYPES.saveSettings) {
    const settings = await saveSettings(message.payload);
    updateActionBadge(settings);
    return settings;
  }

  if (message.type === "RESET_SETTINGS") {
    const settings = await resetSettings();
    updateActionBadge(settings);
    return settings;
  }

  if (message.type === MESSAGE_TYPES.getLastResult) {
    return lastResult;
  }

  if (message.type === MESSAGE_TYPES.generateDanmaku) {
    const settings = await getSettings();
    const result = await generateDanmaku(message.payload || {}, settings);
    lastResult = result;
    return result;
  }

  return { error: "Unknown message type" };
}

function updateActionBadge(settings) {
  if (!chrome.action) return;

  chrome.action.setBadgeText({ text: settings.enabled ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({
    color: settings.enabled ? "#1f6feb" : "#667085"
  });
}

async function generateDanmaku(context, settings) {
  const style = context.style || settings.style;

  if (!settings.apiKey || settings.apiProvider !== "openai") {
    return {
      ...generateFallbackDanmaku(style),
      error: settings.apiKey ? null : "Missing API key"
    };
  }

  try {
    return await generateWithOpenAI({ ...context, style }, settings);
  } catch (error) {
    console.warn("[Danmaku Copilot] API failed, using fallback:", error.message);
    return {
      ...generateFallbackDanmaku(style),
      error: error.message || "AI request failed"
    };
  }
}
