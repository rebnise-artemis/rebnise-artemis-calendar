import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeText, foldLine } from '../lib/ical.js';

test('バックスラッシュをエスケープする', () => {
  assert.equal(escapeText('a\\b'), 'a\\\\b');
});

test('セミコロンとカンマをエスケープする', () => {
  assert.equal(escapeText('a;b,c'), 'a\\;b\\,c');
});

test('改行を \\n に変換する', () => {
  assert.equal(escapeText('a\nb'), 'a\\nb');
  assert.equal(escapeText('a\r\nb'), 'a\\nb');
});

test('バックスラッシュを先にエスケープするので二重エスケープにならない', () => {
  assert.equal(escapeText('a\\,b'), 'a\\\\\\,b');
});

test('75オクテット以内の行は折り返さない', () => {
  const line = 'SUMMARY:short';
  assert.equal(foldLine(line), line);
});

test('75オクテットを超える行を折り返し、継続行はスペースで始まる', () => {
  const line = 'SUMMARY:' + 'a'.repeat(100);
  const folded = foldLine(line);
  const parts = folded.split('\r\n');
  assert.ok(parts.length > 1, '折り返されていない');
  assert.equal(Buffer.byteLength(parts[0], 'utf8'), 75);
  assert.ok(parts.slice(1).every((p) => p.startsWith(' ')), '継続行がスペースで始まっていない');
});

test('折り返しても元の文字列を復元できる', () => {
  const line = 'SUMMARY:' + 'a'.repeat(200);
  const restored = foldLine(line).split('\r\n').map((p, i) => (i === 0 ? p : p.slice(1))).join('');
  assert.equal(restored, line);
});

test('マルチバイト文字を分断しない', () => {
  const line = 'SUMMARY:' + 'あ'.repeat(60);
  const folded = foldLine(line);
  for (const part of folded.split('\r\n')) {
    assert.ok(Buffer.byteLength(part, 'utf8') <= 75, `75オクテットを超えた: ${part}`);
    assert.ok(!part.includes('�'), '文字が壊れている');
  }
  const restored = folded.split('\r\n').map((p, i) => (i === 0 ? p : p.slice(1))).join('');
  assert.equal(restored, line);
});
