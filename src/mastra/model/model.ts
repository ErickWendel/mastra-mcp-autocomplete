import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { config } from '../../config.ts'

// 1. The model: Mastra speaks the AI SDK interface, so any provider works. Here: an OpenRouter model (see config.ts).
const openrouter = createOpenRouter({ apiKey: config.openRouterKey })

export const model = openrouter(config.model)
