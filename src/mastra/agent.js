import { Agent } from '@mastra/core/agent'
import { model } from './model.js'
import { instructions } from './instructions.js'

// 6. The agent: a model + instructions + tools.
export const createAgent = tools => new Agent({
    id: 'talk-autocomplete',
    name: 'talk autocomplete',
    instructions,
    model,
    tools,
})
