import { byId } from './dom/by-id.ts'
import { getForm } from './api/get-form.ts'
import { createSchemaForm } from './form/schema-form.ts'
import { createProgress } from './progress/progress.ts'
import { createRun } from './run/create-run.ts'
import { createRunControls } from './run/run-controls.ts'
import { createStepHandler } from './run/step-handler.ts'
import { createTalkStore } from './talks/talk-store.ts'
import { renderTalkGrid } from './talks/talk-grid.ts'

// The page's wiring: URL ➜ agents' stream ➜ form (filled live) ➜ save (localStorage) ➜ grid.
const urlInput = byId<HTMLInputElement>('url')
const saveButton = byId<HTMLButtonElement>('save')

const schema = await getForm()
const store = createTalkStore()
const progress = createProgress(byId('progress'))
const form = createSchemaForm(byId('fields'))
const controls = createRunControls(urlInput, byId<HTMLButtonElement>('autocomplete'))

// the talk being filled: where it came from, and which model filled it (and how fast) once the agents are done
let draft: { url: string, modelId?: string, tookMs?: number } | null = null

const refresh = (freshId?: string) => renderTalkGrid(byId('grid'), byId('count'), store.list(), freshId)

const run = createRun({
    onStep: createStepHandler({ progress, form, onDone: ({ modelId, tookMs }) => { if (draft) Object.assign(draft, { modelId, tookMs }) } }),
    onChange: controls.setRunning,
    onFailure: message => progress.finish(message, true),
})

function start() {
    const url = urlInput.value.trim()
    if (run.isActive() || !/^https?:\/\//.test(url)) return
    form.render(schema)
    progress.start(url)
    // already saved: no need to ask the agents again
    const existing = store.findByUrl(url)
    if (existing) {
        draft = null
        progress.finish('already saved: it is highlighted below', true)
        return refresh(existing.id)
    }
    draft = { url }
    saveButton.disabled = false
    void run.start(url)
}

function reset() {
    run.stop()
    draft = null
    urlInput.value = ''
    saveButton.disabled = true
    byId('progress').hidden = true
    form.render(schema)
}

function save(event: SubmitEvent) {
    event.preventDefault()
    if (!draft) return
    const { item } = store.save({ ...form.values(), ...draft })
    reset()
    refresh(item.id)
}

function remove(event: MouseEvent) {
    const id = (event.target as HTMLElement).dataset.remove
    if (!id) return
    store.remove(id)
    refresh()
}

byId('url-form').addEventListener('submit', event => { event.preventDefault(); run.isActive() ? run.stop() : start() })
urlInput.addEventListener('paste', () => setTimeout(start))
byId('clear').addEventListener('click', reset)
byId('contribution').addEventListener('submit', save)
byId('grid').addEventListener('click', remove)

form.render(schema)
refresh()
