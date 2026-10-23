// Shows what the agent is doing, with a live timer per step.
const seconds = ms => `${(ms / 1000).toFixed(1)}s`
const describe = event => ({
    model: `thinking with ${event.modelId}`,
    tool: `${event.tool} ${event.args?.url ?? event.args?.element ?? event.args?.text ?? ''}`.trim(),
    fields: `filled ${Object.keys(event.fields ?? {}).join(', ')}`,
    warning: event.message,
})[event.type]

export function createProgress(element) {
    let started, timer, list, title
    return {
        start(url) {
            clearInterval(timer)
            started = Date.now()
            element.hidden = false
            element.replaceChildren(Object.assign(document.createElement('div'), { className: 'title' }), document.createElement('ol'))
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
            // textContent, never innerHTML: tool arguments come from web pages
            const item = document.createElement('li')
            item.append(`› ${text} `, Object.assign(document.createElement('span'), { className: 'time', textContent: seconds(Date.now() - started) }))
            list.append(item)
            list.scrollTop = list.scrollHeight
        },
        finish(message, isError = false) {
            clearInterval(timer)
            list.lastElementChild?.classList.add('done')
            const mark = isError ? Object.assign(document.createElement('span'), { className: 'error', textContent: '✗' }) : '✓'
            title.replaceChildren(mark, ` ${message} (${seconds(Date.now() - started)})`)
        },
    }
}
