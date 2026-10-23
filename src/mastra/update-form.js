import { createTool } from '@mastra/core/tools'
import { schema } from './schemas.js'

// 3. A local tool with a side effect: the agent calls it every time it finds something, and `onFields` sends
//    those fields to the page right away. The input schema is the form itself, so the values arrive typed.
export function createUpdateForm(onFields) {
    return createTool({
        id: 'update_form',
        description: 'Fills form fields. Call it as soon as you find any field; call it many times, each time with only the new fields you found ({} when nothing is new).',
        inputSchema: schema.partial(),
        execute: async fields => {
            const found = Object.fromEntries(Object.entries(fields).filter(([, value]) => value != null && value !== ''))
            if (Object.keys(found).length) onFields(found)
            return { saved: Object.keys(found) }
        },
    })
}
