// Saved contributions live in this browser (localStorage); nothing is written on the server.
// The same URL (ignoring query, hash and trailing slash) is never saved twice.
const KEY = 'mastra-mcp-autocomplete:contributions'
const clean = url => url.split(/[?#]/)[0].replace(/\/+$/, '')

export function createStore(storage = globalThis.localStorage) {
    // localStorage can be missing or full (private mode): then the list lives only while the page is open
    let items
    try { items = JSON.parse(storage.getItem(KEY)) ?? [] } catch { items = [] }
    const persist = () => { try { storage.setItem(KEY, JSON.stringify(items)) } catch { } }

    return {
        list: () => [...items],
        findByUrl: url => items.find(item => clean(item.url) === clean(url)) ?? null,
        save(entry) {
            const existing = this.findByUrl(entry.url)
            if (existing) return { item: existing, duplicate: true }
            const item = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...entry }
            items = [item, ...items]
            persist()
            return { item, duplicate: false }
        },
        remove(id) {
            items = items.filter(item => item.id !== id)
            persist()
        },
    }
}
