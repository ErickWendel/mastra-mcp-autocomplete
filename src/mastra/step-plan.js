// 8. prepareStep runs before every step and can force which tool the model calls. Models don't always follow
//    instructions (cheap and free ones less so), so the important moves are not left to them:
//    - the first steps (open the page)
//    - update_form every few steps and on the last one, so the form fills while the agent browses and nothing it
//      found is lost when the step budget runs out
export function stepPlan({ firstSteps, maxSteps, fillEvery = 3 }) {
    const force = toolName => ({ toolChoice: { type: 'tool', toolName } })
    return ({ stepNumber }) => {
        if (firstSteps[stepNumber]) return force(firstSteps[stepNumber])
        const isLast = stepNumber === maxSteps - 1
        if (isLast || stepNumber % fillEvery === 0) return force('update_form')
    }
}
