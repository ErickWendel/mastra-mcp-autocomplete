import { autocomplete, getForms, listContributions, saveContribution, removeContribution } from './api.js'
import { createProgress } from './progress.js'
import { createSchemaForm } from './schema-form.js'
import { createTypePicker } from './type-picker.js'
import { renderGrid } from './grid.js'

// Wires the pieces together: URL ➜ agent stream ➜ form (filled live) ➜ save ➜ grid.
const $ = id => document.getElementById(id)
const forms = await getForms()
const progress = createProgress($('progress'))
const form = createSchemaForm($('fields'))
const picker = createTypePicker($('types'), Object.keys(forms), type => { form.render(forms[type]); run(type) })
let current = null // { url, type, modelId, tookMs, controller }

const refresh = async freshId => renderGrid($('grid'), $('count'), await listContributions(), freshId)

function onStep(step) {
    progress.add(step)
    if (step.type === 'detected' && step.contributionType !== picker.get()) {
        picker.set(step.contributionType)
        form.render(forms[step.contributionType])
    }
    if (step.type === 'fields') form.fill(step.fields)
    if (step.type === 'done' && current) {
        Object.assign(current, { modelId: step.modelId, tookMs: step.tookMs })
        progress.finish(`filled by ${step.modelId}: review and save`)
    }
    if (step.type === 'duplicate') {
        progress.finish('already saved: it is highlighted below', true)
        refresh(step.item.id)
    }
    if (step.type === 'error') progress.finish(step.message, true)
}

// starting a new run (another URL or type) cancels the previous one
async function run(type) {
    const url = $('url').value.trim()
    if (!/^https?:\/\//.test(url)) return
    current?.controller.abort()
    const controller = new AbortController()
    current = { url, type, controller }
    $('save').disabled = false
    progress.start(url)
    try {
        await autocomplete({ url, type, signal: controller.signal }, onStep)
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
    form.render(forms[picker.get()])
}
$('clear').addEventListener('click', reset)

$('contribution').addEventListener('submit', async event => {
    event.preventDefault()
    if (!current) return
    try {
        const { url, modelId, tookMs } = current
        const item = await saveContribution({ url, type: picker.get(), modelId, tookMs, fields: form.values() })
        reset()
        refresh(item.id)
    } catch (error) {
        progress.finish(`not saved: ${error.message}`, true)
    }
})

$('grid').addEventListener('click', async event => {
    const id = event.target.dataset.remove
    if (!id) return
    await removeContribution(id)
    refresh()
})

form.render(forms[picker.get()])
refresh()
