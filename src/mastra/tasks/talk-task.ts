import { config } from '../../config.ts'
import type { Task } from '../../types/task.ts'

// 4a. Finding the talk: agenda -> the speaker's name -> the talk's own entry.
export const talkTask = {
    name: 'talk',
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
} satisfies Task
