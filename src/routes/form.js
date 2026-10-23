import { formAsJsonSchema } from '../mastra/schemas.js'

// GET /api/form -> the zod schema as JSON Schema, so the page draws the same form the agent fills.
export function formRoute(app) {
    const form = formAsJsonSchema()
    app.get('/api/form', () => form)
}
