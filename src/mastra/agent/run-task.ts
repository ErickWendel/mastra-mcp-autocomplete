import { config } from '../../config.ts'
import { browsers } from '../browser/browsers.ts'
import { createAgent } from './create-agent.ts'
import { createUpdateForm } from '../form/update-form.ts'
import { stepPlan } from './step-plan.ts'
import { toolCallInfo } from './tool-call-info.ts'
import { withoutReasoning } from '../model/without-reasoning.ts'
import type { AgentEvent } from '../../types/agent-event.ts'
import type { Task } from '../../types/task.ts'
import type { Talk } from '../../types/talk.ts'

const prepareStep = stepPlan({ firstSteps: ['browser_navigate'], maxSteps: config.maxSteps })

// 10. One task: an agent with its own browser and its own part of the form; every step is reported with the task's
//     name. It stops when its fields are all filled, when it stops finding new ones, when its time is up (keeping what
//     it found), or when the user stops the run.
export async function runTask({ task, url, onEvent, signal }: {
    task: Task
    url: string
    onEvent: (event: AgentEvent) => void
    signal?: AbortSignal
}) {
    const fields: Partial<Talk> = {}
    let idleSteps = 0
    const complete = new AbortController()
    const taskSignal = AbortSignal.any([complete.signal, AbortSignal.timeout(config.taskTimeoutMs), ...(signal ? [signal] : [])])

    const updateForm = createUpdateForm(task.fields, found => {
        Object.assign(fields, found)
        idleSteps = 0
        onEvent({ type: 'fields', task: task.name, fields: found })
        if (task.fields.every(field => field in fields)) complete.abort()
    })
    const agent = createAgent({ task, tools: { ...await browsers.tools(task.name), update_form: updateForm } })

    try {
        await agent.generate(`Fill your part of the form, starting at ${url}`, {
            maxSteps: config.maxSteps,
            abortSignal: taskSignal,
            prepareStep,
            // one browser, one page: a step's tool calls run in order ("click a tab, then search it"), never at once
            toolCallConcurrency: 1,
            modelSettings: { temperature: 0 },
            providerOptions: withoutReasoning,
            onStepFinish: ({ toolCalls = [] }) => {
                if (Object.keys(fields).length && ++idleSteps > config.idleSteps) complete.abort()
                for (const { tool, args } of toolCalls.map(toolCallInfo)) {
                    if (tool !== 'update_form') onEvent({ type: 'tool', task: task.name, tool, args })
                }
            },
        })
    } catch (error) {
        // finishing early, a time limit or a late failure keeps what was already found
        if (signal?.aborted || !Object.keys(fields).length) throw error
    }
    return fields
}
