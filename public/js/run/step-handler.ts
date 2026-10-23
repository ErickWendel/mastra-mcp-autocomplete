import type { AgentEvent } from '../../../src/mastra/autocomplete.ts'
import type { Progress } from '../progress/progress.ts'
import type { SchemaForm } from '../form/schema-form.ts'

// What each step of a run does on the page: list it, fill the form with what was found, and say when it's done.
export function createStepHandler({ progress, form, onDone }: {
    progress: Pick<Progress, 'add' | 'finish'>
    form: Pick<SchemaForm, 'fill'>
    onDone: (result: { modelId: string, tookMs: number }) => void
}) {
    return (step: AgentEvent) => {
        progress.add(step)
        if (step.type === 'fields') form.fill(step.fields)
        if (step.type === 'done') {
            onDone(step)
            progress.finish(`filled by ${step.modelId}: review and save`)
        }
        if (step.type === 'error') progress.finish(step.message, true)
    }
}
