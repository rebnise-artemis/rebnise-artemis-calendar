const SPORTS = ['basketball', 'volleyball'];
const CATEGORIES = ['preseason', 'regular', 'postseason'];
const HOME_AWAY = ['home', 'away'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function validateScheduleFile(data) {
  const errors = [];

  for (const field of ['team', 'teamShort', 'season']) {
    if (typeof data[field] !== 'string' || !data[field]) {
      errors.push(`${field} が文字列ではありません`);
    }
  }
  if (!SPORTS.includes(data.sport)) {
    errors.push(`sport が不正です: ${data.sport}`);
  }
  if (!Array.isArray(data.games)) {
    errors.push('games が配列ではありません');
    return errors;
  }

  data.games.forEach((game, i) => {
    const at = `games[${i}] (${game.id ?? 'id不明'})`;
    if (typeof game.id !== 'string' || !game.id) errors.push(`${at}: id が不正です`);
    if (!DATE_RE.test(game.date ?? '')) errors.push(`${at}: date が YYYY-MM-DD ではありません`);
    // start が null なら時間未定（終日予定として扱う）
    if (game.start !== null && !TIME_RE.test(game.start ?? '')) {
      errors.push(`${at}: start が HH:MM または null ではありません`);
    }
    if (game.end !== null && !TIME_RE.test(game.end ?? '')) {
      errors.push(`${at}: end が HH:MM または null ではありません`);
    }
    if (game.start === null && game.end !== null) {
      errors.push(`${at}: start が null のとき end も null にしてください`);
    }
    if (typeof game.opponent !== 'string' || !game.opponent) errors.push(`${at}: opponent が不正です`);
    if (typeof game.venue !== 'string' || !game.venue) errors.push(`${at}: venue が不正です`);
    if (!HOME_AWAY.includes(game.homeAway)) errors.push(`${at}: homeAway が不正です`);
    if (!CATEGORIES.includes(game.category)) errors.push(`${at}: category が不正です: ${game.category}`);
  });

  return errors;
}
