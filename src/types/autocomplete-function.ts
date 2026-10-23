import type { AgentEvent } from './agent-event.ts'
import type { Talk } from './talk.ts'

// What the HTTP route needs from the agents: the real ones, or a fake in the tests.
export type AutocompleteFunction = (options: {
    url: string
    onEvent?: (event: AgentEvent) => void
    signal?: AbortSignal
}) => Promise<{ modelId: string, fields: Partial<Talk> }>
