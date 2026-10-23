import { streamAutocomplete } from '../api/stream-autocomplete.ts'
import type { AgentEvent } from '../../../src/mastra/autocomplete.ts'

// One autocomplete at a time: starts the agents for a URL and hands each step to `onStep`. `stop()` aborts the request,
// and the server, seeing the connection close, stops the agents. `onChange` says when a run starts and ends.
export function createRun({ onStep, onChange, onFailure }: {
    onStep: (step: AgentEvent) => void
    onChange: (running: boolean) => void
    onFailure: (message: string) => void
}) {
    let controller: AbortController | null = null

    return {
        isActive: () => controller !== null,
        async start(url: string) {
            const current = controller = new AbortController()
            onChange(true)
            try {
                for await (const step of streamAutocomplete(url, current.signal)) onStep(step)
            } catch (error) {
                onFailure(current.signal.aborted ? 'stopped: keep what was found or clear it' : error instanceof Error ? error.message : String(error))
            } finally {
                controller = null
                onChange(false)
            }
        },
        stop: () => controller?.abort(),
    }
}
