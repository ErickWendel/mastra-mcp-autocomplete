import { detectType } from '../lib/detect-type.js'
import { openStream } from '../lib/sse.js'
import { TYPES } from '../mastra/schemas.js'

// POST /api/autocomplete { url, type? } -> a stream of steps; fields arrive as the agent finds them.
// Nothing is saved on the server: the page reviews the form and keeps it in localStorage.
export function autocompleteRoute(app, { autocomplete }) {
    app.post('/api/autocomplete', async (request, reply) => {
        const { url, type: chosen } = request.body ?? {}
        if (!/^https?:\/\//.test(url ?? '')) return reply.code(400).send({ error: 'paste an http(s) URL' })
        const type = TYPES.includes(chosen) ? chosen : detectType(url)

        const stream = openStream(reply)
        // closing the page (or pasting another URL) stops the agent
        const controller = new AbortController()
        reply.raw.on('close', () => controller.abort())
        const started = Date.now()
        stream.send({ type: 'detected', contributionType: type })
        try {
            const { modelId, fields } = await autocomplete({ type, url, onEvent: stream.send, signal: controller.signal })
            stream.send({ type: 'done', modelId, fields, tookMs: Date.now() - started })
        } catch (error) {
            if (!controller.signal.aborted) stream.send({ type: 'error', message: error.message })
        } finally {
            stream.close()
        }
    })
}
