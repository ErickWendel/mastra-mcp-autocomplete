import { Agent } from '@mastra/core/agent'
import { model } from './model.js'
import { instructionsFor } from './instructions.js'

// 7. An agent: a model + instructions + tools. One per task.
export const createAgent = ({ name, task, tools }) => new Agent({
    id: `${name}-agent`,
    name: `${name} agent`,
    instructions: instructionsFor(task),
    model,
    tools,
})
