/* builders.js — turn stored data into export documents.
 * Everything here is pure: it takes a plain data object and returns a string,
 * a list of tables, or an object the exporters.js writers consume.
 */
import { activeScheme, levelLabel } from "./db.js";

/* gather a plain snapshot of everything, with convenient lookup maps */
export async function assemble(db) {
  const [remedies, symptoms, cases, sections, rubrics, settingsRows] = await Promise.all([
    db.all("remedies"), db.all("symptoms"), db.all("cases"), db.all("sections"), db.all("rubrics"), db.all("settings"),
  ]);
  const S = {};
  for (const r of settingsRows) S[r.key] = r.value;
  const byId = {};
  remedies.forEach(r => { byId[r.id] = r; });
  const secById = {};
  sections.forEach(s => { secById[s.id] = s; });
  return {
    author: S.author || {},
    marking: S.marking || null,
    remedies, symptoms, cases, sections, rubrics,
    byId, secById,
    remedyName: (id) => { const r = byId[id]; return r ? (r.name || r.abbrev || ("#" + id)) : ("#" + id); },
  };
}

const stamp = () => new Date().toISOString().slice(0, 10);
function remedyTok(r) { return (r && (r.abbrev || r.name)) || ""; }

/* ---------------- native JSON ---------------- */
export function buildNativeJSON(data) {
  const a = data.author || {};
  return JSON.stringify({
    app: "Materia Medica Builder",
    schema: "mmb/native/1",
    exported_at: new Date().toISOString(),
    author: {
      name: a.name || "", credentials: a.credentials || "", clinic: a.clinic || "",
      email: a.email || "", website: a.website || "", book_title: a.book_title || "",
      edition: a.edition || "", year: a.year || "", copyright: a.copyright || "", license: a.license || "",
    },
    marking: data.marking || null,
    remedies: data.remedies, symptoms: data.symptoms,
    repertory: {
      sections: data.sections.map(s => ({
        id: s.id, title: s.title, order: s.order || 0,
        rubrics: data.rubrics.filter(r => r.section_id === s.id).map(r => ({
          id: r.id, text: r.text, parent: r.parent || null, note: r.note || "",
          remedies: (r.remedies || []).map(l => ({ remedy_id: l.remedy_id, grade: l.grade, polarity: l.polarity || "+", note: l.note || "" })),
        })),
      })),
    },
    cases: data.cases,
  }, null, 2);
}

/* ---------------- OMM-compatible JSON (reader-app schema v1.1) ---------------- */
function ommBook(a, type, counts) {
  return {
    id: (a.book_title ? slug(a.book_title) : (type === "repertory" ? "personal-repertory" : "personal-materia-medica")),
    title: a.book_title || (type === "repertory" ? "Personal Repertory" : "Personal Materia Medica"),
    author: a.name || null, year: a.year || null, publisher: a.clinic || null,
    language: "en", public_domain: false, source_file: null,
    extraction_date: stamp(), pipeline_version: "mmb 1.0", counts: counts || {},
  };
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

export function buildOMMRepertory(data) {
  const table = []; const index = {};
  const code = (remId) => {
    const r = data.byId[remId]; const tok = remedyTok(r) || ("#" + remId);
    if (index[tok] === undefined) { index[tok] = table.length; table.push({ abbrev: tok, name: (r && r.name) || null }); }
    return index[tok];
  };
  const sections = data.sections.slice().sort((x, y) => (x.order || 0) - (y.order || 0)).map(s => ({
    id: slug(s.title || "section") + "-" + s.id,
    title: s.title,
    rubrics: data.rubrics.filter(r => r.section_id === s.id).map(r => {
      const out = { text: r.text };
      if (r.parent) out.parent = r.parent;
      if (r.note) out.note = r.note;
      out.remedies = (r.remedies || []).map(l => {
        const c = code(l.remedy_id);
        const grade = (l.grade == null || l.grade === "") ? null : Number(l.grade);
        const pol = l.polarity || "+";
        if (grade == null && pol === "+" && !l.note) return c;
        return l.note ? [c, grade, pol, l.note] : [c, grade, pol];
      });
      return out;
    }),
  }));
  return JSON.stringify({
    schema_version: "1.1", type: "repertory",
    book: ommBook(data.author || {}, "repertory", { sections: sections.length, rubrics: sections.reduce((n, s) => n + s.rubrics.length, 0), remedies: table.length }),
    sections, remedy_table: table,
  }, null, 2);
}

export function buildOMMMateriaMedica(data) {
  const remedies = data.remedies.map(r => {
    const symptoms = data.symptoms.filter(s => s.remedy_id === r.id).map(s => {
      const o = { chapter: s.chapter || "General", text: s.text, grade: (s.grade == null || s.grade === "") ? null : Number(s.grade) };
      const mods = (s.modalities || []).filter(m => m && m.text);
      o.modalities = mods.map(m => ({ dir: m.dir || "ws", text: m.text }));
      return o;
    });
    return {
      name: r.name, abbrev: r.abbrev || null, common_name: r.common_name || null,
      kingdom: r.kingdom || null, family: r.family || null,
      clinical_indications: [], sections: { relationships: [], dosages: [], antidotes: [] },
      symptoms,
    };
  }).filter(r => r.name);
  return JSON.stringify({
    schema_version: "1.1", type: "materia_medica",
    book: ommBook(data.author || {}, "materia_medica", { remedies: remedies.length, symptoms: remedies.reduce((n, r) => n + r.symptoms.length, 0) }),
    remedies,
  }, null, 2);
}

/* ---------------- spreadsheet sheets ---------------- */
export function buildXlsxSheets(data) {
  const a = data.author || {};
  const scheme = data.marking ? activeScheme(data.marking) : { levels: [] };
  const gl = (v) => (v == null || v === "" ? "" : levelLabel(scheme, v));
  const info = [
    ["Field", "Value"],
    ["Book title", a.book_title || ""], ["Edition", a.edition || ""], ["Year", a.year || ""],
    ["Author", a.name || ""], ["Credentials", a.credentials || ""], ["Clinic", a.clinic || ""],
    ["Email", a.email || ""], ["Website", a.website || ""],
    ["Copyright", a.copyright || ""], ["License", a.license || ""],
    ["Exported", new Date().toISOString()],
  ];
  const remedyRows = [["id", "Name", "Abbrev", "Common name", "Kingdom", "Family", "Source", "Notes"]];
  for (const r of data.remedies) remedyRows.push([r.id, r.name, r.abbrev || "", r.common_name || "", r.kingdom || "", r.family || "", r.source || "", r.notes || ""]);

  const symptomRows = [["id", "Remedy", "Chapter", "Symptom", "Grade", "Modalities", "Notes"]];
  for (const s of data.symptoms) symptomRows.push([s.id, data.remedyName(s.remedy_id), s.chapter || "General", s.text, gl(s.grade), (s.modalities || []).map(m => (m.dir && m.dir !== "ws" ? m.dir + " " : "") + m.text).join("; "), s.notes || ""]);

  const repRows = [["Section", "Rubric", "Parent", "Note", "Remedies (graded)"]];
  for (const sec of data.sections) {
    for (const r of data.rubrics.filter(x => x.section_id === sec.id)) {
      const rx = (r.remedies || []).map(l => remedyTok(data.byId[l.remedy_id]) + (l.grade != null && l.grade !== "" ? " " + gl(l.grade) : "") + (l.polarity === "-" ? " (antidotal)" : "")).join(", ");
      repRows.push([sec.title, r.text, r.parent || "", r.note || "", rx]);
    }
  }
  const caseRows = [["id", "Initials", "Age", "Gender", "Complaint", "Remedy", "Potency", "Dosage", "Outcome", "Follow-up", "Date"]];
  for (const c of data.cases) caseRows.push([c.id, c.patient_initials || "", c.age || "", c.gender || "", c.chief_complaint || "", data.remedyName(c.prescribed_remedy_id), c.potency || "", c.dosage || "", c.outcome || "", c.follow_up_notes || "", (c.date || "").slice(0, 10)]);

  const markRows = [["Scheme", "Active", "Level value", "Label", "Style"]];
  if (data.marking) for (const s of data.marking.schemes) for (const l of s.levels) markRows.push([s.name, s.id === data.marking.active ? "yes" : "", l.v, l.label, l.style]);

  return [
    { name: "Info", rows: info }, { name: "Remedies", rows: remedyRows }, { name: "Symptoms", rows: symptomRows },
    { name: "Repertory", rows: repRows }, { name: "Cases", rows: caseRows }, { name: "Marking", rows: markRows },
  ];
}

/* ---------------- CSV set ---------------- */
export function buildCsvSets(data) {
  const scheme = data.marking ? activeScheme(data.marking) : { levels: [] };
  const gl = (v) => (v == null || v === "" ? "" : levelLabel(scheme, v));
  const sets = {};
  sets["remedies"] = [["id", "name", "abbrev", "common_name", "kingdom", "family", "source", "notes"]]
    .concat(data.remedies.map(r => [r.id, r.name, r.abbrev || "", r.common_name || "", r.kingdom || "", r.family || "", r.source || "", r.notes || ""]));
  sets["symptoms"] = [["id", "remedy", "chapter", "text", "grade", "modalities", "notes"]]
    .concat(data.symptoms.map(s => [s.id, data.remedyName(s.remedy_id), s.chapter || "General", s.text, gl(s.grade), (s.modalities || []).map(m => (m.dir && m.dir !== "ws" ? m.dir + " " : "") + m.text).join("; "), s.notes || ""]));
  sets["repertory"] = [["section", "rubric", "parent", "note", "remedies"]]
    .concat(data.sections.flatMap(sec => data.rubrics.filter(r => r.section_id === sec.id).map(r => [
      sec.title, r.text, r.parent || "", r.note || "",
      (r.remedies || []).map(l => remedyTok(data.byId[l.remedy_id]) + (l.grade != null && l.grade !== "" ? " " + gl(l.grade) : "")).join(", ")])));
  sets["cases"] = [["id", "initials", "age", "gender", "complaint", "remedy", "potency", "dosage", "outcome", "follow_up", "date"]]
    .concat(data.cases.map(c => [c.id, c.patient_initials || "", c.age || "", c.gender || "", c.chief_complaint || "", data.remedyName(c.prescribed_remedy_id), c.potency || "", c.dosage || "", c.outcome || "", c.follow_up_notes || "", (c.date || "").slice(0, 10)]));
  return sets;
}

/* ---------------- SQLite / SQL tables ---------------- */
export function buildSqlTables(data) {
  const scheme = data.marking ? activeScheme(data.marking) : { levels: [] };
  const gl = (v) => (v == null || v === "" ? "" : levelLabel(scheme, v));
  const remedyRows = data.remedies.map(r => [r.id, r.name, r.abbrev || "", r.common_name || "", r.kingdom || "", r.family || "", r.source || "", r.notes || ""]);
  const symptomRows = data.symptoms.map(s => [s.id, s.remedy_id, data.remedyName(s.remedy_id), s.chapter || "General", s.text, gl(s.grade), (s.modalities || []).map(m => (m.dir && m.dir !== "ws" ? m.dir + " " : "") + m.text).join("; "), s.notes || ""]);
  const rubricRows = [];
  let rid = 1;
  for (const sec of data.sections) for (const r of data.rubrics.filter(x => x.section_id === sec.id)) {
    rubricRows.push([rid++, r.id, sec.title, r.text, r.parent || "", r.note || ""]);
  }
  const linkRows = [];
  for (const sec of data.sections) for (const r of data.rubrics.filter(x => x.section_id === sec.id)) {
    for (const l of (r.remedies || [])) linkRows.push([r.id, remedyTok(data.byId[l.remedy_id]), l.grade == null ? null : Number(l.grade), l.polarity || "+", l.note || ""]);
  }
  const caseRows = data.cases.map(c => [c.id, c.patient_initials || "", c.age || null, c.gender || "", c.chief_complaint || "", c.prescribed_remedy_id || null, data.remedyName(c.prescribed_remedy_id), c.potency || "", c.dosage || "", c.outcome || "", c.follow_up_notes || "", (c.date || "")]);
  const metaRows = [["author_name", (data.author || {}).name || ""], ["book_title", (data.author || {}).book_title || ""], ["exported_at", new Date().toISOString()]];

  return [
    { name: "meta", columns: ["k", "v"], createSql: "CREATE TABLE meta (k TEXT, v TEXT)", rows: metaRows },
    { name: "remedy", columns: ["id", "name", "abbrev", "common_name", "kingdom", "family", "source", "notes"],
      createSql: "CREATE TABLE remedy (id INTEGER PRIMARY KEY, name TEXT, abbrev TEXT, common_name TEXT, kingdom TEXT, family TEXT, source TEXT, notes TEXT)", rows: remedyRows },
    { name: "symptom", columns: ["id", "remedy_id", "remedy", "chapter", "text", "grade", "modalities", "notes"],
      createSql: "CREATE TABLE symptom (id INTEGER PRIMARY KEY, remedy_id INTEGER, remedy TEXT, chapter TEXT, text TEXT, grade TEXT, modalities TEXT, notes TEXT)", rows: symptomRows },
    { name: "rubric", columns: ["id", "rubric_id", "section", "text", "parent", "note"],
      createSql: "CREATE TABLE rubric (id INTEGER PRIMARY KEY, rubric_id INTEGER, section TEXT, text TEXT, parent TEXT, note TEXT)", rows: rubricRows },
    { name: "remedy_link", columns: ["rubric_id", "abbrev", "grade", "polarity", "note"],
      createSql: "CREATE TABLE remedy_link (rubric_id INTEGER, abbrev TEXT, grade INTEGER, polarity TEXT, note TEXT)", rows: linkRows },
    { name: "case_log", columns: ["id", "initials", "age", "gender", "complaint", "remedy_id", "remedy", "potency", "dosage", "outcome", "follow_up", "date"],
      createSql: "CREATE TABLE case_log (id INTEGER PRIMARY KEY, initials TEXT, age INTEGER, gender TEXT, complaint TEXT, remedy_id INTEGER, remedy TEXT, potency TEXT, dosage TEXT, outcome TEXT, follow_up TEXT, date TEXT)", rows: caseRows },
  ];
}

/* ---------------- PDF / HTML documents ---------------- */
export function buildPdfDoc(data, scope) {
  const a = data.author || {};
  const scheme = data.marking ? activeScheme(data.marking) : { levels: [] };
  const gl = (v) => (v == null || v === "" ? "" : levelLabel(scheme, v));
  const blocks = [];
  scope = scope || { remedies: true, repertory: true };
  if (scope.remedies) {
    for (const r of data.remedies) {
      blocks.push({ type: "heading", text: r.name + (r.abbrev ? "  (" + r.abbrev + ")" : "") });
      const meta = [r.common_name, r.kingdom, r.family, r.source].filter(Boolean).join("  ·  ");
      if (meta) blocks.push({ type: "para", text: meta });
      if (r.notes) blocks.push({ type: "para", text: r.notes });
      const syms = data.symptoms.filter(s => s.remedy_id === r.id);
      if (syms.length) {
        blocks.push({ type: "table", columns: [{ header: "Chapter", width: 1 }, { header: "Symptom", width: 3 }, { header: "Grade", width: 1 }, { header: "Modalities", width: 2 }],
          rows: syms.map(s => [s.chapter || "General", s.text, gl(s.grade), (s.modalities || []).map(m => (m.dir && m.dir !== "ws" ? m.dir + " " : "") + m.text).join("; ")]) });
      }
      blocks.push({ type: "spacer" });
    }
  }
  if (scope.repertory) {
    blocks.push({ type: "heading", text: "Repertory" });
    for (const sec of data.sections) {
      const rubs = data.rubrics.filter(r => r.section_id === sec.id);
      if (!rubs.length) continue;
      blocks.push({ type: "sub", text: sec.title });
      for (const r of rubs) {
        const rx = (r.remedies || []).map(l => remedyTok(data.byId[l.remedy_id]) + (l.grade != null && l.grade !== "" ? " " + gl(l.grade) : "")).join(", ");
        blocks.push({ type: "para", text: (r.parent ? r.parent + ", " : "") + r.text });
        if (rx) blocks.push({ type: "para", text: rx });
        if (r.note) blocks.push({ type: "para", text: r.note });
      }
    }
  }
  return {
    title: a.book_title || "Materia Medica & Repertory",
    subtitle: [a.edition, a.year].filter(Boolean).join(" · "),
    author: { name: a.name, credentials: a.credentials, clinic: a.clinic, email: a.email, website: a.website, copyright: a.copyright },
    generated: "Generated " + stamp(), blocks,
  };
}

export function buildHtmlDoc(data, scope) {
  const a = data.author || {};
  const scheme = data.marking ? activeScheme(data.marking) : { levels: [] };
  const gl = (v) => (v == null || v === "" ? "" : levelLabel(scheme, v));
  const styleClass = (v) => {
    const lv = (scheme.levels || []).find(l => Number(l.v) === Number(v));
    if (!lv) return "";
    return { italic: "g2", bold: "g3", caps: "g4", "bold-italic": "g3" }[lv.style] || "";
  };
  const blocks = [];
  scope = scope || { remedies: true, repertory: true };
  if (scope.remedies) {
    blocks.push({ type: "heading", text: "Materia Medica" });
    for (const r of data.remedies) {
      blocks.push({ type: "sub", text: r.name + (r.abbrev ? "  (" + r.abbrev + ")" : "") });
      const meta = [r.common_name, r.kingdom, r.family, r.source].filter(Boolean).join(" · ");
      if (meta) blocks.push({ type: "para", text: meta });
      if (r.notes) blocks.push({ type: "para", text: r.notes });
      const syms = data.symptoms.filter(s => s.remedy_id === r.id);
      if (syms.length) blocks.push({ type: "table", columns: [{ header: "Chapter" }, { header: "Symptom" }, { header: "Grade" }, { header: "Modalities" }],
        rows: syms.map(s => [s.chapter || "General", s.text, gl(s.grade), (s.modalities || []).map(m => (m.dir && m.dir !== "ws" ? m.dir + " " : "") + m.text).join("; ")]) });
    }
  }
  if (scope.repertory) {
    blocks.push({ type: "heading", text: "Repertory" });
    for (const sec of data.sections) {
      const rubs = data.rubrics.filter(r => r.section_id === sec.id);
      if (!rubs.length) continue;
      blocks.push({ type: "sub", text: sec.title });
      let html = "";
      for (const r of rubs) {
        const rx = (r.remedies || []).map(l => {
          const tok = esc(remedyTok(data.byId[l.remedy_id]));
          const cls = styleClass(l.grade);
          const g = (l.grade != null && l.grade !== "") ? " " + esc(gl(l.grade)) : "";
          return '<span class="' + cls + '">' + tok + g + "</span>";
        }).join(", ");
        html += '<div class="rub"><span class="t">' + esc((r.parent ? r.parent + ", " : "") + r.text) + '</span>' + (rx ? ' <span class="rx">&mdash; ' + rx + "</span>" : "") + "</div>";
      }
      blocks.push({ type: "html", text: html });
    }
  }
  return {
    title: a.book_title || "Materia Medica & Repertory",
    author: a, generated: "Generated " + stamp(), blocks,
  };
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])); }
