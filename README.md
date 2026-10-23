# Mastra + MCP autocomplete

Paste a post, YouTube or event URL (even an event's home page). A [Mastra](https://mastra.ai) agent browses it like a
person through the [Playwright MCP server](https://github.com/microsoft/playwright-mcp): it opens the page, *searches* it
for what it needs (`browser_find`), zooms into one section (`browser_snapshot` with a target), and clicks through to the
agenda, the talk or the venue. Every field it finds is pushed to the form right away (the `update_form` tool); you review
it and save it to a grid kept in your browser (localStorage).

```
URL ─▶ detect type ─▶ Mastra Agent ──▶ Playwright MCP: navigate · find · snapshot(target) · click
                           │
                           └─▶ update_form (as it goes) ─▶ SSE ─▶ form fills live ─▶ Save ─▶ localStorage
```

## Run it

```bash
nvm use                # Node 22
npm install
cp .env.example .env   # add your OPEN_ROUTER_KEY (the model is free)
npm start              # http://localhost:3333
npm test
npm run try -- <url>   # the agent in the terminal, with timings
```

## How it works: read the Mastra files in order

Each file in `src/mastra/` does one thing (the number is in each file's first comment):

| # | File | What it shows |
|---|------|---------------|
| 1 | `model.js` | A model through OpenRouter (`@openrouter/ai-sdk-provider`); Mastra speaks the AI SDK interface. |
| 2 | `schemas.js` | The form as zod schemas (talk, post, video). The same schema is the `update_form` input and the page's form (as JSON Schema). |
| 3 | `update-form.js` | A local tool (`createTool`) whose side effect streams the fields it receives to the page. |
| 4 | `mcp.js` | `MCPClient` starts the Playwright MCP server over stdio once; only 5 tools are exposed (fewer tools = a faster, less confused model, and no `run_code_unsafe`). |
| 5 | `instructions.js` | The system prompt: how to browse (search, then zoom in), the navigation playbook (home page → agenda → talk → venue), never guess. |
| 6 | `agent.js` | `new Agent({ instructions, model, tools })`. |
| 7 | `step-plan.js` | `prepareStep`: forces the first step (open the page) and an `update_form` every few steps and on the last one. |
| 8 | `autocomplete.js` | `agent.generate()` with `maxSteps`, `prepareStep`, `onStepFinish` (live steps) and `abortSignal` (cancel). |

Things worth showing:

- **Tools beat a final answer for live UIs.** The agent never returns JSON at the end: it calls `update_form` whenever it
  finds something, and the page fills while it's still browsing.
- **`prepareStep` turns "please do X" into "X happens".** Free models don't always follow instructions; forcing the tool
  choice on specific steps makes the flow reliable.
- **Token-cheap browsing.** `browser_navigate` returns only the title, `browser_find` returns snippets, and a snapshot is
  only taken of one section, instead of feeding the whole page to the model on every step.

## The rest of the app

| Path | Responsibility |
|------|----------------|
| `src/config.js` | Model, step budget, speaker name. |
| `src/lib/detect-type.js` | URL ➜ `video` / `post` / `talk`. |
| `src/lib/sse.js` | Server-sent events so the page sees each step live. |
| `src/routes/` | `POST /api/autocomplete` (stream of steps and fields) and `GET /api/forms`. The server saves nothing. |
| `src/app.js` / `src/server.js` | Fastify app built from injectable dependencies, and its entry point. |
| `public/` | No-build front end: `api.js` (reads the stream), `schema-form.js` (form from JSON Schema, filled live), `storage.js` (saved grid in localStorage, no duplicate URLs), `type-picker.js`, `progress.js`, `grid.js`, `app.js`. |
| `scripts/try.js` | Runs the agent from the terminal. |

## Configuration

`.env` holds only `OPEN_ROUTER_KEY` and `PORT` (default `3333`); `SPEAKER_NAME` (default `Erick Wendel`) is optional.
The model and the step budget are in `src/config.js`.

It's a local, single-user app: one shared browser serves one autocomplete at a time (pasting a new URL cancels the
previous run).
