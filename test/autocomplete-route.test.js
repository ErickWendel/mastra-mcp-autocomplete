import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.js'

// an in-memory store and a fake agent: the route is tested without a browser or a model
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
    onEvent({ type: 'tool', tool: 'browser_navigate', args: { url: 'https://youtu.be/x' } })
    return { modelId: 'fake/model', fields: { title: 'A video' } }
}

const events = body => body.split('\n\n').filter(Boolean).map(chunk => JSON.parse(chunk.replace(/^data: /, '')))

test('streams the steps and saves the result', async () => {
    const store = memoryStore()
    const app = await buildApp({ store, autocomplete: fakeAutocomplete })
    const response = await app.inject({ method: 'POST', url: '/api/autocomplete', payload: { url: 'https://youtu.be/VhwIJrhjqcQ' } })

    assert.deepEqual(events(response.body).map(event => event.type), ['detected', 'model', 'tool', 'saved'])
    assert.equal(events(response.body)[0].contributionType, 'video')
    const [saved] = await store.list()
    assert.equal(saved.title, 'A video')
    assert.equal(saved.modelId, 'fake/model')
})

test('a URL already saved is not sent to the agent again', async () => {
    const store = memoryStore()
    await store.save({ url: 'https://youtu.be/VhwIJrhjqcQ', title: 'old' })
    const app = await buildApp({ store, autocomplete: () => assert.fail('agent called') })
    const response = await app.inject({ method: 'POST', url: '/api/autocomplete', payload: { url: 'https://youtu.be/VhwIJrhjqcQ' } })
    const last = events(response.body).at(-1)
    assert.equal(last.duplicate, true)
    assert.equal(last.item.title, 'old')
})

test('rejects anything that is not a URL', async () => {
    const app = await buildApp({ store: memoryStore(), autocomplete: fakeAutocomplete })
    const response = await app.inject({ method: 'POST', url: '/api/autocomplete', payload: { url: 'hello' } })
    assert.equal(response.statusCode, 400)
})
