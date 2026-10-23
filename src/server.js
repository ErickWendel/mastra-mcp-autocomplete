import { config } from './config.js'
import { buildApp } from './app.js'
import { createStore } from './storage/contributions-store.js'
import { autocomplete } from './mastra/autocomplete.js'
import { closeBrowser } from './mastra/mcp.js'

if (!config.openRouterKey) throw new Error('OPEN_ROUTER_KEY is missing: copy .env.example to .env')

const app = await buildApp({ store: createStore(config.dataFile), autocomplete })
await app.listen({ host: '127.0.0.1', port: config.port })
console.log(`open http://localhost:${config.port}`)

// the browser (Playwright MCP) is shared between requests: close it on exit
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
    await Promise.allSettled([closeBrowser(), app.close()])
    process.exit(0)
})
