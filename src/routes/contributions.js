import { schemas } from '../mastra/schemas.js'

// The saved grid: list, save (after reviewing the form) and delete.
export function contributionsRoutes(app, { store }) {
    app.get('/api/contributions', () => store.list())

    app.post('/api/contributions', async (request, reply) => {
        const { url, type, modelId, tookMs, fields } = request.body ?? {}
        const parsed = schemas[type]?.safeParse(fields ?? {})
        if (!/^https?:\/\//.test(url ?? '') || !parsed?.success) return reply.code(400).send({ error: parsed?.error?.message ?? 'url and type are required' })
        const { item, duplicate } = await store.save({ url, type, modelId, tookMs, ...parsed.data })
        return reply.code(duplicate ? 409 : 201).send(item)
    })

    app.delete('/api/contributions/:id', async (request, reply) => {
        await store.remove(request.params.id)
        return reply.code(204).send()
    })
}
