/* importers.js — parse incoming files into a normalised "bundle" that app.js
 * can apply to the database. Supports:
 *   - native JSON (mmb/native/1)
 *   - OMM reader JSON (schema 1.1: repertory and/or materia_medica)
 *   - CSV for remedies / symptoms / repertory / cases
 */

/* ---------------- CSV parser (RFC-4180-ish) ---------------- */
export function parseCSV(text) {
  text = String(text).replace(/^\uFEFF/, "");
  const rows = []; let row = []; let field = ""; let i = 0; let inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = (rows.shift() || []).map(h => h.trim().toLowerCase());
  return { header, rows: rows.filter(r => r.some(x => String(x).trim() !== "")) };
}
const col = (header, names) => { for (const n of names) { const k = header.indexOf(n); if (k !== -1) return k; } return -1; };

/* ---------------- JSON ---------------- */
export function detectJSON(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (obj.schema && String(obj.schema).startsWith("mmb/native")) return "native";
  if (obj.schema_version && obj.type === "repertory") return "omm-repertory";
  if (obj.schema_version && obj.type === "materia_medica") return "omm-mm";
  if (Array.isArray(obj.remedies) || obj.repertory) return "native"; // lenient
  return null;
}

export function bundleFromJSON(obj) {
  const kind = detectJSON(obj);
  if (kind === "native") return bundleNative(obj);
  if (kind === "omm-repertory") return bundleOMMRepertory(obj);
  if (kind === "omm-mm") return bundleOMMMateriaMedica(obj);
  throw new Error("Unrecognised JSON. Expected a Materia Medica Builder backup or an OMM repertory/materia-medica file.");
}

function bundleNative(obj) {
  const b = { source: "native", author: obj.author || null, marking: obj.marking || null, remedies: [], symptoms: [], sections: [], cases: [] };
  const nameById = {};
  (obj.remedies || []).forEach(r => {
    b.remedies.push({ name: r.name, abbrev: r.abbrev || "", common_name: r.common_name || "", kingdom: r.kingdom || "", family: r.family || "", source: r.source || "", notes: r.notes || "" });
    nameById[r.id] = r.name;
  });
  (obj.symptoms || []).forEach(s => b.symptoms.push({
    remedy: s.remedy || nameById[s.remedy_id] || "", chapter: s.chapter || "General", text: s.text || "",
    grade: s.grade == null ? null : s.grade, modalities: s.modalities || [], notes: s.notes || "",
  }));
  const rep = obj.repertory || { sections: [] };
  (rep.sections || []).forEach((sec, i) => b.sections.push({
    title: sec.title || ("Section " + (i + 1)), order: sec.order || i + 1,
    rubrics: (sec.rubrics || []).map(r => ({
      text: r.text || "", parent: r.parent || null, note: r.note || "",
      remedies: (r.remedies || []).map(l => ({ remedy: l.remedy || nameById[l.remedy_id] || "", grade: l.grade == null ? null : l.grade, polarity: l.polarity || "+", note: l.note || "" })),
    })),
  }));
  (obj.cases || []).forEach(c => b.cases.push(c));
  return b;
}

function bundleOMMRepertory(obj) {
  const b = { source: "omm-repertory", author: null, marking: null, remedies: [], symptoms: [], sections: [], cases: [] };
  const a = obj.book || {};
  if (a.author || a.title) b.author = { name: a.author || "", book_title: a.title || "", year: a.year || "", clinic: a.publisher || "" };
  const table = obj.remedy_table || [];
  const seen = {};
  (obj.sections || []).forEach((sec, i) => b.sections.push({
    title: sec.title || ("Section " + (i + 1)), order: i + 1,
    rubrics: (sec.rubrics || []).map(r => ({
      text: r.text || "", parent: r.parent || null, note: r.note || "",
      remedies: (r.remedies || []).map(link => {
        let code, grade = null, pol = "+", note = "";
        if (Array.isArray(link)) { code = link[0]; grade = link[1]; pol = link[2] || "+"; note = link[3] || ""; }
        else if (typeof link === "number") { code = link; }
        else if (link && typeof link === "object") { return { remedy: link.abbrev || link.name || "", grade: link.grade == null ? null : link.grade, polarity: link.polarity || "+", note: link.note || "" }; }
        const t = table[code] || {};
        const name = t.name || t.abbrev || ("#" + code);
        if (name && !seen[name.toLowerCase()]) { seen[name.toLowerCase()] = 1; b.remedies.push({ name, abbrev: t.abbrev || "", common_name: "", kingdom: "", family: "", source: "", notes: "" }); }
        return { remedy: name, grade: grade == null ? null : grade, polarity: pol, note };
      }),
    })),
  }));
  return b;
}

function bundleOMMMateriaMedica(obj) {
  const b = { source: "omm-mm", author: null, marking: null, remedies: [], symptoms: [], sections: [], cases: [] };
  const a = obj.book || {};
  if (a.author || a.title) b.author = { name: a.author || "", book_title: a.title || "", year: a.year || "", clinic: a.publisher || "" };
  (obj.remedies || []).forEach(r => {
    b.remedies.push({ name: r.name, abbrev: r.abbrev || "", common_name: r.common_name || "", kingdom: r.kingdom || "", family: r.family || "", source: "", notes: "" });
    (r.symptoms || []).forEach(s => b.symptoms.push({
      remedy: r.name, chapter: s.chapter || "General", text: s.text || "",
      grade: s.grade == null ? null : s.grade, modalities: s.modalities || [], notes: "",
    }));
  });
  return b;
}

/* ---------------- CSV ---------------- */
export function bundleFromCSV(dataset, text) {
  const { header, rows } = parseCSV(text);
  const b = { source: "csv-" + dataset, author: null, marking: null, remedies: [], symptoms: [], sections: [], cases: [] };
  const cell = (r, names) => { const k = col(header, names); return k === -1 ? "" : (r[k] == null ? "" : String(r[k])); };

  if (dataset === "remedies") {
    for (const r of rows) b.remedies.push({ name: cell(r, ["name"]), abbrev: cell(r, ["abbrev"]), common_name: cell(r, ["common_name", "common name"]), kingdom: cell(r, ["kingdom"]), family: cell(r, ["family"]), source: cell(r, ["source"]), notes: cell(r, ["notes"]) });
  } else if (dataset === "symptoms") {
    for (const r of rows) b.symptoms.push({
      remedy: cell(r, ["remedy", "remedy_name"]), chapter: cell(r, ["chapter"]) || "General", text: cell(r, ["text", "symptom"]),
      grade: cell(r, ["grade"]) === "" ? null : Number(cell(r, ["grade"])) || cell(r, ["grade"]),
      modalities: parseModalities(cell(r, ["modalities"])), notes: cell(r, ["notes"]),
    });
  } else if (dataset === "repertory") {
    const bySec = {};
    for (const r of rows) {
      const sec = cell(r, ["section", "chapter"]) || "General";
      if (!bySec[sec]) { bySec[sec] = { title: sec, order: Object.keys(bySec).length + 1, rubrics: [] }; b.sections.push(bySec[sec]); }
      bySec[sec].rubrics.push({ text: cell(r, ["rubric", "text"]), parent: cell(r, ["parent"]) || null, note: cell(r, ["note"]) || "", remedies: parseRemedyList(cell(r, ["remedies", "remedy"])) });
    }
  } else if (dataset === "cases") {
    for (const r of rows) b.cases.push({
      patient_initials: cell(r, ["initials", "patient_initials"]), age: cell(r, ["age"]) === "" ? "" : Number(cell(r, ["age"])),
      gender: cell(r, ["gender"]), chief_complaint: cell(r, ["complaint", "chief_complaint"]),
      prescribed_remedy_name: cell(r, ["remedy"]), potency: cell(r, ["potency"]), dosage: cell(r, ["dosage"]),
      outcome: cell(r, ["outcome"]), follow_up_notes: cell(r, ["follow_up", "follow_up_notes"]), date: cell(r, ["date"]),
    });
  } else throw new Error("Unknown CSV dataset: " + dataset);
  return b;
}

function parseModalities(s) {
  if (!s) return [];
  return String(s).split(";").map(x => x.trim()).filter(Boolean).map(x => {
    const m = x.match(/^(worse|better|ws)\s+(.*)$/i);
    return m ? { dir: m[1].toLowerCase(), text: m[2] } : { dir: "ws", text: x };
  });
}
/* "Ars 3, Bell 2, Phos"  ->  [{remedy:'Ars',grade:3},...] */
function parseRemedyList(s) {
  if (!s) return [];
  return String(s).split(",").map(x => x.trim()).filter(Boolean).map(tok => {
    const m = tok.match(/^(.*?)\s+([0-9]+)$/);
    if (m) return { remedy: m[1].trim(), grade: Number(m[2]), polarity: "+", note: "" };
    return { remedy: tok.replace(/\s*\(antidotal\)\s*$/i, "").trim(), grade: null, polarity: /\(antidotal\)/i.test(tok) ? "-" : "+", note: "" };
  });
}
