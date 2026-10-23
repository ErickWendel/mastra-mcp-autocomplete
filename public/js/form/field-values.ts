// Converts between a field's value and its input's text: tags are a comma-separated list, numbers are numbers.
export const fieldValues = {
    toInput: (kind: string, value: unknown) => kind === 'tags' ? [value].flat().join(', ') : String(value),
    fromInput: (kind: string, text: string) =>
        kind === 'tags' ? text.split(',').map(tag => tag.trim()).filter(Boolean) : kind === 'number' ? Number(text) : text.trim(),
}
