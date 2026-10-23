// A page element by id, typed: byId<HTMLInputElement>('url').
export const byId = <T extends HTMLElement = HTMLElement>(id: string) => {
    const element = document.getElementById(id)
    if (!element) throw new Error(`#${id} is missing from the page`)
    return element as T
}
