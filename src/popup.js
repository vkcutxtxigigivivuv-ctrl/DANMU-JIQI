(function initPopup() {
  const { AI_PROVIDERS, DANMAKU_STYLES, MESSAGE_TYPES } = globalThis.DanmakuCopilotConstants;
  const { getProviderDefaults, normalizeSettings } = globalThis.DanmakuCopilotStorage;

  const statusText = document.querySelector("#statusText");
  const enabledToggle = document.querySelector("#enabledToggle");
  const switchHint = document.querySelector("#switchHint");
  const styleSelect = document.querySelector("#styleSelect");
  const apiProviderSelect = document.querySelector("#apiProviderSelect");
  const apiKeyStatus = document.querySelector("#apiKeyStatus");
  const apiKeyLabel = document.querySelector("#apiKeyLabel");
  const apiKeyInput = document.querySelector("#apiKeyInput");
  const saveApiKeyButton = document.querySelector("#saveApiKeyButton");
  const testApiButton = document.querySelector("#testApiButton");
  const apiTestStatus = document.querySelector("#apiTestStatus");
  const autoFillText = document.querySelector("#autoFillText");
  const cooldownText = document.querySelector("#cooldownText");
  const lastResultText = document.querySelector("#lastResultText");
  const lastSourceText = document.querySelector("#lastSourceText");
  const lastErrorText = document.querySelector("#lastErrorText");
  const openOptionsButton = document.querySelector("#openOptionsButton");

  Object.entries(DANMAKU_STYLES).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    styleSelect.appendChild(option);
  });

  Object.entries(AI_PROVIDERS).forEach(([value, provider]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = provider.label;
    apiProviderSelect.appendChild(option);
  });

  load();

  enabledToggle.addEventListener("change", saveQuickSettings);
  styleSelect.addEventListener("change", saveQuickSettings);
  apiProviderSelect.addEventListener("change", updateProviderHint);
  saveApiKeyButton.addEventListener("click", saveApiKey);
  testApiButton.addEventListener("click", testApiConnection);
  openOptionsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

  async function load() {
    const settings = normalizeSettings(await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" }));
    const lastResult = await sendMessage({ type: MESSAGE_TYPES.getLastResult || "GET_LAST_RESULT" });

    enabledToggle.checked = settings.enabled;
    styleSelect.value = settings.style;
    apiProviderSelect.value = settings.apiProvider;
    statusText.textContent = settings.enabled ? "状态：已开启" : "状态：已暂停";
    switchHint.textContent = settings.enabled ? "点击弹幕框会生成草稿" : "已暂停，不会生成或填入";
    apiKeyStatus.textContent = settings.apiKey ? "已设置" : "未设置";
    apiKeyInput.value = "";
    updateProviderHint();
    autoFillText.textContent = settings.autoFill ? "开启" : "关闭";
    cooldownText.textContent = `${Math.round(settings.cooldownMs / 1000)} / ${Math.round(settings.poolWaitMs / 1000)} 秒`;
    lastResultText.textContent = lastResult?.text || "暂无";
    lastSourceText.textContent = formatSource(lastResult);
    lastErrorText.textContent = formatError(lastResult?.error);
  }

  async function saveQuickSettings() {
    const current = normalizeSettings(await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" }));
    await sendMessage({
      type: MESSAGE_TYPES.saveSettings || "SAVE_SETTINGS",
      payload: {
        ...current,
        enabled: enabledToggle.checked,
        style: styleSelect.value
      }
    });
    await load();
  }

  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      apiKeyStatus.textContent = "请输入 Key";
      return;
    }

    saveApiKeyButton.disabled = true;
    const current = normalizeSettings(await sendMessage({ type: MESSAGE_TYPES.getSettings || "GET_SETTINGS" }));
    const saved = await sendMessage({
      type: MESSAGE_TYPES.saveSettings || "SAVE_SETTINGS",
      payload: {
        ...current,
        apiProvider: apiProviderSelect.value,
        apiBaseUrl: getProviderDefaults(apiProviderSelect.value).apiBaseUrl || current.apiBaseUrl,
        model: getProviderDefaults(apiProviderSelect.value).model || current.model,
        apiKey
      }
    });

    if (saved?.error) {
      apiKeyStatus.textContent = formatError(saved.error);
      saveApiKeyButton.disabled = false;
      return;
    }

    apiKeyInput.value = "";
    apiKeyStatus.textContent = "已保存";
    saveApiKeyButton.disabled = false;
    setTimeout(load, 800);
  }

  async function testApiConnection() {
    testApiButton.disabled = true;
    apiTestStatus.textContent = "测试中...";

    const result = await sendMessage({ type: MESSAGE_TYPES.testApi || "TEST_API" });

    if (result?.ok) {
      apiTestStatus.textContent = `可用：${result.provider} / ${result.model}`;
    } else {
      apiTestStatus.textContent = `失败：${formatError(result?.error)}`;
    }

    testApiButton.disabled = false;
    await load();
  }

  function updateProviderHint() {
    const provider = getProviderDefaults(apiProviderSelect.value);
    apiKeyLabel.textContent = `${provider.label} API Key`;
    apiKeyInput.placeholder = provider.keyPlaceholder || "粘贴后保存，不会显示明文";
  }

  function formatSource(result) {
    if (!result) return "暂无";
    if (result.source === "api-pool") return "AI 池";
    if (result.source === "api") return "AI 单条";
    if (result.source === "fallback") return "本地兜底";
    if (result.source === "pool") return "候选池";
    return result.source || "未知";
  }

  function formatError(error) {
    if (!error) return "-";
    if (error === "Missing API key") return "未设置 API Key";
    const text = String(error);
    if (/failed to fetch|load failed|network/i.test(text)) return "网络或权限失败，请重载扩展并检查 Base URL";
    if (/401|unauthorized|invalid api key/i.test(text)) return "API Key 无效或未授权";
    if (/403|forbidden/i.test(text)) return "API 权限不足或服务商拒绝";
    if (/404|not found|model/i.test(text)) return "模型名或 Base URL 不对";
    if (/429|quota|billing|insufficient/i.test(text)) return "额度不足或触发限流";
    if (/empty model response/i.test(text)) return "接口通了但模型返回为空";
    return text.slice(0, 80);
  }

  function sendMessage(message) {
    return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
  }
})();
