(function initDanmakuCopilot() {
  const { MESSAGE_TYPES } = globalThis.DanmakuCopilotConstants;
  const {
    findDanmakuInputs,
    isInputEmpty,
    getInputValue,
    setInputValue,
    clearInputValue,
    isEditableTarget
  } = globalThis.DanmakuCopilotDom;
  const { formatSeconds } = globalThis.DanmakuCopilotTime;

  let lastGenerateTime = 0;
  let lastFocusedInput = null;
  let lastInjectedText = "";
  let lastPreparedEpisodeKey = "";
  let activeEpisodeKey = "";
  let activePreparePromise = null;
  let activePrepareContext = null;
  const failedPrepareAtByKey = new Map();
  let activeRequestId = 0;
  let observer = null;
  let prepareTimer = null;
  let toastTimer = null;

  console.info("[Danmaku Copilot] loaded");

  init();

  function init() {
    bindExistingInputs();
    observePageChanges();
    bindHotkeys();
    bindNavigationWatchers();
    schedulePoolPrepare("init");
  }

  function observePageChanges() {
    if (!document.body) return;
    observer = new MutationObserver(() => {
      bindExistingInputs();
      schedulePoolPrepare("mutation");
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function bindExistingInputs() {
    findDanmakuInputs().forEach((input) => {
      if (input.dataset.danmakuCopilotBound === "1") return;

      input.dataset.danmakuCopilotBound = "1";
      input.addEventListener("focus", () => handleInputFocus(input, "focus"));
      input.addEventListener("click", () => handleInputFocus(input, "click"));
    });
  }

  async function handleInputFocus(input, trigger) {
    lastFocusedInput = input;
    console.info("[Danmaku Copilot] danmaku input focused");

    const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" });
    if (!settings?.enabled || !settings.autoGenerateOnFocus) return;
    if (!isInputEmpty(input)) return;
    if (Date.now() - lastGenerateTime < settings.cooldownMs) return;

    await requestAndApplyDanmaku({ input, style: settings.style, trigger, force: false });
  }

  async function requestAndApplyDanmaku({ input, style, trigger, force }) {
    if (!input || !isEditableTarget(input)) return;

    const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" });
    if (!settings?.enabled) return;

    if (!force && !isInputEmpty(input)) return;
    if (!force && Date.now() - lastGenerateTime < settings.cooldownMs) return;

    const requestId = ++activeRequestId;
    lastGenerateTime = Date.now();
    showToast("AI 弹幕生成中...");

    const context = collectPageContext(style || settings.style, trigger);
    await waitForEpisodePoolIfNeeded(context, settings);
    console.info("[Danmaku Copilot] context", context);

    const result = await sendMessage({
      type: MESSAGE_TYPES.generateDanmaku || "GENERATE_DANMAKU",
      payload: context
    });

    if (requestId !== activeRequestId) return;

    if (!result?.text) {
      showToast("弹幕生成失败");
      return;
    }

    if (settings.autoFill) {
      if (force || isInputEmpty(input) || getInputValue(input) === lastInjectedText) {
        setInputValue(input, result.text);
        lastInjectedText = result.text;
        showToast(getResultToast(result));
      }
    } else {
      showCandidatePanel(input, result.text);
    }
  }

  function collectPageContext(style, trigger) {
    const videoTime = getCurrentVideoTime();

    return {
      title: getVideoTitle(),
      url: location.href,
      currentTime: videoTime?.formatted || "",
      currentTimeSeconds: videoTime?.seconds || 0,
      videoSrc: getCurrentVideoSource(),
      pageContext: getVisiblePageText(),
      style,
      source: "v.qq.com",
      trigger
    };
  }

  function bindNavigationWatchers() {
    ["pushState", "replaceState"].forEach((methodName) => {
      const original = history[methodName];
      history[methodName] = function patchedHistoryMethod(...args) {
        const value = original.apply(this, args);
        schedulePoolPrepare(methodName);
        return value;
      };
    });

    window.addEventListener("popstate", () => schedulePoolPrepare("popstate"));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) schedulePoolPrepare("visible");
    });
    setInterval(() => schedulePoolPrepare("interval"), 5000);
  }

  function schedulePoolPrepare(trigger, knownContext) {
    clearTimeout(prepareTimer);
    prepareTimer = setTimeout(() => prepareDanmakuPool(trigger, knownContext), 900);
  }

  async function prepareDanmakuPool(trigger, knownContext) {
    const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" });
    if (!settings?.enabled) return;

    const context = knownContext || collectPageContext(settings.style, `pool-${trigger}`);
    const episodeKey = getEpisodeKey(context);
    if (!episodeKey) return;
    if (episodeKey !== activeEpisodeKey) {
      activeEpisodeKey = episodeKey;
      lastPreparedEpisodeKey = "";
      failedPrepareAtByKey.delete(episodeKey);
      activePrepareContext = context;
      if (settings.forceNewPoolPerEpisode) {
        await sendMessage({
          type: MESSAGE_TYPES.resetDanmakuPool || "RESET_DANMAKU_POOL",
          payload: context
        });
      }
      showToast("新一集弹幕池生成中...");
    }

    if (episodeKey === lastPreparedEpisodeKey) return;
    if (isInPrepareFailureCooldown(episodeKey)) return;

    activePrepareContext = context;
    activePreparePromise = sendMessage({
      type: MESSAGE_TYPES.prepareDanmakuPool || "PREPARE_DANMAKU_POOL",
      payload: {
        ...context,
        forceNewPool: settings.forceNewPoolPerEpisode
      }
    }).finally(() => {
      activePreparePromise = null;
    });

    const result = await activePreparePromise;

    if (result?.ok && !result.reused) {
      lastPreparedEpisodeKey = episodeKey;
      failedPrepareAtByKey.delete(episodeKey);
      console.info("[Danmaku Copilot] danmaku pool prepared", result);
      return;
    }

    if (result?.ok && result.reused) {
      lastPreparedEpisodeKey = episodeKey;
      failedPrepareAtByKey.delete(episodeKey);
      return;
    }

    failedPrepareAtByKey.set(episodeKey, Date.now());
    console.info("[Danmaku Copilot] danmaku pool not prepared", result);
  }

  async function waitForEpisodePoolIfNeeded(context, settings) {
    const episodeKey = getEpisodeKey(context);

    if (episodeKey && episodeKey !== activeEpisodeKey) {
      await prepareDanmakuPool("focus-new-episode", context);
    }

    const currentKey = getEpisodeKey(activePrepareContext || {});
    if (!activePreparePromise || currentKey !== episodeKey || settings.poolWaitMs <= 0) return;

    showToast("等弹幕池生成一下...");
    await Promise.race([
      activePreparePromise,
      delay(settings.poolWaitMs)
    ]);
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getEpisodeKey(context) {
    const url = normalizeEpisodeUrl(context.url);
    const title = String(context.title || "").trim();
    const videoSrc = String(context.videoSrc || "").split("#")[0];
    if (!url && !title && !videoSrc) return "";
    return `${context.style || "natural"}::${title}::${url}::${videoSrc}`;
  }

  function normalizeEpisodeUrl(rawUrl) {
    let parsedUrl;

    try {
      parsedUrl = new URL(rawUrl || location.href);
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

  function isInPrepareFailureCooldown(episodeKey) {
    const failedAt = failedPrepareAtByKey.get(episodeKey);
    if (!failedAt) return false;

    if (Date.now() - failedAt > 60000) {
      failedPrepareAtByKey.delete(episodeKey);
      return false;
    }

    return true;
  }

  function getVideoTitle() {
    const candidates = [
      document.querySelector("h1")?.innerText,
      document.querySelector("[class*='title']")?.innerText,
      document.title
    ];

    return candidates.find((text) => text && text.trim())?.trim().slice(0, 80) || "";
  }

  function getCurrentVideoTime() {
    const video = document.querySelector("video");
    if (!video) return null;

    const seconds = Math.floor(video.currentTime || 0);
    return {
      seconds,
      formatted: formatSeconds(seconds)
    };
  }

  function getCurrentVideoSource() {
    const video = document.querySelector("video");
    return video?.currentSrc || video?.src || "";
  }

  function getVisiblePageText() {
    const text = (document.body?.innerText || "")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 500);
  }

  function bindHotkeys() {
    document.addEventListener("keydown", async (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!lastFocusedInput || document.activeElement !== lastFocusedInput) return;

      const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" });
      if (!settings?.enableHotkeys) return;

      const key = event.key.toLowerCase();
      const styleByKey = {
        t: "roast",
        e: "emotion",
        d: "detail",
        a: "praise"
      };

      if (key === "r") {
        event.preventDefault();
        await requestAndApplyDanmaku({
          input: lastFocusedInput,
          style: settings.style,
          trigger: "hotkey-regenerate",
          force: true
        });
      }

      if (key === "c") {
        event.preventDefault();
        if (getInputValue(lastFocusedInput) === lastInjectedText) {
          clearInputValue(lastFocusedInput);
          lastInjectedText = "";
          showToast("已清空弹幕草稿");
        }
      }

      if (styleByKey[key]) {
        event.preventDefault();
        await requestAndApplyDanmaku({
          input: lastFocusedInput,
          style: styleByKey[key],
          trigger: `hotkey-${styleByKey[key]}`,
          force: true
        });
      }
    }, true);
  }

  function showToast(message) {
    sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" }).then((settings) => {
      if (settings && settings.showToast === false) return;

      let toast = document.querySelector(".danmaku-copilot-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "danmaku-copilot-toast";
        document.documentElement.appendChild(toast);
      }

      toast.textContent = message;
      toast.classList.add("is-visible");

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 2200);
    });
  }

  function showCandidatePanel(input, text) {
    let panel = document.querySelector(".danmaku-copilot-candidate");
    if (!panel) {
      panel = document.createElement("button");
      panel.type = "button";
      panel.className = "danmaku-copilot-candidate";
      document.documentElement.appendChild(panel);
    }

    const rect = input.getBoundingClientRect();
    panel.textContent = text;
    panel.style.left = `${Math.max(12, rect.left)}px`;
    panel.style.top = `${Math.max(12, rect.top - 42)}px`;
    panel.onclick = () => {
      setInputValue(input, text);
      lastInjectedText = text;
      panel.remove();
      showToast("已填入弹幕，按 Enter 发送");
    };
  }

  function getResultToast(result) {
    if (result.source !== "fallback" || !result.error) {
      return "已填入弹幕，按 Enter 发送";
    }

    if (result.error === "Missing API key") {
      return "未设置 API Key，已使用本地弹幕";
    }

    if (/model|404|not found|does not exist/i.test(result.error)) {
      return "模型不可用，已使用本地弹幕";
    }

    if (/401|403|quota|billing|insufficient|invalid api key/i.test(result.error)) {
      return "API Key 或额度异常，已使用本地弹幕";
    }

    return "接口失败，已使用本地弹幕";
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("[Danmaku Copilot]", chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response);
      });
    });
  }
})();
