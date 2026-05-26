(function attachFallbackDanmaku(global) {
  const recentByStyle = new Map();

  const FALLBACKS = {
    natural: [
      "这段气氛不错",
      "感觉要进重点了",
      "这个镜头有点东西",
      "这节奏挺舒服",
      "这里开始有意思了",
      "这段看着挺顺",
      "节奏一下起来了",
      "这个点有意思",
      "这幕有点抓人",
      "这里感觉不简单",
      "这段铺得挺稳",
      "这下有看头了",
      "这个转折可以",
      "这段信息量不小",
      "这里味儿对了",
      "这镜头挺会拍",
      "感觉要变天了",
      "这段挺有层次",
      "这一下很关键",
      "这里开始带感",
      "这节奏刚刚好",
      "感觉事情不小",
      "这幕挺有张力",
      "这里有点微妙",
      "这段越看越对",
      "这一幕挺稳的",
      "这处理挺自然",
      "这里开始入戏",
      "这段不太简单",
      "这个反应真实",
      "这一下有意思",
      "这氛围慢慢来了"
    ],
    roast: [
      "这反应也太真实了",
      "他这眼神不简单",
      "前一秒还挺正常",
      "这下有点绷不住",
      "这操作有点离谱",
      "这话说得真敢",
      "这表情太会了",
      "这一下真没想到",
      "他是不是慌了",
      "这波属实突然",
      "这也太会接了",
      "这沉默很有戏",
      "这反转挺会玩",
      "这眼神藏不住",
      "这下尴尬了",
      "这节奏有点损",
      "他真的很会装",
      "这回答太真实",
      "这下装不下去了",
      "这话听着不妙",
      "这表情笑死我",
      "这空气突然安静",
      "这波很难评",
      "这也能圆回来",
      "这下压力给到",
      "这走向挺突然",
      "他脑子转真快",
      "这台词有点狠",
      "这反应绝了",
      "这下真露馅了",
      "这场面太真实"
    ],
    emotion: [
      "突然有点紧张了",
      "这段看得好压抑",
      "情绪一下上来了",
      "有点心疼他了",
      "这里突然破防了",
      "这一下好揪心",
      "这段有点难受",
      "情绪铺得好满",
      "这眼神太难过",
      "突然不敢看了",
      "这段后劲有点大",
      "这里真的戳到了",
      "这一下太沉了",
      "感觉心里一紧",
      "这段太压人了",
      "有点替他难受",
      "这里情绪很真",
      "这一下挺疼的",
      "这段看得心酸",
      "突然有点酸了",
      "这沉默太重了",
      "这段好有代入感",
      "这里真的绷不住",
      "这一下太扎心",
      "情绪慢慢上来了",
      "这段好让人慌",
      "这里有点鼻酸",
      "这段真的难顶",
      "这眼神看心软了",
      "这里突然安静了",
      "这一下很心疼"
    ],
    detail: [
      "注意这个眼神",
      "这里声音变了",
      "镜头开始不对劲",
      "这个细节挺妙",
      "注意他刚才停顿",
      "这里表情变了",
      "这个动作很关键",
      "背景声音变轻了",
      "这里镜头没乱给",
      "看他手上的动作",
      "这个停顿有东西",
      "这里光线变暗了",
      "注意这个视线",
      "这个反应很细",
      "这里台词有伏笔",
      "镜头给得很准",
      "这个站位有意思",
      "注意她没接话",
      "这处剪辑很细",
      "这里节奏变慢了",
      "这个眼神别错过",
      "声音一下收住了",
      "这里氛围变了",
      "这个细节藏得深",
      "注意他没看人",
      "这里镜头在暗示",
      "这句台词很关键",
      "这个小动作绝了",
      "这里反应对上了",
      "这处铺垫挺巧",
      "看这个转身"
    ],
    atmosphere: [
      "压迫感上来了",
      "这段氛围好稳",
      "镜头感很强",
      "这个转场挺顺",
      "空气突然紧了",
      "这段很有压迫感",
      "氛围慢慢压下来",
      "这里节奏很稳",
      "这个镜头好沉",
      "这段质感不错",
      "气氛一下变冷了",
      "这转场挺舒服",
      "镜头推进很稳",
      "这里悬念拉满",
      "这段张力很足",
      "氛围开始不对了",
      "这里安静得吓人",
      "这段拍得很克制",
      "压迫感一点点来",
      "这节奏很会吊",
      "镜头语言挺强",
      "这段呼吸感很重",
      "这里气场变了",
      "这个调度挺稳",
      "这段铺垫很足",
      "这里像暴风前夜",
      "这幕氛围太对",
      "镜头开始收紧了",
      "这段很有电影感",
      "这里越静越慌",
      "这光影挺有味"
    ],
    praise: [
      "这个镜头真不错",
      "这段节奏拿捏住了",
      "表演挺有层次",
      "这里处理得好细",
      "这段演得很稳",
      "这个转场很舒服",
      "这镜头调度可以",
      "这里节奏真好",
      "这段处理很高级",
      "这个眼神很到位",
      "表演细节挺足",
      "这场戏挺扎实",
      "这里拍得真细",
      "这段剪得很顺",
      "镜头语言很舒服",
      "这个情绪很准",
      "这段台词挺好",
      "这里表演很自然",
      "节奏控制得不错",
      "这幕完成度很高",
      "这段质感挺好",
      "这里情绪给到了",
      "这个处理很克制",
      "这段很有感染力",
      "这个镜头有记忆点",
      "这里细节真不错",
      "这场戏挺有劲",
      "这段很耐看",
      "这里转得很顺",
      "这个节奏舒服",
      "表演状态真不错"
    ]
  };

  function generateFallbackDanmaku(style = "natural", context = {}) {
    const list = FALLBACKS[style] || FALLBACKS.natural;
    const text = pickWithoutRecentRepeat(style, list, context);

    return {
      text,
      provider: "local",
      model: "fallback",
      createdAt: Date.now(),
      source: "fallback",
      error: null
    };
  }

  function generateFallbackDanmakuPool(style = "natural", context = {}, count = 18) {
    const results = [];
    const seen = new Set();
    const maxAttempts = count * 6;

    for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt += 1) {
      const result = generateFallbackDanmaku(style, context);
      if (seen.has(result.text)) continue;
      seen.add(result.text);
      results.push(result.text);
    }

    return results;
  }

  function pickWithoutRecentRepeat(style, list, context) {
    const contextualList = buildContextualFallbacks(style, context);
    const pool = [...contextualList, ...list];
    const recent = recentByStyle.get(style) || [];
    let candidates = pool.filter((text) => !recent.includes(text));

    if (candidates.length === 0) {
      candidates = pool.filter((text) => text !== recent[0]);
    }

    const text = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    rememberRecent(style, text, pool.length);
    return text;
  }

  function rememberRecent(style, text, poolSize) {
    const recent = recentByStyle.get(style) || [];
    recent.unshift(text);

    const maxRecent = Math.min(14, Math.max(4, Math.floor(poolSize * 0.45)));
    recentByStyle.set(style, recent.slice(0, maxRecent));
  }

  function buildContextualFallbacks(style, context) {
    const seconds = Number(context?.currentTimeSeconds || 0);
    const isOpening = seconds > 0 && seconds < 180;
    const isLate = seconds > 1800;

    if (style === "detail") {
      return isOpening ? ["开头这个细节有用", "前面这里别错过"] : ["这里细节开始多了"];
    }

    if (style === "atmosphere") {
      return isLate ? ["后面气氛更紧了", "这里压迫感更重"] : ["这段氛围在铺了"];
    }

    if (style === "emotion") {
      return isLate ? ["看到这里有点沉", "这段后劲上来了"] : ["情绪开始铺开了"];
    }

    if (style === "roast") {
      return ["这反应也太有戏", "这下有点意思了"];
    }

    if (style === "praise") {
      return ["这段完成度不错", "这里处理挺稳"];
    }

    return isOpening ? ["开头节奏挺稳", "一上来就有点意思"] : ["这里节奏挺稳"];
  }

  global.DanmakuCopilotFallback = {
    FALLBACKS,
    generateFallbackDanmaku,
    generateFallbackDanmakuPool
  };
})(globalThis);
