import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../public/js/storage.ts'

// the browser's localStorage, in memory
const fakeStorage = () => {
    const data = new Map<string, string>()
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
}

test('saves newest first, survives a reload and removes', () => {
    const storage = fakeStorage()
    const store = createStore(storage)
    const { item: first } = store.save({ url: 'https://a.com/1', title: 'one' })
    const { item: second } = store.save({ url: 'https://a.com/2', title: 'two' })
    assert.deepEqual(store.list().map(item => item.id), [second.id, first.id])

    const reloaded = createStore(storage)
    assert.equal(reloaded.list().length, 2)
    reloaded.remove(first.id)
    assert.deepEqual(createStore(storage).list().map(item => item.title), ['two'])
})

test('never saves the same URL twice (query, hash and trailing slash ignored)', () => {
    const store = createStore(fakeStorage())
    const { item } = store.save({ url: 'https://a.com/post' })
    const again = store.save({ url: 'https://a.com/post/?utm_source=x#top' })
    assert.equal(again.duplicate, true)
    assert.equal(again.item.id, item.id)
    assert.equal(store.list().length, 1)
})

test('still works when localStorage is unavailable (private mode)', () => {
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    const store = createStore(broken)
    store.save({ url: 'https://a.com/1' })
    assert.equal(store.list().length, 1)
})
