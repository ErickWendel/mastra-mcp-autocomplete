import { autocomplete } from '../src/mastra/autocomplete.js'
import { closeBrowsers } from '../src/mastra/mcp.js'

// Runs the agent from the terminal, no server or page: npm run try -- <url> [<url>...]
for (const url of process.argv.slice(2)) {
    const started = Date.now()
    const at = () => `${((Date.now() - started) / 1000).toFixed(1)}s`.padStart(6)
    const describe = event => JSON.stringify(event.fields ?? event.args ?? event.modelId ?? event.message ?? '').slice(0, 140)
    console.log(`\n${url}`)
    try {
        const { modelId, fields } = await autocomplete({ url, onEvent: event => console.log(at(), (event.task ?? '').padEnd(5), event.type.padEnd(7), describe(event)) })
        console.log(at(), 'done  ', modelId, '\n', fields)
    } catch (error) {
        console.log(at(), 'failed', error.message)
    }
}
await closeBrowsers()
