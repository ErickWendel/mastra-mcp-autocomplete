// One property of the form's JSON Schema (as zod's z.toJSONSchema writes it).
export type FieldSchema = {
    type?: string | string[]
    enum?: string[]
    anyOf?: FieldSchema[]
    description?: string
}
