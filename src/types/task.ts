import type { TalkField } from './talk-field.ts'

// One independent piece of work, done by its own agent: its goal and the part of the form it fills.
export type Task = {
    name: string
    fields: TalkField[]
    goal: string
}
