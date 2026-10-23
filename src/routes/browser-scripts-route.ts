import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'

const scripts = join(import.meta.dirname, '../../public/js')

// GET /js/<path>.ts -> the page's TypeScript with its types stripped by Node itself (the same thing `node file.ts`
// does), so the browser gets plain JavaScript with no build step. Types shared with the server (`import type`) vanish.
export function browserScriptsRoute(app: FastifyInstance) {
    app.get<{ Params: { '*': string } }>('/js/*', async (request, reply) => {
        const path = request.params['*']
        if (!/^[\w-]+(\/[\w-]+)*\.ts$/.test(path)) return reply.code(404).send()
        const source = await readFile(join(scripts, path), 'utf8').catch(() => null)
        if (source === null) return reply.code(404).send()
        return reply.type('text/javascript').send(stripTypeScriptTypes(source))
    })
}
