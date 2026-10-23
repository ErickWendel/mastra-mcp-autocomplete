import { createElement } from '../dom/create-element.ts'
import { describeEvent } from './describe-event.ts'
import type { AgentEvent } from '../../../src/mastra/autocomplete.ts'

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

// The panel that shows what the agents are doing.
export type Progress = ReturnType<typeof createProgress>

// One line per step with a live timer. Text goes in with textContent, never innerHTML: tool arguments come from web pages.
export function createProgress(element: HTMLElement) {
    let started = 0
    let timer: ReturnType<typeof setInterval> | undefined
    const title = createElement('div', { className: 'title' })
    const list = createElement('ol')

    return {
        start(url: string) {
            clearInterval(timer)
            started = Date.now()
            element.hidden = false
            list.replaceChildren()
            element.replaceChildren(title, list)
            const tick = () => { title.textContent = `▶ ${url} (${seconds(Date.now() - started)}…)` }
            tick()
            timer = setInterval(tick, 200)
        },
        add(event: AgentEvent) {
            const text = describeEvent(event)
            if (!text) return
            list.lastElementChild?.classList.add('done')
            const item = createElement('li', { textContent: `› ${text} ` })
            item.append(createElement('span', { className: 'time', textContent: seconds(Date.now() - started) }))
            list.append(item)
            list.scrollTop = list.scrollHeight
        },
        finish(message: string, isError = false) {
            clearInterval(timer)
            list.lastElementChild?.classList.add('done')
            title.replaceChildren(isError ? createElement('span', { className: 'error', textContent: '✗' }) : '✓', ` ${message} (${seconds(Date.now() - started)})`)
        },
    }
}
