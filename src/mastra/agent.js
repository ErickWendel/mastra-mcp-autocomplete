import { Agent } from '@mastra/core/agent'
import { model } from './model.js'
import { browsingInstructions, formInstructions } from './instructions.js'

// 5. Two agents, one job each (a model + instructions + tools):
//    - the browser agent has the MCP tools and finds the information
//    - the form agent has no tools: it only fills the form's JSON with what the browser saw
export const createBrowserAgent = ({ type, tools }) => new Agent({
    id: `browse-${type}`,
    name: `${type} browser`,
    instructions: browsingInstructions(type),
    model,
    tools,
})

export const createFormAgent = type => new Agent({
    id: `form-${type}`,
    name: `${type} form`,
    instructions: formInstructions(type),
    model,
})
