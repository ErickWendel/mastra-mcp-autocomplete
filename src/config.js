// Everything configurable lives here.
export const config = {
    port: Number(process.env.PORT || 3333),
    openRouterKey: process.env.OPEN_ROUTER_KEY,
    // a free OpenRouter model that is good at calling tools
    model: process.env.MODEL || 'nvidia/nemotron-3.5-super-vl:free',
    // who the agent looks for on event pages (a talk page often lists many speakers)
    speaker: process.env.SPEAKER_NAME || 'Erick Wendel',
    // 'mcp': Playwright MCP only, browsing like a person; 'hybrid': a plain fetch first, the browser when needed
    browseMode: process.env.BROWSE_MODE === 'hybrid' ? 'hybrid' : 'mcp',
    // each step is one model call: a budget keeps a stubborn model from browsing forever
    // (an event's home page -> agenda -> session -> venue takes a few pages)
    maxSteps: 25,
    dataFile: new URL('../data/contributions.json', import.meta.url),
}
