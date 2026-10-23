import type { AgentEvent } from '../../src/mastra/autocomplete.ts'

const prefix = (task: string) => `[${task}] `

// One line for the progress panel, or nothing for events it doesn't list.
export function describeEvent(event: AgentEvent) {
    switch (event.type) {
        case 'model': return `thinking with ${event.modelId}`
        case 'tool': {
            const args = (event.args ?? {}) as { url?: string, element?: string, text?: string }
            return `${prefix(event.task)}${event.tool} ${args.url ?? args.element ?? args.text ?? ''}`.trim()
        }
        case 'fields': return `${prefix(event.task)}filled ${Object.keys(event.fields).join(', ')}`
        case 'warning': return event.message
        default: return null
    }
}
