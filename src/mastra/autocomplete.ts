import { config } from '../config.ts'
import { runTask } from './agent/run-task.ts'
import { tasks } from './tasks/tasks.ts'
import type { AutocompleteFunction } from '../types/autocomplete-function.ts'

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
