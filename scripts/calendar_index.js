// scripts/calendar_index.js
async function loadIndexCalendarEvents() {
  const calendarURL =
    'https://calendar.google.com/calendar/ical/57d4b94486ef72a90c0e0852ff99bd9b96c352689b56a78da55512e3b9e851d8@group.calendar.google.com/public/basic.ics';
  const proxy = 'https://api.allorigins.win/raw?url=';

  let ics;
  try {
    const resp = await fetch(proxy + encodeURIComponent(calendarURL));
    if (!resp.ok) throw new Error(`Proxy fetch failed: ${resp.status}`);
    ics = await resp.text();
  } catch (e) {
    console.error('Calendar fetch failed:', e);
    const list = document.querySelector('.gig-list-stacked');
    if (list)
      list.innerHTML = `<li><p style="color:red;">Unable to load events right now.</p></li>`;
    return;
  }

  // Extract VEVENT blocks
  const events = ics.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g) || [];

  const parsed = events
    .map((block) => {
      const get = (key) =>
        block.match(new RegExp(`${key}:([^\\n\\r]*)`))?.[1]?.trim();

      const start = get('DTSTART');
      const end = get('DTEND');
      const summary = get('SUMMARY') || 'Untitled Event';
      const location = get('LOCATION') || ''; // address for map link

      // Clean and sanitize description (used for visible link text)
      let description = get('DESCRIPTION') || '';
      description = description
        .replace(/\\,/g, ',')               // unescape commas
        .replace(/<\/?[^>]+(>|$)/g, '')     // strip HTML tags
        .replace(/&lt;|&gt;|&amp;/g, '')    // remove HTML entities
        .replace(/\s+/g, ' ')               // normalize spaces
        .trim();

      const startDate = start ? parseIcsDate(start) : null;
      const endDate = end ? parseIcsDate(end) : null;

      return { summary, location, description, startDate, endDate };
    })
    .filter((ev) => ev.startDate && ev.startDate >= new Date())
    .sort((a, b) => a.startDate - b.startDate);

  const list = document.querySelector('.gig-list-stacked');
  if (!list) return;
  list.innerHTML = '';

  // Render top 5 upcoming events
  parsed.slice(0, 5).forEach((ev) => {
    const monthName = ev.startDate.toLocaleString('en-US', {
      month: 'long',
      timeZone: 'America/Chicago',
    });
    const day = ev.startDate.toLocaleString('en-US', {
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
    const startTime = formatTime(ev.startDate);
    const endTime = ev.endDate ? formatTime(ev.endDate) : '';
    const displayLocation = ev.description || 'Location TBD';
    const mapsHref = ev.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          ev.location
        )}`
      : '';

    const li = document.createElement('li');
    li.innerHTML = `
      <h2 class="gig-title">${escapeHtml(ev.summary)}</h2>
      <p class="gig-date">${monthName} ${day} @ ${startTime}${
      endTime ? ' – ' + endTime : ''
    }</p>
      <p class="gig-location">
        ${
          mapsHref
            ? `<a href="${mapsHref}" target="_blank" rel="noopener">${escapeHtml(
                displayLocation
              )}</a>`
            : escapeHtml(displayLocation)
        }
      </p>
    `;
    list.appendChild(li);
  });

  if (!parsed.length) {
    list.innerHTML = `<li><p>No upcoming events at this time. Check back soon!</p></li>`;
  }
}

// ----------------- helpers -----------------
function parseIcsDate(ics) {
  // Parse ICS date/time and interpret directly as local time (America/Chicago)
  const m = ics.match(
    /(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})?(Z)?)?/
  );
  if (!m) return null;
  const [_, y, mo, d, , hh, mm, ss] = m;
  // Always use local time (no UTC conversion)
  return new Date(+y, +mo - 1, +d, +(hh || 0), +(mm || 0), +(ss || 0));
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[c];
  });
}

document.addEventListener('DOMContentLoaded', loadIndexCalendarEvents);
