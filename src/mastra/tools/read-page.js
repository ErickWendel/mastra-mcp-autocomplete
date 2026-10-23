import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { pageContent } from '../../lib/page-content.js'

// 3. Tools (a): a local tool: plain fetch, ~1s. Mastra tools are a description + an input schema + a function.
//     The model reads `description` to decide when to call it.
export const readPage = createTool({
    id: 'read_page',
    description: 'Fast: downloads a web page and returns its title, meta tags, JSON-LD, text and links. Try this first. '
        + 'Long pages are cut: pass `search` to get only the text around a word or name instead.',
    inputSchema: z.object({
        url: z.string().describe('the page URL'),
        search: z.string().nullish().describe('optional word or name to look for, e.g. the speaker name on an agenda'),
    }),
    execute: async ({ url, search }) => {
        const response = await fetch(url, {
            headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140 Safari/537.36', 'accept-language': 'en,pt;q=0.8' },
            signal: AbortSignal.timeout(15_000),
        })
        if (!response.ok) return { error: `HTTP ${response.status}: open it with the browser tools instead` }
        const page = pageContent(await response.text(), response.url, { search })
        // no text and no description means the page is rendered by JavaScript
        if (page.textLength < 300 && !page.meta.description && !page.jsonLd.length) page.hint = 'nothing readable: open it with the browser tools'
        if (search && !page.matches.length) page.hint = `"${search}" is not on this page: try its links, or the browser tools`
        return page
    },
})
