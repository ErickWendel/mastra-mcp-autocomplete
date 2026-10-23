import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.ts'

const app = await buildApp({ autocomplete: async () => ({ modelId: 'fake', fields: {} }) })

test('serves the page TypeScript as JavaScript, types stripped', async () => {
    const response = await app.inject('/js/talks/talk-store.ts')
    assert.equal(response.statusCode, 200)
    assert.match(String(response.headers['content-type']), /text\/javascript/)
    assert.match(response.body, /export function createTalkStore/)
    assert.doesNotMatch(response.body, /: SavedTalk\[\]|import type/)
})

test('serves files in subfolders and nothing outside public/js', async () => {
    assert.equal((await app.inject('/js/api/get-form.ts')).statusCode, 200)
    assert.equal((await app.inject('/js/missing.ts')).statusCode, 404)
    assert.equal((await app.inject('/js/..%2F..%2Fsrc%2Fconfig.ts')).statusCode, 404)
})
