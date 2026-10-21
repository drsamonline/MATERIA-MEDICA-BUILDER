/* ============================================================================
 * exporters.mjs — dependency-free export writers for Materia Medica Builder.
 * Pure functions, no DOM, no network. Returns strings or Uint8Array.
 *   - XLSX  : real Office Open XML (zip, store method)
 *   - PDF   : minimal PDF 1.4 with Helvetica text + simple tables
 *   - SQLite: real SQLite 3 database file (single-table-per-btree, multi-page)
 *   - SQL   : portable SQL dump (SQLite / Postgres / MySQL friendly)
 *   - CSV, HTML, JSON handled here too.
 * ==========================================================================*/

/* ---------- bytes & text ---------- */
export function utf8(s) { return new TextEncoder().encode(s); }
const enc = new TextEncoder();
const dec = new TextDecoder();

/* ---------- CRC32 ---------- */
let _crc = null;
function crcTable() {
  if (_crc) return _crc;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  _crc = t; return t;
}
export function crc32(bytes) {
  const t = crcTable(); let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ---------- byte writer ---------- */
class BW {
  constructor() { this.chunks = []; this.len = 0; }
  push(b) { this.chunks.push(b); this.len += b.length; return this; }
  u16(v) { const b = new Uint8Array(2); b[0] = v & 255; b[1] = (v >>> 8) & 255; return this.push(b); }
  u32(v) { const b = new Uint8Array(4); b[0] = v & 255; b[1] = (v >>> 8) & 255; b[2] = (v >>> 16) & 255; b[3] = (v >>> 24) & 255; return this.push(b); }
  u32be(v) { const b = new Uint8Array(4); b[0] = (v >>> 24) & 255; b[1] = (v >>> 16) & 255; b[2] = (v >>> 8) & 255; b[3] = v & 255; return this.push(b); }
  u16be(v) { const b = new Uint8Array(2); b[0] = (v >>> 8) & 255; b[1] = v & 255; return this.push(b); }
  bytes() { const out = new Uint8Array(this.len); let o = 0; for (const c of this.chunks) { out.set(c, o); o += c.length; } return out; }
}

/* ---------- ZIP (store, no compression) ---------- */
export function zip(files) {
  const DOS_TIME = 0, DOS_DATE = 0x2100; // 2000-01-01
  const local = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = utf8(f.name);
    const data = f.data instanceof Uint8Array ? f.data : utf8(String(f.data));
    const crc = crc32(data);
    const lh = new BW();
    lh.u32(0x04034b50).u16(20).u16(0x0800).u16(0).u16(DOS_TIME).u16(DOS_DATE).u32(crc).u32(data.length).u32(data.length).u16(name.length).u16(0);
    lh.push(name).push(data);
    const lhBytes = lh.bytes();
    local.push(lhBytes);
    const ch = new BW();
    ch.u32(0x02014b50).u16(20).u16(20).u16(0x0800).u16(0).u16(DOS_TIME).u16(DOS_DATE).u32(crc).u32(data.length).u32(data.length).u16(name.length).u16(0).u16(0).u16(0).u16(0).u32(0).u32(offset);
    ch.push(name);
    central.push(ch.bytes());
    offset += lhBytes.length;
  }
  const centralStart = offset;
  let centralSize = 0; for (const c of central) centralSize += c.length;
  const eocd = new BW();
  eocd.u32(0x06054b50).u16(0).u16(0).u16(files.length).u16(files.length).u32(centralSize).u32(centralStart).u16(0);
  const all = [...local, ...central, eocd.bytes()];
  let total = 0; for (const c of all) total += c.length;
  const out = new Uint8Array(total); let o = 0;
  for (const c of all) { out.set(c, o); o += c.length; }
  return out;
}

/* ============================ XLSX ============================ */
function xmlEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[m]));
}
function colLetter(n) { let s = ""; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

/**
 * sheets: [{ name, rows: [[cell,...], ...] }]  (row 0 is treated as header, bold)
 * cell: string | number | null | {v, type:'text'|'number', bold:true}
 */
export function buildXLSX(sheets) {
  const files = [];
  const CT = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'];
  sheets.forEach((s, i) => CT.push(`<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`));
  CT.push('</Types>');
  files.push({ name: "[Content_Types].xml", data: CT.join("") });

  files.push({ name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });

  const wb = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'];
  sheets.forEach((s, i) => wb.push(`<sheet name="${xmlEsc(s.name).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`));
  wb.push('</sheets></workbook>');
  files.push({ name: "xl/workbook.xml", data: wb.join("") });

  const rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'];
  sheets.forEach((s, i) => rels.push(`<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`));
  rels.push(`<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
  rels.push('</Relationships>');
  files.push({ name: "xl/_rels/workbook.xml.rels", data: rels.join("") });

  files.push({
    name: "xl/styles.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
      + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
      + '<borders count="1"><border/></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
      + '</styleSheet>'
  });

  sheets.forEach((s, i) => {
    const rowsXml = [];
    (s.rows || []).forEach((row, r) => {
      const cells = [];
      (row || []).forEach((cell, c) => {
        const ref = colLetter(c) + (r + 1);
        let v = cell, bold = (r === 0);
        if (cell && typeof cell === "object") { v = cell.v; bold = cell.bold != null ? cell.bold : bold; }
        const style = bold ? ' s="1"' : "";
        if (v == null || v === "") { cells.push(`<c r="${ref}"${style}/>`); }
        else if (typeof v === "number" && isFinite(v)) { cells.push(`<c r="${ref}"${style}><v>${v}</v></c>`); }
        else { cells.push(`<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`); }
      });
      rowsXml.push(`<row r="${r + 1}">${cells.join("")}</row>`);
    });
    const sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetData>' + rowsXml.join("") + '</sheetData></worksheet>';
    files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml });
  });

  return zip(files);
}

/* ============================ PDF ============================ */
const HELV_W = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
function textWidth(str, size) { let w = 0; for (const ch of String(str)) { const c = ch.codePointAt(0); w += (c >= 32 && c <= 126 ? HELV_W[c - 32] : 556); } return w / 1000 * size; }
function pdfAscii(s) {
  return String(s == null ? "" : s)
    .replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-").replace(/\u2026/g, "...")
    .replace(/[\u00B7\u2022\u25CF]/g, "-").replace(/\u2605/g, "*")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?");
}
function pdfStr(s) { return pdfAscii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }

/**
 * doc: { title, subtitle, author:{name,credentials,clinic,email,website,copyright},
 *        blocks: [ {type:'heading',text} | {type:'sub'} | {type:'para',text} |
 *                  {type:'table', columns:[{header,width}], rows:[[..]] } ] }
 * page: A4 portrait. Returns Uint8Array.
 */
export function buildPDF(doc) {
  const W = 595.28, H = 841.89, M = 50, LH = 14;
  const pages = []; let cur = null; let y = 0;
  const newPage = () => { cur = { ops: [] }; pages.push(cur); y = H - M; };
  newPage();
  const op = (s) => cur.ops.push(s);
  const textAt = (x, yy, size, bold, str) => op(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfStr(str)}) Tj ET`);
  const ensure = (need) => { if (y - need < M) newPage(); };
  const wrap = (str, size, maxW) => {
    const words = String(str).split(/\s+/); const lines = []; let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (textWidth(t, size) > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const para = (str, size, bold, color) => {
    const maxW = W - 2 * M;
    for (const ln of wrap(str, size, maxW)) { ensure(LH); y -= LH; textAt(M, y, size, bold, ln); }
  };

  // Title block
  if (doc.title) { para(doc.title, 20, true); y -= 4; }
  if (doc.subtitle) { para(doc.subtitle, 12, false); }
  const a = doc.author || {};
  const meta = [];
  if (a.name) meta.push(a.name + (a.credentials ? ", " + a.credentials : ""));
  if (a.clinic) meta.push(a.clinic);
  if (a.email) meta.push(a.email);
  if (a.website) meta.push(a.website);
  if (meta.length) { y -= 4; para(meta.join("  ·  "), 9, false); }
  if (doc.generated) { para(doc.generated, 8, false); }
  y -= 8;

  for (const b of (doc.blocks || [])) {
    if (b.type === "heading") { ensure(LH + 8); y -= 8; para(b.text, 13, true); y -= 2; }
    else if (b.type === "sub") { ensure(LH + 4); y -= 6; para(b.text, 11, true); }
    else if (b.type === "para") { para(b.text, 10, false); }
    else if (b.type === "spacer") { y -= 8; }
    else if (b.type === "rule") { ensure(6); y -= 6; op(`0.7 w 0.6 0.6 0.6 RG ${M} ${y.toFixed(2)} m ${(W - M).toFixed(2)} ${y.toFixed(2)} l S`); y -= 4; }
    else if (b.type === "table") {
      const cols = b.columns || []; const totalW = W - 2 * M;
      const widths = cols.map(c => (c.width || 1));
      const sum = widths.reduce((x, y2) => x + y2, 0);
      const colW = widths.map(w => w / sum * totalW);
      const drawRow = (cells, bold) => {
        const wrapped = cells.map((c, i) => wrap(c == null ? "" : String(c), 9, colW[i] - 4));
        const h = Math.max(...wrapped.map(w => w.length)) * 11 + 2;
        ensure(h); y -= h;
        let x = M;
        for (let i = 0; i < cells.length; i++) {
          let ly = y + h - 11;
          for (const ln of wrapped[i]) { textAt(x, ly, 9, bold, ln); ly -= 11; }
          x += colW[i];
        }
      };
      if (cols.length) drawRow(cols.map(c => c.header), true);
      for (const r of (b.rows || [])) drawRow(r, false);
      y -= 4;
    }
  }

  // Assemble objects
  const nPages = pages.length;
  const objs = [];
  const kids = [];
  for (let i = 0; i < nPages; i++) { kids.push(`${5 + 2 * i} 0 R`); }
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${nPages} >>`;
  objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  pages.forEach((p, i) => {
    const pageNum = 5 + 2 * i, contNum = 6 + 2 * i;
    const content = p.ops.join("\n");
    objs[pageNum] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contNum} 0 R >>`;
    objs[contNum] = `<< /Length ${utf8(content).length} >>\nstream\n${content}\nendstream`;
  });

  let out = "%PDF-1.4\n";
  const offsets = [];
  const maxObj = objs.length - 1;
  for (let i = 1; i <= maxObj; i++) {
    offsets[i] = utf8(out).length;
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xrefStart = utf8(out).length;
  out += `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) out += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  out += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return utf8(out);
}

/* ============================ SQLite ============================ */
function varint(n) {
  n = Math.floor(n);
  if (n < 0) throw new Error("varint negative");
  if (n <= 0x7f) return [n];
  const groups = [];
  let x = n;
  while (x > 0) { groups.unshift(x % 128); x = Math.floor(x / 128); }
  const out = [];
  if (groups.length <= 8) {
    for (let i = 0; i < groups.length - 1; i++) out.push(groups[i] | 0x80);
    out.push(groups[groups.length - 1]);
  } else {
    // 9-byte form: first byte carries 8 bits
    const g = []; x = n;
    while (x > 0) { g.unshift(x % 256); x = Math.floor(x / 256); }
    out.push(0x80 | 0x00); // placeholder, handled below
    // build 8 groups of 7 bits then final 8-bit
    const g7 = []; x = n;
    while (x > 0) { g7.unshift(x % 128); x = Math.floor(x / 128); }
    while (g7.length < 9) g7.unshift(0);
    const first = g7.shift();
    out.length = 0;
    for (let i = 0; i < 8; i++) out.push(g7[i] | 0x80);
    out.push(first);
  }
  return out;
}
function varintLen(n) { return varint(n).length; }

function serial(v) {
  if (v === null || v === undefined) return { t: 0, data: new Uint8Array(0) };
  if (typeof v === "boolean") v = v ? 1 : 0;
  if (typeof v === "number") {
    if (Number.isInteger(v)) {
      const b = new Uint8Array(8); let x = BigInt(v); if (x < 0) x += (1n << 64n);
      for (let i = 7; i >= 0; i--) { b[i] = Number(x & 0xffn); x >>= 8n; }
      return { t: 6, data: b };
    }
    const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v, false); return { t: 7, data: b };
  }
  const bytes = v instanceof Uint8Array ? v : enc.encode(String(v));
  if (v instanceof Uint8Array) return { t: 12 + 2 * bytes.length, data: bytes };
  return { t: 13 + 2 * bytes.length, data: bytes };
}
function record(values) {
  const s = values.map(serial);
  const typeBytes = s.map(x => varint(x.t));
  const typesLen = typeBytes.reduce((a, b) => a + b.length, 0);
  let headerSize = typesLen + 1;
  while (varintLen(headerSize) + typesLen !== headerSize) headerSize = typesLen + varintLen(headerSize);
  const head = [...varint(headerSize), ...typeBytes.flat()];
  let size = head.length; for (const x of s) size += x.data.length;
  const out = new Uint8Array(size); let o = 0;
  out.set(head, o); o += head.length;
  for (const x of s) { out.set(x.data, o); o += x.data.length; }
  return out;
}

/**
 * tables: [{ name, createSql, rows: [[v,...], ...] }]
 * Returns a valid SQLite 3 file as Uint8Array.
 */
export function buildSQLite(tables, pageSize) {
  if (!pageSize) {
    let maxRec = 0;
    for (const t of tables) for (const row of (t.rows || [])) { const n = record(row).length; if (n > maxRec) maxRec = n; }
    pageSize = 4096;
    while (pageSize < 65536 && maxRec + 24 > pageSize) pageSize *= 2;
    if (maxRec + 24 > pageSize) throw new Error("A single record is too large for SQLite export (max ~65 KB). Shorten the longest note or field.");
  }
  const pages = {};               // pageNumber -> Uint8Array
  let nextPage = 2;               // page 1 = sqlite_master
  const schemaRows = [];          // [type,name,tbl_name,rootpage,sql]

  const USABLE = (p) => pageSize;
  const buildLeaf = (cells, headerOffset) => {
    // cells: [{bytes, rowid}] sorted by rowid
    const b = new Uint8Array(pageSize);
    const dv = new DataView(b.buffer);
    const hdr = headerOffset;
    b[hdr] = 0x0D;
    dv.setUint16(hdr + 1, 0);
    dv.setUint16(hdr + 3, cells.length);
    dv.setUint16(hdr + 5, 0);       // content start (set below)
    b[hdr + 7] = 0;
    let ptr = hdr + 8;
    let contentEnd = pageSize;
    for (let i = 0; i < cells.length; i++) {
      contentEnd -= cells[i].bytes.length;
      b.set(cells[i].bytes, contentEnd);
      dv.setUint16(ptr, contentEnd);
      ptr += 2;
    }
    dv.setUint16(hdr + 5, contentEnd === pageSize ? pageSize : contentEnd);
    return b;
  };
  const buildInterior = (children) => {
    // children: [{page, maxRowid}]
    const b = new Uint8Array(pageSize);
    const dv = new DataView(b.buffer);
    b[0] = 0x05;
    dv.setUint16(1, 0);
    dv.setUint16(3, children.length - 1);
    dv.setUint16(5, 0);
    b[7] = 0;
    dv.setUint32(8, children[children.length - 1].page);
    let ptr = 12; let contentEnd = pageSize;
    for (let i = 0; i < children.length - 1; i++) {
      const keyB = varint(children[i].maxRowid);
      const cell = new Uint8Array(4 + keyB.length);
      new DataView(cell.buffer).setUint32(0, children[i].page);
      cell.set(keyB, 4);
      contentEnd -= cell.length;
      b.set(cell, contentEnd);
      dv.setUint16(ptr, contentEnd); ptr += 2;
    }
    dv.setUint16(5, contentEnd);
    return b;
  };

  for (const t of tables) {
    const cells = [];
    let rid = 1;
    for (const row of (t.rows || [])) {
      const rec = record(row);
      const payloadLen = varint(rec.length);
      const rowidB = varint(rid);
      const cell = new Uint8Array(payloadLen.length + rowidB.length + rec.length);
      let o = 0; cell.set(payloadLen, o); o += payloadLen.length; cell.set(rowidB, o); o += rowidB.length; cell.set(rec, o);
      cells.push({ bytes: cell, rowid: rid, payload: rec.length });
      rid++;
    }
    // pack into leaves
    const leaves = [];
    let cur = [], used = 0, curMax = 0, limit = pageSize - 8; // header + ptr array headroom
    const flush = () => { if (cur.length || leaves.length === 0) { leaves.push({ cells: cur, max: curMax }); cur = []; used = 0; curMax = 0; } };
    for (const c of cells) {
      const cost = c.bytes.length + 2;
      if (used + cost + 8 > pageSize && cur.length) flush();
      cur.push(c); used += cost; curMax = c.rowid;
    }
    flush();
    // allocate pages
    const leafPages = [];
    for (const lf of leaves) { const p = nextPage++; leafPages.push({ page: p, max: lf.max, cells: lf.cells }); }
    let rootPage;
    if (leafPages.length === 1) rootPage = leafPages[0].page;
    else { rootPage = nextPage++; }
    // write leaf pages
    for (const lp of leafPages) pages[lp.page] = buildLeaf(lp.cells, 0);
    // write interior root
    if (leafPages.length > 1) pages[rootPage] = buildInterior(leafPages.map(l => ({ page: l.page, maxRowid: l.max })));
    schemaRows.push(["table", t.name, t.name, rootPage, t.createSql || `CREATE TABLE ${t.name}`]);
  }

  // sqlite_master on page 1
  const schemaCells = [];
  let rid = 1;
  for (const row of schemaRows) {
    const rec = record(row);
    const pl = varint(rec.length), rb = varint(rid);
    const cell = new Uint8Array(pl.length + rb.length + rec.length);
    let o = 0; cell.set(pl, o); o += pl.length; cell.set(rb, o); o += rb.length; cell.set(rec, o);
    schemaCells.push({ bytes: cell, rowid: rid }); rid++;
  }
  pages[1] = buildLeaf(schemaCells, 100);

  const totalPages = nextPage - 1;
  const file = new Uint8Array(totalPages * pageSize);
  for (let p = 1; p <= totalPages; p++) file.set(pages[p], (p - 1) * pageSize);

  // header
  const dv = new DataView(file.buffer);
  const magic = enc.encode("SQLite format 3\0");
  file.set(magic, 0);
  dv.setUint16(16, pageSize === 65536 ? 1 : pageSize);
  file[18] = 1; file[19] = 1;   // write/read version
  file[20] = 0;                 // reserved
  file[21] = 64; file[22] = 32; file[23] = 32;
  dv.setUint32(24, 1);          // change counter
  dv.setUint32(28, totalPages); // db size in pages
  dv.setUint32(32, 0);          // freelist trunk
  dv.setUint32(36, 0);          // freelist count
  dv.setUint32(40, 1);          // schema cookie
  dv.setUint32(44, 4);          // schema format
  dv.setUint32(48, 0);          // cache size
  dv.setUint32(52, 0);          // largest root btree page
  dv.setUint32(56, 1);          // text encoding UTF-8
  dv.setUint32(60, 0);          // user version
  dv.setUint32(64, 0);          // incremental vacuum
  dv.setUint32(68, 0);          // application id
  dv.setUint32(92, 1);          // version valid for
  dv.setUint32(96, 3037000);    // sqlite version number
  return file;
}

/* ============================ CSV / SQL / HTML ============================ */
export function csvCell(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
export function buildCSV(columns, rows) {
  const out = [columns.map(csvCell).join(",")];
  for (const r of rows) out.push(r.map(csvCell).join(","));
  return out.join("\r\n");
}
export function buildSQL(dump, dialect = "sqlite") {
  const q = (s) => "'" + String(s == null ? "" : s).replace(/'/g, "''") + "'";
  const lines = [];
  lines.push(`-- Materia Medica Builder export`);
  lines.push(`-- dialect: ${dialect}`);
  lines.push(`-- generated: ${dump.generated || ""}`);
  lines.push(`-- author: ${(dump.author && dump.author.name) || ""}`);
  lines.push("");
  for (const t of dump.tables) {
    if (dialect === "postgres") lines.push(`DROP TABLE IF EXISTS ${t.name} CASCADE;`);
    else if (dialect === "mysql") lines.push(`DROP TABLE IF EXISTS \`${t.name}\`;`);
    else lines.push(`DROP TABLE IF EXISTS ${t.name};`);
    lines.push(t.createSql);
    lines.push("");
    for (const row of t.rows) {
      const vals = row.map(v => (v == null ? "NULL" : (typeof v === "number" ? String(v) : q(v))));
      const cols = t.columns.map(c => (dialect === "mysql" ? "`" + c + "`" : c)).join(", ");
      lines.push(`INSERT INTO ${t.name} (${cols}) VALUES (${vals.join(", ")});`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
export function buildHTML(doc) {
  const a = doc.author || {};
  const esc = xmlEsc;
  const h = [];
  h.push('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">');
  h.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  h.push(`<title>${esc(doc.title || "Materia Medica")}</title>`);
  h.push('<style>:root{--fg:#1f2328;--dim:#57606a;--bd:#d0d7de;--ac:#0969da}*{box-sizing:border-box}body{font:15px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--fg);margin:0;background:#fff}'
    + '.wrap{max-width:900px;margin:0 auto;padding:40px 24px}h1{font-size:1.8rem;margin:0 0 4px}h2{font-size:1.15rem;margin:28px 0 8px;border-bottom:1px solid var(--bd);padding-bottom:4px}h3{font-size:1rem;margin:18px 0 6px}'
    + '.meta{color:var(--dim);font-size:.85rem;margin:0 0 6px}.copy{color:var(--dim);font-size:.78rem;margin-top:30px;border-top:1px solid var(--bd);padding-top:10px}'
    + 'table{border-collapse:collapse;width:100%;margin:8px 0 16px;font-size:.88rem}th,td{border:1px solid var(--bd);padding:6px 8px;text-align:left;vertical-align:top}th{background:#f6f8fa}'
    + '.rub{margin:6px 0}.rub .t{font-weight:600}.rx{color:var(--dim)}.g3{font-weight:700}.g2{font-style:italic}.g4{font-weight:700;text-transform:uppercase}'
    + '.pill{display:inline-block;background:#eaeef2;border-radius:999px;padding:1px 8px;font-size:.75rem;margin:1px 2px}</style></head><body><div class="wrap">');
  h.push(`<h1>${esc(doc.title || "Materia Medica & Repertory")}</h1>`);
  const meta = [];
  if (a.name) meta.push(esc(a.name + (a.credentials ? ", " + a.credentials : "")));
  if (a.clinic) meta.push(esc(a.clinic));
  if (a.email) meta.push(esc(a.email));
  if (a.website) meta.push(esc(a.website));
  if (meta.length) h.push(`<p class="meta">${meta.join(" &middot; ")}</p>`);
  if (doc.generated) h.push(`<p class="meta">${esc(doc.generated)}</p>`);
  for (const b of (doc.blocks || [])) {
    if (b.type === "heading") h.push(`<h2>${esc(b.text)}</h2>`);
    else if (b.type === "sub") h.push(`<h3>${esc(b.text)}</h3>`);
    else if (b.type === "para") h.push(`<p>${esc(b.text)}</p>`);
    else if (b.type === "html") h.push(b.text);
    else if (b.type === "table") {
      h.push("<table><thead><tr>" + b.columns.map(c => `<th>${esc(c.header)}</th>`).join("") + "</tr></thead><tbody>");
      for (const r of b.rows) h.push("<tr>" + r.map(c => `<td>${esc(c)}</td>`).join("") + "</tr>");
      h.push("</tbody></table>");
    }
  }
  if (a.copyright) h.push(`<p class="copy">${esc(a.copyright)}</p>`);
  h.push("</div></body></html>");
  return h.join("");
}
