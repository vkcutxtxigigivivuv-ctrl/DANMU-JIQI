# Danmaku Copilot

Danmaku Copilot 是一个 Chrome 浏览器插件，用于在腾讯视频网页端辅助生成中文弹幕草稿。

## 功能

- 点击弹幕输入框后自动生成一句自然中文弹幕
- 自动填入输入框
- 用户手动按 Enter 发送
- 支持多种弹幕风格
- 支持 API Key 设置
- 支持本地兜底弹幕
- 支持快捷键重新生成和切换风格

## 重要边界

本插件只生成和填入弹幕草稿。
本插件不会自动发送弹幕。
本插件不会模拟 Enter。
本插件不会点击发送按钮。
本插件不会读取或保存腾讯视频账号 Cookie。
本插件不会绕过验证码、风控或平台限制。
本插件不会批量发送弹幕。

## 安装方式

1. 打开 Chrome。
2. 进入 `chrome://extensions/`。
3. 开启开发者模式。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目文件夹。
6. 打开 `v.qq.com` 视频页面测试。

## 使用方式

1. 打开腾讯视频网页。
2. 点击插件图标，进入设置页填写 API Key。
3. 选择默认弹幕风格。
4. 打开视频播放页。
5. 点击弹幕输入框。
6. 插件自动生成并填入弹幕。
7. 用户确认后手动按 Enter 发送。

## 快捷键

- `Alt + R`：重新生成
- `Alt + C`：清空插件填入内容
- `Alt + T`：吐槽型
- `Alt + E`：情绪型
- `Alt + D`：细节型
- `Alt + A`：夸赞型

快捷键只在弹幕输入框聚焦时生效，不会发送弹幕。

## 文件结构

```text
danmaku-copilot/
├─ manifest.json
├─ src/
│  ├─ background.js
│  ├─ content.js
│  ├─ options.html
│  ├─ options.js
│  ├─ popup.html
│  ├─ popup.js
│  ├─ styles.css
│  ├─ ai/
│  │  ├─ openaiClient.js
│  │  ├─ promptBuilder.js
│  │  └─ fallbackDanmaku.js
│  ├─ utils/
│  │  ├─ dom.js
│  │  ├─ storage.js
│  │  ├─ textClean.js
│  │  ├─ safetyFilter.js
│  │  └─ time.js
│  └─ constants.js
├─ icons/
│  ├─ icon-16.png
│  ├─ icon-48.png
│  └─ icon-128.png
├─ README.md
└─ AGENTS.md
```

## OpenAI 兼容接口

默认请求地址是 `https://api.openai.com/v1/chat/completions`。如果使用其他兼容 OpenAI Chat Completions 的服务，可以在设置页修改 API Base URL 和模型名称。

未填写 API Key 或接口失败时，插件会使用本地兜底弹幕库，不会反复重试刷接口。

## 测试清单

- [ ] Chrome 能加载未打包插件
- [ ] manifest 没有报错
- [ ] 插件图标正常显示
- [ ] popup 能打开
- [ ] options 能打开
- [ ] API Key、Base URL、模型名、默认风格、冷却时间能保存并回显
- [ ] 打开 `v.qq.com` 后 content script 正常运行
- [ ] 点击弹幕输入框后能生成弹幕
- [ ] 输入框已有内容时不覆盖
- [ ] 无 API Key 时使用 fallback
- [ ] `input`、`textarea`、`contenteditable` 能填入并触发输入事件
- [ ] 插件不会自动按 Enter 或点击发送按钮
- [ ] `Alt + R/C/T/E/D/A` 只在输入框聚焦时生效
