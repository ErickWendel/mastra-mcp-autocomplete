import { autocomplete, listContributions, removeContribution } from './api.js'
import { createProgress } from './progress.js'
import { renderGrid } from './grid.js'

// Wires the form, the progress panel and the grid together.
const $ = id => document.getElementById(id)
const progress = createProgress($('progress'))

async function refresh(freshId) {
    renderGrid($('grid'), $('count'), await listContributions(), freshId)
}

$('form').addEventListener('submit', async event => {
    event.preventDefault()
    const url = $('url').value.trim()
    $('submit').disabled = true
    progress.start(url)
    try {
        await autocomplete(url, async step => {
            progress.add(step)
            if (step.type === 'saved') {
                progress.finish(step.duplicate ? 'already saved, nothing to do' : `saved “${step.item.title ?? url}”`)
                await refresh(step.item.id)
            }
            if (step.type === 'error') progress.finish(step.message, true)
        })
        $('url').value = ''
    } catch (error) {
        progress.finish(error.message, true)
    } finally {
        $('submit').disabled = false
    }
})

$('grid').addEventListener('click', async event => {
    const id = event.target.dataset.remove
    if (!id) return
    await removeContribution(id)
    refresh()
})

refresh()
