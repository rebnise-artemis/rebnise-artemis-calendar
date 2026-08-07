import { resolveGameTimes, toGoogleUtcString } from './datetime.js';
import { buildEventTitle } from './ical.js';

export function buildGoogleCalendarUrl(entry) {
  const { game, sport, teamShort } = entry;
  const times = resolveGameTimes(game, sport);

  // 終日予定は日付のみ、終了日は排他的
  const dates = times.allDay
    ? `${times.startDate}/${times.endDate}`
    : `${toGoogleUtcString(times.start)}/${toGoogleUtcString(times.end)}`;

  const details = [
    game.note,
    times.allDay ? '開始時刻は未定です。決まり次第サイトで更新されます。' : '',
    `会場: ${game.venue}`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: buildEventTitle(game, teamShort),
    dates,
    location: game.venue,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
