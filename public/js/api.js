// Talks to the server. The autocomplete answer is a stream (server-sent events over a POST),
// read chunk by chunk so every step shows up as soon as it happens.
export async function autocomplete(url, onEvent) {
    const response = await fetch('/api/autocomplete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })
    if (!response.ok) throw new Error((await response.json()).error)
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    for (; ;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const messages = buffer.split('\n\n')
        buffer = messages.pop()
        for (const message of messages) if (message.startsWith('data: ')) onEvent(JSON.parse(message.slice(6)))
    }
}

export const listContributions = () => fetch('/api/contributions').then(r => r.json())
export const removeContribution = id => fetch(`/api/contributions/${id}`, { method: 'DELETE' })
