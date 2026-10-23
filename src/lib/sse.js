// Server-sent events: the browser receives each step as it happens.
export function openStream(reply) {
    reply.hijack()
    reply.raw.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
    return {
        send: event => reply.raw.write(`data: ${JSON.stringify(event)}\n\n`),
        close: () => reply.raw.end(),
    }
}
