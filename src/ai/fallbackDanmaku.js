(function attachFallbackDanmaku(global) {
  const FALLBACKS = {
    natural: [
      "这段气氛不错",
      "感觉要进重点了",
      "这个镜头有点东西",
      "这节奏挺舒服",
      "这里开始有意思了"
    ],
    roast: [
      "这反应也太真实了",
      "他这眼神不简单",
      "前一秒还挺正常",
      "这下有点绷不住"
    ],
    emotion: [
      "突然有点紧张了",
      "这段看得好压抑",
      "情绪一下上来了",
      "有点心疼他了"
    ],
    detail: [
      "注意这个眼神",
      "这里声音变了",
      "镜头开始不对劲",
      "这个细节挺妙"
    ],
    atmosphere: [
      "压迫感上来了",
      "这段氛围好稳",
      "镜头感很强",
      "这个转场挺顺"
    ],
    praise: [
      "这个镜头真不错",
      "这段节奏拿捏住了",
      "表演挺有层次",
      "这里处理得好细"
    ]
  };

  function generateFallbackDanmaku(style = "natural") {
    const list = FALLBACKS[style] || FALLBACKS.natural;
    const text = list[Math.floor(Math.random() * list.length)];

    return {
      text,
      provider: "local",
      model: "fallback",
      createdAt: Date.now(),
      source: "fallback",
      error: null
    };
  }

  global.DanmakuCopilotFallback = {
    FALLBACKS,
    generateFallbackDanmaku
  };
})(globalThis);
