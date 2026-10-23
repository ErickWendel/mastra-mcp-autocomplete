import { config } from '../config.js'
import { createAgent } from './agent.js'
import { createBrowser } from './mcp.js'
import { schemas } from './schemas.js'
import { modelFor } from './model.js'

// 6. Putting it together: browse with the MCP tools, then answer with the schema.
//    `onEvent` reports every tool call, so the page can show what the agent is doing.
export async function autocomplete({ type, url, onEvent = () => { } }) {
    const browser = createBrowser()
    try {
        const toolsets = await browser.listToolsets()
        for (const modelId of config.models) {
            onEvent({ type: 'model', modelId })
            try {
                const result = await createAgent(type, modelId).generate(`Open ${url} and fill the form.`, {
                    toolsets,
                    maxSteps: config.maxSteps,
                    modelSettings: { temperature: 0 },
                    // a separate structuring model lets the agent use tools first and answer with the schema last
                    structuredOutput: { schema: schemas[type], model: modelFor(modelId), errorStrategy: 'strict' },
                    onStepFinish: ({ toolCalls = [] }) => {
                        for (const call of toolCalls) onEvent({ type: 'tool', tool: call.payload?.toolName ?? call.toolName, args: call.payload?.args ?? call.args })
                    },
                })
                return { modelId, fields: result.object }
            } catch (error) {
                onEvent({ type: 'retry', modelId, message: error.message })
            }
        }
        throw new Error('no model could fill the form')
    } finally {
        await browser.disconnect()
    }
}
