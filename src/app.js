import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { autocompleteRoute } from './routes/autocomplete.js'
import { formsRoute } from './routes/forms.js'

// The HTTP app: runs the agent and serves the page. Built from its dependency so the tests pass a fake agent.
export async function buildApp({ autocomplete }) {
    const app = Fastify()
    await app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) })
    autocompleteRoute(app, { autocomplete })
    formsRoute(app)
    return app
}
