/* app.js — Materia Medica Builder UI.
 * Tabs: Dashboard · Materia Medica · Repertory · Cases · Marking · Author · Data
 */
import * as DB from "./db.js";
import * as B from "./builders.js";
import * as IMP from "./importers.js";
import { buildXLSX, buildPDF, buildHTML, buildSQLite, buildSQL, buildCSV, zip } from "./exporters.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const now = () => new Date().toISOString();

const S = { remedies: [], symptoms: [], sections: [], rubrics: [], cases: [], author: { ...DB.DEFAULT_AUTHOR }, marking: null, tab: "dashboard", remSel: null, secSel: null, remQuery: "" };

/* ---------------- small helpers ---------------- */
function toast(msg, bad) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false; t.className = "toast" + (bad ? " bad" : "");
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 3200);
}
function download(filename, data, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "materia-medica"; }
const stampName = () => new Date().toISOString().slice(0, 10);
function scheme() { return S.marking ? DB.activeScheme(S.marking) : { levels: [] }; }
function gradeOptions(sel) {
  const sc = scheme();
  return '<option value="">–</option>' + (sc.levels || []).map(l => `<option value="${l.v}"${String(sel) === String(l.v) ? " selected" : ""}>${esc(l.label)}</option>`).join("");
}
function remedyName(id) { const r = S.remedies.find(x => x.id === id); return r ? (r.name || r.abbrev) : ""; }
function remedyAbbrev(id) { const r = S.remedies.find(x => x.id === id); return r ? (r.abbrev || r.name) : ""; }

/* ---------------- load / render ---------------- */
async function reload() {
  [S.remedies, S.symptoms, S.sections, S.rubrics, S.cases] = await Promise.all([
    DB.db.all("remedies"), DB.db.all("symptoms"), DB.db.all("sections"), DB.db.all("rubrics"), DB.db.all("cases"),
  ]);
  S.remedies = S.remedies || []; S.symptoms = S.symptoms || []; S.sections = S.sections || []; S.rubrics = S.rubrics || []; S.cases = S.cases || [];
  S.sections.sort((a, b) => (a.order || 0) - (b.order || 0) || (a.id - b.id));
  S.author = await DB.getSetting("author", { ...DB.DEFAULT_AUTHOR });
  S.marking = await DB.getMarking();
  if (S.remSel == null && S.remedies.length) S.remSel = S.remedies[0].id;
  if (S.secSel == null && S.sections.length) S.secSel = S.sections[0].id;
}
function render() {
  renderHeader();
  $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === S.tab));
  $$(".panel").forEach(p => { p.hidden = p.id !== "tab-" + S.tab; });
  if (S.tab === "dashboard") renderDashboard();
  if (S.tab === "mm") renderMM();
  if (S.tab === "rep") renderRep();
  if (S.tab === "cases") renderCases();
  if (S.tab === "marking") renderMarking();
  if (S.tab === "author") renderAuthor();
  if (S.tab === "data") renderData();
}
function renderHeader() {
  $("#app-title").textContent = S.author.book_title || "Materia Medica Builder";
  $("#app-sub").textContent = S.author.name ? (S.author.name + (S.author.credentials ? ", " + S.author.credentials : "")) : "Your own materia medica & repertory — offline, private, exportable.";
  $("#author-chip").textContent = S.author.name || "Set author →";
  $("#foot-author").textContent = S.author.copyright || (S.author.name ? "© " + (S.author.year || new Date().getFullYear()) + " " + S.author.name : "");
}

/* ---------------- dashboard ---------------- */
function renderDashboard() {
  const cured = S.cases.filter(c => /cured|improved/i.test(c.outcome || "")).length;
  const stats = [
    ["Remedies", S.remedies.length], ["Symptoms", S.symptoms.length],
    ["Chapters", S.sections.length], ["Rubrics", S.rubrics.length],
    ["Cases", S.cases.length], ["Success", S.cases.length ? Math.round(cured / S.cases.length * 100) + "%" : "—"],
  ];
  $("#dash-stats").innerHTML = stats.map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("");
  const recent = S.cases.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5);
  $("#dash-cases").innerHTML = recent.length
    ? `<table><thead><tr><th>Initials</th><th>Remedy</th><th>Outcome</th><th>Date</th></tr></thead><tbody>`
      + recent.map(c => `<tr><td>${esc(c.patient_initials)}</td><td>${esc(remedyName(c.prescribed_remedy_id))}</td><td>${esc(c.outcome)}</td><td>${esc((c.date || "").slice(0, 10))}</td></tr>`).join("")
      + `</tbody></table>`
    : `<p class="muted">No cases yet.</p>`;
}

/* ---------------- materia medica ---------------- */
function renderMM() {
  const q = S.remQuery.toLowerCase();
  const list = S.remedies.filter(r => !q || (r.name + " " + (r.abbrev || "") + " " + (r.common_name || "")).toLowerCase().includes(q));
  $("#rem-list").innerHTML = list.length ? list.map(r => {
    const n = S.symptoms.filter(s => s.remedy_id === r.id).length;
    return `<button class="list-item${r.id === S.remSel ? " sel" : ""}" data-rem="${r.id}">
      <span class="li-title">${esc(r.name)}</span>
      <span class="li-sub">${esc(r.abbrev || "")}${r.abbrev ? " · " : ""}${n} symptom${n === 1 ? "" : "s"}</span></button>`;
  }).join("") : `<p class="muted">No remedies${q ? " match" : " yet — add one"}.</p>`;
  renderRemDetail();
}
function renderRemDetail() {
  const r = S.remedies.find(x => x.id === S.remSel);
  const d = $("#rem-detail");
  if (!r) { d.innerHTML = `<p class="muted">Select a remedy, or add a new one.</p>`; return; }
  const syms = S.symptoms.filter(s => s.remedy_id === r.id);
  d.innerHTML = `
    <div class="detail-head">
      <h2 contenteditable="false">${esc(r.name)}</h2>
      <button class="btn danger small" data-rem-del="${r.id}">Delete remedy</button>
    </div>
    <div class="form-grid tight">
      <label>Name<input data-store="remedies" data-id="${r.id}" data-field="name" value="${esc(r.name)}"></label>
      <label>Abbreviation<input data-store="remedies" data-id="${r.id}" data-field="abbrev" value="${esc(r.abbrev || "")}"></label>
      <label>Common name<input data-store="remedies" data-id="${r.id}" data-field="common_name" value="${esc(r.common_name || "")}"></label>
      <label>Kingdom<input data-store="remedies" data-id="${r.id}" data-field="kingdom" value="${esc(r.kingdom || "")}"></label>
      <label>Family<input data-store="remedies" data-id="${r.id}" data-field="family" value="${esc(r.family || "")}"></label>
      <label>Source<input data-store="remedies" data-id="${r.id}" data-field="source" value="${esc(r.source || "")}"></label>
      <label class="full">Notes<textarea data-store="remedies" data-id="${r.id}" data-field="notes" rows="2">${esc(r.notes || "")}</textarea></label>
    </div>
    <div class="sub-head"><h3>Symptoms <span class="muted small">(${syms.length})</span></h3>
      <button class="btn small" data-sym-add="${r.id}">+ Add symptom</button></div>
    <div class="sym-list">
      ${syms.length ? syms.map(s => `
        <div class="sym-row">
          <input class="w-chapter" data-store="symptoms" data-id="${s.id}" data-field="chapter" value="${esc(s.chapter || "General")}" placeholder="Chapter">
          <textarea class="w-text" data-store="symptoms" data-id="${s.id}" data-field="text" rows="2" placeholder="Symptom text">${esc(s.text || "")}</textarea>
          <select class="w-grade" data-store="symptoms" data-id="${s.id}" data-field="grade">${gradeOptions(s.grade)}</select>
          <input class="w-mod" data-store="symptoms" data-id="${s.id}" data-field="modalities" value="${esc((s.modalities || []).map(m => (m.dir && m.dir !== "ws" ? m.dir + " " : "") + m.text).join("; "))}" placeholder="worse night; better motion">
          <button class="btn danger small" data-sym-del="${s.id}">×</button>
        </div>`).join("") : `<p class="muted small">No symptoms recorded for this remedy.</p>`}
    </div>`;
}

/* ---------------- repertory ---------------- */
function renderRep() {
  const sel = $("#sec-select");
  sel.innerHTML = S.sections.length
    ? S.sections.map(s => `<option value="${s.id}"${s.id === S.secSel ? " selected" : ""}>${esc(s.title)}</option>`).join("")
    : `<option value="">— no chapters —</option>`;
  const sec = S.sections.find(x => x.id === S.secSel);
  const list = $("#rub-list");
  if (!sec) { list.innerHTML = `<p class="muted">No chapters yet. Add one to begin your repertory.</p>`; return; }
  const rubs = S.rubrics.filter(r => r.section_id === sec.id);
  list.innerHTML = rubs.length ? rubs.map(r => {
    const chips = (r.remedies || []).map((l, i) => `
      <span class="rx-chip">
        <span class="rx-name">${esc(remedyAbbrev(l.remedy_id))}</span>
        <select data-link-grade="${r.id}:${i}" class="rx-grade" title="Grade">${gradeOptions(l.grade)}</select>
        <button class="rx-x" data-link-del="${r.id}:${i}" title="Remove">×</button>
      </span>`).join("");
    return `<div class="rub-row" data-rubric="${r.id}">
      <div class="rub-fields">
        <input class="rub-text" data-store="rubrics" data-id="${r.id}" data-field="text" value="${esc(r.text)}" placeholder="Rubric text">
        <input class="rub-parent" data-store="rubrics" data-id="${r.id}" data-field="parent" value="${esc(r.parent || "")}" placeholder="Parent (optional)">
        <button class="btn danger small" data-rub-del="${r.id}">×</button>
      </div>
      <input class="rub-note" data-store="rubrics" data-id="${r.id}" data-field="note" value="${esc(r.note || "")}" placeholder="Note (optional)">
      <div class="rx-wrap">
        ${chips}
        <input class="rx-add" list="remedy-names" data-link-add="${r.id}" placeholder="+ remedy" autocomplete="off">
      </div>
    </div>`;
  }).join("") : `<p class="muted">No rubrics in this chapter yet.</p>`;
  ensureDatalist();
}
function ensureDatalist() {
  let dl = $("#remedy-names");
  if (!dl) { dl = document.createElement("datalist"); dl.id = "remedy-names"; document.body.appendChild(dl); }
  dl.innerHTML = S.remedies.map(r => `<option value="${esc(r.abbrev || r.name)}">${esc(r.name)}</option>`).join("");
}

/* ---------------- cases ---------------- */
function renderCases() {
  const sel = $("#case-remedy");
  sel.innerHTML = `<option value="">—</option>` + S.remedies.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
  const filter = $("#case-filter").value;
  const rows = S.cases.filter(c => !filter || c.outcome === filter).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  $("#case-list").innerHTML = rows.length
    ? `<table><thead><tr><th>Initials</th><th>Age</th><th>Remedy</th><th>Potency</th><th>Outcome</th><th>Date</th><th></th></tr></thead><tbody>`
      + rows.map(c => `<tr><td>${esc(c.patient_initials)}</td><td>${esc(c.age)}</td><td>${esc(remedyName(c.prescribed_remedy_id))}</td><td>${esc(c.potency)}</td><td>${esc(c.outcome)}</td><td>${esc((c.date || "").slice(0, 10))}</td>
        <td class="row-actions"><button class="btn small" data-case-edit="${c.id}">Edit</button><button class="btn danger small" data-case-del="${c.id}">×</button></td></tr>`).join("")
      + `</tbody></table>`
    : `<p class="muted">No cases${filter ? " with that outcome" : " yet"}.</p>`;
}

/* ---------------- marking ---------------- */
function renderMarking() {
  const root = $("#marking-root");
  const m = S.marking;
  root.innerHTML = m.schemes.map(sc => `
    <div class="scheme${sc.id === m.active ? " active" : ""}" data-scheme="${sc.id}">
      <div class="scheme-head">
        <label class="check"><input type="radio" name="active-scheme" ${sc.id === m.active ? "checked" : ""} data-scheme-active="${sc.id}"> Active</label>
        <input class="scheme-name" data-store="scheme" data-id="${sc.id}" data-field="name" value="${esc(sc.name)}">
        <button class="btn danger small" data-scheme-del="${sc.id}">Delete</button>
      </div>
      <p class="muted small">${esc(sc.description || "")}</p>
      <table class="mark-table"><thead><tr><th>Value</th><th>Label</th><th>Style</th><th></th></tr></thead><tbody>
        ${sc.levels.map((l, i) => `<tr>
          <td><input type="number" class="w-v" data-store="level" data-id="${sc.id}:${i}" data-field="v" value="${l.v}"></td>
          <td><input class="w-l" data-store="level" data-id="${sc.id}:${i}" data-field="label" value="${esc(l.label)}"></td>
          <td><select data-store="level" data-id="${sc.id}:${i}" data-field="style">${DB.STYLES.map(st => `<option value="${st}"${st === l.style ? " selected" : ""}>${st}</option>`).join("")}</select></td>
          <td><button class="btn danger small" data-level-del="${sc.id}:${i}">×</button></td>
        </tr>`).join("")}
      </tbody></table>
      <button class="btn small" data-level-add="${sc.id}">+ Add level</button>
      <div class="preview">Preview: ${sc.levels.map(l => `<span class="${styleClass(l.style)}">${esc(l.label)}</span>`).join(" &nbsp; ")}</div>
    </div>`).join("");
}
function styleClass(style) { return { italic: "st-i", bold: "st-b", caps: "st-c", "bold-italic": "st-bi", superscript: "st-sup" }[style] || ""; }

/* ---------------- author ---------------- */
function renderAuthor() {
  const a = S.author;
  ["book_title", "edition", "year", "name", "credentials", "clinic", "email", "website", "copyright", "license"].forEach(k => {
    const el = $("#a-" + k); if (el) el.value = a[k] == null ? "" : a[k];
  });
}

/* ---------------- data ---------------- */
function renderData() {
  const fmt = $("#exp-format").value;
  $("#csv-one-wrap").hidden = fmt !== "csv-one";
  $("#scope-wrap").hidden = !["pdf", "html"].includes(fmt);
  const notes = {
    "json-native": "A complete backup — re-import it here to restore everything.",
    "json-omm-rep": "Matches the OMM reader schema (sections → rubrics → remedy_table).",
    "json-omm-mm": "Matches the OMM reader schema (remedies → symptoms).",
    "json-omm-both": "A zip with both OMM files.",
    "csv-bundle": "A zip with remedies.csv, symptoms.csv, repertory.csv and cases.csv.",
    "csv-one": "One dataset as a single CSV file.",
    "xlsx": "An Excel workbook: Info, Remedies, Symptoms, Repertory, Cases, Marking.",
    "pdf": "A printable document with your author details and copyright.",
    "html": "A self-contained, styled HTML document you can open or host.",
    "sql": "Portable INSERT statements — load into SQLite, Postgres or MySQL.",
    "sqlite": "A real SQLite database file with remedy, symptom, rubric and case tables.",
  };
  $("#exp-note").textContent = notes[fmt] || "";
}

/* ================= events ================= */
function bind() {
  $$(".tab").forEach(b => b.addEventListener("click", () => { S.tab = b.dataset.tab; render(); }));

  /* theme */
  $("#theme-btn").addEventListener("click", () => {
    const order = ["auto", "light", "dark"];
    const cur = document.documentElement.getAttribute("data-theme") || "auto";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (_) {}
  });

  /* generic inline save */
  document.addEventListener("change", onFieldChange);
  document.addEventListener("input", onFieldInput);

  /* materia medica */
  $("#rem-search").addEventListener("input", e => { S.remQuery = e.target.value; renderMM(); });
  $("#rem-new").addEventListener("click", async () => {
    const id = await DB.db.put("remedies", { name: "New remedy", abbrev: "", common_name: "", kingdom: "", family: "", source: "", notes: "", created_at: now(), updated_at: now() });
    S.remSel = id; await reload(); S.tab = "mm"; render();
    const inp = $('.detail-head ~ .form-grid input[data-field="name"]'); if (inp) inp.focus();
  });
  $("#rem-list").addEventListener("click", e => { const b = e.target.closest("[data-rem]"); if (b) { S.remSel = Number(b.dataset.rem); renderMM(); } });
  $("#rem-detail").addEventListener("click", async e => {
    const del = e.target.closest("[data-rem-del]");
    if (del) { if (!confirm("Delete this remedy and its symptoms?")) return; const id = Number(del.dataset.remDel);
      for (const s of S.symptoms.filter(s => s.remedy_id === id)) await DB.db.del("symptoms", s.id);
      for (const r of S.rubrics) { const links = (r.remedies || []).filter(l => l.remedy_id !== id); if (links.length !== (r.remedies || []).length) { r.remedies = links; await DB.db.put("rubrics", r); } }
      await DB.db.del("remedies", id); S.remSel = null; await reload(); renderMM(); return; }
    const add = e.target.closest("[data-sym-add]");
    if (add) { await DB.db.put("symptoms", { remedy_id: Number(add.dataset.symAdd), chapter: "General", text: "", grade: null, modalities: [], notes: "", created_at: now() }); await reload(); renderMM(); return; }
    const sd = e.target.closest("[data-sym-del]");
    if (sd) { await DB.db.del("symptoms", Number(sd.dataset.symDel)); await reload(); renderMM(); }
  });

  /* repertory */
  $("#sec-select").addEventListener("change", e => { S.secSel = Number(e.target.value); renderRep(); });
  $("#sec-new").addEventListener("click", async () => {
    const title = prompt("Chapter title (e.g. Mind, Head, Stomach):"); if (!title) return;
    const id = await DB.db.put("sections", { title, order: S.sections.length + 1, created_at: now() });
    S.secSel = id; await reload(); renderRep();
  });
  $("#sec-rename").addEventListener("click", async () => {
    const sec = S.sections.find(x => x.id === S.secSel); if (!sec) return;
    const title = prompt("Rename chapter:", sec.title); if (!title) return;
    sec.title = title; await DB.db.put("sections", sec); await reload(); renderRep();
  });
  $("#sec-del").addEventListener("click", async () => {
    const sec = S.sections.find(x => x.id === S.secSel); if (!sec) return;
    if (!confirm(`Delete chapter “${sec.title}” and its rubrics?`)) return;
    for (const r of S.rubrics.filter(r => r.section_id === sec.id)) await DB.db.del("rubrics", r.id);
    await DB.db.del("sections", sec.id); S.secSel = null; await reload(); renderRep();
  });
  $("#rub-new").addEventListener("click", async () => {
    if (!S.secSel) { toast("Add a chapter first.", true); return; }
    await DB.db.put("rubrics", { section_id: S.secSel, text: "", parent: null, note: "", remedies: [], created_at: now() });
    await reload(); renderRep();
    const inputs = $$("#rub-list .rub-text"); const last = inputs[inputs.length - 1]; if (last) last.focus();
  });
  $("#rub-list").addEventListener("click", async e => {
    const rd = e.target.closest("[data-rub-del]"); if (rd) { await DB.db.del("rubrics", Number(rd.dataset.rubDel)); await reload(); renderRep(); return; }
    const ld = e.target.closest("[data-link-del]"); if (ld) {
      const [rid, i] = ld.dataset.linkDel.split(":").map(Number); const r = S.rubrics.find(x => x.id === rid); if (!r) return;
      r.remedies.splice(i, 1); await DB.db.put("rubrics", r); await reload(); renderRep(); return;
    }
  });
  $("#rub-list").addEventListener("change", async e => {
    const g = e.target.closest("[data-link-grade]"); if (g) {
      const [rid, i] = g.dataset.linkGrade.split(":").map(Number); const r = S.rubrics.find(x => x.id === rid); if (!r) return;
      r.remedies[i].grade = g.value === "" ? null : Number(g.value); await DB.db.put("rubrics", r); return;
    }
    const a = e.target.closest("[data-link-add]"); if (a && a.value.trim()) {
      const rid = Number(a.dataset.linkAdd); const r = S.rubrics.find(x => x.id === rid); if (!r) return;
      const token = a.value.trim().toLowerCase();
      const rem = S.remedies.find(x => (x.abbrev || "").toLowerCase() === token || x.name.toLowerCase() === token);
      if (!rem) { toast("No remedy matches “" + a.value + "”. Add it in Materia Medica first.", true); a.value = ""; return; }
      if ((r.remedies || []).some(l => l.remedy_id === rem.id)) { a.value = ""; return; }
      r.remedies = r.remedies || []; r.remedies.push({ remedy_id: rem.id, grade: null, polarity: "+", note: "" });
      await DB.db.put("rubrics", r); await reload(); renderRep();
    }
  });

  /* cases */
  $("#case-form").addEventListener("submit", onCaseSubmit);
  $("#case-reset").addEventListener("click", () => { $("#case-form").reset(); $("#case-id").value = ""; $("#case-form-title").textContent = "Log a case"; });
  $("#case-filter").addEventListener("change", renderCases);
  $("#case-list").addEventListener("click", async e => {
    const ed = e.target.closest("[data-case-edit]"); if (ed) {
      const c = S.cases.find(x => x.id === Number(ed.dataset.caseEdit)); if (!c) return;
      $("#case-id").value = c.id; $("#case-initials").value = c.patient_initials || ""; $("#case-age").value = c.age || "";
      $("#case-gender").value = c.gender || ""; $("#case-remedy").value = c.prescribed_remedy_id || "";
      $("#case-potency").value = c.potency || ""; $("#case-dosage").value = c.dosage || ""; $("#case-outcome").value = c.outcome || "";
      $("#case-date").value = (c.date || "").slice(0, 10); $("#case-complaint").value = c.chief_complaint || ""; $("#case-notes").value = c.follow_up_notes || "";
      $("#case-form-title").textContent = "Edit case"; $("#case-form").scrollIntoView({ behavior: "smooth", block: "start" }); return;
    }
    const dd = e.target.closest("[data-case-del]"); if (dd) { if (!confirm("Delete this case?")) return; await DB.db.del("cases", Number(dd.dataset.caseDel)); await reload(); renderCases(); }
  });

  /* marking */
  $("#scheme-new").addEventListener("click", async () => {
    const name = prompt("Name your marking scheme:"); if (!name) return;
    const id = "u" + Date.now();
    S.marking.schemes.push({ id, name, description: "Custom scheme.", levels: [{ v: 1, label: "1", style: "plain" }, { v: 2, label: "2", style: "italic" }, { v: 3, label: "3", style: "bold" }] });
    await DB.setMarking(S.marking); renderMarking();
  });
  $("#marking-root").addEventListener("change", async e => {
    const act = e.target.closest("[data-scheme-active]"); if (act) { S.marking.active = act.dataset.schemeActive; await DB.setMarking(S.marking); renderMarking(); return; }
    if (e.target.dataset.store === "scheme") { const sc = S.marking.schemes.find(s => s.id === e.target.dataset.id); sc.name = e.target.value; await DB.setMarking(S.marking); return; }
    if (e.target.dataset.store === "level") {
      const [sid, i] = e.target.dataset.id.split(":"); const sc = S.marking.schemes.find(s => s.id === sid); const lv = sc.levels[Number(i)];
      const f = e.target.dataset.field; lv[f] = f === "v" ? Number(e.target.value) : e.target.value; await DB.setMarking(S.marking); renderMarking(); return;
    }
  });
  $("#marking-root").addEventListener("click", async e => {
    const sd = e.target.closest("[data-scheme-del]"); if (sd) {
      if (S.marking.schemes.length <= 1) { toast("Keep at least one scheme.", true); return; }
      if (!confirm("Delete this scheme?")) return;
      const id = sd.dataset.schemeDel; S.marking.schemes = S.marking.schemes.filter(s => s.id !== id);
      if (S.marking.active === id) S.marking.active = S.marking.schemes[0].id;
      await DB.setMarking(S.marking); renderMarking(); return;
    }
    const la = e.target.closest("[data-level-add]"); if (la) { const sc = S.marking.schemes.find(s => s.id === la.dataset.levelAdd); const maxv = Math.max(0, ...sc.levels.map(l => Number(l.v))); sc.levels.push({ v: maxv + 1, label: String(maxv + 1), style: "plain" }); await DB.setMarking(S.marking); renderMarking(); return; }
    const ld = e.target.closest("[data-level-del]"); if (ld) { const [sid, i] = ld.dataset.levelDel.split(":"); const sc = S.marking.schemes.find(s => s.id === sid); if (sc.levels.length <= 1) { toast("A scheme needs at least one level.", true); return; } sc.levels.splice(Number(i), 1); await DB.setMarking(S.marking); renderMarking(); return; }
  });

  /* author */
  $("#author-form").addEventListener("submit", async e => {
    e.preventDefault();
    const a = {};
    ["book_title", "edition", "year", "name", "credentials", "clinic", "email", "website", "copyright", "license"].forEach(k => { a[k] = $("#a-" + k).value; });
    S.author = a; await DB.setSetting("author", a); renderHeader(); toast("Author details saved.");
  });

  /* data */
  $("#exp-format").addEventListener("change", renderData);
  $("#export-btn").addEventListener("click", doExport);
  $("#import-btn").addEventListener("click", doImport);
  $("#clear-btn").addEventListener("click", async () => {
    if (!confirm("Erase ALL data from this browser? This cannot be undone.")) return;
    if (!confirm("Really erase everything? Export a backup first if unsure.")) return;
    await DB.db.clearAll(); S.remSel = S.secSel = null; await reload(); render(); toast("All data erased.");
  });
}

async function onFieldChange(e) {
  const t = e.target;
  if (!t.dataset || !t.dataset.store) return;
  const store = t.dataset.store;
  if (store === "scheme" || store === "level") return; // handled by marking listener
  if (store === "rubrics" || store === "remedies" || store === "symptoms") {
    const id = Number(t.dataset.id); const field = t.dataset.field;
    const row = (store === "rubrics" ? S.rubrics : store === "remedies" ? S.remedies : S.symptoms).find(x => x.id === id);
    if (!row) return;
    if (field === "grade") row.grade = t.value === "" ? null : Number(t.value);
    else if (field === "modalities") row.modalities = t.value.split(";").map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(worse|better|ws)\s+(.*)$/i); return m ? { dir: m[1].toLowerCase(), text: m[2] } : { dir: "ws", text: x }; });
    else row[field] = t.value;
    row.updated_at = now();
    await DB.db.put(store, row);
    if (store === "remedies" && field === "name") renderMM();
  }
}
function onFieldInput(e) {
  const t = e.target;
  if (t.dataset && t.dataset.store === "remedies" && t.dataset.field === "name") {
    const li = $(".list-item.sel .li-title"); if (li) li.textContent = t.value;
  }
}

async function onCaseSubmit(e) {
  e.preventDefault();
  const id = $("#case-id").value;
  const rec = {
    patient_initials: $("#case-initials").value, age: $("#case-age").value === "" ? "" : Number($("#case-age").value),
    gender: $("#case-gender").value, chief_complaint: $("#case-complaint").value,
    prescribed_remedy_id: $("#case-remedy").value === "" ? null : Number($("#case-remedy").value),
    potency: $("#case-potency").value, dosage: $("#case-dosage").value, outcome: $("#case-outcome").value,
    follow_up_notes: $("#case-notes").value, date: $("#case-date").value || stampName(),
  };
  if (id) rec.id = Number(id);
  await DB.db.put("cases", rec);
  $("#case-form").reset(); $("#case-id").value = ""; $("#case-form-title").textContent = "Log a case";
  await reload(); renderCases(); toast("Case saved.");
}

/* ---------------- export ---------------- */
async function doExport() {
  const data = await B.assemble(DB.db);
  data.author = S.author; data.marking = S.marking;
  const base = slug(S.author.book_title || "materia-medica") + "-" + stampName();
  const fmt = $("#exp-format").value;
  const scope = { remedies: $("#scope-mm").checked, repertory: $("#scope-rep").checked };
  try {
    if (fmt === "json-native") download(base + ".json", B.buildNativeJSON(data), "application/json");
    else if (fmt === "json-omm-rep") download(base + "-repertory.json", B.buildOMMRepertory(data), "application/json");
    else if (fmt === "json-omm-mm") download(base + "-materia-medica.json", B.buildOMMMateriaMedica(data), "application/json");
    else if (fmt === "json-omm-both") download(base + "-omm.zip", zip([
      { name: base + "-repertory.json", data: B.buildOMMRepertory(data) },
      { name: base + "-materia-medica.json", data: B.buildOMMMateriaMedica(data) },
    ]), "application/zip");
    else if (fmt === "csv-bundle") {
      const sets = B.buildCsvSets(data);
      download(base + "-csv.zip", zip(Object.entries(sets).map(([k, rows]) => ({ name: k + ".csv", data: buildCSV(rows[0], rows.slice(1)) }))), "application/zip");
    }
    else if (fmt === "csv-one") { const set = $("#exp-csv-set").value || "remedies"; const sets = B.buildCsvSets(data); const rows = sets[set]; download(base + "-" + set + ".csv", buildCSV(rows[0], rows.slice(1)), "text/csv"); }
    else if (fmt === "xlsx") download(base + ".xlsx", buildXLSX(B.buildXlsxSheets(data)), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    else if (fmt === "pdf") download(base + ".pdf", buildPDF(B.buildPdfDoc(data, scope)), "application/pdf");
    else if (fmt === "html") download(base + ".html", buildHTML(B.buildHtmlDoc(data, scope)), "text/html");
    else if (fmt === "sql") download(base + ".sql", buildSQL({ generated: new Date().toISOString(), author: S.author, tables: B.buildSqlTables(data) }, "sqlite"), "application/sql");
    else if (fmt === "sqlite") download(base + ".sqlite", buildSQLite(B.buildSqlTables(data)), "application/vnd.sqlite3");
    toast("Exported.");
  } catch (err) { console.error(err); toast("Export failed: " + err.message, true); }
}

/* ---------------- import ---------------- */
async function doImport() {
  const f = $("#imp-file").files[0];
  if (!f) { toast("Choose a file first.", true); return; }
  const type = $("#imp-type").value;
  const mode = $("#imp-mode").value;
  const text = await f.text();
  let bundle;
  try {
    if (type === "json") { bundle = IMP.bundleFromJSON(JSON.parse(text)); }
    else { bundle = IMP.bundleFromCSV(type.replace("csv-", ""), text); }
  } catch (err) { toast("Could not read file: " + err.message, true); return; }
  const n = (bundle.remedies || []).length + (bundle.symptoms || []).length + (bundle.sections || []).reduce((a, s) => a + s.rubrics.length, 0) + (bundle.cases || []).length;
  if (!confirm(`Import ${n} record(s) from ${f.name}${mode === "replace" ? ", replacing ALL current data" : ""}?`)) return;
  try { await applyBundle(bundle, mode); await reload(); render(); toast("Imported."); }
  catch (err) { console.error(err); toast("Import failed: " + err.message, true); }
}

async function applyBundle(b, mode) {
  if (mode === "replace") await DB.db.clearAll();
  if (b.author) { const cur = await DB.getSetting("author", { ...DB.DEFAULT_AUTHOR }); await DB.setSetting("author", { ...cur, ...b.author }); }
  if (b.marking) await DB.setSetting("marking", b.marking);

  const existing = await DB.db.all("remedies");
  const byName = {}; existing.forEach(r => { byName[r.name.toLowerCase()] = r; });
  async function ensureRemedy(name, extra) {
    if (!name) return null; const key = String(name).toLowerCase();
    if (byName[key]) return byName[key].id;
    const rec = { name, abbrev: (extra && extra.abbrev) || "", common_name: (extra && extra.common_name) || "", kingdom: (extra && extra.kingdom) || "", family: (extra && extra.family) || "", source: (extra && extra.source) || "", notes: (extra && extra.notes) || "", created_at: now(), updated_at: now() };
    const id = await DB.db.put("remedies", rec); byName[key] = { id, name }; return id;
  }
  for (const r of (b.remedies || [])) await ensureRemedy(r.name, r);
  for (const s of (b.symptoms || [])) {
    const rid = await ensureRemedy(s.remedy);
    await DB.db.put("symptoms", { remedy_id: rid, chapter: s.chapter || "General", text: s.text || "", grade: s.grade == null ? null : s.grade, modalities: s.modalities || [], notes: s.notes || "", created_at: now() });
  }
  let ord = 0;
  for (const sec of (b.sections || [])) {
    ord++;
    const sid = await DB.db.put("sections", { title: sec.title || ("Chapter " + ord), order: sec.order || ord, created_at: now() });
    for (const r of (sec.rubrics || [])) {
      const links = [];
      for (const l of (r.remedies || [])) { const rid = await ensureRemedy(l.remedy); if (rid) links.push({ remedy_id: rid, grade: l.grade == null ? null : l.grade, polarity: l.polarity || "+", note: l.note || "" }); }
      await DB.db.put("rubrics", { section_id: sid, text: r.text || "", parent: r.parent || null, note: r.note || "", remedies: links, created_at: now() });
    }
  }
  for (const c of (b.cases || [])) {
    const rec = { ...c };
    if (c.prescribed_remedy_name) rec.prescribed_remedy_id = await ensureRemedy(c.prescribed_remedy_name);
    delete rec.prescribed_remedy_name;
    if (rec.id == null) delete rec.id;
    await DB.db.put("cases", rec);
  }
}

/* ---------------- boot ---------------- */
async function boot() {
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (_) {}
  await DB.openDB();
  try { const fixed = await DB.migrateLegacy(); if (fixed) console.info("Migrated", fixed, "legacy records."); } catch (e) { console.warn(e); }
  try { await DB.seedIfEmpty(); } catch (e) { console.warn(e); }
  await reload();
  bind();
  S.tab = "dashboard";
  render();
  $("#case-date").value = stampName();
}
boot();
