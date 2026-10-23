import { Agent } from '@mastra/core/agent'
import { modelFor } from './model.js'
import { instructionsFor } from './instructions.js'

// 7. The agent: a model + instructions + tools.
export const createAgent = ({ type, modelId, tools, rules }) => new Agent({
    id: `autocomplete-${type}`,
    name: `${type} autocomplete`,
    instructions: instructionsFor(type, rules),
    model: modelFor(modelId),
    tools,
})
