import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateScheduleFile } from '../lib/schedule.js';

const FILES = ['data/rebnise.json', 'data/artemis.json'];

async function loadFile(file) {
  return JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));
}

test('日程ファイルが妥当な形式である', async () => {
  for (const file of FILES) {
    const errors = validateScheduleFile(await loadFile(file));
    assert.deepEqual(errors, [], `${file}: ${errors.join(' / ')}`);
  }
});

test('全ファイルを通して試合IDが一意である', async () => {
  const ids = [];
  for (const file of FILES) {
    const data = await loadFile(file);
    ids.push(...data.games.map((g) => g.id));
  }
  assert.equal(new Set(ids).size, ids.length, 'IDが重複している');
});

test('各ファイルに1件以上の試合がある', async () => {
  for (const file of FILES) {
    const data = await loadFile(file);
    assert.ok(data.games.length > 0, `${file} に試合がありません`);
  }
});

test('validateScheduleFile は不正な日付を検出する', () => {
  const errors = validateScheduleFile({
    team: 'テスト', teamShort: 'テスト', sport: 'basketball', season: '2026-27',
    games: [{ id: 'x', date: '2026/09/26', start: '15:05', end: null, opponent: 'A', venue: 'B', homeAway: 'home', category: 'regular', note: '' }],
  });
  assert.ok(errors.some((e) => e.includes('date')));
});

test('validateScheduleFile は不正な category を検出する', () => {
  const errors = validateScheduleFile({
    team: 'テスト', teamShort: 'テスト', sport: 'basketball', season: '2026-27',
    games: [{ id: 'x', date: '2026-09-26', start: '15:05', end: null, opponent: 'A', venue: 'B', homeAway: 'home', category: 'friendly', note: '' }],
  });
  assert.ok(errors.some((e) => e.includes('category')));
});

test('validateScheduleFile は不正な sport を検出する', () => {
  const errors = validateScheduleFile({
    team: 'テスト', teamShort: 'テスト', sport: 'soccer', season: '2026-27', games: [],
  });
  assert.ok(errors.some((e) => e.includes('sport')));
});

test('validateScheduleFile は start が null（時間未定）を許容する', () => {
  const errors = validateScheduleFile({
    team: 'テスト', teamShort: 'テスト', sport: 'basketball', season: '2026-27',
    games: [{ id: 'x', date: '2026-09-26', start: null, end: null, opponent: 'A', venue: 'B', homeAway: 'home', category: 'regular', note: '' }],
  });
  assert.deepEqual(errors, []);
});

test('validateScheduleFile は start が null なのに end がある場合を検出する', () => {
  const errors = validateScheduleFile({
    team: 'テスト', teamShort: 'テスト', sport: 'basketball', season: '2026-27',
    games: [{ id: 'x', date: '2026-09-26', start: null, end: '18:00', opponent: 'A', venue: 'B', homeAway: 'home', category: 'regular', note: '' }],
  });
  assert.ok(errors.some((e) => e.includes('end')));
});
