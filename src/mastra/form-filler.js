import { createFormAgent } from './agent.js'
import { withoutReasoning } from './model.js'
import { schemas } from './schemas.js'

// 6. The form's state: a JSON object that starts with every field empty. After each browsing step, the form agent
//    gets the current JSON + what the browser saw and returns it with more fields filled (structured output).
//    It runs in the background, one call at a time: findings that arrive meanwhile go together in the next call.
const MAX_FINDINGS = 12_000

const isEmpty = value => value == null || value === '' || (Array.isArray(value) && !value.length)
// a field never goes back to empty: a value the model drops is kept
const merge = (form, update) => Object.fromEntries(Object.entries(form).map(([key, value]) => [key, isEmpty(update?.[key]) ? value : update[key]]))

export function createFormFiller(type, { onChange, onError = () => { }, signal }) {
    const schema = schemas[type]
    const agent = createFormAgent(type)
    let form = Object.fromEntries(Object.keys(schema.shape).map(key => [key, null]))
    let pending = []
    let running = null

    async function fill(findings) {
        const prompt = `Form:\n${JSON.stringify(form, null, 2)}\n\nThe browser saw:\n${findings.slice(-MAX_FINDINGS)}`
        const { object } = await agent.generate(prompt, {
            abortSignal: signal,
            modelSettings: { temperature: 0 },
            providerOptions: withoutReasoning,
            structuredOutput: { schema },
        })
        const next = merge(form, object)
        if (JSON.stringify(next) === JSON.stringify(form)) return
        form = next
        onChange(form)
    }

    async function drain() {
        while (pending.length && !signal?.aborted) {
            // a failed update is reported and skipped: the next findings fill the form anyway
            await fill(pending.splice(0).join('\n\n---\n\n')).catch(error => onError(error))
        }
        running = null
    }

    return {
        add(findings) {
            pending.push(findings)
            running ??= drain()
        },
        result: async () => { await running; return form },
    }
}
