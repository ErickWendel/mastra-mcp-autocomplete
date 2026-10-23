import { describeEvent } from './describe-event.ts'
import type { AgentEvent } from '../../src/types/agent-event.ts'

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`
const tag = <K extends keyof HTMLElementTagNameMap>(name: K, properties: Partial<HTMLElementTagNameMap[K]> = {}) =>
    Object.assign(document.createElement(name), properties)

// Shows what the agents are doing, with a live timer per step.
// Text goes in with textContent, never innerHTML: tool arguments come from web pages.
export function createProgress(element: HTMLElement) {
    let started = 0
    let timer: ReturnType<typeof setInterval> | undefined
    const title = tag('div', { className: 'title' })
    const list = tag('ol')

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
            list.append(tag('li', { textContent: `› ${text} ` }))
            list.lastElementChild?.append(tag('span', { className: 'time', textContent: seconds(Date.now() - started) }))
            list.scrollTop = list.scrollHeight
        },
        finish(message: string, isError = false) {
            clearInterval(timer)
            list.lastElementChild?.classList.add('done')
            title.replaceChildren(isError ? tag('span', { className: 'error', textContent: '✗' }) : '✓', ` ${message} (${seconds(Date.now() - started)})`)
        },
    }
}
