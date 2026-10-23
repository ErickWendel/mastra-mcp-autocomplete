import { escapeHtml } from './escape-html.ts'
import { fieldKind } from './field-kind.ts'
import type { FieldSchema } from './field-kind.ts'
import type { FormSchema } from './api/get-form.ts'

type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const label = (name: string) => name.replace(/([A-Z])/g, ' $1')
const toInput = (kind: string, value: unknown) => kind === 'tags' ? [value].flat().join(', ') : String(value)
const fromInput = (kind: string, value: string) =>
    kind === 'tags' ? value.split(',').map(tag => tag.trim()).filter(Boolean) : kind === 'number' ? Number(value) : value.trim()

function inputHtml(name: string, field: FieldSchema) {
    const kind = fieldKind(name, field)
    const attributes = `name="${name}" data-kind="${kind.kind}" placeholder="${escapeHtml(field.description)}"`
    if (kind.kind === 'textarea') return `<textarea ${attributes}></textarea>`
    if (kind.kind === 'select') return `<select ${attributes}><option value=""></option>${kind.options.map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select>`
    return `<input ${attributes} type="${kind.kind === 'number' ? 'number' : 'text'}" />`
}

// Draws a form from a JSON Schema (the server's zod schema) and fills it field by field as the agents find them.
// A field you edited yourself is never overwritten by the agents.
export function createSchemaForm(element: HTMLElement) {
    const edited = new Set<string>()
    const flashes = new WeakMap<Input, ReturnType<typeof setTimeout>>()
    element.addEventListener('input', event => edited.add((event.target as Input).name))
    const inputs = () => [...element.querySelectorAll<Input>('[name]')]

    return {
        render(schema: FormSchema) {
            edited.clear()
            element.innerHTML = Object.entries(schema.properties)
                .map(([name, field]) => `<label class="${['title', 'summary'].includes(name) ? 'wide' : ''}">${label(name)}${inputHtml(name, field)}</label>`)
                .join('')
        },
        // only fields whose value changed are touched (and flash)
        fill(fields: Record<string, unknown>) {
            for (const input of inputs()) {
                const value = fields[input.name]
                if (value == null || edited.has(input.name)) continue
                const next = toInput(input.dataset.kind ?? 'text', value)
                if (input.value === next) continue
                input.value = next
                input.classList.add('filled')
                clearTimeout(flashes.get(input))
                flashes.set(input, setTimeout(() => input.classList.remove('filled'), 1500))
            }
        },
        values() {
            return Object.fromEntries(inputs()
                .filter(input => input.value.trim())
                .map(input => [input.name, fromInput(input.dataset.kind ?? 'text', input.value)]))
        },
    }
}
