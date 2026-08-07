import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendar, buildEventTitle, buildUid } from '../lib/ical.js';

const GAME = {
  id: 'reb-20260926',
  date: '2026-09-26',
  start: '15:05',
  end: null,
  opponent: 'ライジングゼファー福岡',
  venue: '鹿児島県総合体育センター体育館',
  homeAway: 'home',
  category: 'regular',
  note: '',
};

const ENTRY = { game: GAME, sport: 'basketball', teamShort: 'レブナイズ' };

test('タイトルは「チーム vs 相手（HOME）」の形', () => {
  assert.equal(
    buildEventTitle(GAME, 'レブナイズ'),
    'レブナイズ vs ライジングゼファー福岡（HOME）'
  );
});

test('AWAYの試合はAWAYと表示する', () => {
  assert.equal(
    buildEventTitle({ ...GAME, homeAway: 'away' }, 'レブナイズ'),
    'レブナイズ vs ライジングゼファー福岡（AWAY）'
  );
});

test('UIDは固定サフィックスを持ち、同じidから常に同じ値になる', () => {
  assert.equal(buildUid(GAME), 'reb-20260926@rebnise-artemis-calendar');
  assert.equal(buildUid(GAME), buildUid({ ...GAME }));
});

test('VCALENDARとVTIMEZONEを含む', () => {
  const ics = buildCalendar([ENTRY], 'レブナイズ 2026-27');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('BEGIN:VTIMEZONE'));
  assert.ok(ics.includes('TZID:Asia/Tokyo'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
});

test('DTSTARTはTZID付きのJSTローカル時刻で出力する', () => {
  const ics = buildCalendar([ENTRY], 'テスト');
  assert.ok(ics.includes('DTSTART;TZID=Asia/Tokyo:20260926T150500'));
  assert.ok(ics.includes('DTEND;TZID=Asia/Tokyo:20260926T170500'));
});

test('DTSTAMPはUTCで出力する', () => {
  const ics = buildCalendar([ENTRY], 'テスト');
  assert.ok(ics.includes('DTSTAMP:20260926T060500Z'));
});

test('同じ入力からは常に同じicsが生成される（差分が出ない）', () => {
  assert.equal(buildCalendar([ENTRY], 'テスト'), buildCalendar([ENTRY], 'テスト'));
});

test('すべての行がCRLFで区切られている', () => {
  const ics = buildCalendar([ENTRY], 'テスト');
  const lfOnly = ics.split('\n').filter((line, i, arr) => i < arr.length - 1 && !line.endsWith('\r'));
  assert.equal(lfOnly.length, 0, '素のLFが含まれている');
});

test('会場名がLOCATIONに入る', () => {
  const ics = buildCalendar([ENTRY], 'テスト');
  const unfolded = ics.split('\r\n ').join('');
  assert.ok(unfolded.includes('LOCATION:鹿児島県総合体育センター体育館'));
});

test('カンマを含む会場名はエスケープされる', () => {
  const ics = buildCalendar(
    [{ ...ENTRY, game: { ...GAME, venue: '会場A, 第2体育館' } }],
    'テスト'
  );
  const unfolded = ics.split('\r\n ').join('');
  assert.ok(unfolded.includes('LOCATION:会場A\\, 第2体育館'));
});

test('複数の試合をVEVENTとして出力する', () => {
  const second = { ...ENTRY, game: { ...GAME, id: 'reb-20260927', date: '2026-09-27' } };
  const ics = buildCalendar([ENTRY, second], 'テスト');
  assert.equal(ics.split('BEGIN:VEVENT').length - 1, 2);
});

test('試合が0件でも壊れないカレンダーを返す', () => {
  const ics = buildCalendar([], 'テスト');
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(!ics.includes('BEGIN:VEVENT'));
});

const TBD_ENTRY = { ...ENTRY, game: { ...GAME, id: 'reb-20261212', date: '2026-12-12', start: null, end: null } };

test('時間未定の試合はVALUE=DATEの終日予定として出力する', () => {
  const ics = buildCalendar([TBD_ENTRY], 'テスト');
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261212'));
  assert.ok(ics.includes('DTEND;VALUE=DATE:20261213'));
  assert.ok(!ics.includes('TZID=Asia/Tokyo:2026121'), '終日予定にTZID付きの日時が出ている');
});

test('時間未定の試合にもDTSTAMPが出る', () => {
  const ics = buildCalendar([TBD_ENTRY], 'テスト');
  assert.ok(/DTSTAMP:\d{8}T\d{6}Z/.test(ics));
});

test('時間未定の試合でもUIDとタイトルは通常どおり', () => {
  const ics = buildCalendar([TBD_ENTRY], 'テスト');
  const unfolded = ics.split('\r\n ').join('');
  assert.ok(unfolded.includes('UID:reb-20261212@rebnise-artemis-calendar'));
  assert.ok(unfolded.includes('SUMMARY:レブナイズ vs ライジングゼファー福岡（HOME）'));
});
