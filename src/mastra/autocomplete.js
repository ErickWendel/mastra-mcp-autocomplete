import { config } from '../config.js'
import { createAgent } from './agent.js'
import { browserTools } from './mcp.js'
import { createUpdateForm } from './update-form.js'
import { stepPlan } from './step-plan.js'

const prepareStep = stepPlan({ firstSteps: ['browser_navigate'], maxSteps: config.maxSteps })
const shortName = name => String(name).replace(/^browser_/, '')

// 8. Putting it together: the MCP browser tools + update_form, streaming every step.
//    Fields arrive through update_form while the agent works; there's no final answer to parse.
export async function autocomplete({ type, url, onEvent = () => { }, signal }) {
    const fields = {}
    const updateForm = createUpdateForm(type, found => {
        Object.assign(fields, found)
        onEvent({ type: 'fields', fields: found })
    })
    const agent = createAgent({ type, tools: { ...(await browserTools()), update_form: updateForm } })

    onEvent({ type: 'model', modelId: config.model })
    try {
        await agent.generate(`Fill the form for ${url}`, {
            maxSteps: config.maxSteps,
            abortSignal: signal,
            prepareStep,
            modelSettings: { temperature: 0 },
            onStepFinish: ({ toolCalls = [] }) => {
                for (const call of toolCalls) {
                    const name = call.payload?.toolName ?? call.toolName
                    if (name !== 'update_form') onEvent({ type: 'tool', tool: shortName(name), args: call.payload?.args ?? call.args })
                }
            },
        })
    } catch (error) {
        // a failure late in the run (a page that times out...) keeps what was already found
        if (signal?.aborted || !Object.keys(fields).length) throw error
    }
    if (!Object.keys(fields).length) throw new Error('the agent found nothing on this page')
    return { modelId: config.model, fields }
}
