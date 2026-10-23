import { config } from './config.js'
import { buildApp } from './app.js'
import { autocomplete } from './mastra/autocomplete.js'
import { closeBrowsers } from './mastra/mcp.js'

if (!config.openRouterKey) throw new Error('OPEN_ROUTER_KEY is missing: copy .env.example to .env')

const app = await buildApp({ autocomplete })
await app.listen({ host: '127.0.0.1', port: config.port })
console.log(`open http://localhost:${config.port}`)

// the browsers (Playwright MCP) are shared between requests: close them on exit
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
    await Promise.allSettled([closeBrowsers(), app.close()])
    process.exit(0)
})
