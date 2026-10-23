import { talkTask } from './talk-task.ts'
import { eventTask } from './event-task.ts'
import type { TalkField } from '../form/schema.ts'

// One independent piece of work, done by its own agent: its goal and the part of the form it fills.
export type Task = {
    name: string
    fields: TalkField[]
    goal: string
}

// 4. The work, split into independent tasks that run at the same time, each with its own agent and browser:
//    finding the talk and finding where the event happens don't depend on each other.
export const tasks: Task[] = [talkTask, eventTask]
