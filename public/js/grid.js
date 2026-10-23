// The saved talks as cards.
const escape = text => String(text ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function card(item, fresh) {
    const meta = [item.date, item.language, [item.city, item.country].filter(Boolean).join(', '), item.venue,
        item.attendees && `${item.attendees} attendees`].filter(Boolean)
    return `
        <article class="card ${fresh ? 'fresh' : ''}">
            <header><span class="badge">${escape(item.eventName || 'talk')}</span><button class="ghost" data-remove="${escape(item.id)}">remove</button></header>
            <h3><a href="${escape(item.url)}" target="_blank" rel="noreferrer">${escape(item.title || item.url)}</a></h3>
            ${item.summary ? `<p>${escape(item.summary)}</p>` : ''}
            <div class="meta">${meta.map(m => `<span>${escape(m)}</span>`).join('')}</div>
            <div class="tags">${(item.tags || []).map(t => `<span>#${escape(t)}</span>`).join('')}</div>
            <div class="meta"><span>${escape(item.modelId)}</span>${item.tookMs ? `<span>${(item.tookMs / 1000).toFixed(1)}s</span>` : ''}</div>
        </article>`
}

export function renderGrid(element, counter, items, freshId) {
    counter.textContent = `(${items.length})`
    element.innerHTML = items.length ? items.map(item => card(item, item.id === freshId)).join('') : '<p class="empty">Nothing yet: paste a URL above.</p>'
}
