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
                └─▶ event agent ── Playwright MCP #2 ──▶ update_form(eventName, address, city, country, …) ─┘
```

## Run it

```bash
nvm use                # Node 24 (LTS): runs TypeScript directly
npm install
cp .env.example .env   # add your OPEN_ROUTER_KEY
npm start              # http://localhost:3333
npm test               # node:test, no browser or model needed
npm run typecheck      # tsc --noEmit
npm run try -- <url>   # the agents in the terminal, with timings
```

## TypeScript without a build step

Node 24 runs `.ts` files by stripping the types, so there is no compiler in the loop: `tsc` only checks them.
That's why `tsconfig.json` allows only syntax that can be erased (`erasableSyntaxOnly`: no enums or namespaces),
types are imported with `import type` (`verbatimModuleSyntax`) and imports keep their `.ts` extension.

The browser can't run TypeScript, so `src/routes/browser-scripts-route.ts` strips the types of `public/js/*.ts` with
Node's own `stripTypeScriptTypes` as it serves them. The page and the server share types (`AgentEvent`, `Talk`) through
`import type`, which disappears before the browser sees it.

Every file has one export and one job. Modern bits used along the way: `await using` (the browsers close themselves),
`Promise.withResolvers`, `Set#difference`, iterator helpers, `AbortSignal.any`/`timeout`, async generators with
`for await` (the page reads the agents' stream) and `import.meta.dirname`.

## How it works: read the Mastra files in order

Each file in `src/mastra/` does one thing (the number is in each file's first comment):

| # | File | What it shows |
|---|------|---------------|
| 1 | `model.ts` | A model through OpenRouter (`@openrouter/ai-sdk-provider`); Mastra speaks the AI SDK interface. Claude Haiku 5.5 by default (about $0.001 per run). |
| 2 | `without-reasoning.ts` | Provider options that turn the model's reasoning off: ~1s per step instead of ~10s. |
| 3 | `schema.ts` | The talk form as a zod schema: the `update_form` input, the page's form (as JSON Schema) and the `Talk` type. |
| 4 | `tasks/talk-task.ts`, `tasks/event-task.ts`, `tasks/tasks.ts` | The independent tasks: each one's goal and its part of the form. |
| 5 | `update-form.ts` (+ `is-empty.ts`) | A local tool (`createTool`) for one task's fields: it streams them to the page and answers with what's still missing. |
| 6 | `browsers.ts` | `MCPClient` starts one Playwright MCP server per task over stdio (one browser can't serve two agents); only 5 tools are exposed (no `run_code_unsafe`). |
| 7 | `instructions-for.ts` | The task's goal + how to browse (search, then zoom in) + never guess. |
| 8 | `create-agent.ts` | `new Agent({ instructions, model, tools })`, one per task. |
| 9 | `step-plan.ts` | `prepareStep`: forces the first step (open the page) and an `update_form` every few steps and on the last one. |
| 10 | `run-task.ts` (+ `tool-call-info.ts`) | One task's `agent.generate()`: `maxSteps`, `prepareStep`, `toolCallConcurrency: 1` (a step's browser actions run in order, so "click a tab, then search it" works), `onStepFinish` and an `abortSignal` that fires on Stop, when its fields are complete, after `idleSteps` steps without anything new, or after `taskTimeoutMs`. |
| 11 | `autocomplete.ts` | The tasks run in parallel (`Promise.allSettled`); one failing doesn't stop the other. |

Things worth showing:

- **Split independent work, run it in parallel.** The talk and the address don't depend on each other: two agents with
  two browsers fill the form in about half the time.
- **Tools beat a final answer for live UIs.** `update_form` fills the form while the agents are still browsing, and its
  answer (`missing: [...]`) steers what each agent looks for next.
- **`prepareStep` turns "please do X" into "X happens"** by forcing the tool choice on specific steps.
- **Token-cheap browsing, and reasoning off.** `browser_navigate` returns only the title, `browser_find` returns snippets,
  a snapshot covers one section; with reasoning off most steps take about a second.

## The rest of the app

| Path | Responsibility |
|------|----------------|
| `src/config.ts` | Model, step budget, idle steps, per-task time limit, speaker name. |
| `src/types/` | Shared types: `Talk`, `TalkField`, `Task`, `AgentEvent`, `AutocompleteFunction`. |
| `src/lib/open-stream.ts` | Server-sent events so the page sees each step live. |
| `src/routes/` | `POST /api/autocomplete` (one run at a time; a new one cancels the previous), `GET /api/form`, and the route that serves the page's TypeScript as JavaScript. The server saves nothing. |
| `src/app.ts` / `src/server.ts` | Fastify app built from an injectable `autocomplete` (the tests pass a fake), and its entry point. |
| `public/js/` | The page, one export per file: `api/` (the stream as an async generator, the form), `schema-form.ts` + `field-kind.ts` (form from JSON Schema, filled live), `storage.ts` (saved talks in localStorage, no duplicate URLs), `progress.ts` + `describe-event.ts`, `grid.ts`, `escape-html.ts`, `by-id.ts`, `app.ts` (wiring). |
| `scripts/try.ts` | Runs the agents from the terminal (`await using` closes the browsers). |

## Configuration

`.env` holds only `OPEN_ROUTER_KEY` and `PORT` (default `3333`); `SPEAKER_NAME` (default `Erick Wendel`) is optional.
The model, the step budget, the idle-step limit and the per-task time limit are in `src/config.ts`.

The default model, `anthropic/claude-haiku-5.5`, costs about $0.001 per run and fills a talk in 10-20 seconds. Free models
work but aren't reliable: the best one we tried, `nvidia/nemotron-3.5-lightning:free`, is as fast but often gets dates
wrong, and free models stall or get rate-limited when OpenRouter's free tier is busy.

It's a local, single-user app: the two browsers are shared between runs, so one autocomplete runs at a time (a new
one cancels the run in progress).
