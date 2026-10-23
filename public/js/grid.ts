import { escapeHtml } from './escape-html.ts'
import type { SavedTalk } from './storage.ts'

function card(item: SavedTalk, fresh: boolean) {
    const meta = [item.date, item.language, [item.city, item.country].filter(Boolean).join(', '), item.address,
        item.attendees && `${item.attendees} attendees`].filter(Boolean)
    return `
        <article class="card ${fresh ? 'fresh' : ''}">
            <header><span class="badge">${escapeHtml(item.eventName || 'talk')}</span><button class="ghost" data-remove="${escapeHtml(item.id)}">remove</button></header>
            <h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title || item.url)}</a></h3>
            ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ''}
            <div class="meta">${meta.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>
            <div class="tags">${(item.tags ?? []).map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
            <div class="meta"><span>${escapeHtml(item.modelId)}</span>${item.tookMs ? `<span>${(item.tookMs / 1000).toFixed(1)}s</span>` : ''}</div>
        </article>`
}

// The saved talks as cards; the one just saved (or found again) is highlighted.
export function renderGrid(element: HTMLElement, counter: HTMLElement, items: SavedTalk[], freshId?: string) {
    counter.textContent = `(${items.length})`
    element.innerHTML = items.length ? items.map(item => card(item, item.id === freshId)).join('') : '<p class="empty">Nothing yet: paste a URL above.</p>'
}
