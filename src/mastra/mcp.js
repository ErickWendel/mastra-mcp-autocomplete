import { MCPClient } from '@mastra/mcp'
import { tmpdir } from 'os'
import { join } from 'path'
import { mkdirSync } from 'fs'

// 4. MCP tools: Playwright's MCP server gives the agent a real browser, started over stdio.
//    Mastra turns every MCP tool into a tool the agent can call. The browser starts once and is reused.
//    navigate + find + targeted snapshots let the agent skim a page instead of reading all of it.
const ALLOWED = ['browser_navigate', 'browser_find', 'browser_snapshot', 'browser_click', 'browser_wait_for']

// files the browser saves (snapshots, searches) go to a temp folder, never into the project
const outputDir = join(tmpdir(), 'mastra-mcp-autocomplete')
mkdirSync(outputDir, { recursive: true })

const client = new MCPClient({
    id: 'browser',
    servers: {
        playwright: {
            command: 'npx',
            args: ['-y', '@playwright/mcp@0.0.83', '--headless', '--isolated', '--output-dir', outputDir],
            cwd: outputDir,
            timeout: 60_000,
        },
    },
})

// fewer tools = a faster, less confused model (and no "run arbitrary code" tool)
export async function browserTools() {
    const { playwright } = await client.listToolsets()
    return Object.fromEntries(Object.entries(playwright).filter(([name]) => ALLOWED.includes(name)))
}

export const closeBrowser = () => client.disconnect()
