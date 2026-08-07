const TEAM_FILES = {
  all: 'calendars/all.ics',
  rebnise: 'calendars/rebnise.ics',
  artemis: 'calendars/artemis.ics',
};

const TEAM_LABEL = {
  all: 'rebnise-artemis',
  rebnise: 'rebnise',
  artemis: 'artemis',
};

const els = {
  url: document.getElementById('subscribe-url'),
  copy: document.getElementById('copy-url'),
  status: document.getElementById('copy-status'),
  webcal: document.getElementById('webcal-link'),
  download: document.getElementById('download-ics'),
};

// 公開先のドメインを埋め込まず、現在地から組み立てる
const dir = window.location.pathname.replace(/[^/]*$/, '');

function selectTeam(team) {
  const file = TEAM_FILES[team];
  // コピー用は origin（スキーム込み）、webcal は host（スキーム抜き）から作る
  els.url.value = `${window.location.origin}${dir}${file}`;
  els.webcal.href = `webcal://${window.location.host}${dir}${file}`;
  els.download.href = file;
  els.download.download = `${TEAM_LABEL[team]}-2026-27.ics`;
  els.status.textContent = '';
}

document.querySelectorAll('.team-select .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.team-select .chip').forEach((c) => {
      c.classList.toggle('is-active', c === chip);
    });
    selectTeam(chip.dataset.team);
  });
});

els.copy.addEventListener('click', async () => {
  // navigator.clipboard は https か localhost でしか使えない。
  // LAN経由の実機確認（http://192.168.x.x）では届かないので手動コピーに倒す
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(els.url.value);
      els.status.textContent = 'コピーしました';
      els.status.classList.remove('is-error');
      return;
    } catch {
      // 権限拒否などで失敗した場合も同じ扱いにする
    }
  }
  els.url.select();
  els.status.textContent = 'コピーできませんでした。選択されたURLを手動でコピーしてください。';
  els.status.classList.add('is-error');
});

selectTeam('all');
