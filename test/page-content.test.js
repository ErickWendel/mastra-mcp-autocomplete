import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageContent } from '../src/lib/page-content.js'

const html = `<html><head><title>My talk &amp; more</title>
<meta property="og:title" content="Talk title"><meta name="description" content="About it">
<script type="application/ld+json">{"@type":"Event","startDate":"2026-11-14"}</script>
<style>.x{}</style></head>
<body><nav><a href="/speakers">Speakers</a><a href="#top">top</a></nav><p>Hello <b>world</b></p><script>ignored()</script></body></html>`

test('extracts title, meta tags, JSON-LD, text and absolute links', () => {
    const page = pageContent(html, 'https://event.dev/agenda')
    assert.equal(page.title, 'My talk & more')
    assert.equal(page.meta['og:title'], 'Talk title')
    assert.equal(page.meta.description, 'About it')
    assert.equal(page.jsonLd[0].startDate, '2026-11-14')
    assert.match(page.text, /Hello world/)
    assert.doesNotMatch(page.text, /ignored/)
    assert.deepEqual(page.links, [{ text: 'Speakers', href: 'https://event.dev/speakers' }])
})

test('search returns the text around each match instead of the whole page', () => {
    const page = pageContent(`<body><p>${'filler '.repeat(2000)}</p><p>Erick Wendel: AI talk</p></body>`, 'https://e.dev', { search: 'erick wendel' })
    assert.equal(page.text, undefined)
    assert.equal(page.matches.length, 1)
    assert.match(page.matches[0], /Erick Wendel: AI talk/)
})

test('repeated meta keys keep every value in order and noise is dropped', () => {
    const page = pageContent(`<meta itemprop="interactionType" content="https://schema.org/LikeAction"><meta itemprop="userInteractionCount" content="176">
<meta itemprop="interactionType" content="https://schema.org/WatchAction"><meta itemprop="userInteractionCount" content="6493"><meta property="al:ios:url" content="x">`, 'https://youtu.be/x')
    assert.deepEqual(page.meta.userInteractionCount, ['176', '6493'])
    assert.deepEqual(page.meta.interactionType, ['https://schema.org/LikeAction', 'https://schema.org/WatchAction'])
    assert.equal(page.meta['al:ios:url'], undefined)
})
