// Shows what the agent is doing, with a live timer per step.
const seconds = ms => `${(ms / 1000).toFixed(1)}s`
const describe = event => ({
    detected: `detected a ${event.contributionType}`,
    model: `thinking with ${event.modelId}`,
    tool: `${event.tool} ${event.args?.url ?? event.args?.element ?? event.args?.text ?? ''}`.trim(),
    fields: `filled ${Object.keys(event.fields ?? {}).join(', ')}`,
})[event.type]

export function createProgress(element) {
    let started, timer, list, title
    return {
        start(url) {
            clearInterval(timer)
            started = Date.now()
            element.hidden = false
            element.innerHTML = `<div class="title"></div><ol></ol>`
            title = element.querySelector('.title')
            list = element.querySelector('ol')
            const tick = () => { title.textContent = `▶ ${url} (${seconds(Date.now() - started)}…)` }
            tick()
            timer = setInterval(tick, 200)
        },
        add(event) {
            const text = describe(event)
            if (!text) return
            list.lastElementChild?.classList.add('done')
            const item = document.createElement('li')
            item.innerHTML = `› ${text} <span class="time">${seconds(Date.now() - started)}</span>`
            list.append(item)
            list.scrollTop = list.scrollHeight
        },
        finish(message, isError = false) {
            clearInterval(timer)
            list.lastElementChild?.classList.add('done')
            title.innerHTML = `${isError ? '<span class="error">✗</span>' : '✓'} ${message} (${seconds(Date.now() - started)})`
        },
    }
}
