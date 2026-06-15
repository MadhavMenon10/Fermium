const MODE_INFO = {
  competitive: {
    title: 'Competitive',
    description: '10 minutes. As many questions as you can. Timer runs through everything including result screens.'
  },
  casual: {
    title: 'Casual',
    description: 'No timer. No pressure. Just estimation.'
  }
};

let selectedMode = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function openModeInfo(mode) {
  selectedMode = mode;
  const info = MODE_INFO[mode];
  document.getElementById('mode-title').textContent = info.title;
  document.getElementById('mode-desc').textContent = info.description;
  showScreen('screen-mode');
}

function escapeHtml(value) {
  const el = document.createElement('span');
  el.textContent = value;
  return el.innerHTML;
}

function renderLeaderboardPreview(scores) {
  const list = document.getElementById('preview-list');
  if (!scores.length) {
    list.innerHTML = '<li class="preview-empty">No scores yet — be the first.</li>';
    return;
  }
  list.innerHTML = scores
    .slice(0, 3)
    .map(
      (row, index) => `
      <li>
        <span class="rank mono">${index + 1}</span>
        <span class="who">${escapeHtml(row.name)}</span>
        <span class="pts mono">${row.total}</span>
      </li>`
    )
    .join('');
}

function init() {
  document.getElementById('play-competitive').addEventListener('click', () => openModeInfo('competitive'));
  document.getElementById('play-casual').addEventListener('click', () => openModeInfo('casual'));
  document.getElementById('mode-back').addEventListener('click', () => showScreen('screen-landing'));

  renderLeaderboardPreview([]);
  showScreen('screen-landing');
}

document.addEventListener('DOMContentLoaded', init);
