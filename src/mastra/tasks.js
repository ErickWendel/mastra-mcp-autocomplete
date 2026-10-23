import { config } from '../config.js'

// 3. The work is split into independent tasks, each done by its own agent at the same time:
//    finding the talk and finding where the event happens don't depend on each other.
export const tasks = {
    talk: {
        fields: ['title', 'summary', 'date', 'language', 'tags'],
        goal: `Find the talk given by ${config.speaker}. You may get any page of the event's site, even its home page:
1. Find the agenda: sections or links like Agenda, Programa, Programação, Schedule, Palestras, Charlas, Speakers,
   Palestrantes, Grade.
2. Search it for "${config.speaker}" and open the talk or speaker page when the agenda only shows the title.
3. Agendas are often split into tabs or buttons (days, rooms, tracks: "Day 1", "Sala A", "Hall", room codes) and only
   the selected one is on the page. When the name isn't found, snapshot the agenda section (small depth) to see them,
   then click each one and search for the name again.
Read the talk's title, description and date (the day of the talk or event, never today's date).
The description is the text in the same agenda entry as the title and the speaker's name (usually right after them):
read that entry with browser_snapshot target=<ref of the title or name>. Never use text from another talk's entry.
As soon as you have the title (and the description, when there is one), fill summary, tags and language in the same
update_form call: they come from what you just read, not from another page. Write the summary in the talk's own
language (a talk in Portuguese gets a summary in Portuguese); never translate it.
A speaker card (the name, a role, a bio) is not the talk:
when a page only lists speakers, keep going to the agenda until you find the talk's own title.`,
    },
    event: {
        fields: ['eventName', 'venue', 'city', 'country', 'attendees'],
        goal: `Find the event's official name (as in the page title or logo, often with a year, never a slogan) and where it
happens: the venue's fullest name as the site writes it (e.g. "Acme Innovation Center" rather than "ACME") plus its
street address when shown. You may get any page of the event's site:
look for sections or links like Local, Venue, Location, Endereço, Dirección, Como chegar, Ubicación, or the footer.
The home page (the URL's root) usually has them. Also look for how many people attend, if the site says it.`,
    },
}
