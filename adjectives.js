// adjectives.js - Study mode (1 adjective at a time)
import adjectivesA1 from './js/adjectives-db-a1.js';
import { initStudyMode } from './study-mode.js';

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

  initStudyMode({
    rootId: 'study-root',
    items: list,
    level: currentLevel,
    storageKey: 'adjectives',

    getId: (item) => item.word,
    getFront: (item) => item.word || '—',
    getBack: (item) => (item.translations || []).join(', '),
    getExtra: (item) => formatAdjectiveExtra(item)
  });
}

function formatAdjectiveExtra(adj) {
  const comp = adj.comparative ? `Comparative: ${adj.comparative}` : '';
  const sup = adj.superlative ? `Superlative: ${adj.superlative}` : '';
  const examples = (adj.examples || []).slice(0, 2);
  const exText = examples.length ? `Examples: ${examples.join(' | ')}` : '';
  return [ [comp, sup].filter(Boolean).join(' • '), exText ].filter(Boolean).join('\n');
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
