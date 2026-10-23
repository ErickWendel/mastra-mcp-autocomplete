import { browserTools } from './mcp.js'
import { readPage } from './tools/read-page.js'

// 5. How the agent browses: which tools it gets, which first steps are forced, and the rules it follows.
//    BROWSE_MODE picks one, so both can be compared on the same URL.
export const strategies = {
    // only the Playwright MCP tools, used the way a person scans a page: search, then zoom in
    mcp: {
        tools: () => browserTools(),
        firstSteps: ['browser_navigate'],
        rules: `- browser_navigate opens the page and returns only its title.
- Scan with browser_find: search for what you need (a name, "views", a date, "agenda", "local"), also in the page's
  language. It returns small snippets with element refs, like a person skimming the page.
- To read one section, use browser_snapshot with target=<ref from browser_find> and a small depth. Never snapshot the whole page.
- Click only to reach the page that has what you need (a session or speaker page).`,
    },
    // a plain fetch first (one call, ~1s), the browser only for pages that need JavaScript
    hybrid: {
        tools: async () => ({ read_page: readPage, ...(await browserTools()) }),
        firstSteps: ['read_page', 'update_form'],
        rules: `- Start with read_page; it is fast. Meta tags and JSON-LD often have the title, date, description and view count.
- Use the browser tools only when read_page shows little text or you must click something.`,
    },
}
