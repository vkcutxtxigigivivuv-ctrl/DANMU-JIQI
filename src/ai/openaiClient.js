(function attachOpenAIClient(global) {
  const { cleanDanmakuText } = global.DanmakuCopilotTextClean;
  const { isSafeDanmaku } = global.DanmakuCopilotSafetyFilter;
  const { buildDanmakuMessages } = global.DanmakuCopilotPromptBuilder;

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
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const text = cleanDanmakuText(raw, settings.maxChars);

      if (!text || !isSafeDanmaku(text)) {
        throw new Error("AI output rejected by local safety filter");
      }

      return {
        text,
        provider: "openai",
        model: settings.model,
        createdAt: Date.now(),
        source: "api",
        error: null
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  global.DanmakuCopilotOpenAI = {
    generateWithOpenAI
  };
})(globalThis);
