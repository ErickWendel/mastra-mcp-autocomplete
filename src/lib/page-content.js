// Turns raw HTML into what a model needs to read a page: metadata, JSON-LD, visible text and links.
// No browser involved, so it's fast, but it only sees what the server sends (no JavaScript rendering).
const decode = text => text
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(code))

const attribute = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]

// app banners, image sizes and the like only cost tokens
const NOISE = /^(al:|fb:|apple-|twitter:app|twitter:player|og:image:|og:video:(width|height|type|secure)|theme-color|viewport|msapplication|google-site)/

// a key that repeats keeps every value, in page order (YouTube lists likes and views as two userInteractionCount)
function metaTags(html) {
    const meta = {}
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
        const key = attribute(tag, 'property') ?? attribute(tag, 'name') ?? attribute(tag, 'itemprop')
        const value = attribute(tag, 'content')
        if (!key || !value || NOISE.test(key)) continue
        meta[key] = key in meta ? [meta[key]].flat().concat(decode(value)) : decode(value)
    }
    return meta
}

const jsonLd = html => [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(([, json]) => { try { return JSON.parse(json) } catch { return null } })
    .filter(Boolean)

function visibleText(html) {
    return decode(html
        .replace(/<(script|style|noscript|svg|head)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\/(p|div|li|h\d|section|article|br|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, ' '))
        .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim()
}

function links(html, baseUrl) {
    const seen = new Set()
    return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
        .map(([, attributes, inner]) => ({ text: visibleText(inner).slice(0, 80), href: attribute(attributes, 'href') }))
        .filter(link => link.text && link.href && !link.href.startsWith('#') && !link.href.startsWith('javascript:'))
        .map(link => ({ ...link, href: new URL(link.href, baseUrl).href }))
        .filter(link => !seen.has(link.href) && seen.add(link.href))
}

// the text around each match, so a long page (an event agenda) doesn't have to fit in the answer
function around(text, term, size = 600) {
    const lower = text.toLowerCase()
    const snippets = []
    for (let at = lower.indexOf(term.toLowerCase()); at !== -1 && snippets.length < 5; at = lower.indexOf(term.toLowerCase(), at + size)) {
        snippets.push(text.slice(Math.max(0, at - size / 2), at + size))
    }
    return snippets
}

export function pageContent(html, url, { search, maxText = 6000, maxLinks = 60 } = {}) {
    const text = visibleText(html.match(/<body\b[\s\S]*<\/body>/i)?.[0] ?? html)
    return {
        url,
        title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim(),
        meta: metaTags(html),
        jsonLd: jsonLd(html),
        textLength: text.length,
        ...(search ? { matches: around(text, search) } : { text: text.slice(0, maxText) }),
        links: links(html, url).slice(0, maxLinks),
    }
}
