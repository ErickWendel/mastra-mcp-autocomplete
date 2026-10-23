import { talkCard } from './talk-card.ts'
import type { SavedTalk } from './talk-store.ts'

// The saved talks as a grid of cards, with their count.
export function renderTalkGrid(element: HTMLElement, counter: HTMLElement, talks: SavedTalk[], freshId?: string) {
    counter.textContent = `(${talks.length})`
    element.innerHTML = talks.length ? talks.map(talk => talkCard(talk, talk.id === freshId)).join('') : '<p class="empty">Nothing yet: paste a URL above.</p>'
}
