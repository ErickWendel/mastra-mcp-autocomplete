import { config } from '../config.ts'
import { runTask } from './agent/run-task.ts'
import { tasks } from './tasks/tasks.ts'
import type { Talk } from './form/schema.ts'

// Everything streamed to the page while the agents work.
export type AgentEvent =
    | { type: 'model', modelId: string }
    | { type: 'tool', task: string, tool: string, args: unknown }
    | { type: 'fields', task: string, fields: Partial<Talk> }
    | { type: 'warning', message: string }
    | { type: 'done', modelId: string, fields: Partial<Talk>, tookMs: number }
    | { type: 'error', message: string }

// What the HTTP route needs from the agents: this function, or a fake in the tests.
export type AutocompleteFunction = (options: {
    url: string
    onEvent?: (event: AgentEvent) => void
    signal?: AbortSignal
}) => Promise<{ modelId: string, fields: Partial<Talk> }>

const messageOf = (reason: unknown) => reason instanceof Error ? reason.message : String(reason)

// 11. Putting it together: every task runs at the same time and the form fills from all of them as they find things.
//     One task failing doesn't stop the others.
export const autocomplete: AutocompleteFunction = async ({ url, onEvent = () => { }, signal }) => {
    onEvent({ type: 'model', modelId: config.model })
    const results = await Promise.allSettled(tasks.map(task => runTask({ task, url, onEvent, signal })))

    const failures = results.flatMap((result, index) => result.status === 'rejected' ? [{ task: tasks[index], reason: result.reason }] : [])
    if (!signal?.aborted) failures.forEach(({ task, reason }) => onEvent({ type: 'warning', message: `${task?.name}: ${messageOf(reason)}` }))

    const fields = Object.assign({}, ...results.map(result => result.status === 'fulfilled' ? result.value : {}))
    if (!Object.keys(fields).length) throw failures[0]?.reason ?? new Error('the agents found nothing on this page')
    return { modelId: config.model, fields }
}
