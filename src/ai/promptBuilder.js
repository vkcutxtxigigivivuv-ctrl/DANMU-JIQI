(function attachPromptBuilder(global) {
  const { DANMAKU_STYLES } = global.DanmakuCopilotConstants;

  function buildDanmakuMessages(context, settings) {
    const styleName = DANMAKU_STYLES[context.style || settings.style] || DANMAKU_STYLES.natural;
    const hasContext = Boolean(context.title || context.currentTime || context.pageContext);

    const system = "你是一个中文影视弹幕助手。你的任务是生成一句自然、短促、像真实观众会发的中文弹幕。你只能输出弹幕本身，不要解释、不要编号、不要加引号。";
    const user = hasContext
      ? [
        "请根据以下信息生成一句中文弹幕。",
        "",
        "要求：",
        `1. 8到${settings.maxChars || 18}个中文字符左右。`,
        "2. 语气自然，像普通观众。",
        "3. 不要像广告。",
        "4. 不要剧透后续剧情。",
        "5. 不要攻击演员、导演或现实人物。",
        "6. 不要引导刷屏。",
        "7. 不要出现违法、低俗、仇恨、骚扰内容。",
        "8. 只输出一句弹幕。",
        "",
        `视频标题：${context.title || "未知"}`,
        `当前播放时间：${context.currentTime || "未知"}`,
        `页面上下文：${context.pageContext || "无"}`,
        `弹幕风格：${styleName}`
      ].join("\n")
      : [
        "请生成一句适合视频弹幕区的中文短弹幕。",
        "",
        "要求：",
        `1. 8到${settings.maxChars || 18}个中文字符左右。`,
        "2. 自然、口语化。",
        "3. 不剧透。",
        "4. 不像广告。",
        "5. 不攻击真人。",
        "6. 只输出一句弹幕。",
        "",
        `弹幕风格：${styleName}`
      ].join("\n");

    return [
      { role: "system", content: system },
      { role: "user", content: user }
    ];
  }

  global.DanmakuCopilotPromptBuilder = {
    buildDanmakuMessages
  };
})(globalThis);
