import { talkTask } from './talk-task.ts'
import { eventTask } from './event-task.ts'
import type { Task } from '../../types/task.ts'

// 4. The work, split into independent tasks that run at the same time, each with its own agent and browser:
//    finding the talk and finding where the event happens don't depend on each other.
export const tasks: Task[] = [talkTask, eventTask]
