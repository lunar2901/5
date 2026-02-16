// nouns.js - Study-mode logic for German nouns (1 word per view)
import nounsA1 from './js/nouns-db-a1.js';
import { initStudyMode } from './study-mode.js';

const nounsDB = {
  a1: nounsA1,
  a2: [],
  b1: [],
  b2: [],
  c1: []
};

const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const nounCount = document.getElementById('noun-count');
const clearSearchBtn = document.getElementById('clear-search');

let currentLevel = 'a1';

// Initialize
renderCurrent();
updateCounts();

// Level buttons
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

// Search
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

function filterNouns(level, query) {
  const nouns = nounsDB[level] || [];
  if (!query) return nouns;

  return nouns.filter(noun => {
    const searchText = [
      noun.word,
      noun.plural,
      noun.genitive,
      ...(noun.translations || []),
      ...(noun.examples || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchText.includes(query);
  });
}

function renderCurrent(query = '') {
  const nouns = filterNouns(currentLevel, query);

  // Optional: keep your old count label updated
  nounCount.textContent = `${nouns.length} ${nouns.length === 1 ? 'noun' : 'nouns'}`;

  // If nothing found, show a small message inside study-root
  const root = document.getElementById('study-root');
  if (!root) {
    console.error('Missing #study-root in nouns.html. Replace #nouns-list with #study-root.');
    return;
  }

  if (nouns.length === 0) {
    root.innerHTML = `
      <div class="no-results">
        <p>No nouns found${query ? ` matching "${escapeHtml(query)}"` : ' in this level'}</p>
      </div>
    `;
    return;
  }

  // ✅ This replaces the old "render many cards" logic:
  initStudyMode({
    rootId: 'study-root',
    items: nouns,
    level: currentLevel,
    storageKey: 'nouns',

    // Unique id for learned/unlearned storage:
    getId: (item) => item.word, // word includes article (e.g. "der Hund") — good unique key

    // What appears big on the card:
    getFront: (item) => formatNounFront(item),  // e.g. "der Hund"

    // What appears as translation:
    getBack: (item) => (item.translations || []).join(', '),

    // Extra section (plural/genitive/examples):
    getExtra: (item) => formatNounExtra(item)
  });
}

function formatNounFront(noun) {
  // Show the noun with article badge-style text baked in
  // Example noun.word might already be "der Hund"
  // If it's just "Hund", we'll add the article.
  const article =
    noun.gender === 'm' ? 'der' :
    noun.gender === 'f' ? 'die' :
    noun.gender === 'n' ? 'das' : '';

  const hasArticle = typeof noun.word === 'string' && noun.word.split(' ').length > 1;
  const word = noun.word || '—';

  return hasArticle || !article ? word : `${article} ${word}`;
}

function formatNounExtra(noun) {
  const plural = noun.plural ? `Plural: ${noun.plural}` : '';
  const genitive = noun.genitive ? `Genitive: ${noun.genitive}` : '';
  const examples = (noun.examples || []).slice(0, 2); // keep it focused

  const parts = [plural, genitive].filter(Boolean).join(' • ');
  const exText = examples.length ? `Examples: ${examples.join(' | ')}` : '';

  return [parts, exText].filter(Boolean).join('\n');
}

function updateCounts() {
  Object.keys(nounsDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) badge.textContent = (nounsDB[level] || []).length;
  });
}

// Keyboard shortcuts (keep your old ones)
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
