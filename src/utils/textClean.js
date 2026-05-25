(function attachDanmakuTextClean(global) {
  function cleanDanmakuText(raw, maxChars = 18) {
    if (!raw) return "";

    let text = String(raw)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)[0] || "";

    text = text
      .replace(/^[\s"'“”‘’「」『』【】《》]+|[\s"'“”‘’「」『』【】《》]+$/g, "")
      .replace(/^\s*(?:\d+[\.\)、)]|[-*•])\s*/u, "")
      .replace(/\s+/g, "");

    const sentenceEnd = text.search(/[。！？!?]/u);
    if (sentenceEnd > 0) text = text.slice(0, sentenceEnd);

    if (text.length > maxChars + 7) {
      text = text.slice(0, maxChars);
    }

    return text.trim();
  }

  global.DanmakuCopilotTextClean = {
    cleanDanmakuText
  };
})(globalThis);
