(function initPopup() {
  const { DANMAKU_STYLES, MESSAGE_TYPES } = globalThis.DanmakuCopilotConstants;
  const { normalizeSettings } = globalThis.DanmakuCopilotStorage;

  const statusText = document.querySelector("#statusText");
  const enabledToggle = document.querySelector("#enabledToggle");
  const switchHint = document.querySelector("#switchHint");
  const styleSelect = document.querySelector("#styleSelect");
  const autoFillText = document.querySelector("#autoFillText");
  const cooldownText = document.querySelector("#cooldownText");
  const lastResultText = document.querySelector("#lastResultText");
  const openOptionsButton = document.querySelector("#openOptionsButton");

  Object.entries(DANMAKU_STYLES).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    styleSelect.appendChild(option);
  });

  load();

  enabledToggle.addEventListener("change", saveQuickSettings);
  styleSelect.addEventListener("change", saveQuickSettings);
  openOptionsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

  async function load() {
    const settings = normalizeSettings(await sendMessage({ type: MESSAGE_TYPES.getSettings }));
    const lastResult = await sendMessage({ type: MESSAGE_TYPES.getLastResult });

    enabledToggle.checked = settings.enabled;
    styleSelect.value = settings.style;
    statusText.textContent = settings.enabled ? "状态：已开启" : "状态：已暂停";
    switchHint.textContent = settings.enabled ? "点击弹幕框会生成草稿" : "已暂停，不会生成或填入";
    autoFillText.textContent = settings.autoFill ? "开启" : "关闭";
    cooldownText.textContent = `${Math.round(settings.cooldownMs / 1000)} 秒`;
    lastResultText.textContent = lastResult?.text || "暂无";
  }

  async function saveQuickSettings() {
    const current = normalizeSettings(await sendMessage({ type: MESSAGE_TYPES.getSettings }));
    await sendMessage({
      type: MESSAGE_TYPES.saveSettings,
      payload: {
        ...current,
        enabled: enabledToggle.checked,
        style: styleSelect.value
      }
    });
    await load();
  }

  function sendMessage(message) {
    return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
  }
})();
