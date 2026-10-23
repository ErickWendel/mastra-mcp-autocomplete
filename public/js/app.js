import { autocomplete, getForm } from './api.js'
import { createStore } from './storage.js'
import { createProgress } from './progress.js'
import { createSchemaForm } from './schema-form.js'
import { renderGrid } from './grid.js'

// Wires the pieces together: URL ➜ agent stream ➜ form (filled live) ➜ save (localStorage) ➜ grid.
const $ = id => document.getElementById(id)
const schema = await getForm()
const store = createStore()
const progress = createProgress($('progress'))
const form = createSchemaForm($('fields'))
let current = null // { url, modelId, tookMs, controller }

const refresh = freshId => renderGrid($('grid'), $('count'), store.list(), freshId)

function onStep(step) {
    progress.add(step)
    if (step.type === 'fields') form.fill(step.fields)
    if (step.type === 'done' && current) {
        Object.assign(current, { modelId: step.modelId, tookMs: step.tookMs })
        progress.finish(`filled by ${step.modelId}: review and save`)
    }
    if (step.type === 'error') progress.finish(step.message, true)
}

// starting a new run cancels the previous one
async function run() {
    const url = $('url').value.trim()
    if (!/^https?:\/\//.test(url)) return
    current?.controller.abort()
    form.render(schema)
    // already saved: no need to ask the agent again
    const existing = store.findByUrl(url)
    if (existing) {
        current = null
        progress.start(url)
        progress.finish('already saved: it is highlighted below', true)
        return refresh(existing.id)
    }
    const controller = new AbortController()
    current = { url, controller }
    $('save').disabled = false
    progress.start(url)
    try {
        await autocomplete({ url, signal: controller.signal }, onStep)
    } catch (error) {
        if (!controller.signal.aborted) progress.finish(error.message, true)
    }
}

$('url-form').addEventListener('submit', event => { event.preventDefault(); run() })
$('url').addEventListener('paste', () => setTimeout(run))

function reset() {
    current?.controller.abort()
    current = null
    $('url').value = ''
    $('save').disabled = true
    $('progress').hidden = true
    form.render(schema)
}
$('clear').addEventListener('click', reset)

$('contribution').addEventListener('submit', event => {
    event.preventDefault()
    if (!current) return
    const { url, modelId, tookMs } = current
    const { item } = store.save({ url, modelId, tookMs, ...form.values() })
    reset()
    refresh(item.id)
})

$('grid').addEventListener('click', event => {
    const id = event.target.dataset.remove
    if (!id) return
    store.remove(id)
    refresh()
})

form.render(schema)
refresh()
