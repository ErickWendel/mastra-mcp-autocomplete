import { readEvents } from './read-events.ts'

// Starts the agents for a URL and yields each step as it happens. Aborting `signal` stops them on the server too.
export async function* streamAutocomplete(url: string, signal: AbortSignal) {
    const response = await fetch('/api/autocomplete', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
    })
    if (!response.ok || !response.body) throw new Error((await response.json()).error ?? `HTTP ${response.status}`)
    yield* readEvents(response.body)
}
