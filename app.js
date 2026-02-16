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

  // --- Base / title ---
  const base =
    v.base ||
    v.infinitive ||
    v.verb ||
    v.word ||
    v.lemma ||
    v.name ||
    '—';

  // --- Type badge (optional) ---
  const typeText =
    v.type ||
    v.verbType ||
    v.class ||
    (v.strong ? 'strong' : '') ||
    (v.irregular ? 'irregular' : '');

  // --- Conjugation / forms ---
  const present =
    v.present || v.prasens || v.präsens || v.presens || v.ich || v.form_present || '—';

  const past =
    v.past || v.prateritum || v.präteritum || v.simplePast || v.form_past || '—';

  const partizip2 =
    v.partizip2 || v.partizipII || v.participle || v.pp || v.form_partizip2 || '—';

  // Some DBs store one combined string like: "spricht, sprach, hat gesprochen"
  const conjugationLine =
    v.conjugationLine ||
    v.conjugation ||
    v.forms ||
    v.principalParts ||
    '';

  const conjugationText = normalizeConjugation(conjugationLine, present, past, partizip2);

  // --- Translations / meanings ---
  const translations =
    Array.isArray(v.translations) ? v.translations :
    Array.isArray(v.meanings) ? v.meanings :
    Array.isArray(v.translation) ? v.translation :
    typeof v.translation === 'string' ? [v.translation] :
    typeof v.meaning === 'string' ? [v.meaning] :
    [];

  // --- Examples ---
  const examples =
    Array.isArray(v.examples) ? v.examples :
    Array.isArray(v.sentences) ? v.sentences :
    Array.isArray(v.example) ? v.example :
    typeof v.example === 'string' ? [v.example] :
    [];

  // --- Variants ---
  const variants =
    Array.isArray(v.variants) ? v.variants :
    Array.isArray(v.variant) ? v.variant :
    Array.isArray(v.alternatives) ? v.alternatives :
    [];

  // --- Preposition(s) ---
  const preps =
    v.prepositions ||
    v.preposition ||
    v.prep ||
    '';

  const prepHtml = preps
    ? `<span class="prep-badge">${escapeHtml(String(preps))}</span>`
    : '';

  card.innerHTML = `
    <div class="verb-header">
      <div>
        <div class="verb-base">${escapeHtml(String(base))}</div>
        ${typeText ? `<div class="reflexive-marker">${escapeHtml(String(typeText))}</div>` : ''}
      </div>
    </div>

    ${
      conjugationText
        ? `
          <div class="verb-info conjugation">
            <span class="label">Conjugation:</span>
            <span class="value">${escapeHtml(conjugationText)}</span>
          </div>
        `
        : ''
    }

    <div class="verb-forms">
      <div class="form-item">
        <span class="form-label">Present</span>
        <span class="form-value">${escapeHtml(String(present))}</span>
      </div>
      <div class="form-item">
        <span class="form-label">Past</span>
        <span class="form-value">${escapeHtml(String(past))}</span>
      </div>
      <div class="form-item" style="grid-column: 1 / -1;">
        <span class="form-label">Partizip II</span>
        <span class="form-value">${escapeHtml(String(partizip2))}</span>
      </div>
    </div>

    ${
      translations.length
        ? `
          <div class="verb-info">
            <span class="label">Translation:</span>
            <span class="value">${escapeHtml(translations.join(', '))}</span>
          </div>
        `
        : ''
    }

    ${
      prepHtml
        ? `
          <div class="verb-info">
            <span class="label">Prep:</span>
            <span class="value">${prepHtml}</span>
          </div>
        `
        : ''
    }

    ${
      variants.length
        ? `
          <div class="variants-section">
            <h4>Variants</h4>
            <ul class="variants-list">
              ${variants.map(vr => {
                if (typeof vr === 'string') return `<li>${escapeHtml(vr)}</li>`;
                const txt = vr.text || vr.name || vr.variant || JSON.stringify(vr);
                const ex = vr.example || vr.sentence || '';
                const prep = vr.preps || vr.preposition || '';
                return `
                  <li>
                    ${escapeHtml(txt)}
                    ${prep ? `<div class="variant-preps">${escapeHtml(String(prep))}</div>` : ''}
                    ${ex ? `<div class="variant-example">${escapeHtml(String(ex))}</div>` : ''}
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        `
        : ''
    }

    ${
      examples.length
        ? `
          <div class="examples-section">
            <h4>Examples</h4>
            <ul class="examples-list">
              ${examples.slice(0, 4).map(ex => `<li>${escapeHtml(String(ex))}</li>`).join('')}
            </ul>
          </div>
        `
        : ''
    }
  `;

  return card;
}

function normalizeConjugation(line, present, past, partizip2) {
  // If line is object -> stringify nicely
  if (line && typeof line === 'object') {
    try { return JSON.stringify(line); } catch { return ''; }
  }

  const s = String(line || '').trim();
  if (s) return s;

  // If we have parts, build a simple line
  const parts = [present, past, partizip2].map(x => String(x || '').trim()).filter(x => x && x !== '—');
  if (!parts.length) return '';
  return parts.join(', ');
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
