import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.ts'
import type { FastifyInstance } from 'fastify'
import type { AgentEvent } from '../src/types/agent-event.ts'
import type { AutocompleteFunction } from '../src/types/autocomplete-function.ts'

// a fake agent: the routes are tested without a browser or a model
const fakeAutocomplete: AutocompleteFunction = async ({ onEvent = () => { } }) => {
    onEvent({ type: 'model', modelId: 'fake/model' })
    onEvent({ type: 'tool', task: 'talk', tool: 'navigate', args: { url: 'https://event.dev' } })
    onEvent({ type: 'fields', task: 'talk', fields: { title: 'A talk' } })
    return { modelId: 'fake/model', fields: { title: 'A talk' } }
}

const events = (body: string): AgentEvent[] => body.split('\n\n').filter(Boolean).map(chunk => JSON.parse(chunk.replace(/^data: /, '')))
const post = (app: FastifyInstance, payload: object) => app.inject({ method: 'POST', url: '/api/autocomplete', payload })

test('streams the steps and the fields', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const steps = events((await post(app, { url: 'https://event.dev/agenda' })).body)
    assert.deepEqual(steps.map(step => step.type), ['model', 'tool', 'fields', 'done'])
    assert.deepEqual(steps.at(-1), { ...steps.at(-1), fields: { title: 'A talk' } })
})

test('an agent failure ends the stream with an error', async () => {
    const app = await buildApp({ autocomplete: async () => { throw new Error('boom') } })
    assert.deepEqual(events((await post(app, { url: 'https://event.dev' })).body).at(-1), { type: 'error', message: 'boom' })
})

test('a new run cancels the one in progress', async () => {
    const app = await buildApp({
        // the first run waits until it is cancelled; the second one finishes right away
        autocomplete: options => options.url.endsWith('/slow')
            ? new Promise((_, reject) => options.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
            : fakeAutocomplete(options),
    })
    const slow = post(app, { url: 'https://event.dev/slow' })
    await new Promise(resolve => setTimeout(resolve, 20))
    const fast = await post(app, { url: 'https://event.dev/fast' })

    assert.equal(events(fast.body).at(-1)?.type, 'done')
    assert.deepEqual(events((await slow).body), [])
})

test('rejects anything that is not a URL', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    assert.equal((await post(app, { url: 'hello' })).statusCode, 400)
})

test('serves the form as JSON Schema', async () => {
    const app = await buildApp({ autocomplete: fakeAutocomplete })
    const form = (await app.inject('/api/form')).json()
    assert.ok(form.properties.title)
    assert.ok(form.properties.address)
})
