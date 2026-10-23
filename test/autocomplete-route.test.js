import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.js'

// a fake agent: the routes are tested without a browser or a model
const fakeAutocomplete = async ({ onEvent }) => {
    onEvent({ type: 'model', modelId: 'fake/model' })
    onEvent({ type: 'tool', tool: 'navigate', args: { url: 'https://youtu.be/x' } })
    onEvent({ type: 'fields', fields: { title: 'A video' } })
    return { modelId: 'fake/model', fields: { title: 'A video' } }
}

const events = body => body.split('\n\n').filter(Boolean).map(chunk => JSON.parse(chunk.replace(/^data: /, '')))
const post = (app, payload) => app.inject({ method: 'POST', url: '/api/autocomplete', payload })

test('streams the steps and the fields', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const steps = events((await post(app, { url: 'https://youtu.be/VhwIJrhjqcQ' })).body)
    assert.deepEqual(steps.map(step => step.type), ['detected', 'model', 'tool', 'fields', 'done'])
    assert.equal(steps[0].contributionType, 'video')
    assert.deepEqual(steps.at(-1).fields, { title: 'A video' })
})

test('the chosen type wins over the detected one', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const steps = events((await post(app, { url: 'https://youtu.be/VhwIJrhjqcQ', type: 'talk' })).body)
    assert.equal(steps[0].contributionType, 'talk')
})

test('an agent failure ends the stream with an error', async () => {
    const app = await buildApp({ autocomplete: async () => { throw new Error('boom') } })
    const last = events((await post(app, { url: 'https://e.dev' })).body).at(-1)
    assert.deepEqual(last, { type: 'error', message: 'boom' })
})

test('rejects anything that is not a URL', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    assert.equal((await post(app, { url: 'hello' })).statusCode, 400)
})

test('serves the forms as JSON Schema', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const forms = (await app.inject('/api/forms')).json()
    assert.deepEqual(Object.keys(forms), ['talk', 'post', 'video'])
    assert.ok(forms.talk.properties.eventName)
})
