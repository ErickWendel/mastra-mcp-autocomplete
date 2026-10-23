import type { FieldSchema } from './field-schema.ts'

// The form's JSON Schema, served by GET /api/form.
export type FormSchema = { properties: Record<string, FieldSchema> }
