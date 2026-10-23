import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

// Saved contributions live in a local JSON file; the same URL is never saved twice.
export function createStore(file) {
    const path = fileURLToPath(file)
    const read = () => readFile(path, 'utf8').then(JSON.parse).catch(() => [])
    const write = async items => {
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, JSON.stringify(items, null, 2))
    }
    // writes run one at a time, so two saves at once can't overwrite each other
    let queue = Promise.resolve()
    const serial = task => (queue = queue.then(task, task))
    const clean = url => url.split(/[?#]/)[0].replace(/\/+$/, '')
    const sameUrl = (a, b) => clean(a) === clean(b)

    return {
        list: async () => (await read()).sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
        findByUrl: async url => (await read()).find(item => sameUrl(item.url, url)) ?? null,
        save: entry => serial(async () => {
            const items = await read()
            const existing = items.find(item => sameUrl(item.url, entry.url))
            if (existing) return { item: existing, duplicate: true }
            const item = { id: randomUUID(), savedAt: new Date().toISOString(), ...entry }
            await write([item, ...items])
            return { item, duplicate: false }
        }),
        remove: id => serial(async () => {
            const items = await read()
            await write(items.filter(item => item.id !== id))
        }),
    }
}
