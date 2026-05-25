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
  let activeRequestId = 0;
  let observer = null;
  let toastTimer = null;

  console.info("[Danmaku Copilot] loaded");

  init();

  function init() {
    bindExistingInputs();
    observePageChanges();
    bindHotkeys();
  }

  function observePageChanges() {
    if (!document.body) return;
    observer = new MutationObserver(() => bindExistingInputs());
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

    const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings });
    if (!settings?.enabled || !settings.autoGenerateOnFocus) return;
    if (!isInputEmpty(input)) return;
    if (Date.now() - lastGenerateTime < settings.cooldownMs) return;

    await requestAndApplyDanmaku({ input, style: settings.style, trigger, force: false });
  }

  async function requestAndApplyDanmaku({ input, style, trigger, force }) {
    if (!input || !isEditableTarget(input)) return;

    const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings });
    if (!settings?.enabled) return;

    if (!force && !isInputEmpty(input)) return;
    if (!force && Date.now() - lastGenerateTime < settings.cooldownMs) return;

    const requestId = ++activeRequestId;
    lastGenerateTime = Date.now();
    showToast("AI 弹幕生成中...");

    const context = collectPageContext(style || settings.style, trigger);
    console.info("[Danmaku Copilot] context", context);

    const result = await sendMessage({
      type: MESSAGE_TYPES.generateDanmaku,
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
        showToast(result.source === "fallback" && result.error ? "生成失败，已使用本地弹幕" : "已填入弹幕，按 Enter 发送");
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
      pageContext: getVisiblePageText(),
      style,
      source: "v.qq.com",
      trigger
    };
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

      const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings });
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
    sendMessage({ type: MESSAGE_TYPES.getSettings }).then((settings) => {
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
