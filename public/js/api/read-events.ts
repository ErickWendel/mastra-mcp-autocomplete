import type { AgentEvent } from '../../../src/mastra/autocomplete.ts'

// Server-sent events from a fetch response body, one at a time, as an async generator:
// `for await (const event of readEvents(body))`. EventSource can't do this: it only sends GET requests.
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AgentEvent> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        buffer += decoder.decode(chunk.value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''
        for (const message of messages) if (message.startsWith('data: ')) yield JSON.parse(message.slice(6))
    }
}
