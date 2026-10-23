import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStepHandler } from '../public/js/run/step-handler.ts'

test('each step is listed, fields fill the form, done and error finish the panel', () => {
    const calls: string[] = []
    const handle = createStepHandler({
        progress: { add: step => calls.push(`add ${step.type}`), finish: (message, isError) => calls.push(`finish ${isError ? 'error' : 'ok'}: ${message}`) },
        form: { fill: fields => calls.push(`fill ${Object.keys(fields)}`) },
        onDone: ({ modelId, tookMs }) => calls.push(`done ${modelId} ${tookMs}`),
    })
    handle({ type: 'fields', task: 'talk', fields: { title: 'A talk' } })
    handle({ type: 'done', modelId: 'm', fields: {}, tookMs: 10 })
    handle({ type: 'error', message: 'boom' })
    assert.deepEqual(calls, ['add fields', 'fill title', 'add done', 'done m 10', 'finish ok: filled by m: review and save', 'add error', 'finish error: boom'])
})
