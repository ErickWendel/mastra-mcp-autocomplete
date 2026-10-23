import type { FastifyReply } from 'fastify'
import type { AgentEvent } from '../types/agent-event.ts'

// Server-sent events: the browser receives each step as it happens.
export function openStream(reply: FastifyReply) {
    reply.hijack()
    reply.raw.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
    return {
        send: (event: AgentEvent) => { reply.raw.write(`data: ${JSON.stringify(event)}\n\n`) },
        close: () => { reply.raw.end() },
    }
}
