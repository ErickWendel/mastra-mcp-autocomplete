import { escapeHtml } from '../dom/escape-html.ts'
import type { SavedTalk } from './talk-store.ts'

// One saved talk as a card; `fresh` highlights the one just saved (or found again).
export function talkCard(talk: SavedTalk, fresh: boolean) {
    const meta = [talk.date, talk.language, [talk.city, talk.country].filter(Boolean).join(', '), talk.address,
        talk.attendees && `${talk.attendees} attendees`].filter(Boolean)
    return `
        <article class="card ${fresh ? 'fresh' : ''}">
            <header><span class="badge">${escapeHtml(talk.eventName || 'talk')}</span><button class="ghost" data-remove="${escapeHtml(talk.id)}">remove</button></header>
            <h3><a href="${escapeHtml(talk.url)}" target="_blank" rel="noreferrer">${escapeHtml(talk.title || talk.url)}</a></h3>
            ${talk.summary ? `<p>${escapeHtml(talk.summary)}</p>` : ''}
            <div class="meta">${meta.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</div>
            <div class="tags">${(talk.tags ?? []).map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
            <div class="meta"><span>${escapeHtml(talk.modelId)}</span>${talk.tookMs ? `<span>${(talk.tookMs / 1000).toFixed(1)}s</span>` : ''}</div>
        </article>`
}
