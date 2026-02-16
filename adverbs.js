// adverbs.js
import adverbsA1 from './js/adverbs-db-a1.js';

const adverbsDB = { a1: adverbsA1, a2: [], b1: [], b2: [], c1: [] };
const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const adverbsListDiv = document.getElementById('adverbs-list');
const adverbCount = document.getElementById('adverb-count');
const clearSearchBtn = document.getElementById('clear-search');

let currentLevel = 'a1';

displayAdverbs(currentLevel);
updateCounts();

levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    searchInput.value = '';
    displayAdverbs(currentLevel);
  });
});

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  displayAdverbs(currentLevel, query);
  clearSearchBtn.style.display = query ? 'block' : 'none';
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

function filterAdverbs(level, query) {
  const adverbs = adverbsDB[level];
  if (!query) return adverbs;
  return adverbs.filter(adv => {
    const searchText = [adv.word, adv.type, ...adv.translations, ...adv.examples].join(' ').toLowerCase();
    return searchText.includes(query);
  });
}

function displayAdverbs(level, query = '') {
  const adverbs = query ? filterAdverbs(level, query) : adverbsDB[level];
  adverbsListDiv.innerHTML = '';
  if (adverbs.length === 0) {
    adverbsListDiv.innerHTML = `<div class="no-results"><p>No adverbs found${query ? ` matching "${query}"` : ' in this level'}</p></div>`;
    adverbCount.textContent = '0 adverbs';
    return;
  }
  adverbs.forEach(adv => {
    const card = createAdverbCard(adv);
    adverbsListDiv.appendChild(card);
  });
  adverbCount.textContent = `${adverbs.length} ${adverbs.length === 1 ? 'adverb' : 'adverbs'}`;
}

function createAdverbCard(adv) {
  const card = document.createElement('div');
  card.className = 'adverb-card';
  card.innerHTML = `
    <div class="adverb-header">
      <h3 class="adverb-word">${adv.word}</h3>
      <span class="adverb-type-badge">${adv.type}</span>
    </div>
    <div class="adverb-info"><span class="label">Translation:</span><span class="value">${adv.translations.join(', ')}</span></div>
    <div class="adverb-examples"><span class="label">Examples:</span><ul>${adv.examples.map(ex => `<li>${ex}</li>`).join('')}</ul></div>
  `;
  return card;
}

function updateCounts() {
  Object.keys(adverbsDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) badge.textContent = adverbsDB[level].length;
  });
}
