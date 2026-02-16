// app.js - Focus mode (1 verb at a time + accordion lists)
import { initFocusMode } from './focus-mode.js';
import verbsA1 from './js/verbs-db-a1.js';

const verbsDB = {
  a1: verbsA1,
  a2: [],
  b1: [],
  b2: [],
  c1: []
};

const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const verbCount = document.getElementById('verb-count');
const clearSearchBtn = document.getElementById('clear-search');

let currentLevel = 'a1';

renderCurrent();
updateCounts();

levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentLevel = btn.dataset.level;
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderCurrent();
  });
});

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  clearSearchBtn.style.display = query ? 'block' : 'none';
  renderCurrent(query);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

function filterVerbs(level, query) {
  const list = verbsDB[level] || [];
  if (!query) return list;

  return list.filter(v => {
    const base = getVerbBase(v);
    const searchText = [
      base,
      v.preposition,
      ...(v.translations || []),
      ...(v.examples || []),
      v.present || v.past || v.partizip2 || v.perfect || ''
    ].filter(Boolean).join(' ').toLowerCase();

    return searchText.includes(query);
  });
}

function renderCurrent(query = '') {
  const rootId = 'verbs-list';
  const root = document.getElementById(rootId);
  if (!root) {
    console.error('Missing #verbs-list in index.html');
    return;
  }

  // helps CSS override to single-column
  root.classList.add('study-root');

  const list = filterVerbs(currentLevel, query);

  verbCount.textContent = `${list.length} ${list.length === 1 ? 'verb' : 'verbs'}`;

  if (list.length === 0) {
    root.innerHTML = `
      <div class="no-results">
        <p>No verbs found${query ? ` matching "${escapeHtml(query)}"` : ' in this level'}</p>
      </div>
    `;
    return;
  }

  initFocusMode({
    rootId,
    items: list,
    level: currentLevel,
    storageKey: 'verbs',

    getId: (v) => getVerbBase(v),        // stable unique key
    getLabel: (v) => getVerbBase(v),     // shows in Learned/Not learned list
    renderCard: (v) => createVerbCard(v) // your verb card UI
  });
}

function getVerbBase(v) {
  return v.infinitive || v.verb || v.word || '—';
}

// ✅ Verb card using your existing CSS (.verb-card, .verb-forms, etc.)
function createVerbCard(v) {
  const card = document.createElement('div');
  card.className = 'verb-card';

  const base = getVerbBase(v);

  // Try common field names (so it works even if your DB schema varies)
  const present = v.present || v.prasens || v.presens || v.ich || v.form1 || '—';
  const past = v.past || v.prateritum || v.präteritum || v.simplePast || '—';
  const partizip2 = v.partizip2 || v.participle || v.pp || v.perfectParticiple || '—';

  const translations = (v.translations || []).join(', ') || '—';

  const isReflexive = !!v.reflexive || String(base).toLowerCase().startsWith('sich ');
  const reflexiveTag = isReflexive ? `<span class="reflexive-marker">reflexive</span>` : '';

  // Preposition(s)
  const prep = v.preposition
    ? `<span class="prep-badge">${escapeHtml(v.preposition)}</span>`
    : '';

  card.innerHTML = `
    <div class="verb-header">
      <div>
        <div class="verb-base">${escapeHtml(base)} ${reflexiveTag}</div>
      </div>
    </div>

    <div class="verb-forms">
      <div class="form-item">
        <span class="form-label">Present</span>
        <span class="form-value">${escapeHtml(present)}</span>
      </div>
      <div class="form-item">
        <span class="form-label">Past</span>
        <span class="form-value">${escapeHtml(past)}</span>
      </div>
      <div class="form-item" style="grid-column: 1 / -1;">
        <span class="form-label">Partizip II</span>
        <span class="form-value">${escapeHtml(partizip2)}</span>
      </div>
    </div>

    <div class="verb-info">
      <span class="label">Translation:</span>
      <span class="value">${escapeHtml(translations)}</span>
    </div>

    ${
      prep
        ? `
          <div class="verb-info">
            <span class="label">Prep:</span>
            <span class="value">${prep}</span>
          </div>
        `
        : ''
    }

    ${
      (v.examples || []).length
        ? `
          <div class="examples-section">
            <h4>Examples</h4>
            <ul class="examples-list">
              ${(v.examples || []).slice(0, 4).map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}
            </ul>
          </div>
        `
        : ''
    }
  `;

  return card;
}

function updateCounts() {
  Object.keys(verbsDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) badge.textContent = (verbsDB[level] || []).length;
  });
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape' && searchInput.value) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
});

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
