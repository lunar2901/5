// app.js - Main application logic for verb display

import verbsA1 from './js/verbs-db-a1.js';
import verbsA2 from './js/verbs-db-a2.js';
import verbsB1 from './js/verbs-db-b1.js';
import verbsB2 from './js/verbs-db-b2.js';
import verbsC1 from './js/verbs-db-c1.js';

const verbsDB = { 
  a1: verbsA1, 
  a2: verbsA2, 
  b1: verbsB1, 
  b2: verbsB2, 
  c1: verbsC1 
};

// DOM elements
const levelBtns = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('search-input');
const verbsListDiv = document.getElementById('verbs-list');
const verbCount = document.getElementById('verb-count');
const clearSearchBtn = document.getElementById('clear-search');

let currentLevel = 'a1';

// Initialize
displayVerbs(currentLevel);
updateVerbCount(verbsDB[currentLevel].length, verbsDB[currentLevel].length);

// Level button event listeners
levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    searchInput.value = '';
    displayVerbs(currentLevel);
    updateVerbCount(verbsDB[currentLevel].length, verbsDB[currentLevel].length);
  });
});

// Search functionality
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  const filtered = filterVerbs(currentLevel, query);
  displayVerbs(currentLevel, query);
  updateVerbCount(filtered.length, verbsDB[currentLevel].length);
  
  // Show/hide clear button
  clearSearchBtn.style.display = query ? 'block' : 'none';
});

// Clear search
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.dispatchEvent(new Event('input'));
  searchInput.focus();
});

// Filter verbs by search query
function filterVerbs(level, query) {
  const verbs = verbsDB[level];
  if (!query) return verbs;
  
  return verbs.filter(verb => {
    const searchableText = [
      verb.base,
      verb.past,
      verb.participle,
      ...verb.translations,
      ...verb.derived,
      ...(verb.varieties || []).map(v => v.variant).join(' ')
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });
}

// Display verbs
function displayVerbs(level, query = '') {
  const verbs = query ? filterVerbs(level, query) : verbsDB[level];
  
  verbsListDiv.innerHTML = '';
  
  if (verbs.length === 0) {
    verbsListDiv.innerHTML = `
      <div class="no-results">
        <p>No verbs found matching "${query}"</p>
        <p>Try a different search term or select another level.</p>
      </div>
    `;
    return;
  }
  
  verbs.forEach(verb => {
    const verbCard = createVerbCard(verb);
    verbsListDiv.appendChild(verbCard);
  });
}

// Create verb card element
function createVerbCard(verb) {
  const card = document.createElement('div');
  card.className = 'verb-card';
  
  // Build varieties display (note: using "varieties" not "variants")
  let varietiesHtml = '';
  if (verb.varieties && verb.varieties.length > 0) {
    varietiesHtml = `
      <div class="varieties-section">
        <h4>Varieties:</h4>
        <ul class="varieties-list">
          ${verb.varieties.map(v => `
            <li>
              <strong>${v.variant}</strong>
              ${v.prepositions && v.prepositions.length > 0 ? 
                `<span class="variety-preps">(${v.prepositions.join(', ')})</span>` : ''}
              ${v.explanation ? `<div class="variety-explanation">${v.explanation}</div>` : ''}
              ${v.examples ? `<div class="variety-example">${v.examples[0]}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
  
  card.innerHTML = `
    <div class="verb-header">
      <h3 class="verb-base">${verb.base}${verb.reflexive ? ' <span class="reflexive-marker">(reflexive)</span>' : ''}</h3>
      <button class="bookmark-btn" aria-label="Bookmark this verb">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </div>
    
    <div class="verb-forms">
      <div class="form-item">
        <span class="form-label">Past:</span>
        <span class="form-value">${verb.past}</span>
      </div>
      <div class="form-item">
        <span class="form-label">Participle:</span>
        <span class="form-value">${verb.participle}</span>
      </div>
    </div>
    
    <div class="verb-info">
      <span class="label">Translation:</span>
      <span class="value">${verb.translations.join(', ')}</span>
    </div>
    
    <div class="verb-info">
      <span class="label">Conjugation:</span>
      <span class="value conjugation">${verb.derived.join(', ')}</span>
    </div>
    
    ${varietiesHtml}
  `;
  
  // Add bookmark functionality
  const bookmarkBtn = card.querySelector('.bookmark-btn');
  bookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bookmarkBtn.classList.toggle('bookmarked');
  });
  
  return card;
}

// Update verb count display
function updateVerbCount(shown, total) {
  if (verbCount) {
    verbCount.textContent = shown === total 
      ? `${total} verbs` 
      : `${shown} of ${total} verbs`;
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + F to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    searchInput.focus();
  }
  
  // Escape to clear search
  if (e.key === 'Escape' && searchInput.value) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
});
