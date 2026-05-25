# AGENTS.md

## Project

Danmaku Copilot is a Chrome Extension Manifest V3 project.

It generates and fills a Chinese danmaku draft when the user focuses a likely Tencent Video danmaku input. The user must manually review and send the text.

## Boundaries

- Do not add automatic sending.
- Do not simulate Enter.
- Do not click send buttons.
- Do not read Tencent Video account cookies.
- Do not bypass CAPTCHA, risk controls, or platform limits.
- Do not implement bulk or scheduled danmaku sending.

## Development

- Keep the project build-free unless a future task explicitly adds a bundler.
- Use vanilla JavaScript, HTML, and CSS.
- Keep settings in `chrome.storage.local`.
- Keep API keys out of source code, logs, and DOM.
