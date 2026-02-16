// app.js - Focus mode (1 verb at a time + accordion lists)
import { initFocusMode } from './focus-mode.js';
import verbsA1 from './js/verbs-db-a1.js';
import verbsA2 from './js/verbs-db-a2.js';
import verbsB1 from './js/verbs-db-b1.js';
import verbsB2 from './js/verbs-db-b2.js';
import verbsC1 from './js/verbs-db-C1.js';

const verbsDB = {
  a1: verbsA1,
  a2: verbsA2,
  b1: verbsB1,
  b2: verbsB2,
  c1: verbsC1
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

    getId: (v, idx) => `${getVerbBase(v)}::${idx}`, // stable enough even if duplicates
    getLabel: (v) => getVerbBase(v),
    renderCard: (v) => createVerbCard(v)
  });
}

function filterVerbs(level, query) {
  const list = verbsDB[level] || [];
  if (!query) return list;

  return list.filter(v => {
    const base = getVerbBase(v);

    const forms = getForms(v); // {present, past, partizip2, aux}
    const translations = getTranslations(v);
    const examples = getExamples(v);
    const variants = getVariants(v);

    const searchText = [
      base,
      getTypeText(v),
      asText(v.preposition),
      asText(v.prepositions),
      forms.present,
      forms.past,
      forms.partizip2,
      forms.aux,
      ...translations,
      ...examples,
      ...variants.flatMap(x => (typeof x === 'string' ? [x] : Object.values(x).map(asText)))
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchText.includes(query);
  });
}

/* =========================
   Data extractors (robust)
   ========================= */

function getVerbBase(v) {
  // Try common keys
  const direct =
    v.base ??
    v.infinitive ??
    v.verb ??
    v.word ??
    v.lemma ??
    v.name ??
    v.title;

  if (isNonEmptyString(direct)) return direct.trim();

  // Try nested shapes
  const nested =
    v?.headword ??
    v?.entry?.base ??
    v?.entry?.infinitive ??
    v?.entry?.word ??
    v?.verb?.base ??
    v?.verb?.infinitive;

  if (isNonEmptyString(nested)) return nested.trim();

  // As a last resort: if object has exactly one string property that looks like a verb
  for (const [k, val] of Object.entries(v || {})) {
    if (isNonEmptyString(val) && /[a-zäöüß]/i.test(val) && k.toLowerCase().includes('verb')) {
      return val.trim();
    }
  }

  return '—';
}

function getTypeText(v) {
  // Handles e.g. { type: "Verb (strong, irregular)" } or { strong:true, irregular:true }
  const parts = [];

  const raw = v.type ?? v.verbType ?? v.class ?? v.category;
  if (isNonEmptyString(raw)) parts.push(raw);

  if (v.reflexive === true || String(getVerbBase(v)).toLowerCase().startsWith('sich ')) {
    parts.push('reflexive');
  }
  if (v.strong === true) parts.push('strong');
  if (v.weak === true) parts.push('weak');
  if (v.irregular === true) parts.push('irregular');
  if (v.separable === true) parts.push('separable');

  return parts.filter(Boolean).join(', ');
}

function getForms(v) {
  // Return { present, past, partizip2, aux }
  // Supports many key names and even combined principal parts strings.
  const present =
    v.present ?? v.prasens ?? v.präsens ?? v.presens ?? v.präs ?? v.pras ??
    v.forms?.present ??
    v.conjugation?.present ??
    v?.principalParts?.[0];

  const past =
    v.past ?? v.prateritum ?? v.präteritum ?? v.simplePast ??
    v.forms?.past ??
    v.conjugation?.past ??
    v?.principalParts?.[1];

  const partizip2 =
    v.partizip2 ?? v.partizipII ?? v.participle ?? v.pp ?? v.perfectParticiple ??
    v.forms?.partizip2 ??
    v.conjugation?.partizip2 ??
    v?.principalParts?.[2];

  // Auxiliary verb: haben/sein etc.
  const aux =
    v.aux ?? v.auxiliary ?? v.hilfsverb ??
    v.forms?.aux ?? v.forms?.auxiliary ??
    v.conjugation?.aux;

  // Some DBs have a combined string: "spricht, sprach, hat gesprochen"
  const line =
    v.conjugationLine ?? v.conjugation ?? v.formsLine ?? v.forms ?? v.principalPartsLine;

  const normalizedLine = normalizeConjugation(line, present, past, partizip2);

  // If present/past/partizip2 missing but normalizedLine exists, try to parse 3 parts
  let p = asText(present);
  let pa = asText(past);
  let pp = asText(partizip2);
  let a = asText(aux);

  if ((!p || p === '—') && normalizedLine) {
    const parts = normalizedLine.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      p = parts[0] || p;
      pa = parts[1] || pa;
      // third part might contain aux + participle ("hat gesprochen")
      if (parts[2]) {
        const third = parts[2];
        const m = third.match(/^(hat|habe|hast|haben|seid|ist|bin|bist|sind|war|waren)\s+(.+)$/i);
        if (m) {
          // aux is the first word (hat/ist)
          a = a || m[1];
          pp = pp || m[2];
        } else {
          pp = pp || third;
        }
      }
    }
  }

  return {
    present: p || '—',
    past: pa || '—',
    partizip2: pp || '—',
    aux: a || ''
  };
}

function getTranslations(v) {
  const t =
    v.translations ??
    v.meanings ??
    v.translation ??
    v.meaning ??
    v.mainMeanings ??
    v.mainMeaning ??
    v.definition ??
    v.definitions;

  if (Array.isArray(t)) return t.map(asText).filter(Boolean);

  // Sometimes it's an object: { main: [...], notes: ... }
  if (t && typeof t === 'object') {
    const flat = [];
    for (const val of Object.values(t)) {
      if (Array.isArray(val)) flat.push(...val.map(asText));
      else if (isNonEmptyString(val)) flat.push(val);
    }
    return flat.filter(Boolean);
  }

  if (isNonEmptyString(t)) return [t];

  return [];
}

function getExamples(v) {
  const ex =
    v.examples ??
    v.sentences ??
    v.example ??
    v.examplesList ??
    v.usage ??
    v.sampleSentences;

  if (Array.isArray(ex)) return ex.map(asText).filter(Boolean);
  if (isNonEmptyString(ex)) return [ex];
  return [];
}

function getVariants(v) {
  const va =
    v.variants ??
    v.variant ??
    v.alternatives ??
    v.alternative ??
    v.phrasalVariants;

  if (Array.isArray(va)) return va;
  if (va && typeof va === 'object') return [va];
  return [];
}

function normalizeConjugation(line, present, past, partizip2) {
  if (line && typeof line === 'object') {
    // if it's { present, past, partizip2 } etc.
    const maybe = [line.present, line.past, line.partizip2, line.pp].map(asText).filter(Boolean);
    if (maybe.length) return maybe.join(', ');
    try { return JSON.stringify(line); } catch { return ''; }
  }

  const s = asText(line).trim();
  if (s) return s;

  const parts = [present, past, partizip2].map(asText).map(x => x.trim()).filter(x => x && x !== '—');
  if (!parts.length) return '';
  return parts.join(', ');
}

function asText(x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (typeof x === 'number' || typeof x === 'boolean') return String(x);
  return '';
}

function isNonEmptyString(x) {
  return typeof x === 'string' && x.trim().length > 0;
}

/* =========================
   Card renderer
   ========================= */

function createVerbCard(v) {
  const card = document.createElement('div');
  card.className = 'verb-card';

  const base = getVerbBase(v);
  const typeText = getTypeText(v);
  const forms = getForms(v);
  const translations = getTranslations(v);
  const examples = getExamples(v);
  const variants = getVariants(v);

  // prep(s)
  const preps = asText(v.prepositions) || asText(v.preposition) || asText(v.prep);
  const prepHtml = preps ? `<span class="prep-badge">${escapeHtml(preps)}</span>` : '';

  // conjugation combined line (if present)
  const conjLine =
    normalizeConjugation(v.conjugationLine ?? v.conjugation ?? v.formsLine ?? v.forms ?? v.principalParts, forms.present, forms.past, forms.partizip2);

  card.innerHTML = `
    <div class="verb-header">
      <div>
        <div class="verb-base">${escapeHtml(base)}</div>
        ${typeText ? `<div class="reflexive-marker">${escapeHtml(typeText)}</div>` : ''}
      </div>
    </div>

    ${conjLine ? `
      <div class="verb-info conjugation">
        <span class="label">Conjugation:</span>
        <span class="value">${escapeHtml(conjLine)}</span>
      </div>
    ` : ''}

    <div class="verb-forms">
      <div class="form-item">
        <span class="form-label">Present</span>
        <span class="form-value">${escapeHtml(forms.present)}</span>
      </div>
      <div class="form-item">
        <span class="form-label">Past</span>
        <span class="form-value">${escapeHtml(forms.past)}</span>
      </div>
      <div class="form-item" style="grid-column: 1 / -1;">
        <span class="form-label">Partizip II</span>
        <span class="form-value">${escapeHtml(forms.partizip2)}</span>
      </div>
    </div>

    ${translations.length ? `
      <div class="verb-info">
        <span class="label">Translation:</span>
        <span class="value">${escapeHtml(translations.join(', '))}</span>
      </div>
    ` : ''}

    ${prepHtml ? `
      <div class="verb-info">
        <span class="label">Prep:</span>
        <span class="value">${prepHtml}</span>
      </div>
    ` : ''}

    ${variants.length ? `
      <div class="variants-section">
        <h4>Variants</h4>
        <ul class="variants-list">
          ${variants.map(vr => {
            if (typeof vr === 'string') return `<li>${escapeHtml(vr)}</li>`;

            const txt = vr.text || vr.name || vr.variant || vr.word || '';
            const prep = vr.preps || vr.preposition || vr.prep || '';
            const ex = vr.example || vr.sentence || vr.examples || '';

            return `
              <li>
                ${escapeHtml(txt || JSON.stringify(vr))}
                ${prep ? `<div class="variant-preps">${escapeHtml(String(prep))}</div>` : ''}
                ${ex ? `<div class="variant-example">${escapeHtml(Array.isArray(ex) ? ex.join(' | ') : String(ex))}</div>` : ''}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    ` : ''}

    ${examples.length ? `
      <div class="examples-section">
        <h4>Examples</h4>
        <ul class="examples-list">
          ${examples.slice(0, 4).map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;

  return card;
}

/* =========================
   Utilities
   ========================= */

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
