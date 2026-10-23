import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.js'

// a fake agent: the routes are tested without a browser or a model
const fakeAutocomplete = async ({ onEvent }) => {
    onEvent({ type: 'model', modelId: 'fake/model' })
    onEvent({ type: 'tool', tool: 'navigate', args: { url: 'https://event.dev' } })
    onEvent({ type: 'fields', fields: { title: 'A talk' } })
    return { modelId: 'fake/model', fields: { title: 'A talk' } }
}

const events = body => body.split('\n\n').filter(Boolean).map(chunk => JSON.parse(chunk.replace(/^data: /, '')))
const post = (app, payload) => app.inject({ method: 'POST', url: '/api/autocomplete', payload })

test('streams the steps and the fields', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const steps = events((await post(app, { url: 'https://event.dev/agenda' })).body)
    assert.deepEqual(steps.map(step => step.type), ['model', 'tool', 'fields', 'done'])
    assert.deepEqual(steps.at(-1).fields, { title: 'A talk' })
})

test('an agent failure ends the stream with an error', async () => {
    const app = await buildApp({ autocomplete: async () => { throw new Error('boom') } })
    const last = events((await post(app, { url: 'https://event.dev' })).body).at(-1)
    assert.deepEqual(last, { type: 'error', message: 'boom' })
})

test('rejects anything that is not a URL', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    assert.equal((await post(app, { url: 'hello' })).statusCode, 400)
})

test('serves the form as JSON Schema', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const form = (await app.inject('/api/form')).json()
    assert.ok(form.properties.title)
    assert.ok(form.properties.venue)
})
