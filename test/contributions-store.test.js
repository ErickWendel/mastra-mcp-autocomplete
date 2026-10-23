import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { createStore } from '../src/storage/contributions-store.js'

const tempStore = () => createStore(pathToFileURL(join(mkdtempSync(join(tmpdir(), 'store-')), 'contributions.json')))

test('saves, lists newest first and removes', async () => {
    const store = tempStore()
    const { item: first } = await store.save({ url: 'https://a.com/1', title: 'one' })
    await new Promise(resolve => setTimeout(resolve, 5))
    const { item: second } = await store.save({ url: 'https://a.com/2', title: 'two' })
    assert.deepEqual((await store.list()).map(item => item.id), [second.id, first.id])

    await store.remove(first.id)
    assert.deepEqual((await store.list()).map(item => item.title), ['two'])
})

test('never saves the same URL twice (query, hash and trailing slash ignored)', async () => {
    const store = tempStore()
    const { item } = await store.save({ url: 'https://a.com/post' })
    const again = await store.save({ url: 'https://a.com/post/?utm_source=x#top' })
    assert.equal(again.duplicate, true)
    assert.equal(again.item.id, item.id)
    assert.equal((await store.findByUrl('https://a.com/post/')).id, item.id)
    assert.equal((await store.list()).length, 1)
})
