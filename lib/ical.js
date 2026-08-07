import { resolveGameTimes, toGoogleUtcString } from './datetime.js';

const CRLF = '\r\n';
const MAX_OCTETS = 75;

export function escapeText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function byteLength(str) {
  return new TextEncoder().encode(str).length;
}

export function foldLine(line) {
  if (byteLength(line) <= MAX_OCTETS) return line;

  const parts = [];
  let current = '';
  // 1行目は75オクテット、継続行は先頭スペース1オクテットを含めて75オクテット
  let limit = MAX_OCTETS;

  for (const ch of [...line]) {
    if (byteLength(current) + byteLength(ch) > limit) {
      parts.push(current);
      current = ch;
      limit = MAX_OCTETS - 1;
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  return parts.map((p, i) => (i === 0 ? p : ' ' + p)).join(CRLF);
}

const UID_SUFFIX = '@rebnise-artemis-calendar';

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Tokyo',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0900',
  'TZOFFSETTO:+0900',
  'TZNAME:JST',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const HOME_AWAY_LABEL = { home: 'HOME', away: 'AWAY' };

export function buildEventTitle(game, teamShort) {
  return `${teamShort} vs ${game.opponent}（${HOME_AWAY_LABEL[game.homeAway]}）`;
}

export function buildUid(game) {
  return `${game.id}${UID_SUFFIX}`;
}

// UTCのDateを、JSTのローカル時刻表記 "YYYYMMDDTHHMMSS" にする
function toJstLocalString(utcDate) {
  const jst = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${jst.getUTCFullYear()}${pad(jst.getUTCMonth() + 1)}${pad(jst.getUTCDate())}` +
    `T${pad(jst.getUTCHours())}${pad(jst.getUTCMinutes())}00`
  );
}

function buildEvent(entry) {
  const { game, sport, teamShort } = entry;
  const times = resolveGameTimes(game, sport);

  const description = [game.note, `会場: ${game.venue}`].filter(Boolean).join('\n');

  // DTSTAMPは生成時刻ではなく試合日時から決める。生成のたびに差分が出るのを避けるため
  const timeLines = times.allDay
    ? [
        `DTSTAMP:${times.startDate}T000000Z`,
        `DTSTART;VALUE=DATE:${times.startDate}`,
        `DTEND;VALUE=DATE:${times.endDate}`,
      ]
    : [
        `DTSTAMP:${toGoogleUtcString(times.start)}`,
        `DTSTART;TZID=Asia/Tokyo:${toJstLocalString(times.start)}`,
        `DTEND;TZID=Asia/Tokyo:${toJstLocalString(times.end)}`,
      ];

  return [
    'BEGIN:VEVENT',
    `UID:${buildUid(game)}`,
    ...timeLines,
    `SUMMARY:${escapeText(buildEventTitle(game, teamShort))}`,
    `LOCATION:${escapeText(game.venue)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
  ];
}

export function buildCalendar(entries, calendarName) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//rebnise-artemis-calendar//JP',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Tokyo',
    ...VTIMEZONE,
    ...entries.flatMap(buildEvent),
    'END:VCALENDAR',
  ];

  return lines.map(foldLine).join(CRLF) + CRLF;
}
