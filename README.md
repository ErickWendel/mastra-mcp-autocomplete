# Mastra + MCP autocomplete

Paste a post, YouTube or event URL (even an event's home page). A [Mastra](https://mastra.ai) agent browses it like a
person through the [Playwright MCP server](https://github.com/microsoft/playwright-mcp): it opens the page, *searches* it
for what it needs (`browser_find`), zooms into one section (`browser_snapshot` with a target), and clicks through to the
agenda, the talk or the venue.

The form is a JSON object that starts with every field empty. After each browsing step, a second agent gets that JSON
plus what the browser just saw and returns it with more fields filled (structured output). Each new version goes to the
page, which shows whatever values it has. You review it and save it to a grid kept in your browser (localStorage).

```
URL ─▶ browser agent ──▶ Playwright MCP: navigate · find · snapshot(target) · click
             │ after each step: what the tools saw
             ▼
       form agent: { title: null, … } + findings ─▶ { title: "…", … } ─▶ SSE ─▶ form updates ─▶ Save ─▶ localStorage
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
| 1 | `model.js` | A model through OpenRouter (`@openrouter/ai-sdk-provider`); Mastra speaks the AI SDK interface. Reasoning can be turned off per call. |
| 2 | `schemas.js` | The form as zod schemas (talk, post, video): the form agent's structured output and the page's form (as JSON Schema). |
| 3 | `mcp.js` | `MCPClient` starts the Playwright MCP server over stdio once; only 5 tools are exposed (fewer tools = a faster, less confused model, and no `run_code_unsafe`). |
| 4 | `instructions.js` | One prompt per agent: how to browse (search, then zoom in; home page → agenda → talk → venue) and how to fill the form honestly. |
| 5 | `agent.js` | Two agents, one job each: the browser agent (MCP tools) and the form agent (no tools). |
| 6 | `form-filler.js` | The form's JSON state: each batch of findings goes to the form agent with `structuredOutput`, and the answer is merged (a filled field never goes back to empty). |
| 7 | `autocomplete.js` | `agent.generate()` with `maxSteps`, `prepareStep` (the first step always opens the page), `onStepFinish` (tool calls and their results) and `abortSignal`. |

Things worth showing:

- **Single responsibility for agents too.** The browser agent never writes JSON and the form agent never browses; each
  prompt stays short and each job can use different settings.
- **Partial results without streaming tricks.** The page always receives the whole form, empty fields included, and
  just shows the values it has.
- **`prepareStep` turns "please do X" into "X happens"** by forcing the tool choice on a step.
- **Token-cheap browsing.** `browser_navigate` returns only the title, `browser_find` returns snippets, and a snapshot is
  only taken of one section.
- **Reasoning is not free.** Turning it off for the form agent takes each update from ~10s to ~1s.

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
