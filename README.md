# Mastra + MCP autocomplete

Paste an event's link: the agenda, a talk page or even the home page. Two [Mastra](https://mastra.ai) agents work on
it at the same time, each with its own browser through the [Playwright MCP server](https://github.com/microsoft/playwright-mcp):
one finds the talk (agenda → speaker → talk page), the other finds the event and its address. They browse like a person:
open the page, *search* it (`browser_find`), zoom into one section (`browser_snapshot` with a target), click through.
Every field they find is pushed to the form right away (the `update_form` tool); you review it and save it to a grid kept
in your browser (localStorage). The button turns into **Stop** while they work.

```
                ┌─▶ talk agent  ── Playwright MCP #1 ──▶ update_form(title, summary, date, language, tags) ─┐
event URL ──────┤                                                                                         ├─▶ SSE ─▶ form fills live ─▶ Save ─▶ localStorage
                └─▶ event agent ── Playwright MCP #2 ──▶ update_form(eventName, venue, city, country, …) ─┘
```

## Run it

```bash
nvm use                # Node 22
npm install
cp .env.example .env   # add your OPEN_ROUTER_KEY
npm start              # http://localhost:3333
npm test
npm run try -- <url>   # the agent in the terminal, with timings
```

## How it works: read the Mastra files in order

Each file in `src/mastra/` does one thing (the number is in each file's first comment):

| # | File | What it shows |
|---|------|---------------|
| 1 | `model.js` | A model through OpenRouter (`@openrouter/ai-sdk-provider`); Mastra speaks the AI SDK interface. Claude Haiku 5.5 by default (about $0.001 per run); reasoning is turned off for speed. |
| 2 | `schemas.js` | The talk form as a zod schema: the `update_form` input and the page's form (as JSON Schema). |
| 3 | `tasks.js` | The independent tasks (talk, event): each one's goal and its part of the form. |
| 4 | `update-form.js` | A local tool (`createTool`) for one task's fields: it streams them to the page and answers with what's still missing. |
| 5 | `mcp.js` | `MCPClient` starts one Playwright MCP server per task over stdio (one browser can't serve two agents); only 5 tools are exposed (no `run_code_unsafe`). |
| 6 | `instructions.js` | The task's goal + how to browse (search, then zoom in) + never guess. |
| 7 | `agent.js` | `new Agent({ instructions, model, tools })`, one per task. |
| 8 | `step-plan.js` | `prepareStep`: forces the first step (open the page) and an `update_form` every few steps and on the last one. |
| 9 | `autocomplete.js` | The tasks run in parallel (`Promise.allSettled`); each `agent.generate()` gets `maxSteps`, `prepareStep`, `toolCallConcurrency: 1` (a step's browser actions run in order, so "click a tab, then search it" works), `onStepFinish` and an `abortSignal` that fires on Stop, when its fields are complete, after `idleSteps` steps without anything new, or after `taskTimeoutMs`. |

Things worth showing:

- **Split independent work, run it in parallel.** The talk and the address don't depend on each other: two agents with
  two browsers fill the form in about half the time, and one failing doesn't stop the other.
- **Tools beat a final answer for live UIs.** `update_form` fills the form while the agents are still browsing, and its
  answer (`missing: [...]`) steers what each agent looks for next.
- **`prepareStep` turns "please do X" into "X happens"** by forcing the tool choice on specific steps.
- **Token-cheap browsing, and reasoning off.** `browser_navigate` returns only the title, `browser_find` returns snippets,
  a snapshot covers one section; with reasoning off most steps take about a second.

## The rest of the app

| Path | Responsibility |
|------|----------------|
| `src/config.js` | Model, step budget, speaker name. |
| `src/lib/sse.js` | Server-sent events so the page sees each step live. |
| `src/routes/` | `POST /api/autocomplete` (stream of steps and fields) and `GET /api/form`. The server saves nothing. |
| `src/app.js` / `src/server.js` | Fastify app built from injectable dependencies, and its entry point. |
| `public/` | No-build front end: `api.js` (reads the stream), `schema-form.js` (form from JSON Schema, filled live), `storage.js` (saved grid in localStorage, no duplicate URLs), `progress.js`, `grid.js`, `app.js`. |
| `scripts/try.js` | Runs the agent from the terminal. |

## Configuration

`.env` holds only `OPEN_ROUTER_KEY` and `PORT` (default `3333`); `SPEAKER_NAME` (default `Erick Wendel`) is optional.
The model, the step budget, the idle-step limit and the per-task time limit are in `src/config.js`.

The default model, `anthropic/claude-haiku-5.5`, costs about $0.001 per run and fills a talk in 10-20 seconds. Free models
work but aren't reliable: the best one we tried, `nvidia/nemotron-3.5-lightning:free`, is as fast but often gets dates
wrong, and free models stall or get rate-limited when OpenRouter's free tier is busy.

It's a local, single-user app: the two browsers are shared between runs, so one autocomplete runs at a time (a new
one cancels the run in progress).
