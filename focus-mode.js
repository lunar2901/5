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

  const learnedSet = new Set(JSON.parse(localStorage.getItem(keyLearned) || "[]"));
  let index = clamp(parseInt(localStorage.getItem(keyIndex) || "0", 10), 0, items.length - 1);

  function save() {
    localStorage.setItem(keyLearned, JSON.stringify([...learnedSet]));
    localStorage.setItem(keyIndex, String(index));
  }

  function isLearned(item, idx) {
    return learnedSet.has(getId(item, idx));
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

  function goPrev() {
    index = clamp(index - 1, 0, items.length - 1);
    save();
    render();
  }

  function goNext() {
    index = clamp(index + 1, 0, items.length - 1);
    save();
    render();
  }

  function jumpTo(i) {
    index = clamp(i, 0, items.length - 1);
    save();
    render();
  }

  function renderList(filterFn) {
    return items
      .map((it, i) => ({ it, i }))
      .filter(({ it, i }) => filterFn(it, i))
      .map(({ it, i }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "focus-mini-item";
        btn.textContent = getLabel(it);
        btn.addEventListener("click", () => jumpTo(i));
        return btn;
      });
  }

  function render() {
    if (!items.length) {
      root.innerHTML = `<div class="no-results"><p>No items in this level.</p></div>`;
      return;
    }

    const learnedCount = items.reduce((acc, it, i) => acc + (isLearned(it, i) ? 1 : 0), 0);
    const unlearnedCount = items.length - learnedCount;

    root.innerHTML = `
      <section class="focus-list-card">
        <h3 class="focus-list-title">Vocabulary List</h3>

        <details class="focus-acc">
          <summary>Hide Words</summary>
          <div class="focus-acc-body">
            <p class="focus-muted">
              Collapse “Learned” and “Not learned yet” to focus only on the current word.
            </p>
          </div>
        </details>

        <details class="focus-acc">
          <summary>✅ Learned (${learnedCount})</summary>
          <div class="focus-acc-body" id="focus-learned"></div>
        </details>

        <details class="focus-acc" open>
          <summary>📌 Not learned yet (${unlearnedCount})</summary>
          <div class="focus-acc-body" id="focus-unlearned"></div>
        </details>
      </section>

      <section class="focus-nav">
        <button type="button" class="focus-btn" data-action="prev" ${index === 0 ? "disabled" : ""}>← Prev</button>
        <div class="focus-counter">${index + 1} / ${items.length}</div>
        <button type="button" class="focus-btn" data-action="next" ${index === items.length - 1 ? "disabled" : ""}>Next →</button>
      </section>

      <section class="focus-actions">
        <button type="button" class="focus-btn primary" data-action="learn">Mark Learned</button>
        <button type="button" class="focus-btn" data-action="unlearn">Mark Unlearned</button>
      </section>

      <section id="focus-card-host" class="focus-card-host"></section>
    `;

    // Fill lists
    const learnedHost = root.querySelector("#focus-learned");
    const unlearnedHost = root.querySelector("#focus-unlearned");

    learnedHost.replaceChildren(...renderList((it, i) => isLearned(it, i)));
    unlearnedHost.replaceChildren(...renderList((it, i) => !isLearned(it, i)));

    // Render ONE card (your existing design)
    const host = root.querySelector("#focus-card-host");
    host.innerHTML = "";
    host.appendChild(renderCard(items[index], index));

    // Buttons
    root.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = btn.getAttribute("data-action");
        if (a === "prev") goPrev();
        if (a === "next") goNext();
        if (a === "learn") markLearned();
        if (a === "unlearn") markUnlearned();
      });
    });

    // Optional keyboard
    window.onkeydown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key.toLowerCase() === "l") {
        const it = items[index];
        if (isLearned(it, index)) markUnlearned();
        else markLearned();
      }
    };
  }

  render();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
