(function attachDanmakuDom(global) {
  const INPUT_SELECTOR = 'input, textarea, [contenteditable="true"]';
  const KEYWORDS = ["弹幕", "发弹幕", "说点什么", "danmu", "danmaku", "barrage", "comment", "input"];

  function findDanmakuInputs(root = document) {
    const nodes = Array.from(root.querySelectorAll(INPUT_SELECTOR));
    return nodes.filter(isLikelyDanmakuInput);
  }

  function isLikelyDanmakuInput(el) {
    if (!isEditableTarget(el)) return false;
    if (isHidden(el)) return false;

    const text = [
      el.placeholder,
      el.getAttribute("aria-label"),
      el.getAttribute("role"),
      el.className,
      el.id,
      el.name,
      el.parentElement?.className,
      el.parentElement?.getAttribute("aria-label"),
      getNearbyText(el)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  function isEditableTarget(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  function isInputEmpty(el) {
    return getInputValue(el).trim().length === 0;
  }

  function getInputValue(el) {
    if (!el) return "";
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return el.value || "";
    if (el.isContentEditable) return el.innerText || el.textContent || "";
    return "";
  }

  function setInputValue(el, text) {
    if (!isEditableTarget(el)) return;

    el.focus();

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const prototype = el.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

      if (descriptor?.set) {
        descriptor.set.call(el, text);
      } else {
        el.value = text;
      }

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    if (el.isContentEditable) {
      el.innerText = text;
      el.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text
      }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function clearInputValue(el) {
    setInputValue(el, "");
  }

  function isHidden(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width === 0 || rect.height === 0 || style.visibility === "hidden" || style.display === "none";
  }

  function getNearbyText(el) {
    const parent = el.closest("[class], [role], form, div") || el.parentElement;
    if (!parent) return "";
    return (parent.innerText || parent.textContent || "").slice(0, 240);
  }

  global.DanmakuCopilotDom = {
    findDanmakuInputs,
    isLikelyDanmakuInput,
    isEditableTarget,
    isInputEmpty,
    getInputValue,
    setInputValue,
    clearInputValue
  };
})(globalThis);
