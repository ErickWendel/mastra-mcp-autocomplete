import type { Task } from '../../types/task.ts'

// 4b. Finding the event: its official name, street address, city, country and audience.
export const eventTask = {
    name: 'event',
    fields: ['eventName', 'address', 'city', 'country', 'attendees'],
    goal: `Find the event's official name (as in the page title or logo, often with a year, never a slogan) and its
street address: street, number, neighborhood and postal code, without the venue's name. You may get any page of the
event's site: look for sections or links like Local, Venue, Location, Endereço, Dirección, Como chegar, Ubicación, FAQ,
a map link, or the footer. The home page (the URL's root) usually has them. When a page only names the venue, keep
looking for its street address. Also look for how many people attend, if the site says it.`,
} satisfies Task
