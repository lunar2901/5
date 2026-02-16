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

  const learnedSet = new Set(JSON.parse(localStorage.getItem(keyLearned) || "[]"));
  let index = clamp(parseInt(localStorage.getItem(keyIndex) || "0", 10), 0, Math.max(items.length - 1, 0));

  let hideWords = localStorage.getItem(keyHide) === "1"; // default false
  let openPanel = localStorage.getItem(keyOpen) || "";   // default closed

  function save() {
    localStorage.setItem(keyLearned, JSON.stringify([...learnedSet]));
    localStorage.setItem(keyIndex, String(index));
    localStorage.setItem(keyHide, hideWords ? "1" : "0");
    localStorage.setItem(keyOpen, openPanel);
  }

  function isLearned(item, idx) {
    return learnedSet.has(getId(item, idx));
  }

  function jumpTo(i) {
    index = clamp(i, 0, items.length - 1);
    save();
    render();
  }

  function markLearned() {
    learnedSet.add(getId(items[index], index));
    save();
    render();
  }

  function markUnlearned() {
    learnedSet.delete(getId(items[index], index));
    save();
    render();
  }

  function toggleHide() {
    hideWords = !hideWords;
    // when hiding, also close panels
    if (hideWords) openPanel = "";
    save();
    render();
  }

  function togglePanel(name) {
    if (hideWords) return; // disabled when hidden
    openPanel = openPanel === name ? "" : name;
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

    const learnedCount = items.reduce((acc, it, i) => acc + (isLearned(it, i) ? 1 : 0), 0);
    const unlearnedCount = items.length - learnedCount;

    const currentItem = items[index];
    const currentLearned = isLearned(currentItem, index);

    root.innerHTML = `
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
          <span class="word-level">${level.toUpperCase()}</span>
          <span class="word-count">${index + 1} / ${items.length}</span>
          <span class="word-stats">${learnedCount} learned • ${unlearnedCount} not learned</span>
        </div>

        <div class="word-actions">
          ${
            currentLearned
              ? `<button type="button" class="word-btn" data-action="unlearn">Mark Unlearned</button>`
              : `<button type="button" class="word-btn primary" data-action="learn">Mark Learned</button>`
          }
        </div>
      </section>

      <section class="word-card-host" id="focus-card-host"></section>
    `;

    // Fill lists only if open (to keep it light + focused)
    const learnedHost = root.querySelector("#vocab-learned");
    const unlearnedHost = root.querySelector("#vocab-unlearned");

    if (openPanel === "learned" && !hideWords) {
      learnedHost.replaceChildren(buildWordButtons((it, i) => isLearned(it, i)));
      if (!learnedHost.childNodes.length) learnedHost.textContent = "No learned words yet.";
    } else {
      learnedHost.replaceChildren();
    }

    if (openPanel === "unlearned" && !hideWords) {
      unlearnedHost.replaceChildren(buildWordButtons((it, i) => !isLearned(it, i)));
      if (!unlearnedHost.childNodes.length) unlearnedHost.textContent = "All words learned 🎉";
    } else {
      unlearnedHost.replaceChildren();
    }

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
        if (a === "learn") markLearned();
        if (a === "unlearn") markUnlearned();
      });
    });

    // Keyboard: ← → to move, L to toggle learned
    window.onkeydown = (e) => {
      if (e.key === "ArrowLeft") jumpTo(index - 1);
      if (e.key === "ArrowRight") jumpTo(index + 1);
      if (e.key.toLowerCase() === "l") {
        if (isLearned(items[index], index)) markUnlearned();
        else markLearned();
      }
    };
  }

  render();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
