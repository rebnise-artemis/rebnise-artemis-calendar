import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGameTimes, toGoogleUtcString, DEFAULT_DURATION_MINUTES } from '../lib/datetime.js';

test('JST 15:05 は UTC 06:05 になる', () => {
  const { start } = resolveGameTimes(
    { date: '2026-09-26', start: '15:05', end: null },
    'basketball'
  );
  assert.equal(start.toISOString(), '2026-09-26T06:05:00.000Z');
});

test('バスケットボールの既定所要時間は120分', () => {
  assert.equal(DEFAULT_DURATION_MINUTES.basketball, 120);
  const { end } = resolveGameTimes(
    { date: '2026-09-26', start: '15:05', end: null },
    'basketball'
  );
  assert.equal(end.toISOString(), '2026-09-26T08:05:00.000Z');
});

test('バレーボールの既定所要時間は150分', () => {
  assert.equal(DEFAULT_DURATION_MINUTES.volleyball, 150);
  const { end } = resolveGameTimes(
    { date: '2026-11-07', start: '14:00', end: null },
    'volleyball'
  );
  assert.equal(end.toISOString(), '2026-11-07T07:30:00.000Z');
});

test('end が指定されていればそちらを使う', () => {
  const { end } = resolveGameTimes(
    { date: '2026-09-26', start: '15:05', end: '18:00' },
    'basketball'
  );
  assert.equal(end.toISOString(), '2026-09-26T09:00:00.000Z');
});

test('JST 09:00 未満の開始時刻でも前日UTCに正しく繰り上がる', () => {
  const { start } = resolveGameTimes(
    { date: '2026-09-26', start: '08:30', end: null },
    'basketball'
  );
  assert.equal(start.toISOString(), '2026-09-25T23:30:00.000Z');
});

test('日をまたぐ終了時刻を正しく扱う', () => {
  const { end } = resolveGameTimes(
    { date: '2026-09-26', start: '22:30', end: null },
    'basketball'
  );
  assert.equal(end.toISOString(), '2026-09-26T15:30:00.000Z');
});

test('toGoogleUtcString は Z 付きの詰めた形式を返す', () => {
  const d = new Date('2026-09-26T06:05:00.000Z');
  assert.equal(toGoogleUtcString(d), '20260926T060500Z');
});

test('未知の sport は例外を投げる', () => {
  assert.throws(
    () => resolveGameTimes({ date: '2026-09-26', start: '15:05', end: null }, 'soccer'),
    /soccer/
  );
});

test('時刻が確定していれば allDay は false', () => {
  const times = resolveGameTimes({ date: '2026-09-26', start: '15:05', end: null }, 'basketball');
  assert.equal(times.allDay, false);
});

test('start が null なら終日予定になる', () => {
  const times = resolveGameTimes({ date: '2026-09-26', start: null, end: null }, 'basketball');
  assert.equal(times.allDay, true);
  assert.equal(times.startDate, '20260926');
});

test('終日予定の終了日は翌日（排他的）', () => {
  const times = resolveGameTimes({ date: '2026-09-26', start: null, end: null }, 'basketball');
  assert.equal(times.endDate, '20260927');
});

test('終日予定が月末をまたいでも翌日を正しく求める', () => {
  const times = resolveGameTimes({ date: '2026-11-30', start: null, end: null }, 'volleyball');
  assert.equal(times.startDate, '20261130');
  assert.equal(times.endDate, '20261201');
});

test('終日予定が年末をまたいでも翌日を正しく求める', () => {
  const times = resolveGameTimes({ date: '2026-12-31', start: null, end: null }, 'basketball');
  assert.equal(times.endDate, '20270101');
});
