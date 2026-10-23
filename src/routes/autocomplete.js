import { openStream } from '../lib/sse.js'

// POST /api/autocomplete { url } -> a stream of steps; fields arrive as the agent finds them.
// Nothing is saved on the server: the page reviews the form and keeps it in localStorage.
export function autocompleteRoute(app, { autocomplete }) {
    app.post('/api/autocomplete', async (request, reply) => {
        const { url } = request.body ?? {}
        if (!/^https?:\/\//.test(url ?? '')) return reply.code(400).send({ error: "paste an event page's http(s) URL" })

        const stream = openStream(reply)
        // closing the page (or pasting another URL) stops the agent
        const controller = new AbortController()
        reply.raw.on('close', () => controller.abort())
        const started = Date.now()
        try {
            const { modelId, fields } = await autocomplete({ url, onEvent: stream.send, signal: controller.signal })
            stream.send({ type: 'done', modelId, fields, tookMs: Date.now() - started })
        } catch (error) {
            if (!controller.signal.aborted) stream.send({ type: 'error', message: error.message })
        } finally {
            stream.close()
        }
    })
}
