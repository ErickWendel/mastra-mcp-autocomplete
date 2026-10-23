import { config } from '../config.js'
import { createAgent } from './agent.js'
import { browserTools } from './mcp.js'
import { createUpdateForm } from './update-form.js'
import { withoutReasoning } from './model.js'
import { stepPlan } from './step-plan.js'
import { tasks } from './tasks.js'

const prepareStep = stepPlan({ firstSteps: ['browser_navigate'], maxSteps: config.maxSteps })
const shortName = name => String(name).replace(/^browser_/, '')

// One task: an agent with its own browser and its own part of the form. Every step is reported with the task's name.
// It stops when its fields are all filled, when it stops finding new ones, or when its time is up (keeping what it
// found), or when the user stops the run.
async function runTask({ name, task, url, onEvent, signal }) {
    const fields = {}
    let idleSteps = 0
    const complete = new AbortController()
    const taskSignal = AbortSignal.any([signal, complete.signal, AbortSignal.timeout(config.taskTimeoutMs)].filter(Boolean))
    const updateForm = createUpdateForm(task.fields, found => {
        Object.assign(fields, found)
        idleSteps = 0
        onEvent({ type: 'fields', task: name, fields: found })
        if (task.fields.every(field => field in fields)) complete.abort()
    })
    const agent = createAgent({ name, task, tools: { ...(await browserTools(name)), update_form: updateForm } })
    try {
        await agent.generate(`Fill your part of the form, starting at ${url}`, {
            maxSteps: config.maxSteps,
            abortSignal: taskSignal,
            prepareStep,
            modelSettings: { temperature: 0 },
            providerOptions: withoutReasoning,
            onStepFinish: ({ toolCalls = [] }) => {
                if (Object.keys(fields).length && ++idleSteps > config.idleSteps) complete.abort()
                for (const call of toolCalls) {
                    const tool = call.payload?.toolName ?? call.toolName
                    if (tool !== 'update_form') onEvent({ type: 'tool', task: name, tool: shortName(tool), args: call.payload?.args ?? call.args })
                }
            },
        })
    } catch (error) {
        // finishing early, a time limit or a late failure keeps what was already found
        if (signal?.aborted || !Object.keys(fields).length) throw error
    }
    return fields
}

// 9. Putting it together: every task runs at the same time; the form fills from all of them as they find things.
//    One task failing doesn't stop the others.
export async function autocomplete({ url, onEvent = () => { }, signal }) {
    onEvent({ type: 'model', modelId: config.model })
    const results = await Promise.allSettled(Object.entries(tasks).map(([name, task]) => runTask({ name, task, url, onEvent, signal })))

    for (const [index, result] of results.entries()) {
        if (result.status === 'rejected' && !signal?.aborted) onEvent({ type: 'warning', message: `${Object.keys(tasks)[index]}: ${result.reason.message}` })
    }
    const fields = Object.assign({}, ...results.map(result => result.value ?? {}))
    if (!Object.keys(fields).length) throw results.find(result => result.reason)?.reason ?? new Error('the agents found nothing on this page')
    return { modelId: config.model, fields }
}
