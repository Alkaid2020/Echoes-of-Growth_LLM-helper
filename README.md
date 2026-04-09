# Echoes of Growth

**English** | [中文](#中文)

---

When you feel disappointed with where you are, this space invites you to look back at the moments that shaped you — and use the strength of your past to illuminate the path ahead.

## What it does

The user fills in three prompts:

1. **Express** — What is disappointing you right now?
2. **Recall** — A past moment when you felt truly capable and alive
3. **Within** *(optional)* — Something you have never said to anyone

Gemini 2.5 Flash takes these three inputs and writes a 150–200 word personal letter, drawing a specific connection between past strength and present struggle, and reframing disappointment as an echo of growth.

## Stack

- **Next.js 15** + **React 19**
- **Tailwind CSS v4**
- **Google Gemini API** (`@google/generative-ai`)

All logic lives in `app/page.tsx`. No backend. The API key is stored only in the browser's `localStorage` and never leaves the device.

## Getting started

**1. Get a Gemini API key**

Create one for free at [Google AI Studio](https://aistudio.google.com/app/apikey).

**2. Install and run**

```bash
cd echo_CC
npm install
npm run dev
```

**3. Open your browser**

Visit `http://localhost:3000`, enter your API key, and begin.

## Project structure

```
echo_CC/
├── app/
│   ├── page.tsx       # All logic and UI
│   ├── layout.tsx
│   └── globals.css
├── package.json
└── ...
```

## Notes

- Requires a Gemini API key with access to `gemini-2.5-flash`
- Free-tier accounts have a daily quota; it resets the following day
- No conversation data is saved — refreshing the page clears everything

---

## 中文

[English](#echoes-of-growth) | **中文**

---

当你对现状感到失望，这里陪你回到那些塑造了你的时刻，用过去的力量，重新照亮此刻的路。

## 功能

用户填写三个问题：

1. **倾诉** — 说出正在经历的挫败或迷茫
2. **追溯** — 回忆一个曾让自己感到"我能行"的瞬间
3. **深处**（选填）— 一句从未对人说过的话

提交后，Gemini 2.5 Flash 根据这三段内容，生成一封 150–200 字的专属信件，将过去的力量与当前困境深刻连接，重新解读失望的意义。

## 技术栈

- **Next.js 15** + **React 19**
- **Tailwind CSS v4**
- **Google Gemini API** (`@google/generative-ai`)

所有逻辑集中在 `app/page.tsx`，无额外后端。API Key 仅存储在浏览器 `localStorage`，不经过任何服务器。

## 快速开始

**1. 获取 Gemini API Key**

前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 免费创建。

**2. 安装依赖并启动**

```bash
cd echo_CC
npm install
npm run dev
```

**3. 打开浏览器**

访问 `http://localhost:3000`，填入 API Key 即可开始。

## 项目结构

```
echo_CC/
├── app/
│   ├── page.tsx       # 全部逻辑与 UI
│   ├── layout.tsx
│   └── globals.css
├── package.json
└── ...
```

## 注意事项

- 使用 `gemini-2.5-flash` 模型，需确保 API Key 有访问权限
- 免费账户有每日配额限制，超限后次日重置
- 对话内容不被保存，刷新页面后清空
