# Aria — AI Sourcing Copilot

A client-side vanilla HTML/CSS/JS prototype for an AI-powered conversational sourcing copilot. The entire procurement workflow happens through a persistent chat interface.

## Quick Start

**Live demo:** https://ayushsisodia007.github.io/AYUSH-Personal/

> **One-time setup:** Open [Repository Settings → Pages](https://github.com/ayushsisodia007/AYUSH-Personal/settings/pages), set **Source** to **Deploy from a branch**, choose branch **`gh-pages`** and folder **`/ (root)`**, then click **Save**. The site goes live in ~1 minute.

Or open `aria-sourcing-copilot/index.html` locally in your browser. No build step, no npm, no backend required.

## Features

- **10-step conversational flow**: requirement → RFQ → benchmarks → suppliers → publish → responses → award
- **Rich inline cards**: metadata tables, RFQ preview, benchmarks, supplier panels, bid comparison
- **NLP parser**: understands confirmations, supplier selection, numbered options, and more
- **State persistence**: saved to `localStorage` (`aria_v9_state`)
- **Demo navigator**: floating button (bottom-right) to jump to any step

## Reset

Run `hardReset()` in the browser console, or click **Start new conversation** in the sidebar.

## Files

| File | Purpose |
|------|---------|
| `aria-sourcing-copilot/index.html` | Layout: sidebar + chat panel |
| `aria-sourcing-copilot/style.css` | Design system (Inter, dark sidebar, card styles) |
| `aria-sourcing-copilot/app.js` | State, NLP, flow logic, card builders |
