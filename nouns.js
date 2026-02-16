// nouns.js - Study mode (1 noun at a time)
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
  const root = document.getElementById('study-root');
  if (!root) {
    console.error('Missing #study-root in nouns.html');
    return;
  }

  const nouns = filterNouns(currentLevel, query);

  nounCount.textContent = `${nouns.length} ${nouns.length === 1 ? 'noun' : 'nouns'}`;

  if (nouns.length === 0) {
    root.innerHTML = `
      <div class="no-results">
        <p>No nouns found${query ? ` matching "${escapeHtml(query)}"` : ' in this level'}</p>
      </div>
    `;
    return;
  }

  // ✅ One-word study view
  initStudyMode({
    rootId: 'study-root',
    items: nouns,
    level: currentLevel,
    storageKey: 'nouns',

    // Use full "der Hund" etc. as ID so it’s unique and stable
    getId: (item) => item.word,

    // Big text at the top
    getFront: (item) => formatNounFront(item),

    // Translation line
    getBack: (item) => (item.translations || []).join(', '),

    // Extra details (kept short for focus)
    getExtra: (item) => formatNounExtra(item)
  });
}

function formatNounFront(noun) {
  const article =
    noun.gender === 'm' ? 'der' :
    noun.gender === 'f' ? 'die' :
    noun.gender === 'n' ? 'das' : '';

  const word = noun.word || '—';

  // If noun.word already contains an article, keep it
  const hasArticle = typeof word === 'string' && word.split(' ').length > 1;
  return hasArticle || !article ? word : `${article} ${word}`;
}

function formatNounExtra(noun) {
  const plural = noun.plural ? `Plural: ${noun.plural}` : '';
  const genitive = noun.genitive ? `Genitive: ${noun.genitive}` : '';

  // keep examples short & focused
  const examples = (noun.examples || []).slice(0, 2);
  const exText = examples.length ? `Examples: ${examples.join(' | ')}` : '';

  const line1 = [plural, genitive].filter(Boolean).join(' • ');
  return [line1, exText].filter(Boolean).join('\n');
}

function updateCounts() {
  Object.keys(nounsDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) badge.textContent = (nounsDB[level] || []).length;
  });
}

// Keyboard shortcuts (keeps yours)
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
