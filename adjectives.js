// adjectives.js - Focus mode (1 adjective at a time + accordion lists)
import adjectivesA1 from './js/adjectives-db-a1.js';
import { initFocusMode } from './focus-mode.js';

const adjectivesDB = {
  a1: adjectivesA1,
  a2: [],
  b1: [],
  b2: [],
  c1: []
};

const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const adjectiveCount = document.getElementById('adjective-count');
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

function filterAdjectives(level, query) {
  const list = adjectivesDB[level] || [];
  if (!query) return list;

  return list.filter(adj => {
    const searchText = [
      adj.word,
      adj.comparative,
      adj.superlative,
      ...(adj.translations || []),
      ...(adj.examples || [])
    ].filter(Boolean).join(' ').toLowerCase();

    return searchText.includes(query);
  });
}

function renderCurrent(query = '') {
  const root = document.getElementById('study-root');
  if (!root) {
    console.error('Missing #study-root in adjectives.html');
    return;
  }

  // helps CSS override to single-column
  root.classList.add('study-root');

  const list = filterAdjectives(currentLevel, query);

  adjectiveCount.textContent = `${list.length} ${list.length === 1 ? 'adjective' : 'adjectives'}`;

  if (list.length === 0) {
    root.innerHTML = `
      <div class="no-results">
        <p>No adjectives found${query ? ` matching "${escapeHtml(query)}"` : ' in this level'}</p>
      </div>
    `;
    return;
  }

  initFocusMode({
    rootId: 'study-root',
    items: list,
    level: currentLevel,
    storageKey: 'adjectives',

    getId: (a) => a.word,
    getLabel: (a) => a.word || '—',
    renderCard: (a) => createAdjectiveCard(a)
  });
}

// ✅ Adjective card styled using your existing verb-card CSS classes
function createAdjectiveCard(adj) {
  const card = document.createElement('div');
  card.className = 'verb-card';

  const word = adj.word || '—';
  const translations = (adj.translations || []).join(', ') || '—';
  const comp = adj.comparative || '—';
  const sup = adj.superlative || '—';

  card.innerHTML = `
    <div class="verb-header">
      <div class="verb-base">${escapeHtml(word)}</div>
    </div>

    <div class="verb-forms">
      <div class="form-item">
        <span class="form-label">Comparative</span>
        <span class="form-value">${escapeHtml(comp)}</span>
      </div>
      <div class="form-item">
        <span class="form-label">Superlative</span>
        <span class="form-value">${escapeHtml(sup)}</span>
      </div>
    </div>

    <div class="verb-info">
      <span class="label">Translation:</span>
      <span class="value">${escapeHtml(translations)}</span>
    </div>

    ${
      (adj.examples || []).length
        ? `
          <div class="examples-section">
            <h4>Examples</h4>
            <ul class="examples-list">
              ${(adj.examples || []).slice(0, 4).map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}
            </ul>
          </div>
        `
        : ''
    }
  `;

  return card;
}

function updateCounts() {
  Object.keys(adjectivesDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) badge.textContent = (adjectivesDB[level] || []).length;
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
