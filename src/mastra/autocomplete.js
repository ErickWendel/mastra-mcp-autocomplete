import { config } from '../config.js'
import { createBrowserAgent } from './agent.js'
import { browserTools } from './mcp.js'
import { createFormFiller } from './form-filler.js'

const shortName = name => String(name).replace(/^browser_/, '')
// prepareStep runs before every step and can force the tool: the first step always opens the page
const openThePageFirst = ({ stepNumber }) => stepNumber === 0 ? { toolChoice: { type: 'tool', toolName: 'browser_navigate' } } : undefined
// MCP tools answer with { content: [{ type: 'text', text }] }
const resultText = result => result?.content?.map(part => part.text ?? '').join('\n') ?? JSON.stringify(result ?? '')
// each finding says which call produced it ("find {"text":"Erick Wendel"}"), so the form agent knows what it's looking at
const finding = ({ payload = {}, ...rest }) => {
    const { toolName, args, result } = { ...rest, ...payload }
    return `> ${shortName(toolName)} ${JSON.stringify(args ?? {})}\n${resultText(result)}`
}

// 7. Putting it together: the browser agent browses with the MCP tools; after every step, what its tools saw goes
//    to the form filler, and every new version of the form's JSON is sent to the page.
export async function autocomplete({ type, url, onEvent = () => { }, signal }) {
    const filler = createFormFiller(type, {
        signal,
        onChange: form => onEvent({ type: 'fields', fields: form }),
        onError: error => onEvent({ type: 'warning', message: `form update skipped: ${error.message}` }),
    })
    const browser = createBrowserAgent({ type, tools: await browserTools() })

    onEvent({ type: 'model', modelId: config.model })
    await browser.generate(`Research ${url}`, {
        maxSteps: config.maxSteps,
        abortSignal: signal,
        prepareStep: openThePageFirst,
        modelSettings: { temperature: 0 },
        onStepFinish: ({ toolCalls = [], toolResults = [] }) => {
            for (const call of toolCalls) onEvent({ type: 'tool', tool: shortName(call.payload?.toolName ?? call.toolName), args: call.payload?.args ?? call.args })
            if (toolResults.length) filler.add(toolResults.map(finding).join('\n\n'))
        },
    })

    const fields = await filler.result()
    if (Object.values(fields).every(value => value == null)) throw new Error('the agent found nothing on this page')
    return { modelId: config.model, fields }
}
