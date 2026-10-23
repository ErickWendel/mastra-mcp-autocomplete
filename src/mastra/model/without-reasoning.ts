// 2. Provider options: models "think" before every step by default; for browsing that only adds time.
//    Without it most steps take about a second.
export const withoutReasoning = { openrouter: { reasoning: { enabled: false } } }
