// Models sometimes send placeholders ("none", "", []) instead of leaving a field out.
export const isEmpty = (value: unknown) =>
    value == null || (Array.isArray(value) ? value.length === 0 : /^(|none|null|n\/a|unknown)$/i.test(String(value).trim()))
