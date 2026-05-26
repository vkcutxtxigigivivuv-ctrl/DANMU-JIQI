# Danmaku Copilot

Danmaku Copilot 是一个浏览器扩展，用于在腾讯视频网页端辅助生成中文弹幕草稿。它支持 Chrome 和 Microsoft Edge。

## 功能

- 点击弹幕输入框后生成一句自然中文弹幕
- 自动填入输入框，由用户手动按 Enter 发送
- 支持自然、吐槽、情绪、细节、氛围、夸赞等风格
- 支持 OpenAI、DeepSeek、通义千问、智谱和自定义 OpenAI 兼容接口
- 支持 API Key 快速保存和 API 连通性测试
- 支持按集预生成弹幕池，并可设置切集等待时间
- 支持本地兜底弹幕
- 支持 popup 总开关暂停或启用插件

## 重要边界

本插件只生成和填入弹幕草稿。
本插件不会自动发送弹幕。
本插件不会模拟 Enter。
本插件不会点击发送按钮。
本插件不会读取或保存腾讯视频账号 Cookie。
本插件不会绕过验证码、风控或平台限制。
本插件不会批量发送弹幕。

## Chrome 安装方式

1. 下载 release 里的 Chrome 或通用 zip 包。
2. 解压 zip。
3. 打开 Chrome，进入 `chrome://extensions/`。
4. 开启“开发者模式”。
5. 点击“加载已解压的扩展程序”。
6. 选择解压后的项目文件夹。
7. 打开 `v.qq.com` 视频页面测试。

## Microsoft Edge 安装方式

1. 下载 release 里的 Edge zip 包。
2. 解压 zip。
3. 打开 Edge，进入 `edge://extensions/`。
4. 开启“开发人员模式”。
5. 点击“加载解压缩的扩展”。
6. 选择解压后的项目文件夹。
7. 打开 `v.qq.com` 视频页面测试。

说明：Edge 兼容 Manifest V3 和 `chrome.*` 扩展 API，本项目不需要单独维护 Edge 代码分支。

## 使用方式

1. 打开腾讯视频网页。
2. 点击插件图标，选择 API Provider。
3. 粘贴对应服务商的 API Key，点击“保存 API Key”。
4. 点击“测试 API”，确认显示可用。
5. 选择默认弹幕风格。
6. 打开视频播放页并点击弹幕输入框。
7. 插件生成并填入弹幕草稿。
8. 用户确认后手动按 Enter 发送。

## 快捷键

- `Alt + R`：重新生成
- `Alt + C`：清空插件填入内容
- `Alt + T`：吐槽型
- `Alt + E`：情绪型
- `Alt + D`：细节型
- `Alt + A`：夸赞型

快捷键只在弹幕输入框聚焦时生效，不会发送弹幕。

## API Provider

内置服务商预设：

- OpenAI：`https://api.openai.com/v1`，默认模型 `gpt-4o-mini`
- DeepSeek：`https://api.deepseek.com/v1`，默认模型 `deepseek-chat`
- 通义千问 DashScope：`https://dashscope.aliyuncs.com/compatible-mode/v1`，默认模型 `qwen-plus`
- 智谱 GLM：`https://open.bigmodel.cn/api/paas/v4`，默认模型 `glm-4-flash`
- 自定义兼容接口：手动填写 Base URL 和模型名称

未填写 API Key 或接口失败时，插件会使用本地兜底弹幕，不会反复重试刷接口。

## 调试提示

popup 里会显示最近生成来源：

- `AI 池`：来自当前集预生成的 AI 弹幕池
- `AI 单条`：来自即时 AI 生成
- `本地兜底`：API 不可用或未设置 Key 时使用本地弹幕

如果一直是“本地兜底”，请先点击 popup 里的“测试 API”查看具体错误。
