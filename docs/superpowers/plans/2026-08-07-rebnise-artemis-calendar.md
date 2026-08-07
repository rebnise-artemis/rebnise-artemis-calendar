# 鹿児島レブナイズ・アルテミス北海道 カレンダー登録サイト Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 鹿児島レブナイズとアルテミス北海道の試合予定を一覧表示し、クリック操作でGoogleカレンダーに登録できる静的サイトを作り、GitHub Pagesで公開する。

**Architecture:** 素のHTML/CSS/JSの単一ページ。日程データは `data/*.json` に持ち、ブラウザが直接fetchして描画する。ics生成ロジックは `lib/` に切り出し、Nodeスクリプト（購読用ics生成）とブラウザ（選択試合のics生成）の両方から同じコードを使う。ビルド処理は「JSON → 購読用ics」の1本だけ。

**Tech Stack:** HTML / CSS / Vanilla JavaScript (ESM) / Node.js 20+ (`node:test` のみ、外部依存ゼロ)

## Global Constraints

- **外部ライブラリを一切使わない。** `package.json` に `dependencies` / `devDependencies` を追加しない。テストは Node 標準の `node:test` と `node:assert/strict` を使う
- **すべてのJSファイルは拡張子 `.js` で統一し、ESMとして書く。** `package.json` に `"type": "module"` を指定するため、Nodeは `.js` をESMとして扱う。`.mjs` を使ってはいけない — ローカル開発サーバ（`python3 -m http.server`）が `.mjs` のMIMEタイプを解決できず、ブラウザがモジュールの読み込みを拒否するため
- **タイムゾーンは Asia/Tokyo 固定。** 実行環境のTZに依存する処理（`new Date("2026-09-26 15:05")` のようなローカル時刻解釈）を書いてはいけない。JST→UTC変換は `Date.UTC(y, m-1, d, hh - 9, mm)` の形で明示的に行う
- **UIDの固定サフィックスは `@rebnise-artemis-calendar`。** 公開ドメインには依存させない
- **競技別デフォルト所要時間:** `basketball` = 120分、`volleyball` = 150分
- **開始時刻が未定の試合は `start: null` とし、終日予定として扱う。** 仮の時刻で埋めてはいけない。`start` が `null` のとき `end` も必ず `null`
- **ics の改行コードは CRLF (`\r\n`)、行は75オクテットで折り返す**（マルチバイト文字を分断しない）
- **日程データを書き換えてよいのは `data/*.json` のみ。** 他のファイルはこれを読むだけ
- **コミットメッセージは日本語可。** Conventional Commits のプレフィックス（`feat:` `test:` `docs:` `chore:`）を付ける

---

### Task 1: リポジトリ初期化とプロジェクト骨格

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: なし
- Produces: `npm test` で `*.test.js` が実行される。`npm run build` で `node scripts/build-ics.js` が実行される

**注意:** `test` スクリプトは引数なしの `node --test` にすること。`node --test test/` は Node 24 では `test/` をディレクトリではなくモジュールとして解決しようとして失敗する。引数なしなら該当ファイルが0件でも exit 0 になる。

- [ ] **Step 1: Gitリポジトリを初期化する**

```bash
git init
git branch -M main
```

- [ ] **Step 2: `package.json` を作る**

```json
{
  "name": "rebnise-artemis-calendar",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "鹿児島レブナイズ・アルテミス北海道の試合予定をGoogleカレンダーに登録できるサイト",
  "scripts": {
    "test": "node --test",
    "build": "node scripts/build-ics.js"
  }
}
```

- [ ] **Step 3: `.gitignore` を作る**

```
node_modules/
.DS_Store
```

- [ ] **Step 4: `README.md` を作る**

```markdown
# レブナイズ・アルテミス カレンダー

鹿児島レブナイズ（B.LEAGUE ONE）とアルテミス北海道（V.LEAGUE Women）の試合予定を、クリックでGoogleカレンダーに登録できるサイトです。

## 日程を更新する手順

1. `data/rebnise.json` または `data/artemis.json` を編集する
2. `npm test` を実行してテストが通ることを確認する
3. `npm run build` を実行して `calendars/*.ics` を再生成する
4. コミットしてpushする（GitHub Pagesが自動で反映されます）

### 注意

- 一度公開した試合の `id` は変更しないでください。購読しているカレンダー上で予定が重複します
- `end` を省略（`null`）すると、競技別のデフォルト所要時間（バスケ2時間 / バレー2.5時間）で終了時刻を算出します

## 開発

外部ライブラリは使っていません。Node.js 20以上があれば動きます。

- `npm test` — 変換処理のテスト
- `npm run build` — `data/*.json` から `calendars/*.ics` を生成
- ローカル確認は `python3 -m http.server 8000` で `http://localhost:8000/` を開く（`file://` では動きません）
```

- [ ] **Step 5: `npm test` が正常終了することを確認する**

Run: `npm test`
Expected: テストファイルが無いため実行対象0件で終了する（エラーで落ちなければよい）

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore README.md
git commit -m "chore: プロジェクト骨格を作成"
```

---

### Task 2: 設計ドキュメントをコミット

**Files:**
- Modify: なし（既存の設計書と本計画をコミットするだけ）

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 設計書と計画書をコミットする**

```bash
git add docs/
git commit -m "docs: 設計書と実装計画を追加"
```

---

### Task 3: JST→UTC変換と終了時刻の算出

**Files:**
- Create: `lib/datetime.js`
- Test: `test/datetime.test.js`

**Interfaces:**
- Consumes: なし
- Produces:
  - `resolveGameTimes(game, sport)` — `game` は `{ date: "YYYY-MM-DD", start: "HH:MM"|null, end: "HH:MM"|null }`、`sport` は `"basketball"|"volleyball"`。戻り値は次のいずれか：
    - 時刻が確定している場合: `{ allDay: false, start: Date, end: Date }`（Date はUTC時刻を指す）
    - `game.start` が `null` の場合: `{ allDay: true, startDate: "YYYYMMDD", endDate: "YYYYMMDD" }`（`endDate` は翌日。ics・Googleリンクとも終了日は排他的なため）
  - `toGoogleUtcString(date) -> string` — `Date` を `"YYYYMMDDTHHMMSSZ"` 形式にする
  - `DEFAULT_DURATION_MINUTES` — `{ basketball: 120, volleyball: 150 }`

- [ ] **Step 1: 失敗するテストを書く**

`test/datetime.test.js`:

```javascript
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm test`
Expected: FAIL（`lib/datetime.js` が存在しないため import エラー）

- [ ] **Step 3: 最小限の実装を書く**

`lib/datetime.js`:

```javascript
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm test`
Expected: PASS（13件）

- [ ] **Step 5: Commit**

```bash
git add lib/datetime.js test/datetime.test.js
git commit -m "feat: JST→UTC変換と終了時刻の算出を追加"
```

---

### Task 4: ics のエスケープと行折り返し

**Files:**
- Create: `lib/ical.js`
- Test: `test/ical-text.test.js`

**Interfaces:**
- Consumes: なし
- Produces:
  - `escapeText(value) -> string` — RFC 5545 に従い `\` `;` `,` 改行をエスケープする
  - `foldLine(line) -> string` — 75オクテットで折り返し、継続行の先頭に半角スペースを付ける。行の区切りは `\r\n`

- [ ] **Step 1: 失敗するテストを書く**

`test/ical-text.test.js`:

```javascript
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm test`
Expected: FAIL（`lib/ical.js` が存在しない）

- [ ] **Step 3: 最小限の実装を書く**

`lib/ical.js`:

```javascript
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm test`
Expected: PASS（Task 3 の13件と合わせて21件）

- [ ] **Step 5: Commit**

```bash
git add lib/ical.js test/ical-text.test.js
git commit -m "feat: icsのエスケープと75オクテット行折り返しを追加"
```

---

### Task 5: ics カレンダー本体の組み立て

**Files:**
- Modify: `lib/ical.js`（`buildCalendar` などを追加）
- Test: `test/ical-calendar.test.js`

**Interfaces:**
- Consumes: `lib/datetime.js` の `resolveGameTimes` / `toGoogleUtcString`、同ファイル内の `escapeText` / `foldLine`
- Produces:
  - `buildEventTitle(game, teamShort) -> string` — 例: `レブナイズ vs ライジングゼファー福岡（HOME）`
  - `buildUid(game) -> string` — `<game.id>@rebnise-artemis-calendar`
  - `buildCalendar(entries, calendarName) -> string` — `entries` は `{ game, sport, teamShort }` の配列。完成した ics テキストを返す

`entries` の各要素の型：

```javascript
{
  game: { id, date, start, end, opponent, venue, homeAway, category, note },
  sport: 'basketball' | 'volleyball',
  teamShort: 'レブナイズ'
}
```

- [ ] **Step 1: 失敗するテストを書く**

`test/ical-calendar.test.js`:

```javascript
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm test`
Expected: FAIL（`buildCalendar` が export されていない）

- [ ] **Step 3: `lib/ical.js` に実装を追加する**

ファイル先頭に import を追加する（既存の `escapeText` / `foldLine` はそのまま残す）。

```javascript
import { resolveGameTimes, toGoogleUtcString } from './datetime.js';
```

ファイル末尾に追加：

```javascript
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm test`
Expected: PASS（36件）

- [ ] **Step 5: Commit**

```bash
git add lib/ical.js test/ical-calendar.test.js
git commit -m "feat: icsカレンダー本体の組み立てを追加"
```

---

### Task 6: 試合データの投入

**Files:**
- Create: `data/rebnise.json`
- Create: `data/artemis.json`
- Create: `lib/schedule.js`
- Test: `test/data.test.js`

**Interfaces:**
- Consumes: なし
- Produces:
  - `validateScheduleFile(data) -> string[]` — 問題があればエラーメッセージの配列を返す。問題なければ空配列
  - `data/*.json` — 設計書のデータ形式に従った日程ファイル

**このタスクの実データ収集について:** 公式サイトとニュース記事から日程を収集して投入する。レブナイズのスケジュールページはJavaScriptで動的描画されているため機械的な全件取得ができない。取得できた範囲を投入し、**取得できなかった試合・確証が持てなかった試合は一覧にして報告する**。推測で埋めてはいけない。

参照元：
- https://www.rebnise.jp/schedule/
- https://kagoshima.rebnise.jp/column/8948/ （プレシーズン開催告知）
- https://kagoshima.rebnise.jp/column/9062/ （プレシーズン対戦相手・開始時間）
- https://kagoshima.rebnise.jp/column/9005/ （リーグ戦前半 試合時間・会場）
- https://artemis-hokkaido.jp/game/

- [ ] **Step 1: 失敗するテストを書く**

`test/data.test.js`:

```javascript
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm test`
Expected: FAIL（`lib/schedule.js` と `data/*.json` が存在しない）

- [ ] **Step 3: `lib/schedule.js` を実装する**

```javascript
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
```

- [ ] **Step 4: 公式サイトから日程を収集して `data/*.json` を作る**

WebFetch で参照元の各URLを取得し、日程を書き起こす。`games` は日付昇順に並べる。

`data/rebnise.json`:

```json
{
  "team": "鹿児島レブナイズ",
  "teamShort": "レブナイズ",
  "sport": "basketball",
  "season": "2026-27",
  "games": [
    {
      "id": "reb-20260926",
      "date": "2026-09-26",
      "start": "15:05",
      "end": null,
      "opponent": "ライジングゼファー福岡",
      "venue": "鹿児島県総合体育センター体育館",
      "homeAway": "home",
      "category": "regular",
      "note": ""
    }
  ]
}
```

`data/artemis.json` も同じ形式で、`sport` は `"volleyball"`、`team` は `"アルテミス北海道"`、`teamShort` は `"アルテミス"`、`id` の接頭辞は `art-` にする。

`id` の付け方は `<接頭辞>-<YYYYMMDD>` とし、同日に2試合ある場合のみ末尾に `-2` を付ける。

**開始時刻が未発表の試合は `"start": null, "end": null` とする。** 仮の時刻を入れてはいけない。日付だけ発表されている試合はこの形で載せる。

- [ ] **Step 5: テストを実行して成功を確認する**

Run: `npm test`
Expected: PASS（44件）

- [ ] **Step 6: 収集結果を報告する**

投入した試合数をチーム別・カテゴリ別に集計し、以下を明示して報告する。ユーザーに目視照合を依頼する。

- **取得できなかった／確証が持てなかった試合**
- **開始時刻が未定（`start: null`）の試合の一覧** — 後日更新が必要な箇所として残るため

- [ ] **Step 7: Commit**

```bash
git add data/ lib/schedule.js test/data.test.js
git commit -m "feat: 日程データと検証ロジックを追加"
```

---

### Task 7: 購読用 ics の生成スクリプト

**Files:**
- Create: `scripts/build-ics.js`
- Test: `test/build-ics.test.js`

**Interfaces:**
- Consumes: `lib/ical.js` の `buildCalendar`、`lib/schedule.js` の `validateScheduleFile`
- Produces:
  - `toEntries(scheduleFile) -> Array<{game, sport, teamShort}>` — `buildCalendar` に渡せる形に変換する（`scripts/build-ics.js` から export する）
  - `calendars/rebnise.ics` / `calendars/artemis.ics` / `calendars/all.ics`

- [ ] **Step 1: 失敗するテストを書く**

`test/build-ics.test.js`:

```javascript
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm test`
Expected: FAIL（`scripts/build-ics.js` が存在しない）

- [ ] **Step 3: `scripts/build-ics.js` を実装する**

直接実行されたときだけ生成処理を走らせる（テストから import したときは走らせない）。

```javascript
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildCalendar } from '../lib/ical.js';
import { validateScheduleFile } from '../lib/schedule.js';

const ROOT = new URL('../', import.meta.url);

const SOURCES = [
  { file: 'data/rebnise.json', out: 'calendars/rebnise.ics' },
  { file: 'data/artemis.json', out: 'calendars/artemis.ics' },
];

export function toEntries(scheduleFile) {
  return scheduleFile.games.map((game) => ({
    game,
    sport: scheduleFile.sport,
    teamShort: scheduleFile.teamShort,
  }));
}

async function loadSchedule(file) {
  const data = JSON.parse(await readFile(new URL(file, ROOT), 'utf8'));
  const errors = validateScheduleFile(data);
  if (errors.length > 0) {
    throw new Error(`${file} が不正です:\n  ${errors.join('\n  ')}`);
  }
  return data;
}

async function main() {
  await mkdir(new URL('calendars/', ROOT), { recursive: true });

  const allEntries = [];

  for (const { file, out } of SOURCES) {
    const schedule = await loadSchedule(file);
    const entries = toEntries(schedule);
    allEntries.push(...entries);

    const ics = buildCalendar(entries, `${schedule.team} ${schedule.season}`);
    await writeFile(new URL(out, ROOT), ics, 'utf8');
    console.log(`${out} を生成しました（${entries.length}件）`);
  }

  const allIcs = buildCalendar(allEntries, 'レブナイズ・アルテミス 2026-27');
  await writeFile(new URL('calendars/all.ics', ROOT), allIcs, 'utf8');
  console.log(`calendars/all.ics を生成しました（${allEntries.length}件）`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm test`
Expected: PASS（46件）

- [ ] **Step 5: 生成を実行して結果を確認する**

Run: `npm run build`
Expected: `calendars/rebnise.ics` `calendars/artemis.ics` `calendars/all.ics` が生成され、件数が表示される

生成された `calendars/rebnise.ics` の先頭20行を目視で確認し、`BEGIN:VCALENDAR` / `VTIMEZONE` / `DTSTART;TZID=Asia/Tokyo:` が期待どおり出ていることを確認する。

- [ ] **Step 6: Commit**

```bash
git add scripts/build-ics.js test/build-ics.test.js calendars/
git commit -m "feat: 購読用icsの生成スクリプトを追加"
```

---

### Task 8: Googleカレンダーリンクの生成

**Files:**
- Create: `lib/google-link.js`
- Test: `test/google-link.test.js`

**Interfaces:**
- Consumes: `lib/datetime.js` の `resolveGameTimes` / `toGoogleUtcString`、`lib/ical.js` の `buildEventTitle`
- Produces: `buildGoogleCalendarUrl(entry) -> string` — `entry` は Task 5 と同じ `{ game, sport, teamShort }`

- [ ] **Step 1: 失敗するテストを書く**

`test/google-link.test.js`:

```javascript
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
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm test`
Expected: FAIL（`lib/google-link.js` が存在しない）

- [ ] **Step 3: 実装する**

`lib/google-link.js`:

```javascript
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
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm test`
Expected: PASS（52件）

- [ ] **Step 5: Commit**

```bash
git add lib/google-link.js test/google-link.test.js
git commit -m "feat: Googleカレンダーリンクの生成を追加"
```

---

### Task 9: 一覧表示とフィルタ

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`

**Interfaces:**
- Consumes: `lib/google-link.js`、`lib/datetime.js`、`data/*.json`
- Produces: ブラウザで開いて一覧とフィルタが動作する画面

このタスクではカレンダーの一括ダウンロードと購読リンクは実装しない（Task 10で追加する）。まず一覧が正しく出ることを確認する。

- [ ] **Step 1: `index.html` を作る**

```html
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>レブナイズ・アルテミス 試合カレンダー</title>
<meta name="description" content="鹿児島レブナイズとアルテミス北海道の試合予定を、クリックひとつでGoogleカレンダーに登録できます。">
<meta property="og:title" content="レブナイズ・アルテミス 試合カレンダー">
<meta property="og:description" content="鹿児島レブナイズとアルテミス北海道の試合予定を、クリックひとつでGoogleカレンダーに登録できます。">
<meta property="og:type" content="website">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="site-header">
  <h1>レブナイズ・アルテミス 試合カレンダー</h1>
  <p class="lead">見たい試合をカレンダーに登録できます。</p>
</header>

<main>
  <section class="subscribe" id="subscribe" hidden>
    <h2>シーズン全体を購読する</h2>
    <p class="note">一度登録すれば、日程が変わったときも自動で反映されます（反映まで数時間〜1日ほどかかります）。<br>Googleカレンダーへの購読登録はパソコンからのみ行えます。スマートフォンの方は、各試合の「Googleカレンダーに追加」をお使いください。</p>
    <div class="subscribe-buttons" id="subscribe-buttons"></div>
  </section>

  <section class="filters" aria-label="絞り込み">
    <div class="filter-group" role="group" aria-label="チーム">
      <button type="button" class="chip is-active" data-filter="team" data-value="all">両方</button>
      <button type="button" class="chip" data-filter="team" data-value="rebnise">レブナイズ</button>
      <button type="button" class="chip" data-filter="team" data-value="artemis">アルテミス</button>
    </div>
    <div class="filter-group" role="group" aria-label="大会種別">
      <button type="button" class="chip is-active" data-filter="category" data-value="all">すべて</button>
      <button type="button" class="chip" data-filter="category" data-value="preseason">プレシーズン</button>
      <button type="button" class="chip" data-filter="category" data-value="regular">レギュラー</button>
      <button type="button" class="chip" data-filter="category" data-value="postseason">ポストシーズン</button>
    </div>
    <div class="filter-group" role="group" aria-label="開催地">
      <button type="button" class="chip is-active" data-filter="homeAway" data-value="all">HOME/AWAY</button>
      <button type="button" class="chip" data-filter="homeAway" data-value="home">HOME</button>
      <button type="button" class="chip" data-filter="homeAway" data-value="away">AWAY</button>
    </div>
    <label class="toggle">
      <input type="checkbox" id="show-past"> 過去の試合も表示
    </label>
  </section>

  <p class="status" id="status">読み込み中…</p>
  <ul class="game-list" id="game-list"></ul>
</main>

<script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css` を作る**

モバイルファースト。1カラムでカードを縦積みにする。

```css
:root {
  --bg: #ffffff;
  --fg: #16181d;
  --muted: #666c78;
  --line: #e3e6eb;
  --accent: #1a56db;
  --home: #0f7b3f;
  --away: #8a5a00;
  --radius: 10px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 0 1rem 6rem;
  font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
  color: var(--fg);
  background: var(--bg);
  line-height: 1.6;
}

main { max-width: 720px; margin: 0 auto; }
.site-header { max-width: 720px; margin: 0 auto; padding: 1.5rem 0 0.5rem; }
.site-header h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
.lead, .note { color: var(--muted); font-size: 0.875rem; margin: 0; }

.subscribe {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1rem;
  margin: 1rem 0;
}
.subscribe h2 { font-size: 1rem; margin: 0 0 0.25rem; }
.subscribe-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
.subscribe-buttons a {
  flex: 1 1 auto;
  text-align: center;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  color: var(--accent);
  text-decoration: none;
  font-size: 0.875rem;
}

.filters { margin: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
.filter-group { display: flex; flex-wrap: wrap; gap: 0.375rem; }

.chip {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
}
.chip.is-active { border-color: var(--accent); color: var(--accent); background: #eff4ff; }

.toggle { font-size: 0.8125rem; color: var(--muted); display: flex; align-items: center; gap: 0.375rem; }

.status { color: var(--muted); font-size: 0.875rem; }
.status.is-error { color: #b3261e; }

.game-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.625rem; }

.game-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.875rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: start;
}
.game-card.is-past { opacity: 0.55; }

.game-select { margin: 0.25rem 0 0; width: 1.15rem; height: 1.15rem; }

.game-date { font-size: 0.8125rem; color: var(--muted); }
.tbd { color: var(--away); font-weight: 600; }
.game-title { font-weight: 600; margin: 0.125rem 0; }
.game-venue { font-size: 0.8125rem; color: var(--muted); }

.badges { display: flex; gap: 0.375rem; margin-top: 0.375rem; flex-wrap: wrap; }
.badge {
  font-size: 0.6875rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid currentColor;
}
.badge-home { color: var(--home); }
.badge-away { color: var(--away); }
.badge-category { color: var(--muted); }

.add-button {
  margin-top: 0.625rem;
  display: inline-block;
  padding: 0.5rem 0.875rem;
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 0.8125rem;
}

.selection-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: #fff;
  border-top: 1px solid var(--line);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.selection-bar[hidden] { display: none; }
.selection-bar button {
  padding: 0.6rem 1rem;
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: var(--radius);
  font-size: 0.875rem;
  cursor: pointer;
}

@media (min-width: 600px) {
  .site-header h1 { font-size: 1.5rem; }
  .filters { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
}
```

- [ ] **Step 3: `app.js` を作る（一覧とフィルタのみ）**

```javascript
import { buildGoogleCalendarUrl } from './lib/google-link.js';
import { resolveGameTimes } from './lib/datetime.js';

const TEAM_FILES = {
  rebnise: 'data/rebnise.json',
  artemis: 'data/artemis.json',
};

const CATEGORY_LABEL = {
  preseason: 'プレシーズン',
  regular: 'レギュラー',
  postseason: 'ポストシーズン',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const state = {
  entries: [],
  filters: { team: 'all', category: 'all', homeAway: 'all' },
  showPast: false,
};

const els = {
  status: document.getElementById('status'),
  list: document.getElementById('game-list'),
  showPast: document.getElementById('show-past'),
};

async function load() {
  try {
    const entries = [];
    for (const [key, file] of Object.entries(TEAM_FILES)) {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`${file} の取得に失敗しました (${res.status})`);
      const data = await res.json();
      for (const game of data.games) {
        entries.push({ game, sport: data.sport, teamShort: data.teamShort, teamKey: key });
      }
    }
    // 時間未定（start が null）の試合は同じ日の中で最後に並べる
    const sortKey = (e) => e.game.date + (e.game.start ?? '99:99');
    entries.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    state.entries = entries;
    render();
  } catch (err) {
    els.status.hidden = false;
    els.status.classList.add('is-error');
    els.status.textContent = `日程を読み込めませんでした。時間をおいて再読み込みしてください。（${err.message}）`;
  }
}

// 試合が終了しているか。開始時刻ではなく終了時刻で判定する
function isPast(entry) {
  const times = resolveGameTimes(entry.game, entry.sport);
  if (times.allDay) {
    // 時間未定の試合は、その日が終わる（翌日0時JST）まで「今後の試合」として扱う
    const [y, m, d] = entry.game.date.split('-').map(Number);
    return Date.UTC(y, m - 1, d + 1, -9) < Date.now();
  }
  return times.end.getTime() < Date.now();
}

function visibleEntries() {
  const { team, category, homeAway } = state.filters;
  return state.entries.filter((e) => {
    if (team !== 'all' && e.teamKey !== team) return false;
    if (category !== 'all' && e.game.category !== category) return false;
    if (homeAway !== 'all' && e.game.homeAway !== homeAway) return false;
    if (!state.showPast && isPast(e)) return false;
    return true;
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日（${weekday}）`;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
}

function renderCard(entry) {
  const { game, teamShort } = entry;
  const li = document.createElement('li');
  li.className = 'game-card' + (isPast(entry) ? ' is-past' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'game-select';
  checkbox.dataset.id = game.id;
  checkbox.setAttribute('aria-label', `${game.opponent}戦を選択`);

  const timeText = game.start
    ? `${escapeHtml(game.start)}〜`
    : '<span class="tbd">時間未定</span>';

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="game-date">${formatDate(game.date)} ${timeText}</div>
    <p class="game-title">${escapeHtml(teamShort)} vs ${escapeHtml(game.opponent)}</p>
    <div class="game-venue">${escapeHtml(game.venue)}</div>
    <div class="badges">
      <span class="badge badge-${game.homeAway}">${game.homeAway === 'home' ? 'HOME' : 'AWAY'}</span>
      <span class="badge badge-category">${CATEGORY_LABEL[game.category]}</span>
    </div>
  `;

  const link = document.createElement('a');
  link.className = 'add-button';
  link.href = buildGoogleCalendarUrl(entry);
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Googleカレンダーに追加';
  body.appendChild(link);

  li.append(checkbox, body);
  return li;
}

function render() {
  const entries = visibleEntries();
  els.list.replaceChildren(...entries.map(renderCard));

  if (entries.length === 0) {
    els.status.hidden = false;
    els.status.classList.remove('is-error');
    els.status.textContent = '条件に合う試合がありません。';
  } else {
    els.status.hidden = true;
  }
}

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const { filter, value } = chip.dataset;
    state.filters[filter] = value;
    document.querySelectorAll(`.chip[data-filter="${filter}"]`).forEach((c) => {
      c.classList.toggle('is-active', c === chip);
    });
    render();
  });
});

els.showPast.addEventListener('change', () => {
  state.showPast = els.showPast.checked;
  render();
});

load();
```

- [ ] **Step 4: ローカルサーバで動作を確認する**

ESM の import と fetch のため `file://` では動かない。ローカルサーバで開く。

Run: `python3 -m http.server 8000`
ブラウザで `http://localhost:8000/` を開く。

確認する項目：
- 試合カードが日付順に並んでいる
- チーム／大会種別／HOME・AWAY の各フィルタが効く
- 「過去の試合も表示」で過去試合が出る
- 「Googleカレンダーに追加」を押すとGoogleカレンダーの予定作成画面が開き、タイトル・日時・会場が入っている
- **時間未定の試合が「時間未定」と表示され、その日の最後に並んでいる**
- **時間未定の試合の「Googleカレンダーに追加」を押すと、終日予定として開く**（時刻の入力欄が出ず、日付だけになっていること）
- 開発者ツールのConsoleにエラーが出ていない

確認できたらサーバを停止する。

- [ ] **Step 5: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat: 試合一覧とフィルタを追加"
```

---

### Task 10: 選択した試合の一括ダウンロードと購読リンク

**Files:**
- Modify: `index.html`（下部固定バーを追加）
- Modify: `app.js`（選択状態の管理、ics生成、購読リンクの描画を追加）

**Interfaces:**
- Consumes: `lib/ical.js` の `buildCalendar`
- Produces: 3方式すべてが動作する画面

- [ ] **Step 1: `index.html` の `</main>` の直後に下部固定バーを追加する**

```html
<div class="selection-bar" id="selection-bar" hidden>
  <span id="selection-count"></span>
  <button type="button" id="download-ics">.ics でダウンロード</button>
</div>
```

- [ ] **Step 2: `app.js` の import に `buildCalendar` を追加する**

```javascript
import { buildGoogleCalendarUrl } from './lib/google-link.js';
import { resolveGameTimes } from './lib/datetime.js';
import { buildCalendar } from './lib/ical.js';
```

- [ ] **Step 3: `app.js` の `state` に選択状態を追加する**

```javascript
const state = {
  entries: [],
  filters: { team: 'all', category: 'all', homeAway: 'all' },
  showPast: false,
  selected: new Set(),
};
```

- [ ] **Step 4: `els` に新しい要素を追加する**

```javascript
const els = {
  status: document.getElementById('status'),
  list: document.getElementById('game-list'),
  showPast: document.getElementById('show-past'),
  bar: document.getElementById('selection-bar'),
  count: document.getElementById('selection-count'),
  download: document.getElementById('download-ics'),
  subscribe: document.getElementById('subscribe'),
  subscribeButtons: document.getElementById('subscribe-buttons'),
};
```

- [ ] **Step 5: 購読リンクを描画する処理を追加する**

`load()` 内の `render()` 呼び出しの直前に `renderSubscribeLinks();` を挿入する。関数は以下を `render` の近くに追加する。

`webcal://` のホストは公開先によって変わるため、`window.location` から組み立てる。これでローカルでも公開後でもそのまま動く。

```javascript
const SUBSCRIBE_TARGETS = [
  { file: 'calendars/all.ics', label: '両チーム' },
  { file: 'calendars/rebnise.ics', label: 'レブナイズ' },
  { file: 'calendars/artemis.ics', label: 'アルテミス' },
];

function renderSubscribeLinks() {
  const base = `${window.location.host}${window.location.pathname.replace(/[^/]*$/, '')}`;
  els.subscribeButtons.replaceChildren(
    ...SUBSCRIBE_TARGETS.map(({ file, label }) => {
      const a = document.createElement('a');
      a.href = `webcal://${base}${file}`;
      a.textContent = `${label}を購読`;
      return a;
    })
  );
  els.subscribe.hidden = false;
}
```

- [ ] **Step 6: 選択バーの更新処理を追加する**

```javascript
function renderSelectionBar() {
  const count = state.selected.size;
  els.bar.hidden = count === 0;
  els.count.textContent = `${count}件を選択中`;
}
```

`render()` の末尾で `renderSelectionBar();` を呼ぶ。また `renderCard` 内の checkbox 定義の直後に、選択状態の復元とイベントを追加する。

```javascript
  checkbox.checked = state.selected.has(game.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) state.selected.add(game.id);
    else state.selected.delete(game.id);
    renderSelectionBar();
  });
```

- [ ] **Step 7: ダウンロード処理を追加する**

```javascript
els.download.addEventListener('click', () => {
  const entries = state.entries.filter((e) => state.selected.has(e.game.id));
  if (entries.length === 0) return;

  const ics = buildCalendar(entries, '選択した試合');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'games.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
```

- [ ] **Step 8: テストが引き続き通ることを確認する**

Run: `npm test`
Expected: PASS（52件）

- [ ] **Step 9: ローカルサーバで3方式すべてを確認する**

Run: `python3 -m http.server 8000`

確認する項目：
- チェックボックスを2件選ぶと下部バーに「2件を選択中」と出る
- フィルタを切り替えても選択が保持される
- ダウンロードした `games.ics` をテキストエディタで開き、`BEGIN:VEVENT` が2つあることを確認する
- ダウンロードした `games.ics` をGoogleカレンダーにインポートし、日時が正しいことを確認する
- 選択を全部外すと下部バーが消える
- 「Googleカレンダーに追加」が引き続き動く
- 購読リンクのhrefが `webcal://localhost:8000/calendars/all.ics` になっている（ローカルでは実際の購読はできない。公開後に確認する）

確認できたらサーバを停止する。

- [ ] **Step 10: Commit**

```bash
git add index.html app.js
git commit -m "feat: 選択試合の一括ダウンロードと購読リンクを追加"
```

---

### Task 11: GitHub Pages への公開と購読の動作確認

**Files:**
- Modify: `README.md`（公開URLと購読URLを追記）

**Interfaces:**
- Consumes: なし
- Produces: 公開URL

**このタスクは外向きの操作を含む。リポジトリ作成と公開の前に必ずユーザーの確認を取ること。**

- [ ] **Step 1: 公開設定をユーザーに確認する**

以下を確認する：
- GitHubのリポジトリ名（例: `rebnise-artemis-calendar`）
- 公開（public）でよいか
- 独自ドメインを使うか

- [ ] **Step 2: GitHubリポジトリを作成してpushする**

```bash
gh repo create <リポジトリ名> --public --source=. --remote=origin --push
```

- [ ] **Step 3: GitHub Pages を有効化する**

```bash
gh api -X POST repos/{owner}/<リポジトリ名>/pages -f "source[branch]=main" -f "source[path]=/"
```

数分待ってから公開URLにアクセスし、サイトが表示されることを確認する。

- [ ] **Step 4: 公開環境で3方式すべてを確認する**

- 一覧が表示され、フィルタが動く
- 「Googleカレンダーに追加」でGoogleカレンダーの予定作成画面が開く
- `.ics` の一括ダウンロードができる
- **購読リンクをGoogleカレンダーに登録し、試合が取り込まれることを確認する**（`webcal://` が開かない場合は、Googleカレンダーの「他のカレンダー」→「URLで追加」に `https://.../calendars/all.ics` を直接貼って確認する）

スマートフォン実機での確認（主要な利用経路のため必ず行う）：

- 画面が横スクロールせず、文字とボタンが読める大きさで表示される
- フィルタのチップがタップしやすく、折り返して収まっている
- **「Googleカレンダーに追加」をタップしてGoogleカレンダーの予定作成画面が開き、保存できる**（スマホでの本命の経路）
- 下部固定バーがカード最下部の内容を隠していない
- 購読セクションに「パソコンからのみ」の注記が表示されている

- [ ] **Step 5: `README.md` に公開URLと購読URLを追記する**

`## 日程を更新する手順` の前に以下を追加する（`<公開URL>` は実際のURLに置き換える）。

```markdown
## 公開URL

<公開URL>

### 購読用URL

- 両チーム: `<公開URL>calendars/all.ics`
- レブナイズ: `<公開URL>calendars/rebnise.ics`
- アルテミス: `<公開URL>calendars/artemis.ics`
```

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: 公開URLと購読URLを追記"
git push
```

---

## 完了条件

- `npm test` が全件（52件）パスする
- `npm run build` で3つの `.ics` が生成される
- 公開URLで一覧が表示され、フィルタが動作する
- 3つの登録方式（Googleリンク / 選択して.ics / 購読）がいずれも実機で動作する
- 時間未定の試合が終日予定として登録できる
- `data/*.json` の内容がユーザーによって目視照合されている
