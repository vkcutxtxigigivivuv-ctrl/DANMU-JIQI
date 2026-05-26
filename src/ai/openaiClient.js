(function attachOpenAIClient(global) {
  const { cleanDanmakuText } = global.DanmakuCopilotTextClean;
  const { isSafeDanmaku } = global.DanmakuCopilotSafetyFilter;
  const { buildDanmakuMessages, buildDanmakuPoolMessages } = global.DanmakuCopilotPromptBuilder;

  async function generateWithOpenAI(context, settings) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${settings.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: buildDanmakuMessages(context, settings),
          temperature: 0.8,
          max_tokens: 40
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(await buildApiErrorMessage(response, "AI request failed"));
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const text = cleanDanmakuText(raw, settings.maxChars);

      if (!text || !isSafeDanmaku(text)) {
        throw new Error("AI output rejected by local safety filter");
      }

      return {
        text,
        provider: settings.apiProvider || "openai-compatible",
        model: settings.model,
        createdAt: Date.now(),
        source: "api",
        error: null
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function generatePoolWithOpenAI(context, settings, count = 18) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${settings.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: buildDanmakuPoolMessages(context, settings, count),
          temperature: 0.9,
          max_tokens: Math.max(180, count * 32)
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(await buildApiErrorMessage(response, "AI pool request failed"));
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const texts = parsePoolText(raw, settings.maxChars)
        .filter(isSafeDanmaku)
        .slice(0, count);

      if (texts.length === 0) {
        throw new Error("AI pool output rejected by local safety filter");
      }

      return texts;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function testOpenAICompatibleApi(settings) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${settings.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: "system", content: "只输出 ok。" },
            { role: "user", content: "测试" }
          ],
          temperature: 0,
          max_tokens: 8
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(await buildApiErrorMessage(response, "API test failed"));
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "";

      if (!raw) {
        throw new Error("API test failed: empty model response");
      }

      return {
        ok: true,
        text: String(raw).trim().slice(0, 40)
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function parsePoolText(raw, maxChars) {
    const seen = new Set();

    return String(raw || "")
      .split(/\r?\n|[；;]/)
      .map((line) => cleanDanmakuText(line, maxChars))
      .filter((text) => {
        if (!text || seen.has(text)) return false;
        seen.add(text);
        return true;
      });
  }

  async function buildApiErrorMessage(response, prefix) {
    let detail = "";

    try {
      const data = await response.clone().json();
      detail = data?.error?.message || data?.message || "";
    } catch (error) {
      try {
        detail = (await response.text()).slice(0, 160);
      } catch (_) {
        detail = "";
      }
    }

    return [prefix, response.status, detail].filter(Boolean).join(": ");
  }

  global.DanmakuCopilotOpenAI = {
    generateWithOpenAI,
    generatePoolWithOpenAI,
    testOpenAICompatibleApi
  };
})(globalThis);
