import { byId } from './by-id.ts'
import { getForm } from './api/get-form.ts'
import { streamAutocomplete } from './api/stream-autocomplete.ts'
import { createStore } from './storage.ts'
import { createProgress } from './progress.ts'
import { createSchemaForm } from './schema-form.ts'
import { renderGrid } from './grid.ts'
import type { AgentEvent } from '../../src/mastra/autocomplete.ts'

// Wires the pieces together: URL ➜ agents' stream ➜ form (filled live) ➜ save (localStorage) ➜ grid.
const urlInput = byId<HTMLInputElement>('url')
const runButton = byId<HTMLButtonElement>('autocomplete')
const saveButton = byId<HTMLButtonElement>('save')

const schema = await getForm()
const store = createStore()
const progress = createProgress(byId('progress'))
const form = createSchemaForm(byId('fields'))
let current: { url: string, modelId?: string, tookMs?: number } | null = null
let running: AbortController | null = null

const refresh = (freshId?: string) => renderGrid(byId('grid'), byId('count'), store.list(), freshId)

// while the agents work, the URL can't change and the button stops the run instead
function setRunning(controller: AbortController | null) {
    running = controller
    urlInput.disabled = Boolean(controller)
    runButton.textContent = controller ? '■ Stop' : 'Autocomplete'
    runButton.classList.toggle('stop', Boolean(controller))
}

function onStep(step: AgentEvent) {
    progress.add(step)
    if (step.type === 'fields') form.fill(step.fields)
    if (step.type === 'done' && current) {
        Object.assign(current, { modelId: step.modelId, tookMs: step.tookMs })
        progress.finish(`filled by ${step.modelId}: review and save`)
    }
    if (step.type === 'error') progress.finish(step.message, true)
}

async function run() {
    const url = urlInput.value.trim()
    if (running || !/^https?:\/\//.test(url)) return
    form.render(schema)
    // already saved: no need to ask the agents again
    const existing = store.findByUrl(url)
    if (existing) {
        current = null
        progress.start(url)
        progress.finish('already saved: it is highlighted below', true)
        return refresh(existing.id)
    }
    const controller = new AbortController()
    current = { url }
    saveButton.disabled = false
    progress.start(url)
    setRunning(controller)
    try {
        for await (const step of streamAutocomplete(url, controller.signal)) onStep(step)
    } catch (error) {
        progress.finish(controller.signal.aborted ? 'stopped: keep what was found or clear it' : String((error as Error)?.message ?? error), true)
    } finally {
        setRunning(null)
    }
}

// stopping aborts the request; the server sees the connection close and stops the agents
const stop = () => running?.abort()

function reset() {
    stop()
    current = null
    urlInput.value = ''
    saveButton.disabled = true
    byId('progress').hidden = true
    form.render(schema)
}

byId('url-form').addEventListener('submit', event => { event.preventDefault(); running ? stop() : run() })
urlInput.addEventListener('paste', () => setTimeout(run))
byId('clear').addEventListener('click', reset)

byId('contribution').addEventListener('submit', event => {
    event.preventDefault()
    if (!current) return
    const { item } = store.save({ ...form.values(), ...current })
    reset()
    refresh(item.id)
})

byId('grid').addEventListener('click', event => {
    const id = (event.target as HTMLElement).dataset.remove
    if (!id) return
    store.remove(id)
    refresh()
})

form.render(schema)
refresh()
