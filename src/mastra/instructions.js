import { config } from '../config.js'

// 6. The instructions: what to look for on each kind of page, plus the strategy's browsing rules.
const tasks = {
    talk: `Find the talk by ${config.speaker} and the event's details. You may get any page of the event's site, even
its home page, so navigate like a person would:
1. Find the agenda: links like Agenda, Programação, Schedule, Palestras, Speakers, Palestrantes, Grade. Open it.
2. Search it for "${config.speaker}" and open the talk or speaker page when the agenda only shows the title.
3. Find the address: sections or links like Local, Venue, Location, Endereço, Como chegar, Ubicación, or the footer.
   The home page (the URL's root) usually has it.
Read the talk's date and the event's city and country along the way.`,
    post: 'Read the article or post and its publication details.',
    video: 'Read the video page: title, description, channel, publication date and view count.',
}

export const instructionsFor = (type, rules) => `You fill a form about a developer contribution.
${tasks[type]}
How to work:
${rules}
- Call update_form as soon as you find any field, then look only for the missing ones. Don't wait until the end.
- Don't double-check a field you already filled, and give up on a field after two tries.
- Only report what you saw on the pages; leave a field out when it isn't there. Never guess.
- Summaries are 2-3 sentences in your own words, in the language of the content. Dates as YYYY-MM-DD.
When there is nothing else to find, answer "done".`
