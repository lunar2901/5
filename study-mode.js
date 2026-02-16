// study-mode.js
export function initStudyMode({
  rootId = "study-root",
  items = [],
  level = "a1",
  storageKey = "study",
  getId = (item, idx) => item?.id ?? item?.word ?? item?.term ?? String(idx),
  getFront = (item) => item?.word ?? item?.term ?? item?.german ?? "—",
  getBack = (item) => item?.translation ?? item?.meaning ?? item?.english ?? "",
  getExtra = (item) => item?.example ?? item?.sentence ?? item?.notes ?? "",
}) {
  const root = document.getElementById(rootId);
  if (!root) throw new Error(`Study root #${rootId} not found`);
  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = `<div class="empty-state">No items found for ${level.toUpperCase()}.</div>`;
    return;
  }

  const keyLearned = `${storageKey}:learned:${level}`;
  const keyIndex = `${storageKey}:index:${level}`;

  const learnedSet = new Set(JSON.parse(localStorage.getItem(keyLearned) || "[]"));
  let index = clamp(parseInt(localStorage.getItem(keyIndex) || "0", 10), 0, items.length - 1);

  function save() {
    localStorage.setItem(keyLearned, JSON.stringify(Array.from(learnedSet)));
    localStorage.setItem(keyIndex, String(index));
  }

  function isLearned(item, idx) {
    return learnedSet.has(getId(item, idx));
  }

  function markLearned(item, idx) {
    learnedSet.add(getId(item, idx));
    save();
    // Auto-advance to keep flow focused
    goNext();
  }

  function markUnlearned(item, idx) {
    learnedSet.delete(getId(item, idx));
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

  function jumpTo(idx) {
    index = clamp(idx, 0, items.length - 1);
    save();
    render();
  }

  function render() {
    const item = items[index];
    const learned = isLearned(item, index);

    const learnedCount = items.reduce((acc, it, i) => acc + (isLearned(it, i) ? 1 : 0), 0);
    const unlearnedCount = items.length - learnedCount;

    const learnedList = items
      .map((it, i) => ({ it, i, ok: isLearned(it, i) }))
      .filter(x => x.ok)
      .map(x => `
        <button class="mini-item" type="button" data-jump="${x.i}">
          <span class="mini-front">${escapeHtml(getFront(x.it))}</span>
          <span class="mini-back">${escapeHtml(getBack(x.it))}</span>
        </button>
      `)
      .join("");

    const unlearnedList = items
      .map((it, i) => ({ it, i, ok: !isLearned(it, i) }))
      .filter(x => x.ok)
      .map(x => `
        <button class="mini-item" type="button" data-jump="${x.i}">
          <span class="mini-front">${escapeHtml(getFront(x.it))}</span>
          <span class="mini-back">${escapeHtml(getBack(x.it))}</span>
        </button>
      `)
      .join("");

    root.innerHTML = `
      <section class="study-header">
        <div class="study-meta">
          <div class="study-level">${level.toUpperCase()}</div>
          <div class="study-progress">
            <span>${learnedCount}/${items.length} learned</span>
            <span class="dot">•</span>
            <span>${unlearnedCount} unlearned</span>
          </div>
        </div>

        <div class="study-nav">
          <button type="button" class="btn" data-action="prev" ${index === 0 ? "disabled" : ""}>← Prev</button>
          <div class="study-counter">${index + 1} / ${items.length}</div>
          <button type="button" class="btn" data-action="next" ${index === items.length - 1 ? "disabled" : ""}>Next →</button>
        </div>
      </section>

      <section class="study-card">
        <div class="card-front">${escapeHtml(getFront(item))}</div>
        ${getBack(item) ? `<div class="card-back">${escapeHtml(getBack(item))}</div>` : ""}
        ${getExtra(item) ? `<div class="card-extra">${escapeHtml(getExtra(item))}</div>` : ""}

        <div class="study-actions">
          ${
            learned
              ? `<button type="button" class="btn danger" data-action="unlearn">Mark Unlearned</button>`
              : `<button type="button" class="btn primary" data-action="learn">Mark Learned</button>`
          }
        </div>
      </section>

      <section class="study-panels">
        <details class="panel">
          <summary>✅ Learned (${learnedCount})</summary>
          <div class="panel-body">${learnedList || `<div class="panel-empty">No learned words yet.</div>`}</div>
        </details>

        <details class="panel" open>
          <summary>📌 Unlearned (${unlearnedCount})</summary>
          <div class="panel-body">${unlearnedList}</div>
        </details>
      </section>
    `;

    // events
    root.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        if (action === "prev") goPrev();
        if (action === "next") goNext();
        if (action === "learn") markLearned(item, index);
        if (action === "unlearn") markUnlearned(item, index);
      });
    });

    root.querySelectorAll("[data-jump]").forEach(btn => {
      btn.addEventListener("click", () => jumpTo(parseInt(btn.getAttribute("data-jump"), 10)));
    });

    // keyboard (optional, but very “focused”)
    window.onkeydown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key.toLowerCase() === "l") {
        const now = items[index];
        if (isLearned(now, index)) markUnlearned(now, index);
        else markLearned(now, index);
      }
    };
  }

  render();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
