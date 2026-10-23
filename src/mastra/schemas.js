import { z } from 'zod'

// 3. The output: one zod schema per type. Every field is optional, so the agent leaves unknown ones empty
//    instead of inventing them. `.describe()` is what the model reads to know what each field means.
const text = description => z.string().nullish().describe(description)
const common = {
    title: text('title of the contribution'),
    summary: text('2-3 sentences in your own words, in the language of the content'),
    date: text('YYYY-MM-DD'),
    language: z.enum(['pt-br', 'en-us', 'es']).nullish(),
    tags: z.array(z.string()).nullish().describe('3-6 short lowercase technology tags'),
}

export const schemas = {
    talk: z.object({
        ...common,
        title: text('title of the talk/session given by the speaker, not the event name'),
        eventName: text('name of the event'),
        city: text('city of the event'),
        country: text('country, in English'),
        attendees: z.number().nullish().describe('attendees/registrations if shown'),
    }),
    post: z.object({ ...common, site: text('site or portal name, e.g. LinkedIn, Medium, dev.to') }),
    video: z.object({ ...common, channel: text('channel name'), views: z.number().nullish() }),
}

export const TYPES = Object.keys(schemas)
