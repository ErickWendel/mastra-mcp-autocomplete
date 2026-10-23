// Everything configurable lives here.
export const config = {
    port: Number(process.env.PORT || 3333),
    openRouterKey: process.env.OPEN_ROUTER_KEY,
    // free OpenRouter models that can call tools, tried in this order
    models: [
        'nvidia/nemotron-3.5-super-vl:free',
        'google/gemma-4-31b-it:free',
        'google/gemma-4-26b-a4b-it:free',
    ],
    // who the agent looks for on event pages (a talk page often lists many speakers)
    speaker: process.env.SPEAKER_NAME || 'Erick Wendel',
    maxSteps: 20,
    dataFile: new URL('../data/contributions.json', import.meta.url),
}
