import { z } from 'zod'

// 2. The form: a zod schema. Every field is optional, so the agent leaves unknown ones out instead of inventing them.
//    `.describe()` is what the model reads to know what each field means.
//    The same schema is the update_form tool's input and the page's form (as JSON Schema).
const text = description => z.string().nullish().describe(description)

export const schema = z.object({
    title: text("title of the talk/session given by the speaker; not the event's name, not the speaker's name or bio"),
    summary: text("2-3 sentences in your own words about this talk, written in the talk's language (never translated): from its own description, or from its title alone when the page has none"),
    date: text('date of the talk, YYYY-MM-DD'),
    language: z.enum(['pt-br', 'en-us', 'es']).nullish().describe('language the talk is given in'),
    tags: z.array(z.string()).nullish().describe('3-6 short lowercase technology tags about the talk'),
    eventName: text('official name of the event (as in the page title or logo, often with a year), not its slogan or tagline'),
    venue: text("venue's full name (the most complete one the site gives) and street address"),
    city: text('city of the event'),
    country: text('country, in English'),
    attendees: z.number().nullish().describe('attendees/registrations if shown'),
})

export const formAsJsonSchema = () => z.toJSONSchema(schema)
