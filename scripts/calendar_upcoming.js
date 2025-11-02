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
    if (list)
      list.innerHTML = `<li><p style="color:red;">Unable to load events at this time.</p></li>`;
    return;
  }

  // Extract each event block
  const events = ics.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g) || [];
  const now = new Date();

  const parsed = events
    .map((e) => {
      const get = (key) =>
        e.match(new RegExp(`${key}:([^\\n\\r]*)`))?.[1]?.trim();

      const start = get('DTSTART');
      const end = get('DTEND');
      const summary = get('SUMMARY') || 'Untitled Event';
      const location = get('LOCATION') || ''; // full address for map link

      // Clean up description (this becomes the visible link text)
      let description = get('DESCRIPTION') || '';
      description = description
        .replace(/\\,/g, ',') // unescape commas
        .replace(/<\/?[^>]+(>|$)/g, '') // strip HTML tags
        .replace(/&lt;|&gt;|&amp;/g, '') // remove HTML entities
        .replace(/\s+/g, ' ') // normalize spaces
        .trim();

      const startDate = start ? parseIcsDate(start) : null;
      const endDate = end ? parseIcsDate(end) : null;

      return { summary, location, description, startDate, endDate };
    })
    .filter((e) => e.startDate)
    .sort((a, b) => a.startDate - b.startDate);

  // Split future vs past
  const pastEvents = parsed.filter((e) => e.startDate < now);
  const upcomingEvents = parsed.filter((e) => e.startDate >= now);

  // Keep last 3 past events (most recent first)
  const recentPast = pastEvents.slice(-3).reverse();

  // Combine past (greyed out) and upcoming
  const combined = [...recentPast, ...upcomingEvents];

  const list = document.querySelector('.gig-list-stacked');
  if (!list) return;
  list.innerHTML = '';

  combined.forEach((ev) => {
    const month = ev.startDate.toLocaleString('en-US', { month: 'short' });
    const day = ev.startDate.getDate();
    const startTime = ev.startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTime = ev.endDate
      ? ev.endDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'TBD';

    const mapsHref = ev.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          ev.location
        )}`
      : '';

    const displayLocation = ev.description || 'Location TBD';
    const isPast = ev.startDate < now;

    const li = document.createElement('li');
    li.className = `gig-item${isPast ? ' is-past' : ''}`;
    li.setAttribute('data-start', ev.startDate.toISOString());

    li.innerHTML = `
      <div class="gig-badge" aria-hidden="true">
        <span class="month">${month}</span>
        <span class="day">${day}</span>
        <span class="time">${startTime.replace(
          ' ',
          ''
        )}${endTime !== 'TBD' ? '–' + endTime.replace(' ', '') : ''}</span>
      </div>
      <div class="gig-details">
        <p class="gig-title">${escapeHtml(ev.summary)}</p>
        <p class="gig-location">
          ${
            mapsHref
              ? `<a href="${mapsHref}" target="_blank" rel="noopener">${escapeHtml(
                  displayLocation
                )}</a>`
              : escapeHtml(displayLocation)
          }
        </p>
        <hr class="hr" />
      </div>
    `;

    list.appendChild(li);
  });

  if (!combined.length) {
    list.innerHTML = `<li><p>No upcoming events at this time. Check back soon!</p></li>`;
  }
}

// --- Helpers ---
function parseIcsDate(icsDate) {
  const match = icsDate.match(
    /(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})?(Z)?)?/
  );
  if (!match) return null;
  const [_, y, m, d, , h, min, s, z] = match;
  return z
    ? new Date(Date.UTC(y, m - 1, d, h || 0, min || 0, s || 0))
    : new Date(y, m - 1, d, h || 0, min || 0, s || 0);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => {
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

document.addEventListener('DOMContentLoaded', loadUpcomingCalendarEvents);
