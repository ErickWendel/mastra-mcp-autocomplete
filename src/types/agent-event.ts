import type { Talk } from './talk.ts'

// Everything the server streams to the page while the agents work.
export type AgentEvent =
    | { type: 'model', modelId: string }
    | { type: 'tool', task: string, tool: string, args: unknown }
    | { type: 'fields', task: string, fields: Partial<Talk> }
    | { type: 'warning', message: string }
    | { type: 'done', modelId: string, fields: Partial<Talk>, tookMs: number }
    | { type: 'error', message: string }
