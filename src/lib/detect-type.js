// The URL usually tells the type; anything we don't recognize is treated as an event page (a talk).
const rules = [
    ['video', /(youtu\.be\/|youtube\.com\/(watch|live|shorts))/i],
    ['post', /(linkedin\.com\/(posts|pulse|feed)|medium\.com|dev\.to|hashnode\.dev|substack\.com)/i],
]

export const detectType = url => rules.find(([, pattern]) => pattern.test(url))?.[0] ?? 'talk'
