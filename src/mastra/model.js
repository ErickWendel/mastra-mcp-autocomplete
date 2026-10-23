import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { config } from '../config.js'

// 1. The model: Mastra speaks the AI SDK interface, so any provider works. Here: a free OpenRouter model.
const openrouter = createOpenRouter({ apiKey: config.openRouterKey })

export const model = openrouter(config.model)

// for simple jobs (filling a form) the model's "thinking" only adds time: ~1s instead of ~10s per call
export const withoutReasoning = { openrouter: { reasoning: { enabled: false } } }
