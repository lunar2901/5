// adjectives.js
import adjectivesA1 from './js/adjectives-db-a1.js';

const adjectivesDB = { a1: adjectivesA1, a2: [], b1: [], b2: [], c1: [] };
const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const adjectivesListDiv = document.getElementById('adjectives-list');
const adjectiveCount = document.getElementById('adjective-count');
const clearSearchBtn = document.getElementById('clear-search');

let currentLevel = 'a1';

displayAdjectives(currentLevel);
updateCounts();

levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    searchInput.value = '';
    displayAdjectives(currentLevel);
  });
});

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  displayAdjectives(currentLevel, query);
  clearSearchBtn.style.display = query ? 'block' : 'none';
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

function filterAdjectives(level, query) {
  const adjectives = adjectivesDB[level];
  if (!query) return adjectives;
  return adjectives.filter(adj => {
    const searchText = [adj.word, adj.comparative, adj.superlative, ...adj.translations, ...adj.examples].join(' ').toLowerCase();
    return searchText.includes(query);
  });
}

function displayAdjectives(level, query = '') {
  const adjectives = query ? filterAdjectives(level, query) : adjectivesDB[level];
  adjectivesListDiv.innerHTML = '';
  if (adjectives.length === 0) {
    adjectivesListDiv.innerHTML = `<div class="no-results"><p>No adjectives found${query ? ` matching "${query}"` : ' in this level'}</p></div>`;
    adjectiveCount.textContent = '0 adjectives';
    return;
  }
  adjectives.forEach(adj => {
    const card = createAdjectiveCard(adj);
    adjectivesListDiv.appendChild(card);
  });
  adjectiveCount.textContent = `${adjectives.length} ${adjectives.length === 1 ? 'adjective' : 'adjectives'}`;
}

function createAdjectiveCard(adj) {
  const card = document.createElement('div');
  card.className = 'adjective-card';
  card.innerHTML = `
    <div class="adjective-header">
      <h3 class="adjective-word">${adj.word}</h3>
    </div>
    <div class="adjective-forms">
      <div class="form-item"><span class="form-label">Comparative:</span><span class="form-value">${adj.comparative}</span></div>
      <div class="form-item"><span class="form-label">Superlative:</span><span class="form-value">${adj.superlative}</span></div>
    </div>
    <div class="adjective-info"><span class="label">Translation:</span><span class="value">${adj.translations.join(', ')}</span></div>
    <div class="adjective-examples"><span class="label">Examples:</span><ul>${adj.examples.map(ex => `<li>${ex}</li>`).join('')}</ul></div>
  `;
  return card;
}

function updateCounts() {
  Object.keys(adjectivesDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) badge.textContent = adjectivesDB[level].length;
  });
}
