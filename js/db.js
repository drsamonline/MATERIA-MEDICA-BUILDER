/* db.js — storage layer for Materia Medica Builder.
 * Extends the original app's IndexedDB ('MateriaMedicaDB') from v1 to v2:
 * v1 stores (remedies, symptoms, cases) are preserved; we add sections,
 * rubrics and settings. No data is lost on upgrade.
 */
export const DB_NAME = "MateriaMedicaDB";
export const DB_VERSION = 2;

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains("remedies")) db.createObjectStore("remedies", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("symptoms")) db.createObjectStore("symptoms", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("cases")) db.createObjectStore("cases", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("sections")) db.createObjectStore("sections", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("rubrics")) db.createObjectStore("rubrics", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode) { return _db.transaction(store, mode).objectStore(store); }
function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const db = {
  async all(store) { await openDB(); return wrap(tx(store, "readonly").getAll()); },
  async get(store, id) { await openDB(); return wrap(tx(store, "readonly").get(id)); },
  async put(store, obj) { await openDB(); return wrap(tx(store, "readwrite").put(obj)); },
  async del(store, id) { await openDB(); return wrap(tx(store, "readwrite").delete(id)); },
  async clear(store) { await openDB(); return wrap(tx(store, "readwrite").clear()); },
  async bulk(store, rows) {
    await openDB();
    return new Promise((resolve, reject) => {
      const t = _db.transaction(store, "readwrite");
      const os = t.objectStore(store);
      rows.forEach(r => os.put(r));
      t.oncomplete = () => resolve(true);
      t.onerror = () => reject(t.error);
    });
  },
  async clearAll() {
    await openDB();
    return new Promise((resolve, reject) => {
      const stores = ["remedies", "symptoms", "cases", "sections", "rubrics", "settings"];
      const t = _db.transaction(stores, "readwrite");
      stores.forEach(s => t.objectStore(s).clear());
      t.oncomplete = () => resolve(true);
      t.onerror = () => reject(t.error);
    });
  },
};

/* ---------------- settings ---------------- */
export async function getSetting(key, def) {
  const row = await db.get("settings", key);
  return row && row.value !== undefined ? row.value : def;
}
export async function setSetting(key, value) { return db.put("settings", { key, value }); }

export const DEFAULT_AUTHOR = {
  name: "", credentials: "", clinic: "", email: "", website: "",
  book_title: "", edition: "", year: new Date().getFullYear(),
  copyright: "", license: "All rights reserved.",
};

/* ---------------- marking schemes ---------------- */
/* A level: { v: numeric value, label: short text, style: plain|italic|bold|caps|bold-italic } */
export const STYLES = ["plain", "italic", "bold", "bold-italic", "caps", "superscript"];

export const DEFAULT_MARKING = {
  active: "kent3",
  schemes: [
    { id: "kent3", name: "Kent 3-point", description: "Plain / Italic / Bold — the classic Kent scale.", levels: [
      { v: 1, label: "1", style: "plain" }, { v: 2, label: "2", style: "italic" }, { v: 3, label: "3", style: "bold" } ] },
    { id: "four", name: "4-point (with capitals)", description: "1 plain, 2 italic, 3 bold, 4 CAPITALS.", levels: [
      { v: 1, label: "1", style: "plain" }, { v: 2, label: "2", style: "italic" }, { v: 3, label: "3", style: "bold" }, { v: 4, label: "4", style: "caps" } ] },
    { id: "boen", name: "Boenninghausen 5-point", description: "A five-step gradation for finer ranking.", levels: [
      { v: 1, label: "1", style: "plain" }, { v: 2, label: "2", style: "italic" }, { v: 3, label: "3", style: "bold" }, { v: 4, label: "4", style: "bold-italic" }, { v: 5, label: "5", style: "caps" } ] },
    { id: "simple", name: "Simple 0–2", description: "Minimal: not marked / present / strong.", levels: [
      { v: 0, label: "–", style: "plain" }, { v: 1, label: "+", style: "italic" }, { v: 2, label: "++", style: "bold" } ] },
  ],
};

export async function getMarking() {
  const m = await getSetting("marking", null);
  if (!m || !Array.isArray(m.schemes) || !m.schemes.length) return JSON.parse(JSON.stringify(DEFAULT_MARKING));
  return m;
}
export async function setMarking(m) { return setSetting("marking", m); }

export function activeScheme(marking) {
  return (marking.schemes.find(s => s.id === marking.active)) || marking.schemes[0];
}
export function levelStyle(scheme, value) {
  const lv = (scheme.levels || []).find(l => Number(l.v) === Number(value));
  return lv ? lv.style : "plain";
}
export function levelLabel(scheme, value) {
  const lv = (scheme.levels || []).find(l => Number(l.v) === Number(value));
  return lv ? lv.label : String(value);
}

/* ---------------- legacy migration ---------------- */
/* The original app stored symptoms as {description, location, sensation,
 * modality, confidence_level}. Fold those into the richer symptom shape once. */
export async function migrateLegacy() {
  const syms = await db.all("symptoms");
  const fixed = [];
  for (const s of syms) {
    if (s.text === undefined) {
      const parts = [s.description, s.location, s.sensation, s.modality].filter(Boolean);
      s.text = parts.join(" — ") || "(no text)";
      s.chapter = s.chapter || "General";
      s.grade = (s.grade != null) ? s.grade : (s.confidence_level != null ? s.confidence_level : null);
      s.modalities = s.modalities || [];
      delete s.description; delete s.location; delete s.sensation; delete s.modality; delete s.confidence_level;
      fixed.push(s);
    }
  }
  if (fixed.length) await db.bulk("symptoms", fixed);
  const rems = await db.all("remedies");
  const rfix = [];
  for (const r of rems) {
    let changed = false;
    if (r.family === undefined) { r.family = r.source_family || ""; changed = true; }
    if (r.abbrev === undefined) { r.abbrev = ""; changed = true; }
    if (r.common_name === undefined) { r.common_name = ""; changed = true; }
    if (changed) { delete r.source_family; rfix.push(r); }
  }
  if (rfix.length) await db.bulk("remedies", rfix);
  return fixed.length + rfix.length;
}

/* ---------------- first-run starter (only if truly empty) ---------------- */
export async function seedIfEmpty() {
  const rems = await db.all("remedies");
  const secs = await db.all("sections");
  if (rems.length || secs.length) return false;
  const now = new Date().toISOString();
  const seed = [
    { name: "Aconitum napellus", abbrev: "Acon", family: "Ranunculaceae", notes: "Sudden, violent onset; fear and restlessness." },
    { name: "Belladonna", abbrev: "Bell", family: "Solanaceae", notes: "Heat, redness, throbbing; sudden onset." },
    { name: "Natrum muriaticum", abbrev: "Nat-m", family: " ", notes: "Grief, reserved; worse consolation." },
  ];
  for (const r of seed) await db.put("remedies", { ...r, common_name: "", kingdom: "", source: "", created_at: now, updated_at: now });
  const secId = await db.put("sections", { title: "Mind", order: 1, created_at: now });
  await db.put("rubrics", { section_id: secId, text: "Anxiety, about health", parent: null, note: "", remedies: [], created_at: now });
  await db.put("rubrics", { section_id: secId, text: "Fear, of death, during illness", parent: null, note: "", remedies: [], created_at: now });
  return true;
}
