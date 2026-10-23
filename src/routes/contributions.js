// The saved grid: list and delete.
export function contributionsRoutes(app, { store }) {
    app.get('/api/contributions', () => store.list())
    app.delete('/api/contributions/:id', async (request, reply) => {
        await store.remove(request.params.id)
        return reply.code(204).send()
    })
}
