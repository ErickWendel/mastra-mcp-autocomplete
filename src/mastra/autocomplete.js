import { config } from '../config.js'
import { createAgent } from './agent.js'
import { strategies } from './strategies.js'
import { createUpdateForm } from './tools/update-form.js'
import { stepPlan } from './step-plan.js'

const toolName = name => String(name).replace(/^browser_/, '')

// 8. Putting it together: run the agent with the strategy's tools and stream what happens.
//    Fields arrive through update_form while the agent works; there's no final "answer" to parse.
export async function autocomplete({ type, url, onEvent = () => { }, signal, mode = config.browseMode }) {
    const strategy = strategies[mode]
    const tools = await strategy.tools()
    const prepareStep = stepPlan({ firstSteps: strategy.firstSteps, maxSteps: config.maxSteps })

    const modelId = config.model
    const fields = {}
    const updateForm = createUpdateForm(type, found => {
        Object.assign(fields, found)
        onEvent({ type: 'fields', fields: found })
    })
    onEvent({ type: 'model', modelId })
    await createAgent({ type, modelId, rules: strategy.rules, tools: { ...tools, update_form: updateForm } }).generate(`Fill the form for ${url}`, {
        maxSteps: config.maxSteps,
        abortSignal: signal,
        prepareStep,
        modelSettings: { temperature: 0 },
        onStepFinish: ({ toolCalls = [] }) => {
            for (const call of toolCalls) {
                const name = call.payload?.toolName ?? call.toolName
                if (name !== 'update_form') onEvent({ type: 'tool', tool: toolName(name), args: call.payload?.args ?? call.args })
            }
        },
    })
    if (!Object.keys(fields).length) throw new Error('the agent found nothing on this page')
    return { modelId, fields }
}
