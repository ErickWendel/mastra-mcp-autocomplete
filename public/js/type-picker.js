// The talk / post / video toggle. The URL picks one; clicking another overrides it.
export function createTypePicker(element, types, onChange) {
    let current = types[0]
    const render = () => {
        element.innerHTML = types.map(type => `<button type="button" data-type="${type}" class="${type === current ? 'active' : ''}">${type}</button>`).join('')
    }
    element.addEventListener('click', event => {
        const type = event.target.dataset.type
        if (type && type !== current) { current = type; render(); onChange(type) }
    })
    render()
    return {
        get: () => current,
        set(type) { current = type; render() },
    }
}
