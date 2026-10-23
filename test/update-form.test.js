import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createUpdateForm } from '../src/mastra/update-form.js'

test('sends the fields it gets and answers with the ones still missing', async () => {
    const sent = []
    const tool = createUpdateForm(['city', 'country', 'address'], fields => sent.push(fields))
    assert.deepEqual(await tool.execute({ city: 'Madrid', address: '' }, {}), { saved: ['city'], missing: ['country', 'address'] })
    assert.deepEqual(sent, [{ city: 'Madrid' }])
})

test('ignores placeholders like "none" and empty lists', async () => {
    const sent = []
    const tool = createUpdateForm(['summary', 'tags', 'date'], fields => sent.push(fields))
    const answer = await tool.execute({ summary: 'none', tags: [], date: '2026-11-14' }, {})
    assert.deepEqual(answer, { saved: ['date'], missing: ['summary', 'tags'] })
    assert.deepEqual(sent, [{ date: '2026-11-14' }])
})

test('only accepts its own part of the form', () => {
    const tool = createUpdateForm(['city'], () => { })
    assert.equal(tool.inputSchema.safeParse({ city: 'Madrid' }).success, true)
    assert.deepEqual(Object.keys(tool.inputSchema.shape), ['city'])
})
