// A new element with its properties set: createElement('span', { className: 'time', textContent: '1.2s' }).
export const createElement = <K extends keyof HTMLElementTagNameMap>(name: K, properties: Partial<HTMLElementTagNameMap[K]> = {}) =>
    Object.assign(document.createElement(name), properties)
