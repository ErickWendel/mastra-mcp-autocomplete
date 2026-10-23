import { config } from '../config.js'

// 4. The instructions, one set per agent: the browser agent browses like a person (search, then zoom in); the form
//    agent fills the form with what each step saw. Both keep answers honest: never guess.
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

export const browsingInstructions = type => `You research a developer contribution using a web browser.
${tasks[type]}
How to browse:
- browser_navigate opens a page and returns only its title.
- Scan with browser_find: search for what you need (a name, "views", a date, "agenda", "local"), also in the page's
  language. It returns small snippets with element refs, like a person skimming the page.
- To read one section, use browser_snapshot with target=<ref from browser_find> and a small depth. Never snapshot the whole page.
- Click only to reach the page that has what you need (a session, speaker or venue page).
- Stop once you have what you need, or after two tries at a missing detail: don't double-check what you found.
When you are done, answer "done".`

// what the form is about, so the form agent doesn't mix the talk up with the event (or the page itself)
const subjects = {
    talk: `the talk given by ${config.speaker}. The talk's own title and description go in title and summary; the event
goes in eventName, city and country. Agendas list many talks: take a title only from text where ${config.speaker}'s name
is part of the same talk entry. A page that doesn't mention the talk only gives event details.`,
    post: 'the article or post.',
    video: 'the video.',
}

export const formInstructions = type => `You keep a form about ${subjects[type]}
You get the form as JSON and what a browser just saw. Return the form with the empty fields filled from what the browser saw.
Each finding starts with the browser action that produced it (> tool {arguments}).
Fix a filled value only when the page shows it is wrong. Leave a field empty when the page doesn't show it. Never guess:
no years, numbers or names that aren't on the page (a date without a year stays empty unless the page shows the year).
Summaries are 2-3 sentences in your own words, in the language of the content; tags come from the content's topics.
Dates as YYYY-MM-DD.`
