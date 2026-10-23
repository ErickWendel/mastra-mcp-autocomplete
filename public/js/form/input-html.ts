import { escapeHtml } from '../dom/escape-html.ts'
import { fieldKind } from './field-kind.ts'
import type { FieldSchema } from './field-kind.ts'

const label = (name: string) => name.replace(/([A-Z])/g, ' $1')

// One labelled input for a JSON Schema property; the description the model reads becomes the placeholder.
export function inputHtml(name: string, field: FieldSchema) {
    const kind = fieldKind(name, field)
    const attributes = `name="${name}" data-kind="${kind.kind}" placeholder="${escapeHtml(field.description)}"`
    const input = kind.kind === 'textarea' ? `<textarea ${attributes}></textarea>`
        : kind.kind === 'select' ? `<select ${attributes}><option value=""></option>${kind.options.map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select>`
        : `<input ${attributes} type="${kind.kind === 'number' ? 'number' : 'text'}" />`
    return `<label class="${['title', 'summary'].includes(name) ? 'wide' : ''}">${label(name)}${input}</label>`
}
