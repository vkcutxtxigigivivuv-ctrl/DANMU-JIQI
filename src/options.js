(function initOptionsPage() {
  const { DANMAKU_STYLES, MESSAGE_TYPES } = globalThis.DanmakuCopilotConstants;
  const { normalizeSettings } = globalThis.DanmakuCopilotStorage;

  const form = document.querySelector("#settingsForm");
  const status = document.querySelector("#saveStatus");
  const resetButton = document.querySelector("#resetButton");
  const styleSelect = document.querySelector("#styleSelect");

  Object.entries(DANMAKU_STYLES).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    styleSelect.appendChild(option);
  });

  loadSettings();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = readForm();
    const saved = await sendMessage({ type: MESSAGE_TYPES.saveSettings, payload });
    fillForm(saved);
    setStatus("已保存");
  });

  resetButton.addEventListener("click", async () => {
    const settings = await sendMessage({ type: "RESET_SETTINGS" });
    fillForm(settings);
    setStatus("已恢复默认");
  });

  async function loadSettings() {
    const settings = await sendMessage({ type: MESSAGE_TYPES.getSettings });
    fillForm(settings);
    setStatus("已加载");
  }

  function readForm() {
    const data = new FormData(form);
    return normalizeSettings({
      enabled: data.has("enabled"),
      autoGenerateOnFocus: data.has("autoGenerateOnFocus"),
      autoFill: data.has("autoFill"),
      apiProvider: data.get("apiProvider"),
      apiKey: data.get("apiKey"),
      apiBaseUrl: data.get("apiBaseUrl"),
      model: data.get("model"),
      style: data.get("style"),
      cooldownSeconds: Number(data.get("cooldownSeconds")),
      maxChars: Number(data.get("maxChars")),
      avoidSpoiler: data.has("avoidSpoiler"),
      avoidAdTone: data.has("avoidAdTone"),
      enableHotkeys: data.has("enableHotkeys"),
      showToast: data.has("showToast")
    });
  }

  function fillForm(settings) {
    const normalized = normalizeSettings(settings);

    form.elements.apiProvider.value = normalized.apiProvider;
    form.elements.apiKey.value = normalized.apiKey;
    form.elements.apiBaseUrl.value = normalized.apiBaseUrl;
    form.elements.model.value = normalized.model;
    form.elements.style.value = normalized.style;
    form.elements.cooldownSeconds.value = Math.round(normalized.cooldownMs / 1000);
    form.elements.maxChars.value = normalized.maxChars;

    form.elements.enabled.checked = normalized.enabled;
    form.elements.autoGenerateOnFocus.checked = normalized.autoGenerateOnFocus;
    form.elements.autoFill.checked = normalized.autoFill;
    form.elements.avoidSpoiler.checked = normalized.avoidSpoiler;
    form.elements.avoidAdTone.checked = normalized.avoidAdTone;
    form.elements.enableHotkeys.checked = normalized.enableHotkeys;
    form.elements.showToast.checked = normalized.showToast;
  }

  function setStatus(text) {
    status.textContent = text;
    setTimeout(() => {
      if (status.textContent === text) status.textContent = "就绪";
    }, 1800);
  }

  function sendMessage(message) {
    return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
  }
})();
