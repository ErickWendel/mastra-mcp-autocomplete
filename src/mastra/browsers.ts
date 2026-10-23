import { MCPClient } from '@mastra/mcp'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ToolsInput } from '@mastra/core/agent'

// 6. MCP tools: Playwright's MCP server gives an agent a real browser, started over stdio, and Mastra turns every MCP
//    tool into a tool the agent can call. Each task gets its own browser (a Playwright MCP server drives one page, so
//    two agents sharing it would navigate away from each other); each starts once and is reused.
//    navigate + find + targeted snapshots let the agent skim a page instead of reading all of it.
const ALLOWED = new Set(['browser_navigate', 'browser_find', 'browser_snapshot', 'browser_click', 'browser_wait_for'])

// files the browser saves (snapshots, searches) go to a temp folder, never into the project
const outputDir = join(tmpdir(), 'mastra-mcp-autocomplete')
mkdirSync(outputDir, { recursive: true })

const clients = new Map<string, MCPClient>()

function clientFor(name: string) {
    const client = clients.get(name) ?? new MCPClient({
        id: `browser-${name}`,
        servers: {
            playwright: {
                command: 'npx',
                args: ['-y', '@playwright/mcp@0.0.83', '--headless', '--isolated', '--output-dir', outputDir],
                cwd: outputDir,
                timeout: 60_000,
            },
        },
    })
    clients.set(name, client)
    return client
}

export const browsers = {
    // fewer tools = a faster, less confused model (and no "run arbitrary code" tool)
    async tools(name: string): Promise<ToolsInput> {
        const { playwright = {} } = await clientFor(name).listToolsets()
        return Object.fromEntries(Object.entries(playwright).filter(([tool]) => ALLOWED.has(tool)))
    },
    close: () => Promise.allSettled(clients.values().map(client => client.disconnect())),
    // `await using browsers` closes them when the block ends (explicit resource management)
    [Symbol.asyncDispose]: () => browsers.close().then(() => { }),
}
