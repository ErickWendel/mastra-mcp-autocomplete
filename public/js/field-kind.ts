// One property of the form's JSON Schema (as zod's z.toJSONSchema writes it).
export type FieldSchema = {
    type?: string | string[]
    enum?: string[]
    anyOf?: FieldSchema[]
    description?: string
}

const isNullOnly = (field: FieldSchema) => [field.type].flat().every(type => type === 'null')

// Which input a JSON Schema property becomes: a select for enums, a comma list for arrays, a number, a textarea or text.
export function fieldKind(name: string, field: FieldSchema) {
    const main = (field.anyOf ?? [field]).find(variant => !isNullOnly(variant)) ?? field
    if (main.enum) return { kind: 'select', options: main.enum } as const
    const type = [main.type].flat().find(type => type !== 'null')
    if (type === 'array') return { kind: 'tags' } as const
    if (type === 'number' || type === 'integer') return { kind: 'number' } as const
    return { kind: name === 'summary' ? 'textarea' : 'text' } as const
}
