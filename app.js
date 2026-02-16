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

  if
