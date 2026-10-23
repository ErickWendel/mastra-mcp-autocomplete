# Mastra + MCP autocomplete

Paste a post, YouTube or event URL (even an event's home page). A [Mastra](https://mastra.ai) agent browses it like a
person through the [Playwright MCP server](https://github.com/microsoft/playwright-mcp): it opens the page, *searches* it
for what it needs (`browser_find`), zooms into one section (`browser_snapshot` with a target), and clicks through to the
agenda, the talk or the venue. Every field it finds is pushed to the form right away (the `update_form` tool); you review
it and save it to a local grid.

```
URL ─▶ detect type ─▶ Mastra Agent ──▶ Playwright MCP: navigate · find · snapshot(target) · click
                           │
                           └─▶ update_form (as it goes) ─▶ SSE ─▶ form fills live ─▶ Save ─▶ data/contributions.json
```

## Run it

```bash
nvm use            # Node 22
npm install
cp .env.example .env   # add your OPEN_ROUTER_KEY (free models are used)
npm start              # http://localhost:3333
npm test
```

## How it works: read the Mastra files in order

Each file in `src/mastra/` does one thing (the number is in each file's first comment):

| # | File | What it shows |
|---|------|---------------|
| 1 | `model.js` | A model through OpenRouter (`@openrouter/ai-sdk-provider`); Mastra speaks the AI SDK interface. |
| 2 | `schemas.js` | The form as zod schemas (talk, post, video). The same schema is the `update_form` input and the page's form (as JSON Schema). |
| 3 | `tools/read-page.js`, `tools/update-form.js` | Local tools with `createTool`: a plain fetch, and a tool whose side effect streams fields to the page. |
| 4 | `mcp.js` | `MCPClient` starts the Playwright MCP server over stdio once; only 5 tools are exposed (fewer tools = a faster, less confused model, and no `run_code_unsafe`). |
| 5 | `strategies.js` | How it browses: `mcp` (search then zoom, like a person) or `hybrid` (fetch first). Set with `BROWSE_MODE`. |
| 6 | `instructions.js` | The system prompt: what to look for, the navigation playbook (home page → agenda → talk → venue), never guess. |
| 7 | `agent.js` | `new Agent({ instructions, model, tools })`. |
| 8 | `autocomplete.js` + `step-plan.js` | `agent.generate()` with `maxSteps`, `onStepFinish` (live steps), `abortSignal` (cancel) and `prepareStep`, which forces the first step (open the page) and an `update_form` every few steps and on the last one. |

Things worth showing in the video:

- **Tools beat a final answer for live UIs.** The agent never returns JSON at the end: it calls `update_form` whenever it
  finds something, and the page fills while it's still browsing.
- **`prepareStep` turns "please do X" into "X happens".** Free models don't always follow instructions; forcing the tool
  choice on specific steps makes the flow reliable.
- **Token-cheap browsing.** `browser_navigate` returns only the title; `browser_find` returns snippets; a snapshot is
  only taken of one section. Compare with `BROWSE_MODE=hybrid` on a YouTube link (its meta tags already have everything).
- `npm run try -- <url>` runs the agent in the terminal with timings, no page needed.

## The rest of the app

| Folder | Responsibility |
|--------|----------------|
| `src/lib/detect-type.js` | URL ➜ `video` / `post` / `talk`. |
| `src/lib/sse.js` | Server-sent events so the page sees each step live. |
| `src/storage/contributions-store.js` | JSON file storage; the same URL is never saved twice. |
| `src/lib/page-content.js` | HTML ➜ meta tags, JSON-LD, text, links (used by `read_page`). |
| `src/routes/` | `POST /api/autocomplete` (stream of steps and fields), `GET/POST/DELETE /api/contributions`, `GET /api/forms`. |
| `src/app.js` / `src/server.js` | Fastify app built from injectable dependencies, and its entry point. |
| `public/` | No-build front end: `api.js` (reads the stream), `schema-form.js` (form from JSON Schema, filled live), `type-picker.js`, `progress.js`, `grid.js`, `app.js`. |

## Configuration

| Variable | Default |
|----------|---------|
| `OPEN_ROUTER_KEY` | required |
| `PORT` | `3333` |
| `BROWSE_MODE` | `mcp` (or `hybrid`) |
| `MODEL` | `nvidia/nemotron-3.5-super-vl:free` |
| `SPEAKER_NAME` | `Erick Wendel` (used to tell the speaker's own talk apart on event pages) |
