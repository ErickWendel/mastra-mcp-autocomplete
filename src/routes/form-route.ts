import { z } from 'zod'
import { schema } from '../mastra/schema.ts'
import type { FastifyInstance } from 'fastify'

// GET /api/form -> the zod schema as JSON Schema, so the page draws the same form the agents fill.
export function formRoute(app: FastifyInstance) {
    const form = z.toJSONSchema(schema)
    app.get('/api/form', () => form)
}
