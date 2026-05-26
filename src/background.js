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
const { generateFallbackDanmaku, generateFallbackDanmakuPool } = globalThis.DanmakuCopilotFallback;
const { generateWithOpenAI, generatePoolWithOpenAI, testOpenAICompatibleApi } = globalThis.DanmakuCopilotOpenAI;

let lastResult = null;
const poolsByEpisode = new Map();

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

  if (message.type === MESSAGE_TYPES.getSettings || message.type === "GET_SETTINGS") {
    return getSettings();
  }

  if (message.type === MESSAGE_TYPES.saveSettings || message.type === "SAVE_SETTINGS") {
    const settings = await saveSettings(message.payload);
    poolsByEpisode.clear();
    updateActionBadge(settings);
    return settings;
  }

  if (message.type === "RESET_SETTINGS") {
    const settings = await resetSettings();
    poolsByEpisode.clear();
    updateActionBadge(settings);
    return settings;
  }

  if (message.type === MESSAGE_TYPES.getLastResult || message.type === "GET_LAST_RESULT") {
    return lastResult;
  }

  if (message.type === MESSAGE_TYPES.generateDanmaku || message.type === "GENERATE_DANMAKU") {
    const settings = await getSettings();
    const result = await generateDanmaku(message.payload || {}, settings);
    lastResult = result;
    return result;
  }

  if (message.type === MESSAGE_TYPES.prepareDanmakuPool || message.type === "PREPARE_DANMAKU_POOL") {
    const settings = await getSettings();
    return prepareDanmakuPool(message.payload || {}, settings);
  }

  if (message.type === MESSAGE_TYPES.resetDanmakuPool || message.type === "RESET_DANMAKU_POOL") {
    return resetDanmakuPool(message.payload || {});
  }

  if (message.type === MESSAGE_TYPES.testApi || message.type === "TEST_API") {
    const settings = await getSettings();
    return testApiConnection(settings);
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
  const pooled = takeFromDanmakuPool({ ...context, style }, settings);

  if (pooled) {
    maybeRefillDanmakuPool({ ...context, style }, settings);
    return {
      text: pooled.text,
      provider: pooled.provider,
      model: pooled.model,
      createdAt: Date.now(),
      source: pooled.source,
      error: null
    };
  }

  if (!settings.apiKey) {
    return {
      ...generateFallbackDanmaku(style, context),
      error: settings.apiKey ? null : "Missing API key"
    };
  }

  try {
    return await generateWithOpenAI({ ...context, style }, settings);
  } catch (error) {
    console.warn("[Danmaku Copilot] API failed, using fallback:", error.message);
    return {
      ...generateFallbackDanmaku(style, context),
      error: error.message || "AI request failed"
    };
  }
}

async function prepareDanmakuPool(context, settings) {
  const style = context.style || settings.style;
  const normalizedContext = { ...context, style };
  const key = getPoolKey(normalizedContext);
  const existing = poolsByEpisode.get(key);

  if (existing && shouldReusePool(existing, settings) && existing.items.length >= 8) {
    return {
      ok: true,
      key,
      count: existing.items.length,
      source: existing.source,
      reused: true
    };
  }

  const pool = await buildDanmakuPool(normalizedContext, settings, 18);

  if (settings.apiKey && pool.source !== "api") {
    poolsByEpisode.delete(key);
    return {
      ok: false,
      key,
      count: 0,
      source: pool.source,
      error: pool.error || "API pool unavailable",
      reused: false
    };
  }

  poolsByEpisode.set(key, {
    items: pool.items,
    source: pool.source,
    provider: settings.apiProvider,
    model: settings.model,
    error: pool.error || null,
    createdAt: Date.now()
  });
  trimOldPools();

  return {
    ok: true,
    key,
    count: pool.items.length,
    source: pool.source,
    reused: false
  };
}

async function buildDanmakuPool(context, settings, count) {
  if (settings.apiKey) {
    try {
      const apiItems = await generatePoolWithOpenAI(context, settings, count);
      if (apiItems.length >= 6) {
        return {
          items: apiItems,
          source: "api",
          error: null
        };
      }
    } catch (error) {
      console.warn("[Danmaku Copilot] API pool failed, using fallback:", error.message);
      return {
        items: [],
        source: "api-error",
        error: error.message || "AI pool request failed"
      };
    }
  }

  return {
    items: generateFallbackDanmakuPool(context.style || settings.style, context, count),
    source: "fallback",
    error: settings.apiKey ? "API pool unavailable" : "Missing API key"
  };
}

function takeFromDanmakuPool(context, settings) {
  const key = getPoolKey(context);
  const pool = poolsByEpisode.get(key);
  if (!pool || pool.items.length === 0) return null;

  if (!shouldReusePool(pool, settings)) {
    poolsByEpisode.delete(key);
    return null;
  }

  return {
    text: pool.items.shift(),
    source: pool.source === "api" ? "api-pool" : "fallback",
    provider: pool.provider || settings.apiProvider || "local",
    model: pool.model || settings.model || "fallback"
  };
}

function maybeRefillDanmakuPool(context, settings) {
  const key = getPoolKey(context);
  const pool = poolsByEpisode.get(key);
  if (!pool || pool.items.length > 5) return;

  prepareDanmakuPool(context, settings).catch((error) => {
    console.warn("[Danmaku Copilot] pool refill failed:", error.message);
  });
}

function getPoolKey(context) {
  const url = normalizeEpisodeUrl(context.url);
  const title = String(context.title || "").trim().slice(0, 80);
  const style = String(context.style || "natural");
  const videoSrc = String(context.videoSrc || "").split("#")[0];
  return `${style}::${title}::${url}::${videoSrc}`;
}

function normalizeEpisodeUrl(rawUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl || "");
  } catch (_) {
    return String(rawUrl || "").split("#")[0];
  }

  const ignoredParams = [
    "ptag",
    "from",
    "channel",
    "share",
    "utm_source",
    "utm_medium",
    "utm_campaign"
  ];
  ignoredParams.forEach((param) => parsedUrl.searchParams.delete(param));
  parsedUrl.hash = "";
  return parsedUrl.toString();
}

function shouldReusePool(pool, settings) {
  if (!settings.apiKey) return pool.source === "fallback";
  return pool.source === "api" && pool.provider === settings.apiProvider && pool.model === settings.model;
}

function trimOldPools() {
  const entries = Array.from(poolsByEpisode.entries());
  if (entries.length <= 12) return;

  entries
    .sort((a, b) => a[1].createdAt - b[1].createdAt)
    .slice(0, entries.length - 12)
    .forEach(([key]) => poolsByEpisode.delete(key));
}

function resetDanmakuPool(context) {
  const style = context.style || "natural";
  let deleted = 0;

  if (context.all) {
    deleted = poolsByEpisode.size;
    poolsByEpisode.clear();
    return { ok: true, deleted };
  }

  const key = getPoolKey({ ...context, style });
  if (poolsByEpisode.delete(key)) deleted += 1;
  return { ok: true, deleted, key };
}

async function testApiConnection(settings) {
  if (!settings.apiKey) {
    return {
      ok: false,
      error: "Missing API key",
      provider: settings.apiProvider,
      model: settings.model,
      apiBaseUrl: settings.apiBaseUrl
    };
  }

  try {
    const result = await testOpenAICompatibleApi(settings);

    return {
      ok: true,
      text: result.text,
      provider: settings.apiProvider,
      model: settings.model,
      apiBaseUrl: settings.apiBaseUrl
    };
  } catch (error) {
    lastResult = {
      text: "",
      provider: settings.apiProvider,
      model: settings.model,
      createdAt: Date.now(),
      source: "api-test",
      error: error.message || "API test failed"
    };

    return {
      ok: false,
      error: error.message || "API test failed",
      provider: settings.apiProvider,
      model: settings.model,
      apiBaseUrl: settings.apiBaseUrl
    };
  }
}
