import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { config } from '../config.js'

// 1. The model: Mastra speaks the AI SDK interface, so any provider works. Here: a free OpenRouter model.
const openrouter = createOpenRouter({ apiKey: config.openRouterKey })

export const model = openrouter(config.model)

// the model "thinks" before every step by default; for browsing that only adds time (~1s per step without it)
export const withoutReasoning = { openrouter: { reasoning: { enabled: false } } }
