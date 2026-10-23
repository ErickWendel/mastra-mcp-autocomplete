import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stepPlan } from '../src/mastra/step-plan.js'

const forced = (plan, steps) => steps.map(stepNumber => plan({ stepNumber })?.toolChoice.toolName ?? null)

test('forces the first steps, then update_form every few steps and on the last one', () => {
    const plan = stepPlan({ firstSteps: ['browser_navigate'], maxSteps: 10, fillEvery: 4 })
    assert.deepEqual(forced(plan, [0, 1, 2, 3, 4, 5, 8, 9]),
        ['browser_navigate', null, null, null, 'update_form', null, 'update_form', 'update_form'])
})
