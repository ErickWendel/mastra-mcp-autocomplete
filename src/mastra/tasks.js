import { config } from '../config.js'

// 3. The work is split into independent tasks, each done by its own agent at the same time:
//    finding the talk and finding where the event happens don't depend on each other.
export const tasks = {
    talk: {
        fields: ['title', 'summary', 'date', 'language', 'tags'],
        goal: `Find the talk given by ${config.speaker}. You may get any page of the event's site, even its home page:
1. Find the agenda: links like Agenda, Programação, Programa, Schedule, Palestras, Charlas, Speakers, Palestrantes, Grade.
2. Search it for "${config.speaker}" and open the talk or speaker page when the agenda only shows the title.
Read the talk's title, description, date and language.`,
    },
    event: {
        fields: ['eventName', 'venue', 'city', 'country', 'attendees'],
        goal: `Find the event's official name and where it happens. You may get any page of the event's site:
look for sections or links like Local, Venue, Location, Endereço, Dirección, Como chegar, Ubicación, or the footer.
The home page (the URL's root) usually has them. Also look for how many people attend, if the site says it.`,
    },
}
