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
let running = null // the AbortController of the run in progress

// while the agent works, the URL can't change and the button stops the run instead
function setRunning(controller) {
    running = controller
    $('url').disabled = Boolean(controller)
    $('autocomplete').textContent = controller ? '■ Stop' : 'Autocomplete'
    $('autocomplete').classList.toggle('stop', Boolean(controller))
}

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

async function run() {
    const url = $('url').value.trim()
    if (running || !/^https?:\/\//.test(url)) return
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
    setRunning(controller)
    try {
        await autocomplete({ url, signal: controller.signal }, onStep)
    } catch (error) {
        progress.finish(controller.signal.aborted ? 'stopped: keep what was found or clear it' : error.message, true)
    } finally {
        setRunning(null)
    }
}

// stopping aborts the request; the server sees the connection close and stops the agent
const stop = () => running?.abort()

$('url-form').addEventListener('submit', event => { event.preventDefault(); running ? stop() : run() })
$('url').addEventListener('paste', () => setTimeout(run))

function reset() {
    stop()
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
