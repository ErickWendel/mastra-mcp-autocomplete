import { createTool } from '@mastra/core/tools'
import { schema } from './schemas.js'

// 4. A local tool with a side effect: the agent calls it every time it finds something, and `onFields` sends
//    those fields to the page right away. Its input schema is the part of the form this agent fills, so the
//    values arrive typed and two agents never write the same field. Its answer tells the agent what's missing.
// models sometimes send placeholders instead of leaving a field out
const isEmpty = value => value == null || (Array.isArray(value) ? !value.length : /^(|none|null|n\/a|unknown)$/i.test(String(value).trim()))

export function createUpdateForm(fields, onFields) {
    const missing = new Set(fields)
    return createTool({
        id: 'update_form',
        description: 'Fills form fields. Call it as soon as you find any field; call it many times, each time with only the new fields you found. It answers with the fields still missing.',
        inputSchema: schema.pick(Object.fromEntries(fields.map(field => [field, true]))).partial(),
        execute: async input => {
            const found = Object.fromEntries(Object.entries(input).filter(([, value]) => !isEmpty(value)))
            for (const field of Object.keys(found)) missing.delete(field)
            if (Object.keys(found).length) onFields(found)
            return { saved: Object.keys(found), missing: [...missing] }
        },
    })
}
