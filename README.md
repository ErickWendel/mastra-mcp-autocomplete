# Mastra + MCP autocomplete

Paste a post, YouTube or event URL. A [Mastra](https://mastra.ai) agent opens it in a real browser through the
[Playwright MCP server](https://github.com/microsoft/playwright-mcp), reads the page, and returns a typed card
(title, summary, date, tags…) that is saved locally and shown in a grid.

```
URL ─▶ detect type ─▶ Mastra Agent ──tools──▶ Playwright MCP (headless Chrome)
                           │
                           └─▶ structured output (zod) ─▶ data/contributions.json ─▶ grid
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

Each file in `src/mastra/` does one thing:

| # | File | What it shows |
|---|------|---------------|
| 1 | `model.js` | Pick a model through OpenRouter (`@openrouter/ai-sdk-provider`). |
| 2 | `mcp.js` | Start the Playwright MCP server with `MCPClient`: the agent's browser tools. |
| 3 | `schemas.js` | The answer's shape as zod schemas, one per type (talk, post, video). |
| 4 | `instructions.js` | The system prompt: what to look for, and never guess. |
| 5 | `agent.js` | `new Agent({ instructions, model })`. |
| 6 | `autocomplete.js` | `agent.generate()` with the MCP `toolsets`, `maxSteps`, `structuredOutput` and `onStepFinish` (live steps), falling back to the next model on failure. |

Two details worth calling out:

- **`structuredOutput.model`** makes the agent use the tools first and then produce the schema in a separate step.
  Without it, the model tends to answer right away (often with made-up fields) instead of browsing.
- **`listToolsets()`** passes the MCP tools per call, and `disconnect()` in `finally` closes the browser every time.

## The rest of the app

| Folder | Responsibility |
|--------|----------------|
| `src/lib/detect-type.js` | URL ➜ `video` / `post` / `talk`. |
| `src/lib/sse.js` | Server-sent events so the page sees each step live. |
| `src/storage/contributions-store.js` | JSON file storage; the same URL is never saved twice. |
| `src/routes/` | `POST /api/autocomplete` (stream) and `GET/DELETE /api/contributions`. |
| `src/app.js` / `src/server.js` | Fastify app built from injectable dependencies, and its entry point. |
| `public/` | No-build front end: `api.js` (reads the stream), `progress.js`, `grid.js`, `app.js`. |

## Configuration

| Variable | Default |
|----------|---------|
| `OPEN_ROUTER_KEY` | required |
| `PORT` | `3333` |
| `SPEAKER_NAME` | `Erick Wendel` (used to tell the speaker's own talk apart on event pages) |
