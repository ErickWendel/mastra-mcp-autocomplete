import { MCPClient } from '@mastra/mcp'
import { tmpdir } from 'os'
import { join } from 'path'
import { mkdirSync } from 'fs'

// 5. MCP tools: Playwright's MCP server gives an agent a real browser, started over stdio.
//    Mastra turns every MCP tool into a tool the agent can call. Each task gets its own browser (a Playwright MCP
//    server drives one page, so two agents sharing it would navigate away from each other); each starts once.
//    navigate + find + targeted snapshots let the agent skim a page instead of reading all of it.
const ALLOWED = ['browser_navigate', 'browser_find', 'browser_snapshot', 'browser_click', 'browser_wait_for']

// files the browser saves (snapshots, searches) go to a temp folder, never into the project
const outputDir = join(tmpdir(), 'mastra-mcp-autocomplete')
mkdirSync(outputDir, { recursive: true })

const clients = new Map()
const clientFor = name => {
    if (!clients.has(name)) clients.set(name, new MCPClient({
        id: `browser-${name}`,
        servers: {
            playwright: {
                command: 'npx',
                args: ['-y', '@playwright/mcp@0.0.83', '--headless', '--isolated', '--output-dir', outputDir],
                cwd: outputDir,
                timeout: 60_000,
            },
        },
    }))
    return clients.get(name)
}

// fewer tools = a faster, less confused model (and no "run arbitrary code" tool)
export async function browserTools(name) {
    const { playwright } = await clientFor(name).listToolsets()
    return Object.fromEntries(Object.entries(playwright).filter(([tool]) => ALLOWED.includes(tool)))
}

export const closeBrowsers = () => Promise.allSettled([...clients.values()].map(client => client.disconnect()))
