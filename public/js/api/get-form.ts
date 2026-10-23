import type { FieldSchema } from '../field-kind.ts'

// The form's JSON Schema, served by GET /api/form.
export type FormSchema = { properties: Record<string, FieldSchema> }

// The form's JSON Schema: the page draws the same form the agents fill.
export async function getForm(): Promise<FormSchema> {
    const response = await fetch('/api/form')
    if (!response.ok) throw new Error(`could not load the form (HTTP ${response.status})`)
    return response.json()
}
