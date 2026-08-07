import { buildGoogleCalendarUrl } from './lib/google-link.js';
import { resolveGameTimes } from './lib/datetime.js';
import { buildCalendar } from './lib/ical.js';

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
  loadFailed: false,
  selected: new Set(),
};

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
    renderSubscribeLinks();
    render();
  } catch (err) {
    state.loadFailed = true;
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
  checkbox.checked = state.selected.has(game.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) state.selected.add(game.id);
    else state.selected.delete(game.id);
    renderSelectionBar();
  });

  const timeText = game.start
    ? `${escapeHtml(game.start)}〜`
    : '<span class="tbd">時間未定</span>';

  const body = document.createElement('div');
  body.innerHTML = `
    <div class="game-date">${formatDate(game.date)} ${timeText}</div>
    <p class="game-title">${escapeHtml(teamShort)} vs ${escapeHtml(game.opponent)}</p>
    <div class="game-venue">${escapeHtml(game.venue)}</div>
    <div class="badges">
      <span class="badge badge-${escapeHtml(game.homeAway)}">${game.homeAway === 'home' ? 'HOME' : 'AWAY'}</span>
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

function renderSelectionBar() {
  const count = state.selected.size;
  els.bar.hidden = count === 0;
  els.count.textContent = `${count}件を選択中`;
}

function render() {
  // 読み込みに失敗しているときは、エラー表示をフィルタ操作で上書きしない
  if (state.loadFailed) return;

  const entries = visibleEntries();
  els.list.replaceChildren(...entries.map(renderCard));

  if (entries.length === 0) {
    els.status.hidden = false;
    els.status.classList.remove('is-error');
    els.status.textContent = '条件に合う試合がありません。';
  } else {
    els.status.hidden = true;
  }

  renderSelectionBar();
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

load();
