import { autocomplete } from '../src/mastra/autocomplete.ts'
import { browsers } from '../src/mastra/browser/browsers.ts'
import type { AgentEvent } from '../src/types/agent-event.ts'

// Runs the agents from the terminal, no server or page: npm run try -- <url> [<url>...]
// `await using` closes the browsers when the script ends, even if something throws.
await using _ = browsers

const describe = (event: AgentEvent) => JSON.stringify(
    'fields' in event ? event.fields : 'args' in event ? event.args : 'modelId' in event ? event.modelId : 'message' in event ? event.message : '',
).slice(0, 140)

for (const url of process.argv.slice(2)) {
    const started = Date.now()
    const at = () => `${((Date.now() - started) / 1000).toFixed(1)}s`.padStart(6)
    console.log(`\n${url}`)
    try {
        const { modelId, fields } = await autocomplete({
            url,
            onEvent: event => console.log(at(), ('task' in event ? event.task : '').padEnd(5), event.type.padEnd(7), describe(event)),
        })
        console.log(at(), 'done  ', modelId, '\n', fields)
    } catch (error) {
        console.log(at(), 'failed', error instanceof Error ? error.message : error)
    }
}
