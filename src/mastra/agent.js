import { Agent } from '@mastra/core/agent'
import { modelFor } from './model.js'
import { instructionsFor } from './instructions.js'

// 5. The agent: a model + instructions. Tools are handed to it per call (see autocomplete.js).
export const createAgent = (type, modelId) => new Agent({
    id: `autocomplete-${type}`,
    name: `${type} autocomplete`,
    instructions: instructionsFor(type),
    model: modelFor(modelId),
})
