// app.js - Study mode (1 verb at a time)
import { initStudyMode } from './study-mode.js';

// ✅ IMPORTANT:
// Keep your existing imports for verbs DB here.
// Example:
// import verbsA1 from './js/verbs-db-a1.js';
// ...and build your verbsDB like you did in nouns.js.

// --- Example structure (replace with YOUR actual DB imports) ---
import verbsA1 from './js/verbs-db-a1.js';

const verbsDB = {
  a1: verbsA1,
  a2: [],
  b1: [],
  b2: [],
  c1: []
};
// ------------------------------------------------------------

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
    const front = v.infinitive || v.verb || v.word || '';
    const searchText = [
      front,
      v.preposition,
      ...(v.translations || []),
      ...(v.examples || [])
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

  // Optional: make it styled like study-root
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

  initStudyMode({
    rootId,
    items: list,
    level: currentLevel,
    storageKey: 'verbs',

    getId: (item) => item.infinitive || item.verb || item.word,
    getFront: (item) => item.infinitive || item.verb || item.word || '—',
    getBack: (item) => (item.translations || []).join(', '),
    getExtra: (item) => formatVerbExtra(item)
  });
}

function formatVerbExtra(v) {
  const prep = v.preposition ? `With: ${v.preposition}` : '';
  const forms =
    v.forms ? `Forms: ${v.forms}` :
    v.conjugation ? `Conjugation: ${JSON.stringify(v.conjugation)}` :
    '';

  const examples = (v.examples || []).slice(0, 2);
  const exText = examples.length ? `Examples: ${examples.join(' | ')}` : '';

  return [prep, forms, exText].filter(Boolean).join('\n');
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
