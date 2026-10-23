import { formsAsJsonSchema } from '../mastra/schemas.js'

// GET /api/forms -> the zod schemas as JSON Schema, so the page draws the same form the agent fills.
export function formsRoute(app) {
    const forms = formsAsJsonSchema()
    app.get('/api/forms', () => forms)
}
