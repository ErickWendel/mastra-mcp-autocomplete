import { fieldValues } from './field-values.ts'
import { inputHtml } from './input-html.ts'
import type { FormSchema } from '../api/get-form.ts'

type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

// The form, drawn from a JSON Schema (the server's zod schema) and filled field by field as the agents find them.
export type SchemaForm = ReturnType<typeof createSchemaForm>

// A field you edited yourself is never overwritten by the agents.
export function createSchemaForm(element: HTMLElement) {
    const edited = new Set<string>()
    const flashes = new WeakMap<Input, ReturnType<typeof setTimeout>>()
    element.addEventListener('input', event => edited.add((event.target as Input).name))
    const inputs = () => [...element.querySelectorAll<Input>('[name]')]

    return {
        render(schema: FormSchema) {
            edited.clear()
            element.innerHTML = Object.entries(schema.properties).map(([name, field]) => inputHtml(name, field)).join('')
        },
        // only fields whose value changed are touched (and flash)
        fill(fields: Record<string, unknown>) {
            for (const input of inputs()) {
                const value = fields[input.name]
                if (value == null || edited.has(input.name)) continue
                const next = fieldValues.toInput(input.dataset.kind ?? 'text', value)
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
                .map(input => [input.name, fieldValues.fromInput(input.dataset.kind ?? 'text', input.value)]))
        },
    }
}
