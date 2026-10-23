// prepareStep runs before every step and can force which tool the model calls.
// - the strategy's first steps (e.g. open the page) are not left to the model
// - every few steps, and on the last one, the model must call update_form, so the form fills while it
//   browses and nothing it found is lost when the step budget runs out
export function stepPlan({ firstSteps, maxSteps, fillEvery = 4 }) {
    const force = toolName => ({ toolChoice: { type: 'tool', toolName } })
    return ({ stepNumber }) => {
        if (firstSteps[stepNumber]) return force(firstSteps[stepNumber])
        const isLast = stepNumber === maxSteps - 1
        if (isLast || stepNumber % fillEvery === 0) return force('update_form')
    }
}
