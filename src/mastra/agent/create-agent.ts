import { Agent } from '@mastra/core/agent'
import { model } from '../model/model.ts'
import { instructionsFor } from './instructions-for.ts'
import type { ToolsInput } from '@mastra/core/agent'
import type { Task } from '../../types/task.ts'

// 8. An agent: a model + instructions + tools. One per task.
export const createAgent = ({ task, tools }: { task: Task, tools: ToolsInput }) => new Agent({
    id: `${task.name}-agent`,
    name: `${task.name} agent`,
    instructions: instructionsFor(task),
    model,
    tools,
})
