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

const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const ROUND_SECONDS = 600;

const session = {
  mode: null,
  questions: [],
  currentIndex: 0,
  scores: [],
  totalBaseScore: 0,
  timeRemaining: ROUND_SECONDS,
  timerInterval: null,
  startTime: null,
  ended: false,
  currentSessionTotal: null
};

let selectedMode = null;

function calculateBaseScore(userAnswer, trueAnswer) {
  if (userAnswer <= 0) return 0;
  const oomError = Math.abs(Math.log10(userAnswer / trueAnswer));
  return Math.max(0, Math.round(100 - 20 * oomError));
}

function calculateTimeBonus(timeUsedSeconds) {
  return Math.max(0, Math.round(50 * (1 - timeUsedSeconds / 600)));
}

function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatNumber(value) {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1e7 || magnitude < 1e-3)) {
    return value.toExponential(1);
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function escapeHtml(value) {
  const el = document.createElement('span');
  el.textContent = value;
  return el.innerHTML;
}

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

function answeredCount() {
  return session.scores.filter((entry) => !entry.skipped).length;
}

function skippedCount() {
  return session.scores.filter((entry) => entry.skipped).length;
}

function startRound(mode) {
  session.mode = mode;
  session.questions = shuffle(QUESTIONS);
  session.currentIndex = 0;
  session.scores = [];
  session.totalBaseScore = 0;
  session.timeRemaining = ROUND_SECONDS;
  session.startTime = Date.now();
  session.ended = false;
  session.currentSessionTotal = null;

  if (!session.questions.length) return;

  const competitive = mode === 'competitive';
  document.getElementById('timer').classList.toggle('hidden', !competitive);
  document.getElementById('end-round').classList.toggle('hidden', competitive);

  if (competitive) {
    updateTimer();
    session.timerInterval = setInterval(tick, 1000);
  }

  showQuestion();
  updateStatus();
  showScreen('screen-game');
}

function showQuestion() {
  if (session.currentIndex >= session.questions.length) {
    session.questions = shuffle(QUESTIONS);
    session.currentIndex = 0;
  }
  const question = session.questions[session.currentIndex];

  const badge = document.getElementById('difficulty');
  badge.textContent = DIFFICULTY_LABELS[question.difficulty];
  badge.dataset.level = question.difficulty;

  document.getElementById('prompt').textContent = question.prompt;
  document.getElementById('unit').textContent = question.answer_unit;

  const input = document.getElementById('answer');
  input.value = '';
  hideError();

  document.getElementById('result-view').classList.add('hidden');
  document.getElementById('question-view').classList.remove('hidden');
  input.focus();
}

function submitAnswer() {
  const input = document.getElementById('answer');
  const raw = input.value.trim();
  if (raw === '') return showError('Enter a number.');

  const value = Number(raw);
  if (!Number.isFinite(value)) return showError('That isn’t a number.');
  if (value <= 0) return showError('Enter a number greater than zero.');

  const question = session.questions[session.currentIndex];
  const points = calculateBaseScore(value, question.answer);
  session.scores.push({ question, userAnswer: value, points });
  session.totalBaseScore += points;

  showResult(question, value, points);
  updateStatus();
}

function showResult(question, userAnswer, points) {
  document.getElementById('said').textContent = `${formatNumber(userAnswer)} ${question.answer_unit}`;
  document.getElementById('truth').textContent = `${formatNumber(question.answer)} ${question.answer_unit}`;

  const oomError = Math.abs(Math.log10(userAnswer / question.answer));
  document.getElementById('oom').textContent = oomError.toFixed(1);

  document.getElementById('decomposition').textContent = question.canonical_decomposition;
  document.getElementById('running').textContent = `${session.totalBaseScore} total`;

  document.getElementById('question-view').classList.add('hidden');
  document.getElementById('result-view').classList.remove('hidden');

  animateCount(document.getElementById('points'), points, 800);
}

function animateCount(el, target, duration) {
  const start = performance.now();
  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(progress * target);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function skipQuestion() {
  session.scores.push({ skipped: true, points: 0 });
  advance();
}

function advance() {
  session.currentIndex += 1;
  showQuestion();
}

function tick() {
  session.timeRemaining -= 1;
  updateTimer();
  if (session.timeRemaining <= 0) endRound();
}

function updateTimer() {
  const remaining = Math.max(session.timeRemaining, 0);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const el = document.getElementById('timer');
  el.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  el.classList.toggle('danger', remaining < 60);
}

function updateStatus() {
  const el = document.getElementById('status');
  if (session.mode === 'competitive') {
    el.innerHTML = `<span class="status-value mono">${session.totalBaseScore}</span><span class="status-label">score</span>`;
  } else {
    el.innerHTML = `<span class="status-value mono">${answeredCount()}</span><span class="status-label">answered</span>`;
  }
}

function endRound() {
  if (session.ended) return;
  session.ended = true;
  clearInterval(session.timerInterval);
  session.timerInterval = null;

  const timeUsed = ROUND_SECONDS - session.timeRemaining;
  const timeBonus = session.mode === 'competitive' ? calculateTimeBonus(timeUsed) : 0;
  session.currentSessionTotal = session.totalBaseScore + timeBonus;

  renderEndScreen(timeBonus);
  showScreen('screen-end');
}

function renderEndScreen(timeBonus) {
  const competitive = session.mode === 'competitive';

  document.getElementById('end-base').textContent = session.totalBaseScore;
  document.getElementById('end-total').textContent = session.currentSessionTotal;
  document.getElementById('end-answered').textContent = answeredCount();
  document.getElementById('end-skipped').textContent = skippedCount();

  document.getElementById('end-bonus-row').classList.toggle('hidden', !competitive);
  document.getElementById('end-bonus').textContent = `+${timeBonus}`;

  document.getElementById('breakdown-body').innerHTML = session.scores
    .map((entry) => {
      if (entry.skipped) {
        return '<tr><td class="skip" colspan="3">Skipped</td><td class="mono">0</td></tr>';
      }
      const question = entry.question;
      const prompt =
        question.prompt.length > 60 ? `${question.prompt.slice(0, 60)}…` : question.prompt;
      return `<tr>
        <td>${escapeHtml(prompt)}</td>
        <td class="mono">${formatNumber(entry.userAnswer)}</td>
        <td class="mono">${formatNumber(question.answer)}</td>
        <td class="mono">${entry.points}</td>
      </tr>`;
    })
    .join('');
}

function playAgain() {
  showScreen('screen-landing');
}

function showError(message) {
  const el = document.getElementById('error');
  el.textContent = message;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error').classList.add('hidden');
}

function init() {
  document.getElementById('play-competitive').addEventListener('click', () => openModeInfo('competitive'));
  document.getElementById('play-casual').addEventListener('click', () => openModeInfo('casual'));
  document.getElementById('mode-back').addEventListener('click', () => showScreen('screen-landing'));
  document.getElementById('mode-start').addEventListener('click', () => startRound(selectedMode));

  document.getElementById('submit').addEventListener('click', submitAnswer);
  document.getElementById('skip').addEventListener('click', skipQuestion);
  document.getElementById('next').addEventListener('click', advance);
  document.getElementById('end-round').addEventListener('click', endRound);
  document.getElementById('play-again').addEventListener('click', playAgain);

  document.getElementById('answer').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitAnswer();
  });

  renderLeaderboardPreview([]);
  showScreen('screen-landing');
}

document.addEventListener('DOMContentLoaded', init);
