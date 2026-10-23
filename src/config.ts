// Everything configurable lives here.
export const config = {
    port: Number(process.env.PORT ?? 3333),
    openRouterKey: process.env.OPEN_ROUTER_KEY,
    // a cheap, fast OpenRouter model that is good at calling tools (~$0.10 / $0.50 per million tokens in / out)
    model: 'anthropic/claude-haiku-5.5',
    // who the agent looks for on event pages (a talk page often lists many speakers)
    speaker: process.env.SPEAKER_NAME ?? 'Erick Wendel',
    // each step is one model call: a budget keeps a stubborn model from browsing forever
    // (an event's home page -> agenda -> session -> address takes a few pages)
    maxSteps: 25,
    // a task that found something and then goes this many steps without anything new stops (some fields aren't on the site)
    idleSteps: 4,
    // a task that is still looking for the last fields after this long stops, keeping what it found
    taskTimeoutMs: 90_000,
}
