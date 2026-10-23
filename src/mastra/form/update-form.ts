import { createTool } from '@mastra/core/tools'
import { schema } from './schema.ts'
import { isEmpty } from './is-empty.ts'
import type { Talk } from '../../types/talk.ts'
import type { TalkField } from '../../types/talk-field.ts'

// 5. A local tool with a side effect: the agent calls it every time it finds something, and `onFields` sends those
//    fields to the page right away. Its input schema is the part of the form this agent fills, so the values arrive
//    typed and two agents never write the same field. Its answer tells the agent what's still missing.
export function createUpdateForm(fields: TalkField[], onFields: (found: Partial<Talk>) => void) {
    let missing = new Set(fields)
    const ownFields = Object.fromEntries(fields.map(field => [field, true])) as Partial<Record<TalkField, true>>

    return createTool({
        id: 'update_form',
        description: 'Fills form fields. Call it as soon as you find any field; call it many times, each time with only the new fields you found. It answers with the fields still missing.',
        inputSchema: schema.pick(ownFields).partial(),
        execute: async input => {
            const found: Partial<Talk> = Object.fromEntries(Object.entries(input).filter(([, value]) => !isEmpty(value)))
            missing = missing.difference(new Set(Object.keys(found) as TalkField[]))
            if (Object.keys(found).length) onFields(found)
            return { saved: Object.keys(found), missing: [...missing] }
        },
    })
}
