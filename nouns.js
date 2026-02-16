// nouns.js - Display logic for German nouns
import nounsA1 from './js/nouns-db-a1.js';

const nounsDB = {
  a1: nounsA1,
  a2: [],  // Will be populated
  b1: [],
  b2: [],
  c1: []
};

const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const nounsListDiv = document.getElementById('nouns-list');
const nounCount = document.getElementById('noun-count');
const clearSearchBtn = document.getElementById('clear-search');

let currentLevel = 'a1';

// Initialize
displayNouns(currentLevel);
updateCounts();

// Level buttons
levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    searchInput.value = '';
    displayNouns(currentLevel);
  });
});

// Search
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  displayNouns(currentLevel, query);
  clearSearchBtn.style.display = query ? 'block' : 'none';
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

function filterNouns(level, query) {
  const nouns = nounsDB[level];
  if (!query) return nouns;
  
  return nouns.filter(noun => {
    const searchText = [
      noun.word,
      noun.plural,
      ...noun.translations,
      ...noun.examples
    ].join(' ').toLowerCase();
    return searchText.includes(query);
  });
}

function displayNouns(level, query = '') {
  const nouns = query ? filterNouns(level, query) : nounsDB[level];
  
  nounsListDiv.innerHTML = '';
  
  if (nouns.length === 0) {
    nounsListDiv.innerHTML = `
      <div class="no-results">
        <p>No nouns found${query ? ` matching "${query}"` : ' in this level'}</p>
      </div>
    `;
    nounCount.textContent = '0 nouns';
    return;
  }
  
  nouns.forEach(noun => {
    const card = createNounCard(noun);
    nounsListDiv.appendChild(card);
  });
  
  nounCount.textContent = `${nouns.length} ${nouns.length === 1 ? 'noun' : 'nouns'}`;
}

function createNounCard(noun) {
  const card = document.createElement('div');
  card.className = 'noun-card';
  
  const genderClass = noun.gender === 'm' ? 'masculine' : noun.gender === 'f' ? 'feminine' : 'neuter';
  const genderText = noun.gender === 'm' ? 'der' : noun.gender === 'f' ? 'die' : 'das';
  
  card.innerHTML = `
    <div class="noun-header">
      <h3 class="noun-word">
        <span class="gender-badge ${genderClass}">${genderText}</span>
        ${noun.word.split(' ')[1] || noun.word}
      </h3>
    </div>
    
    <div class="noun-forms">
      <div class="form-item">
        <span class="form-label">Plural:</span>
        <span class="form-value">${noun.plural}</span>
      </div>
      <div class="form-item">
        <span class="form-label">Genitive:</span>
        <span class="form-value">${noun.genitive}</span>
      </div>
    </div>
    
    <div class="noun-info">
      <span class="label">Translation:</span>
      <span class="value">${noun.translations.join(', ')}</span>
    </div>
    
    <div class="noun-examples">
      <span class="label">Examples:</span>
      <ul>
        ${noun.examples.map(ex => `<li>${ex}</li>`).join('')}
      </ul>
    </div>
  `;
  
  return card;
}

function updateCounts() {
  Object.keys(nounsDB).forEach(level => {
    const badge = document.getElementById(`count-${level}`);
    if (badge) {
      badge.textContent = nounsDB[level].length;
    }
  });
}

// Keyboard shortcuts
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
