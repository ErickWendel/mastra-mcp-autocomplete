import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { autocompleteRoute } from './routes/autocomplete.js'
import { contributionsRoutes } from './routes/contributions.js'

// The HTTP app, built from its dependencies (the tests pass fakes).
export async function buildApp({ store, autocomplete }) {
    const app = Fastify()
    await app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) })
    autocompleteRoute(app, { store, autocomplete })
    contributionsRoutes(app, { store })
    return app
}
