import type { Talk } from '../../../src/types/talk.ts'

// A talk saved in the browser: the form's fields plus where it came from.
export type SavedTalk = Partial<Talk> & {
    id: string
    savedAt: string
    url: string
    modelId?: string
    tookMs?: number
}
