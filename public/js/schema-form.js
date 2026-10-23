// Draws a form from a JSON Schema (the server's zod schemas) and fills it with each new version of the form's JSON.
// A field you edited yourself is never overwritten by the agent.
const label = name => name.replace(/([A-Z])/g, ' $1')
const variants = property => property.anyOf ?? [property]
const kindOf = (name, property) => {
    const [main] = variants(property).filter(variant => variant.type !== 'null' && variant.type?.[0] !== 'null')
    if (main.enum) return { kind: 'select', options: main.enum }
    const type = [main.type].flat().find(t => t !== 'null')
    if (type === 'array') return { kind: 'tags' }
    if (type === 'number' || type === 'integer') return { kind: 'number' }
    return { kind: name === 'summary' ? 'textarea' : 'text' }
}

function input(name, property) {
    const { kind, options } = kindOf(name, property)
    const attributes = `name="${name}" data-kind="${kind}" placeholder="${property.description ?? ''}"`
    if (kind === 'textarea') return `<textarea ${attributes}></textarea>`
    if (kind === 'select') return `<select ${attributes}><option value=""></option>${options.map(o => `<option>${o}</option>`).join('')}</select>`
    return `<input ${attributes} type="${kind === 'number' ? 'number' : 'text'}" />`
}

const toInput = (kind, value) => kind === 'tags' ? [value].flat().join(', ') : String(value)
const fromInput = (kind, value) => kind === 'tags' ? value.split(',').map(tag => tag.trim()).filter(Boolean) : kind === 'number' ? Number(value) : value.trim()

export function createSchemaForm(element) {
    const edited = new Set()
    element.addEventListener('input', event => edited.add(event.target.name))
    const field = name => element.querySelector(`[name="${name}"]`)

    return {
        render(schema) {
            edited.clear()
            element.innerHTML = Object.entries(schema.properties)
                .map(([name, property]) => `<label class="${['title', 'summary'].includes(name) ? 'wide' : ''}">${label(name)}${input(name, property)}</label>`)
                .join('')
        },
        // receives the whole form every time (empty fields are null): only fields whose value changed are touched
        fill(fields) {
            for (const [name, value] of Object.entries(fields)) {
                const target = field(name)
                if (!target || value == null || edited.has(name)) continue
                const next = toInput(target.dataset.kind, value)
                if (target.value === next) continue
                target.value = next
                target.classList.add('filled')
                clearTimeout(target.flash)
                target.flash = setTimeout(() => target.classList.remove('filled'), 1500)
            }
        },
        values() {
            return Object.fromEntries([...element.querySelectorAll('[name]')]
                .filter(target => target.value.trim())
                .map(target => [target.name, fromInput(target.dataset.kind, target.value)]))
        },
    }
}
