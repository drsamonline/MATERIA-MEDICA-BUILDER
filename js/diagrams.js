/* diagrams.js — inline SVG artwork used inside the app.
 * The same files are shipped as docs/*.svg for the README.
 */
export const WORKFLOW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 310" width="940" height="310" role="img" aria-label="How the builder fits together: materia medica and repertory feed the exporter">
  <defs>
    <style>
      .t{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
      .h{font-size:16px;font-weight:700;fill:#16211f}
      .b{font-size:12.5px;fill:#5c6b68}
      .cap{font-size:12.5px;fill:#8b9996}
      .card{fill:#ffffff;stroke:#dbe4e2;stroke-width:1.5}
    </style>
  </defs>
  <rect x="1" y="1" width="938" height="308" rx="16" fill="#f8fafb" stroke="#dbe4e2" stroke-width="1.5"/>

  <!-- Materia Medica -->
  <rect class="card" x="36" y="58" width="252" height="184" rx="14"/>
  <rect x="36" y="58" width="6" height="184" rx="3" fill="#0e9384"/>
  <text class="t h" x="60" y="90">Materia Medica</text>
  <text class="t b" x="60" y="120">•  remedy — name, abbreviation</text>
  <text class="t b" x="60" y="144">•  symptoms — chapter, text</text>
  <text class="t b" x="60" y="168">•  grade from your scale</text>
  <text class="t b" x="60" y="192">•  modalities — worse / better</text>
  <text class="t b" x="60" y="222" fill="#0b7a6e">Your own words, by hand</text>

  <!-- arrow -->
  <line x1="292" y1="150" x2="320" y2="150" stroke="#0e9384" stroke-width="2.5"/>
  <polygon points="320,143 332,150 320,157" fill="#0e9384"/>

  <!-- Repertory -->
  <rect class="card" x="340" y="58" width="252" height="184" rx="14"/>
  <rect x="340" y="58" width="6" height="184" rx="3" fill="#0e9384"/>
  <text class="t h" x="364" y="90">Repertory</text>
  <text class="t b" x="364" y="120">•  chapters — Mind, Head…</text>
  <text class="t b" x="364" y="144">•  rubrics — text, parent, note</text>
  <text class="t b" x="364" y="168">•  graded remedies attached</text>
  <text class="t b" x="364" y="192">•  marking scheme applied</text>
  <text class="t b" x="364" y="222" fill="#0b7a6e">Searchable, structured</text>

  <!-- arrow -->
  <line x1="596" y1="150" x2="624" y2="150" stroke="#0e9384" stroke-width="2.5"/>
  <polygon points="624,143 636,150 624,157" fill="#0e9384"/>

  <!-- Export -->
  <rect class="card" x="644" y="58" width="260" height="184" rx="14"/>
  <rect x="644" y="58" width="6" height="184" rx="3" fill="#0e9384"/>
  <text class="t h" x="668" y="90">Export</text>
  <text class="t b" x="668" y="120">•  JSON · CSV</text>
  <text class="t b" x="668" y="144">•  Excel · PDF · HTML</text>
  <text class="t b" x="668" y="168">•  SQL · SQLite database</text>
  <text class="t b" x="668" y="192">•  stamped with your name</text>
  <text class="t b" x="668" y="222" fill="#0b7a6e">Eight formats, one click</text>

  <text class="t cap" x="470" y="282" text-anchor="middle">Everything stays in your browser — offline, private, no account.</text>
</svg>`;

export const ARCHITECTURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 300" width="940" height="300" role="img" aria-label="Architecture: a browser-only app storing to IndexedDB and writing files directly">
  <defs>
    <style>
      .t{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
      .h{font-size:15.5px;font-weight:700;fill:#16211f}
      .chip{font-size:12.5px;fill:#16211f}
      .cap{font-size:12.5px;fill:#8b9996}
      .card{fill:#ffffff;stroke:#dbe4e2;stroke-width:1.5}
      .box{fill:#f3f7f6;stroke:#dbe4e2;stroke-width:1.2}
    </style>
  </defs>
  <rect x="1" y="1" width="938" height="298" rx="16" fill="#f8fafb" stroke="#dbe4e2" stroke-width="1.5"/>

  <!-- browser -->
  <rect class="card" x="36" y="50" width="474" height="196" rx="14"/>
  <rect x="36" y="50" width="6" height="196" rx="3" fill="#0e9384"/>
  <text class="t h" x="60" y="82">This browser — offline</text>
  <text class="t cap" x="60" y="102">No server, no account, no tracking</text>

  <rect class="box" x="56" y="116" width="204" height="32" rx="9"/><text class="t chip" x="68" y="137">db.js · IndexedDB storage</text>
  <rect class="box" x="272" y="116" width="216" height="32" rx="9"/><text class="t chip" x="284" y="137">builders.js · documents</text>
  <rect class="box" x="56" y="156" width="204" height="32" rx="9"/><text class="t chip" x="68" y="177">exporters.js · file writers</text>
  <rect class="box" x="272" y="156" width="216" height="32" rx="9"/><text class="t chip" x="284" y="177">docs.js · tour.js · help</text>
  <rect class="box" x="56" y="196" width="204" height="32" rx="9"/><text class="t chip" x="68" y="217">app.js · interface</text>
  <rect class="box" x="272" y="196" width="216" height="32" rx="9"/><text class="t chip" x="284" y="217">service worker · offline</text>

  <!-- arrow -->
  <line x1="516" y1="148" x2="546" y2="148" stroke="#0e9384" stroke-width="2.5"/>
  <polygon points="546,141 558,148 546,155" fill="#0e9384"/>
  <text class="t cap" x="531" y="132" text-anchor="middle">writes</text>

  <!-- files -->
  <rect class="card" x="564" y="50" width="340" height="196" rx="14"/>
  <rect x="564" y="50" width="6" height="196" rx="3" fill="#0e9384"/>
  <text class="t h" x="588" y="82">Your files</text>
  <text class="t cap" x="588" y="102">Generated in the browser, byte by byte</text>

  <rect class="box" x="588" y="116" width="140" height="30" rx="9"/><text class="t chip" x="602" y="136">JSON · CSV</text>
  <rect class="box" x="740" y="116" width="140" height="30" rx="9"/><text class="t chip" x="754" y="136">Excel · HTML</text>
  <rect class="box" x="588" y="154" width="140" height="30" rx="9"/><text class="t chip" x="602" y="174">PDF book</text>
  <rect class="box" x="740" y="154" width="140" height="30" rx="9"/><text class="t chip" x="754" y="174">SQL · SQLite</text>
  <rect class="box" x="588" y="192" width="292" height="30" rx="9"/><text class="t chip" x="602" y="212">Re-importable backup — restore on any device</text>

  <text class="t cap" x="470" y="276" text-anchor="middle">Nothing leaves the device unless you export it.</text>
</svg>`;

export const MARKING_SCALE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 210" width="760" height="210" role="img" aria-label="Marking scale: four gradations, each with its own typographic style">
  <defs>
    <style>
      .t{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
      .h{font-size:15.5px;font-weight:700;fill:#16211f}
      .cap{font-size:12.5px;fill:#8b9996}
      .num{font-size:40px;fill:#0b7a6e;font-family:Georgia,'Times New Roman',serif}
      .lab{font-size:12.5px;fill:#5c6b68}
      .card{fill:#ffffff;stroke:#dbe4e2;stroke-width:1.5}
    </style>
  </defs>
  <rect x="1" y="1" width="758" height="208" rx="16" fill="#f8fafb" stroke="#dbe4e2" stroke-width="1.5"/>
  <text class="t h" x="34" y="46">Your marking scale — you define it</text>

  <rect class="card" x="34" y="70" width="158" height="106" rx="12"/>
  <text class="t num" x="113" y="128" text-anchor="middle">1</text>
  <text class="t lab" x="113" y="156" text-anchor="middle">plain</text>

  <rect class="card" x="212" y="70" width="158" height="106" rx="12"/>
  <text class="t num" x="291" y="128" text-anchor="middle" font-style="italic">2</text>
  <text class="t lab" x="291" y="156" text-anchor="middle">italic</text>

  <rect class="card" x="390" y="70" width="158" height="106" rx="12"/>
  <text class="t num" x="469" y="128" text-anchor="middle" font-weight="700">3</text>
  <text class="t lab" x="469" y="156" text-anchor="middle">bold</text>

  <rect class="card" x="568" y="70" width="158" height="106" rx="12"/>
  <text class="t num" x="647" y="128" text-anchor="middle" font-weight="700">4</text>
  <text class="t lab" x="647" y="156" text-anchor="middle">CAPITALS</text>

  <text class="t cap" x="380" y="196" text-anchor="middle">Kent 3-point · 4-point · Boenninghausen 5-point · or your own</text>
</svg>`;
