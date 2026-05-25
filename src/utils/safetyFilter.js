(function attachDanmakuSafetyFilter(global) {
  const BLOCKED_PATTERNS = [
    /刷起来/u,
    /快发/u,
    /冲啊/u,
    /加群/u,
    /关注/u,
    /私信/u,
    /优惠/u,
    /代购/u,
    /傻逼|垃圾|去死/u
  ];

  function isSafeDanmaku(text) {
    if (!text || typeof text !== "string") return false;
    return !BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
  }

  global.DanmakuCopilotSafetyFilter = {
    isSafeDanmaku
  };
})(globalThis);
