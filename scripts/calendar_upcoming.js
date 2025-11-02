// scripts/calendar_upcoming.js
async function loadUpcomingCalendarEvents() {
  const calendarURL =
    'https://calendar.google.com/calendar/ical/57d4b94486ef72a90c0e0852ff99bd9b96c352689b56a78da55512e3b9e851d8@group.calendar.google.com/public/basic.ics';
  const proxy = 'https://api.allorigins.win/raw?url=';

  let ics;
  try {
    const response = await fetch(proxy + encodeURIComponent(calendarURL));
    if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`);
    ics = await response.text();
  } catch (err) {
    console.error('❌ Calendar fetch failed:', err);
    const list = document.querySelector('.gig-list-stacked');
    if (list) list.innerHTML = `<li><p style="color:red;">Unable to load events at this time.</p></li>`;
    return;
  }

  const events = ics.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g) || [];

  const parsed = events
    .map((e) => {
      const get = (key) => e.match(new RegExp(`${key}:([^\\n\\r]*)`))?.[1]?.trim();
      const start = get('DTSTART');
      const end = get('DTEND');
      const summary = get('SUMMARY') || 'Untitled Event';
      const location = get('LOCATION') || 'Location TBD';
      const startDate = start ? parseIcsDate(start) : null;
      const endDate = end ? parseIcsDate(end) : null;
      return { summary, location, startDate, endDate };
    })
    .filter((e) => e.startDate && e.startDate >= new Date())
    .sort((a, b) => a.startDate - b.startDate);

  const list = document.querySelector('.gig-list-stacked');
  if (!list) return;
  list.innerHTML = '';

  parsed.forEach((ev) => {
    const month = ev.startDate.toLocaleString('en-US', { month: 'short' });
    const day = ev.startDate.getDate();
    const startTime = ev.startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endTime = ev.endDate
      ? ev.endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : 'TBD';
    const li = document.createElement('li');
    li.className = 'gig-item';
    li.setAttribute('data-start', ev.startDate.toISOString());
    li.innerHTML = `
      <div class="gig-badge" aria-hidden="true">
        <span class="month">${month}</span>
        <span class="day">${day}</span>
        <span class="time">${startTime.replace(' ', '')}${endTime !== 'TBD' ? '–' + endTime.replace(' ', '') : ''}</span>
      </div>
      <div class="gig-details">
        <p class="gig-title">${ev.summary} at ${ev.location}</p>
        <p class="gig-location">
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}"
             target="_blank" rel="noopener">${ev.location}</a>
        </p>
        <hr class="hr" />
      </div>
    `;
    list.appendChild(li);
  });

  if (!parsed.length) {
    list.innerHTML = `<li><p>No upcoming events at this time. Check back soon!</p></li>`;
  }
}

function parseIcsDate(icsDate) {
  const match = icsDate.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2}))?/);
  if (!match) return null;
  const [_, y, m, d, , h, min] = match;
  return new Date(Date.UTC(y, m - 1, d, h || 0, min || 0));
}

document.addEventListener('DOMContentLoaded', loadUpcomingCalendarEvents);
