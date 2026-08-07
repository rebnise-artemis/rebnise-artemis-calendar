import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGoogleCalendarUrl } from '../lib/google-link.js';

const ENTRY = {
  game: {
    id: 'reb-20260926',
    date: '2026-09-26',
    start: '15:05',
    end: null,
    opponent: 'ライジングゼファー福岡',
    venue: '鹿児島県総合体育センター体育館',
    homeAway: 'home',
    category: 'regular',
    note: '',
  },
  sport: 'basketball',
  teamShort: 'レブナイズ',
};

test('GoogleカレンダーのTEMPLATE URLを生成する', () => {
  const url = new URL(buildGoogleCalendarUrl(ENTRY));
  assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
});

test('datesはUTCの開始/終了をスラッシュで繋いだ形', () => {
  const url = new URL(buildGoogleCalendarUrl(ENTRY));
  assert.equal(url.searchParams.get('dates'), '20260926T060500Z/20260926T080500Z');
});

test('タイトルと会場が入る', () => {
  const url = new URL(buildGoogleCalendarUrl(ENTRY));
  assert.equal(url.searchParams.get('text'), 'レブナイズ vs ライジングゼファー福岡（HOME）');
  assert.equal(url.searchParams.get('location'), '鹿児島県総合体育センター体育館');
});

test('日本語と記号がURLエンコードされている', () => {
  const url = buildGoogleCalendarUrl(ENTRY);
  assert.ok(!/[^\x00-\x7F]/.test(url), '未エンコードのマルチバイト文字が含まれている');
  assert.ok(url.includes('%'), 'エンコードされていない');
});

test('noteがあればdetailsに含まれる', () => {
  const url = new URL(buildGoogleCalendarUrl({ ...ENTRY, game: { ...ENTRY.game, note: '開場は13時' } }));
  assert.ok(url.searchParams.get('details').includes('開場は13時'));
});

test('時間未定の試合は日付だけのdates（終日予定）になる', () => {
  const url = new URL(
    buildGoogleCalendarUrl({ ...ENTRY, game: { ...ENTRY.game, start: null, end: null } })
  );
  assert.equal(url.searchParams.get('dates'), '20260926/20260927');
});
