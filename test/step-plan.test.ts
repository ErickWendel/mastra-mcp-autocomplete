import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stepPlan } from '../src/mastra/agent/step-plan.ts'

test('forces the first steps, then update_form every few steps and on the last one', () => {
    const plan = stepPlan({ firstSteps: ['browser_navigate'], maxSteps: 10, fillEvery: 4 })
    const forced = [0, 1, 2, 3, 4, 5, 8, 9].map(stepNumber => plan({ stepNumber })?.toolChoice.toolName ?? null)
    assert.deepEqual(forced, ['browser_navigate', null, null, null, 'update_form', null, 'update_form', 'update_form'])
})
