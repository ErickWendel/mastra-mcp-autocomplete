import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createUpdateForm } from '../src/mastra/form/update-form.ts'
import type { z } from 'zod'
import type { Talk } from '../src/types/talk.ts'

const run = (tool: ReturnType<typeof createUpdateForm>, input: Partial<Talk>) => tool.execute!(input, {} as never)

test('sends the fields it gets and answers with the ones still missing', async () => {
    const sent: Partial<Talk>[] = []
    const tool = createUpdateForm(['city', 'country', 'address'], fields => sent.push(fields))
    assert.deepEqual(await run(tool, { city: 'Madrid', address: '' }), { saved: ['city'], missing: ['country', 'address'] })
    assert.deepEqual(sent, [{ city: 'Madrid' }])
})

test('ignores placeholders like "none" and empty lists', async () => {
    const sent: Partial<Talk>[] = []
    const tool = createUpdateForm(['summary', 'tags', 'date'], fields => sent.push(fields))
    assert.deepEqual(await run(tool, { summary: 'none', tags: [], date: '2026-11-14' }), { saved: ['date'], missing: ['summary', 'tags'] })
    assert.deepEqual(sent, [{ date: '2026-11-14' }])
})

test('only accepts its own part of the form', () => {
    // Mastra types the input as a generic standard schema; it is the zod object built from the form
    const input = createUpdateForm(['city'], () => { }).inputSchema as unknown as z.ZodObject
    assert.equal(input.safeParse({ city: 'Madrid' }).success, true)
    assert.deepEqual(Object.keys(input.shape), ['city'])
})
