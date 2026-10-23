import type { Talk } from '../../../src/mastra/form/schema.ts'

// A talk saved in the browser: the form's fields plus where it came from.
export type SavedTalk = Partial<Talk> & {
    id: string
    savedAt: string
    url: string
    modelId?: string
    tookMs?: number
}

// The saved talks, kept in this browser (localStorage); nothing is written on the server.
// The same URL (ignoring query, hash and trailing slash) is never saved twice.
const KEY = 'mastra-mcp-autocomplete:talks'
const clean = (url: string) => url.split(/[?#]/)[0]?.replace(/\/+$/, '') ?? url

export function createTalkStore(storage: Pick<Storage, 'getItem' | 'setItem'> = globalThis.localStorage) {
    // localStorage can be missing or full (private mode): then the list lives only while the page is open
    let items: SavedTalk[]
    try { items = JSON.parse(storage.getItem(KEY) ?? '[]') } catch { items = [] }
    const persist = () => { try { storage.setItem(KEY, JSON.stringify(items)) } catch { } }
    const findByUrl = (url: string) => items.find(item => clean(item.url) === clean(url)) ?? null

    return {
        list: () => [...items],
        findByUrl,
        save(entry: Omit<SavedTalk, 'id' | 'savedAt'>) {
            const existing = findByUrl(entry.url)
            if (existing) return { item: existing, duplicate: true }
            const item: SavedTalk = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...entry }
            items = [item, ...items]
            persist()
            return { item, duplicate: false }
        },
        remove(id: string) {
            items = items.filter(item => item.id !== id)
            persist()
        },
    }
}
