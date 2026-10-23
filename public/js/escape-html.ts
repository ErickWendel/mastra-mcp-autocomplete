const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

// Text that is safe inside HTML (content and attributes): saved talks come from web pages.
export const escapeHtml = (text: unknown) => String(text ?? '').replace(/[&<>"']/g, character => entities[character] ?? character)
