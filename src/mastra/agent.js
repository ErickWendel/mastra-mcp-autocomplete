import { Agent } from '@mastra/core/agent'
import { model } from './model.js'
import { instructionsFor } from './instructions.js'

// 6. The agent: a model + instructions + tools.
export const createAgent = ({ type, tools }) => new Agent({
    id: `autocomplete-${type}`,
    name: `${type} autocomplete`,
    instructions: instructionsFor(type),
    model,
    tools,
})
