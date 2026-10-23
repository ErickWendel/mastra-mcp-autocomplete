import { MCPClient } from '@mastra/mcp'
import { tmpdir } from 'os'
import { join } from 'path'

// 2. The tools: an MCP server started over stdio. Playwright's MCP server gives the agent a real browser
//    (navigate, click, snapshot the page...). Mastra turns every MCP tool into a tool the agent can call.
export function createBrowser() {
    return new MCPClient({
        id: 'browser',
        servers: {
            playwright: {
                command: 'npx',
                args: ['-y', '@playwright/mcp@0.0.83', '--headless', '--isolated', '--output-dir', join(tmpdir(), 'mastra-mcp-autocomplete')],
                timeout: 60_000,
            },
        },
    })
}
