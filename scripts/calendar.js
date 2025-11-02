// scripts/calendar.js
async function loadCalendarEvents() {
  const calendarURL =
    'https://calendar.google.com/calendar/ical/57d4b94486ef72a90c0e0852ff99bd9b96c352689b56a78da55512e3b9e851d8@group.calendar.google.com/public/basic.ics';
  const proxy = 'https://api.allorigins.win/raw?url=';

  let response, ics;
  try {
    response = await fetch(proxy + encodeURIComponent(calendarURL));
    if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`);
    ics = await response.text();
  } catch (err) {
    console.error('❌ Calendar fetch failed:', err);
    const lists = document.querySelectorAll('.gig-list-stacked');
    lists.forEach((l) => {
      l.innerHTML = `<li><p style="color:red;">Unable to load events at this time.</p></li>`;
    });
    return;
  }

  // Match each event block from ICS
  const events = ics.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g) || [];

  // Parse events into objects
  const parsed = events
    .map((e) => {
      const get = (key) => e.match(new RegExp(`${key}:([^\\n\\r]*)`))?.[1]?.trim();
      const start = get('DTSTART');
      const end = get('DTEND');
      const summary = get('SUMMARY') || 'Untitled';
      const location = get('LOCATION') || 'Location TBD';
      const startDate = start ? parseIcsDate(start) : null;
      const endDate = end ? parseIcsDate(end) : null;
      return { summary, location, startDate, endDate };
    })
    .filter((e) => e.startDate && e.startDate >= new Date());

  // Sort by date ascending
  parsed.sort((a, b) => a.startDate - b.startDate);

  // Select both event list containers
  const lists = document.querySelectorAll('.gig-list-stacked');
  if (!lists.length) return;

  // Clear existing items
  lists.forEach((l) => (l.innerHTML = ''));

  // Render up to 5 upcoming events
  parsed.slice(0, 5).forEach((ev) => {
    const li = document.createElement('li');

    const dateOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };

    const dateStr = ev.startDate.toLocaleString('en-US', dateOptions);
    const endStr = ev.endDate
      ? ' – ' + ev.endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';

    li.innerHTML = `
      <h2 class="gig-title">${ev.summary}</h2>
      <p class="gig-date">${dateStr}${endStr}</p>
      <p class="gig-location">${ev.location}</p>
    `;

    lists.forEach((l) => l.appendChild(li.cloneNode(true)));
  });

  // If no upcoming events
  if (!parsed.length) {
    lists.forEach((l) => {
      l.innerHTML = `<li><p>No upcoming events at this time. Check back soon!</p></li>`;
    });
  }
}

// Helper: parse ICS datetime formats
function parseIcsDate(icsDate) {
  // Handles both all-day and timed events (with or without Z suffix)
  const match = icsDate.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2}))?/);
  if (!match) return null;
  const [_, y, m, d, , h, min] = match;
  const date = new Date(Date.UTC(y, m - 1, d, h || 0, min || 0));
  return date;
}

// Run once DOM is ready
document.addEventListener('DOMContentLoaded', loadCalendarEvents);
