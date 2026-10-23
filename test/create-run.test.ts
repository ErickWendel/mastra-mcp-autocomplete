import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createRun } from '../public/js/run/create-run.ts'

// the server's answer: two server-sent events
const stream = (body: string) => new Response(new Blob([body]).stream(), { headers: { 'content-type': 'text/event-stream' } })

test('streams every step, then reports the run is over', async () => {
    mock.method(globalThis, 'fetch', async () => stream('data: {"type":"model","modelId":"m"}\n\ndata: {"type":"done","modelId":"m","fields":{},"tookMs":5}\n\n'))
    const seen: string[] = []
    const run = createRun({ onStep: step => seen.push(step.type), onChange: running => seen.push(`running=${running}`), onFailure: message => seen.push(message) })
    await run.start('https://event.dev')
    assert.deepEqual(seen, ['running=true', 'model', 'done', 'running=false'])
    assert.equal(run.isActive(), false)
    mock.restoreAll()
})

test('stop() aborts the request and says so', async () => {
    mock.method(globalThis, 'fetch', (_: string, init: RequestInit) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))))
    const failures: string[] = []
    const run = createRun({ onStep: () => { }, onChange: () => { }, onFailure: message => failures.push(message) })
    const started = run.start('https://event.dev')
    assert.equal(run.isActive(), true)
    run.stop()
    await started
    assert.match(failures[0] ?? '', /^stopped/)
    mock.restoreAll()
})
