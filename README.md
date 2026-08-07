# レブナイズ・アルテミス カレンダー

鹿児島レブナイズ（B.LEAGUE ONE）とアルテミス北海道（V.LEAGUE Women）の試合予定を、Googleカレンダーに登録できるサイトです。

## 公開URL

https://tadashisetomoto.github.io/rebnise-artemis-calendar/

### 購読用URL

- 両チーム: `https://tadashisetomoto.github.io/rebnise-artemis-calendar/calendars/all.ics`
- レブナイズ: `https://tadashisetomoto.github.io/rebnise-artemis-calendar/calendars/rebnise.ics`
- アルテミス: `https://tadashisetomoto.github.io/rebnise-artemis-calendar/calendars/artemis.ics`

## 画面構成

- `index.html` — シーズン全体をGoogleカレンダーに入れる。URLで購読する方法と、`.ics` を取り込む方法を案内する
- `games.html` — 試合を選んで1件ずつ登録する。チーム・大会種別・HOME/AWAY・年月で絞り込める

どちらの一括登録もパソコンからのみ設定できる。GoogleカレンダーのスマートフォンアプリにはURL追加もインポートもないため、スマートフォンからの主経路は `games.html` の「Googleカレンダーに追加」になる。

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
