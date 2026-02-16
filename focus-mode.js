// focus-mode.js
export function initFocusMode({
  rootId = "study-root",
  items = [],
  level = "a1",
  storageKey = "study",
  getId = (item, idx) => item?.id ?? item?.word ?? item?.term ?? String(idx),
  getLabel = (item) => item?.word ?? item?.term ?? item?.infinitive ?? "—",
  renderCard = (item) => {
    const el = document.createElement("div");
    el.textContent = getLabel(item);
    return el;
  },
}) {
  const root = document.getElementById(rootId);
  if (!root) throw new Error(`Missing #${rootId}`);

  const keyLearned = `${storageKey}:learned:${level}`;
  const keyIndex = `${storageKey}:index:${level}`;
  const keyHide = `${storageKey}:hideWords:${level}`;
  const keyOpen = `${storageKey}:openPanel:${level}`; // "learned" | "unlearned" | ""
  const keyZen = `${storageKey}:zen:${level}`; // "1" | "0"

  const learnedSet = new Set(JSON.parse(localStorage.getItem(keyLearned) || "[]"));
  let index = clamp(parseInt(localStorage.getItem(keyIndex) || "0", 10), 0, Math.max(items.length - 1, 0));

  let hideWords = localStorage.getItem(keyHide) === "1";
  let openPanel = localStorage.getItem(keyOpen) || "";

  const isSmallScreen = () => window.matchMedia('(max-width: 768px)').matches;
  let zen = (() => {
    // Default: ON for small screens so the user focuses on the word.
    const saved = localStorage.getItem(keyZen);
    if (saved === '1') return true;
    if (saved === '0') return false;
    return isSmallScreen();
  })();

  function applyZen() {
    document.body.classList.toggle('zen-mode', !!zen);
  }

  function save() {
    localStorage.setItem(keyLearned, JSON.stringify([...learnedSet]));
    localStorage.setItem(keyIndex, String(index));
    localStorage.setItem(keyHide, hideWords ? "1" : "0");
    localStorage.setItem(keyOpen, openPanel);
    localStorage.setItem(keyZen, zen ? '1' : '0');
  }

  function isLearned(item, idx) {
    return learnedSet.has(getId(item, idx));
  }

  function jumpTo(i) {
    index = clamp(i, 0, items.length - 1);
    save();
    render();
  }

  function findNextUnlearned(fromIndex) {
    if (!items.length) return 0;
    for (let i = fromIndex + 1; i < items.length; i++) {
      if (!isLearned(items[i], i)) return i;
    }
    // wrap
    for (let i = 0; i <= fromIndex; i++) {
      if (!isLearned(items[i], i)) return i;
    }
    return fromIndex; // all learned
  }

  function findPrevUnlearned(fromIndex) {
    if (!items.length) return 0;
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (!isLearned(items[i], i)) return i;
    }
    // wrap
    for (let i = items.length - 1; i >= fromIndex; i--) {
      if (!isLearned(items[i], i)) return i;
    }
    return fromIndex;
  }

  function next() {
    // Move forward (prefer next unlearned)
    const nextIdx = findNextUnlearned(index);
    jumpTo(nextIdx === index ? Math.min(index + 1, items.length - 1) : nextIdx);
  }

  function prev() {
    const prevIdx = findPrevUnlearned(index);
    jumpTo(prevIdx === index ? Math.max(index - 1, 0) : prevIdx);
  }

  function markLearnedAndNext() {
    learnedSet.add(getId(items[index], index));
    save();
    // auto go to next unlearned
    const nextIdx = findNextUnlearned(index);
    jumpTo(nextIdx);
  }

  function markUnlearned() {
    learnedSet.delete(getId(items[index], index));
    save();
    render();
  }

  function toggleHide() {
    hideWords = !hideWords;
    if (hideWords) openPanel = "";
    save();
    render();
  }

  function togglePanel(name) {
    if (hideWords) return;
    openPanel = openPanel === name ? "" : name;
    save();
    render();
  }

  function toggleZen() {
    zen = !zen;
    save();
    render();
  }

  function buildWordButtons(filterFn) {
    const frag = document.createDocumentFragment();

    items.forEach((it, i) => {
      if (!filterFn(it, i)) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vocab-word";
      btn.textContent = getLabel(it);
      if (i === index) btn.classList.add("active");
      btn.addEventListener("click", () => jumpTo(i));
      frag.appendChild(btn);
    });

    return frag;
  }

  function render() {
    if (!Array.isArray(items) || items.length === 0) {
      root.innerHTML = `<div class="no-results"><p>No items in this level.</p></div>`;
      return;
    }

    applyZen();

    const learnedCount = items.reduce((acc, it, i) => acc + (isLearned(it, i) ? 1 : 0), 0);
    const unlearnedCount = items.length - learnedCount;

    const currentItem = items[index];
    const currentLearned = isLearned(currentItem, index);

    root.innerHTML = `
      <button type="button" class="zen-fab" data-action="zen" aria-label="${zen ? 'Show menus' : 'Hide menus'}">
        ${zen ? '☰' : '⛶'}
      </button>

      <section class="vocab-panel">
        <h3 class="vocab-title">Vocabulary List</h3>

        <button type="button" class="vocab-row" data-action="hide">
          <span>Hide Words</span>
          <span class="chev">${hideWords ? "▲" : "▼"}</span>
        </button>

        <button type="button" class="vocab-row" data-action="learned" ${hideWords ? "disabled" : ""}>
          <span>✅ Learned</span>
          <span class="chev">${openPanel === "learned" ? "▲" : "▼"}</span>
        </button>
        <div class="vocab-body ${openPanel === "learned" && !hideWords ? "open" : ""}" id="vocab-learned"></div>

        <button type="button" class="vocab-row" data-action="unlearned" ${hideWords ? "disabled" : ""}>
          <span>📌 Not learned yet</span>
          <span class="chev">${openPanel === "unlearned" ? "▲" : "▼"}</span>
        </button>
        <div class="vocab-body ${openPanel === "unlearned" && !hideWords ? "open" : ""}" id="vocab-unlearned"></div>
      </section>

      <section class="word-toolbar">
        <div class="word-meta">
          <span class="word-level">${String(level).toUpperCase()}</span>
          <span class="word-count">${index + 1} / ${items.length}</span>
          <span class="word-stats">${learnedCount} learned • ${unlearnedCount} not learned</span>
        </div>

        <div class="word-actions">
          <button type="button" class="word-btn" data-action="prev">← Prev</button>
          <button type="button" class="word-btn" data-action="next">Next →</button>
          ${
            currentLearned
              ? `<button type="button" class="word-btn" data-action="unlearn">Unlearn</button>`
              : `<button type="button" class="word-btn primary" data-action="learnNext">Learned ✓</button>`
          }
        </div>
      </section>

      <section class="word-card-host" id="focus-card-host"></section>
    `;

    // Fill lists only when open
    const learnedHost = root.querySelector("#vocab-learned");
    const unlearnedHost = root.querySelector("#vocab-unlearned");

    if (openPanel === "learned" && !hideWords) {
      learnedHost.replaceChildren(buildWordButtons((it, i) => isLearned(it, i)));
      if (!learnedHost.childNodes.length) learnedHost.textContent = "No learned words yet.";
    } else learnedHost.replaceChildren();

    if (openPanel === "unlearned" && !hideWords) {
      unlearnedHost.replaceChildren(buildWordButtons((it, i) => !isLearned(it, i)));
      if (!unlearnedHost.childNodes.length) unlearnedHost.textContent = "All words learned 🎉";
    } else unlearnedHost.replaceChildren();

    // Render ONE card
    const cardHost = root.querySelector("#focus-card-host");
    cardHost.innerHTML = "";
    cardHost.appendChild(renderCard(currentItem, index));

    // Actions
    root.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", () => {
        const a = el.getAttribute("data-action");
        if (a === "hide") toggleHide();
        if (a === "learned") togglePanel("learned");
        if (a === "unlearned") togglePanel("unlearned");
        if (a === "prev") prev();
        if (a === "next") next();
        if (a === "learnNext") markLearnedAndNext();
        if (a === "unlearn") markUnlearned();
        if (a === "zen") toggleZen();
      });
    });

    // Keyboard shortcuts
    window.onkeydown = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key.toLowerCase() === 'm') toggleZen();
      if (e.key.toLowerCase() === "l") {
        if (isLearned(items[index], index)) markUnlearned();
        else markLearnedAndNext();
      }
    };

    // Swipe navigation on touch devices (works even when menus are hidden)
    const cardHost = root.querySelector('#focus-card-host');
    if (cardHost) {
      let x0 = null;
      let y0 = null;
      cardHost.addEventListener('touchstart', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        x0 = t.clientX;
        y0 = t.clientY;
      }, { passive: true });
      cardHost.addEventListener('touchend', (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t || x0 == null || y0 == null) return;
        const dx = t.clientX - x0;
        const dy = t.clientY - y0;
        x0 = null;
        y0 = null;
        // horizontal swipe only
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) next();
        else prev();
      }, { passive: true });
    }
  }

  render();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
