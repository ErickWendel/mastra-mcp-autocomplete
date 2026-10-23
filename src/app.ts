import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { join } from 'node:path'
import { autocompleteRoute } from './routes/autocomplete-route.ts'
import { browserScriptsRoute } from './routes/browser-scripts-route.ts'
import { formRoute } from './routes/form-route.ts'
import type { AutocompleteFunction } from './types/autocomplete-function.ts'

// The HTTP app: runs the agents and serves the page. Built from its dependency so the tests pass a fake agent.
export async function buildApp({ autocomplete }: { autocomplete: AutocompleteFunction }) {
    const app = Fastify()
    await app.register(fastifyStatic, { root: join(import.meta.dirname, '../public') })
    browserScriptsRoute(app)
    autocompleteRoute(app, { autocomplete })
    formRoute(app)
    return app
}
