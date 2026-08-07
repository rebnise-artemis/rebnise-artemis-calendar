export const DEFAULT_DURATION_MINUTES = {
  basketball: 120,
  volleyball: 150,
};

const JST_OFFSET_HOURS = 9;

function jstToUtc(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - JST_OFFSET_HOURS, minute));
}

// "YYYY-MM-DD" を "YYYYMMDD" にし、offsetDays 日ずらす
function toDateStamp(dateStr, offsetDays = 0) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + offsetDays));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

export function resolveGameTimes(game, sport) {
  const durationMinutes = DEFAULT_DURATION_MINUTES[sport];
  if (durationMinutes === undefined) {
    throw new Error(`未知の競技です: ${sport}`);
  }

  // 開始時刻が未発表の試合は終日予定として扱う。終了日は翌日（排他的）
  if (game.start === null) {
    return {
      allDay: true,
      startDate: toDateStamp(game.date),
      endDate: toDateStamp(game.date, 1),
    };
  }

  const start = jstToUtc(game.date, game.start);
  const end = game.end
    ? jstToUtc(game.date, game.end)
    : new Date(start.getTime() + durationMinutes * 60 * 1000);

  return { allDay: false, start, end };
}

export function toGoogleUtcString(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
