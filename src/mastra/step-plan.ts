// 9. prepareStep runs before every step and can force which tool the model calls. Models don't always follow
//    instructions (cheap and free ones less so), so the important moves are not left to them:
//    - the first steps (open the page)
//    - update_form every few steps and on the last one, so the form fills while the agent browses and nothing it
//      found is lost when the step budget runs out
export function stepPlan({ firstSteps, maxSteps, fillEvery = 3 }: { firstSteps: string[], maxSteps: number, fillEvery?: number }) {
    const force = (toolName: string) => ({ toolChoice: { type: 'tool' as const, toolName } })
    return ({ stepNumber }: { stepNumber: number }) => {
        const first = firstSteps[stepNumber]
        if (first) return force(first)
        if (stepNumber === maxSteps - 1 || stepNumber % fillEvery === 0) return force('update_form')
    }
}
