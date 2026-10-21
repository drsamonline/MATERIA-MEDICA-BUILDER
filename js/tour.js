/* tour.js — a lightweight, dependency-free spotlight tour.
 * Steps may switch tabs, highlight an element, or appear centred.
 */

const STEPS = [
  { title: "Welcome to Materia Medica Builder", body: "A private workspace for building your own materia medica and repertory. Let's take a one-minute look around. You can leave at any point, and reopen this tour from the Help tab.", place: "center" },
  { target: ".hero", title: "Your workspace", body: "This is the dashboard. From here you can jump straight into adding a remedy, building a rubric, setting your scale, or exporting your book.", tab: "dashboard" },
  { target: "#dash-stats", title: "Your project at a glance", body: "Live counts for remedies, symptoms, chapters, rubrics and cases — they update as you work.", tab: "dashboard" },
  { target: ".tab[data-tab='mm']", title: "Materia Medica", body: "Your remedies live here, each with its own symptoms. Three starter remedies are waiting — edit them or add your own.", tab: "dashboard" },
  { target: "#rem-new", title: "Add a remedy", body: "Every remedy is a few fixed facts plus any number of symptoms. Give it an abbreviation — that short form is what the repertory shows.", tab: "mm" },
  { target: "#rem-detail", title: "Symptoms and grades", body: "Each symptom has a chapter, its text, a grade from your marking scale, and optional modalities such as “worse night”.", tab: "mm" },
  { target: "#rub-new", title: "The Repertory", body: "Chapters hold rubrics; a rubric is a symptom heading carrying graded remedies. Type a remedy abbreviation inside a rubric and press Enter to attach it.", tab: "rep" },
  { target: "#marking-root", title: "Your marking scale", body: "Choose a preset or define your own. Grades you set here appear everywhere — in the app and in every export.", tab: "marking" },
  { target: "#author-form", title: "Make it yours", body: "Your name, credentials, book title and copyright are stamped into every PDF, HTML file and workbook you export.", tab: "author" },
  { target: "#export-btn", title: "Export your book", body: "JSON, CSV, Excel, PDF, HTML, SQL or SQLite — including a real .sqlite database file. Re-import any JSON backup to restore your project.", tab: "data" },
  { title: "That's everything", body: "The Help tab carries the full how-to guide, and About has the licence and maker details. Your work is stored only on this device — export a backup now and then.", place: "center", tab: "help" },
];

let els = null, idx = 0, onFinish = null;

function build() {
  if (els) return els;
  const wrap = document.createElement("div");
  wrap.className = "tour";
  wrap.id = "tour";
  wrap.innerHTML =
    '<div class="tour-dim"></div>' +
    '<div class="tour-spot" id="tour-spot"></div>' +
    '<div class="tour-card" id="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">' +
      '<div class="tour-top"><span class="tour-count" id="tour-count"></span><span class="tour-dots" id="tour-dots"></span></div>' +
      '<h3 id="tour-title"></h3>' +
      '<p id="tour-body"></p>' +
      '<div class="tour-actions">' +
        '<span class="spacer"></span>' +
        '<button class="btn small ghost" id="tour-skip" type="button">Skip tour</button>' +
        '<button class="btn small" id="tour-back" type="button">Back</button>' +
        '<button class="btn primary small" id="tour-next" type="button">Next</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);
  els = {
    wrap,
    dim: wrap.querySelector(".tour-dim"),
    spot: wrap.querySelector("#tour-spot"),
    card: wrap.querySelector("#tour-card"),
    count: wrap.querySelector("#tour-count"),
    dots: wrap.querySelector("#tour-dots"),
    title: wrap.querySelector("#tour-title"),
    body: wrap.querySelector("#tour-body"),
    back: wrap.querySelector("#tour-back"),
    next: wrap.querySelector("#tour-next"),
    skip: wrap.querySelector("#tour-skip"),
  };
  els.next.addEventListener("click", () => (idx >= STEPS.length - 1 ? finish(true) : show(idx + 1)));
  els.back.addEventListener("click", () => show(Math.max(0, idx - 1)));
  els.skip.addEventListener("click", () => finish(false));
  els.dim.addEventListener("click", () => finish(false));
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", reposition);
  return els;
}

function onKey(e) {
  if (!els) return;
  if (e.key === "Escape") finish(false);
  else if (e.key === "ArrowRight") (idx >= STEPS.length - 1 ? finish(true) : show(idx + 1));
  else if (e.key === "ArrowLeft") show(Math.max(0, idx - 1));
}

function activateTab(tab) {
  const b = document.querySelector('.tab[data-tab="' + tab + '"]');
  if (b && b.click) b.click();
}

function center(card, vw, vh) {
  const cw = Math.min(360, vw - 24);
  card.style.width = cw + "px";
  card.style.left = Math.max(12, (vw - cw) / 2) + "px";
  card.style.top = Math.max(12, vh / 2 - 150) + "px";
}

function place() {
  const step = STEPS[idx];
  const card = els.card, spot = els.spot;
  const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
  const target = step.target ? document.querySelector(step.target) : null;
  let r = null;
  try { if (target && target.getBoundingClientRect) r = target.getBoundingClientRect(); } catch (_) {}
  if (!r || (!r.width && !r.height)) {
    spot.style.display = "none";
    center(card, vw, vh);
    return;
  }
  const pad = 6;
  spot.style.display = "block";
  spot.style.left = (r.left - pad) + "px";
  spot.style.top = (r.top - pad) + "px";
  spot.style.width = (r.width + pad * 2) + "px";
  spot.style.height = (r.height + pad * 2) + "px";
  const cw = Math.min(340, vw - 24);
  card.style.width = cw + "px";
  let left = r.left + r.width / 2 - cw / 2;
  left = Math.max(12, Math.min(left, vw - cw - 12));
  card.style.left = left + "px";
  const below = r.bottom + 200 < vh;
  card.style.top = (below ? r.bottom + 14 : Math.max(12, r.top - 190)) + "px";
}
function reposition() { if (els && !els.wrap.hidden) place(); }

function show(n) {
  build();
  idx = Math.max(0, Math.min(n, STEPS.length - 1));
  const step = STEPS[idx];
  els.wrap.hidden = false;
  els.count.textContent = "Step " + (idx + 1) + " of " + STEPS.length;
  els.dots.innerHTML = STEPS.map((_, i) => '<i class="' + (i === idx ? "on" : "") + '"></i>').join("");
  els.title.textContent = step.title;
  els.body.textContent = step.body;
  els.back.hidden = idx === 0;
  els.next.textContent = idx === STEPS.length - 1 ? "Finish" : "Next";
  if (step.tab) activateTab(step.tab);
  const go = () => { try { if (step.target) { const t = document.querySelector(step.target); if (t && t.scrollIntoView) t.scrollIntoView({ block: "center", behavior: "smooth" }); } } catch (_) {} place(); };
  // let the tab switch paint before measuring
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => requestAnimationFrame(go)); else go();
}

function finish(completed) {
  teardown();
  if (typeof onFinish === "function") onFinish({ completed: !!completed });
}

function teardown() {
  if (!els) return;
  try { els.wrap.remove(); } catch (_) {}
  document.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", reposition);
  els = null;
}

export function startTour(opts) {
  onFinish = (opts && opts.onFinish) || null;
  build();
  show(0);
}
export function tourIsOpen() { return !!(els && !els.wrap.hidden); }
export function stopTour() { teardown(); }
