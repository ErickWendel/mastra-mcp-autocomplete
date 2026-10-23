import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.js'

// an in-memory store and a fake agent: the routes are tested without a browser or a model
function memoryStore() {
    const items = []
    return {
        list: async () => items,
        findByUrl: async url => items.find(item => item.url === url) ?? null,
        save: async entry => { const item = { id: String(items.length + 1), ...entry }; items.push(item); return { item, duplicate: false } },
        remove: async () => { },
    }
}

const fakeAutocomplete = async ({ onEvent }) => {
    onEvent({ type: 'model', modelId: 'fake/model' })
    onEvent({ type: 'tool', tool: 'navigate', args: { url: 'https://youtu.be/x' } })
    onEvent({ type: 'fields', fields: { title: 'A video' } })
    return { modelId: 'fake/model', fields: { title: 'A video' } }
}

const events = body => body.split('\n\n').filter(Boolean).map(chunk => JSON.parse(chunk.replace(/^data: /, '')))
const post = (app, url, payload) => app.inject({ method: 'POST', url, payload })

test('streams the steps and the fields, without saving', async () => {
    const store = memoryStore()
    const app = await buildApp({ store, autocomplete: fakeAutocomplete })
    const response = await post(app, '/api/autocomplete', { url: 'https://youtu.be/VhwIJrhjqcQ' })

    const steps = events(response.body)
    assert.deepEqual(steps.map(step => step.type), ['detected', 'model', 'tool', 'fields', 'done'])
    assert.equal(steps[0].contributionType, 'video')
    assert.deepEqual(steps.at(-1).fields, { title: 'A video' })
    assert.equal((await store.list()).length, 0)
})

test('the chosen type wins over the detected one', async () => {
    const app = await buildApp({ store: memoryStore(), autocomplete: fakeAutocomplete })
    const response = await post(app, '/api/autocomplete', { url: 'https://youtu.be/VhwIJrhjqcQ', type: 'talk' })
    assert.equal(events(response.body)[0].contributionType, 'talk')
})

test('a URL already saved is not sent to the agent again', async () => {
    const store = memoryStore()
    await store.save({ url: 'https://youtu.be/VhwIJrhjqcQ', title: 'old' })
    const app = await buildApp({ store, autocomplete: () => assert.fail('agent called') })
    const last = events((await post(app, '/api/autocomplete', { url: 'https://youtu.be/VhwIJrhjqcQ' })).body).at(-1)
    assert.equal(last.type, 'duplicate')
    assert.equal(last.item.title, 'old')
})

test('rejects anything that is not a URL', async () => {
    const app = await buildApp({ store: memoryStore(), autocomplete: fakeAutocomplete })
    assert.equal((await post(app, '/api/autocomplete', { url: 'hello' })).statusCode, 400)
})

test('saves the reviewed form, validated by the zod schema', async () => {
    const store = memoryStore()
    const app = await buildApp({ store, autocomplete: fakeAutocomplete })
    const saved = await post(app, '/api/contributions', { url: 'https://youtu.be/x', type: 'video', modelId: 'm', fields: { title: 'A video', views: 10 } })
    assert.equal(saved.statusCode, 201)
    assert.equal((await store.list())[0].views, 10)

    const invalid = await post(app, '/api/contributions', { url: 'https://youtu.be/y', type: 'video', fields: { views: 'many' } })
    assert.equal(invalid.statusCode, 400)
})

test('serves the forms as JSON Schema', async () => {
    const app = await buildApp({ store: memoryStore(), autocomplete: fakeAutocomplete })
    const forms = (await app.inject('/api/forms')).json()
    assert.deepEqual(Object.keys(forms), ['talk', 'post', 'video'])
    assert.ok(forms.talk.properties.eventName)
})
