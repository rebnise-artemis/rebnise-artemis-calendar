import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEntries } from '../scripts/build-ics.js';

test('スケジュールファイルをbuildCalendar用のentriesに変換する', () => {
  const entries = toEntries({
    team: '鹿児島レブナイズ',
    teamShort: 'レブナイズ',
    sport: 'basketball',
    season: '2026-27',
    games: [
      { id: 'reb-1', date: '2026-09-26', start: '15:05', end: null, opponent: 'A', venue: 'B', homeAway: 'home', category: 'regular', note: '' },
      { id: 'reb-2', date: '2026-09-27', start: '13:05', end: null, opponent: 'A', venue: 'B', homeAway: 'home', category: 'regular', note: '' },
    ],
  });

  assert.equal(entries.length, 2);
  assert.equal(entries[0].sport, 'basketball');
  assert.equal(entries[0].teamShort, 'レブナイズ');
  assert.equal(entries[0].game.id, 'reb-1');
});

test('試合0件なら空配列を返す', () => {
  const entries = toEntries({
    team: 'テスト', teamShort: 'テスト', sport: 'volleyball', season: '2026-27', games: [],
  });
  assert.deepEqual(entries, []);
});
