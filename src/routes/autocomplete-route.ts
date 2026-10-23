import { openStream } from '../lib/open-stream.ts'
import type { FastifyInstance } from 'fastify'
import type { AutocompleteFunction } from '../types/autocomplete-function.ts'

// POST /api/autocomplete { url } -> a stream of steps; fields arrive as the agents find them.
// Nothing is saved on the server: the page reviews the form and keeps it in localStorage.
export function autocompleteRoute(app: FastifyInstance, { autocomplete }: { autocomplete: AutocompleteFunction }) {
    // the agents' browsers are shared, so only one run at a time: a new run (another tab, or Stop then Autocomplete)
    // cancels the one in progress and waits for it to let go of the browsers
    let current: { controller: AbortController, finished: Promise<void> } | null = null

    app.post<{ Body: { url?: string } }>('/api/autocomplete', async (request, reply) => {
        const url = request.body?.url ?? ''
        if (!/^https?:\/\//.test(url)) return reply.code(400).send({ error: "paste an event page's http(s) URL" })

        if (current) {
            current.controller.abort()
            await current.finished
        }
        const controller = new AbortController()
        const { promise: finished, resolve: finish } = Promise.withResolvers<void>()
        current = { controller, finished }

        const stream = openStream(reply)
        // closing the page (or the Stop button) stops the agents
        reply.raw.on('close', () => controller.abort())
        const started = Date.now()
        try {
            const { modelId, fields } = await autocomplete({ url, onEvent: stream.send, signal: controller.signal })
            stream.send({ type: 'done', modelId, fields, tookMs: Date.now() - started })
        } catch (error) {
            if (!controller.signal.aborted) stream.send({ type: 'error', message: error instanceof Error ? error.message : String(error) })
        } finally {
            stream.close()
            if (current?.controller === controller) current = null
            finish()
        }
    })
}
