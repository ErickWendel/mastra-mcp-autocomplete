import { detectType } from '../lib/detect-type.js'
import { openStream } from '../lib/sse.js'

// POST /api/autocomplete { url } -> a stream of steps, ending with the saved contribution
export function autocompleteRoute(app, { store, autocomplete }) {
    app.post('/api/autocomplete', async (request, reply) => {
        const { url } = request.body ?? {}
        if (!/^https?:\/\//.test(url ?? '')) return reply.code(400).send({ error: 'paste an http(s) URL' })

        const stream = openStream(reply)
        const type = detectType(url)
        stream.send({ type: 'detected', contributionType: type })
        try {
            const existing = await store.findByUrl(url)
            if (existing) return stream.send({ type: 'saved', item: existing, duplicate: true })

            const started = Date.now()
            const { modelId, fields } = await autocomplete({ type, url, onEvent: stream.send })
            const { item, duplicate } = await store.save({ url, type, modelId, tookMs: Date.now() - started, ...fields })
            stream.send({ type: 'saved', item, duplicate })
        } catch (error) {
            stream.send({ type: 'error', message: error.message })
        } finally {
            stream.close()
        }
    })
}
