import { config } from '../config.js'

// 4. The instructions: what to look for on each kind of page, and the rules that keep answers honest.
const tasks = {
    talk: `Find the talk by ${config.speaker} on this event page. Event pages list many sessions: look at the
agenda/schedule/speakers sections and follow links to the session when needed. Read the event's date and city.`,
    post: 'Read the article or post and its publication details.',
    video: 'Read the video page: title, description, channel, publication date and view count.',
}

export const instructionsFor = type => `You fill a form about a developer contribution by browsing with the browser tools.
${tasks[type]}
Only report what you saw on the pages; leave a field empty when it isn't there. Never guess.`
