// scripts/calendar.js
async function loadCalendarEvents() {
  const calendarURL = 'https://calendar.google.com/calendar/ical/57d4b94486ef72a90c0e0852ff99bd9b96c352689b56a78da55512e3b9e851d8@group.calendar.google.com/public/basic.ics';
  const response = await fetch(calendarURL);
  const ics = await response.text();

  // Match each event block
  const events = ics.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g) || [];

  // Parse events into objects
  const parsed = events.map(e => {
    const get = (key) => e.match(new RegExp(`${key}:([^\\n\\r]*)`))?.[1]?.trim();
    const start = get('DTSTART');
    const summary = get('SUMMARY') || 'Untitled';
    const location = get('LOCATION') || 'Location TBD';
    const date = start ? parseIcsDate(start) : null;
    return { summary, location, date };
  }).filter(e => e.date && e.date >= new Date());

  // Sort by date ascending
  parsed.sort((a, b) => a.date - b.date);

  // Select both event list containers
  const lists = document.querySelectorAll('.gig-list-stacked');
  if (!lists.length) return;

  // Clear existing list items
  lists.forEach(l => (l.innerHTML = ''));

  // Render up to 5 upcoming events
  parsed.slice(0, 5).forEach(ev => {
    const li = document.createElement('li');
    const dateStr = ev.date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    li.innerHTML = `
      <h2 class="gig-title">${ev.summary}</h2>
      <p class="gig-date">${dateStr}</p>
      <p class="gig-location">${ev.location}</p>
    `;

    lists.forEach(l => l.appendChild(li.cloneNode(true)));
  });
}

function parseIcsDate(icsDate) {
  // Handles both all-day and timed events
  const match = icsDate.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2}))?/);
  if (!match) return null;
  const [_, y, m, d, , h, min] = match;
  return new Date(y, m - 1, d, h || 0, min || 0);
}

document.addEventListener('DOMContentLoaded', loadCalendarEvents);
