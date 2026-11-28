/* docs.js — in-app documentation.
 * Everything the Help and About tabs render lives here, so the app carries its
 * own README, maker details and licence. Edit these constants to rebrand.
 */

export const APP = {
  name: "Materia Medica Builder",
  version: "1.2.0",
  tagline: "Your own materia medica & repertory — offline, private, exportable.",
  repo: "https://github.com/drsamonline/MATERIA-MEDICA-BUILDER",
  live: "https://drsamonline.github.io/MATERIA-MEDICA-BUILDER/",
  licenceName: "PolyForm Perimeter 1.0.1",
};

export const MAKER = {
  name: "Dr Sohil Momin",
  credentials: "BHMS",
  role: "Homeopathic physician",
  tagline: "Doctor, Poet, Social Worker.",
  initials: "SM",
  github: "drsamonline",
  githubUrl: "https://github.com/drsamonline",
  email: "sohilmomin2000@gmail.com",
  website: "https://drsamonline.github.io/",
  blurb: "Built so that any practitioner — or any individual studying on their own — can assemble a personal materia medica and repertory by hand, keep it entirely private, and publish or back it up in whatever form they need.",
};

export const DEDICATION = {
  title: "Dedication",
  lead: "To the homeopaths of the past, the present and the future.",
  paragraphs: [
    "To those of the past \u2014 who sat with the sick through long nights and wrote down what they saw, symptom by symptom and remedy by remedy, so that what they learned would not be lost.",
    "To those of the present \u2014 who still take the whole case: the body, the mind, and the life around it; who keep this craft alive in a hurried world, and who teach it to whoever asks.",
    "To those of the future \u2014 who will inherit whatever we choose to record, and who will add their own careful observations to the record.",
    "And to anyone studying alone, with no teacher at hand and no one to compare notes with \u2014 may this make the work a little lighter.",
  ],
  signoff: "Dr Sohil Momin",
};

export const LICENCE = {
  name: "PolyForm Perimeter 1.0.1",
  year: 2026,
  holder: "Dr Sohil Momin",
  summary: "Free for any purpose, including paid practice and commercial work \u2014 the only restriction is that you may not ship a competing product built from it.",
  short: "Free to use, including in your practice.",
  clauses: [
    "You may use, copy, modify and share this software for any purpose \u2014 personal study, teaching, research, a paid practice or clinic, and use inside any organisation.",
    "Anyone who receives a copy from you must also get these terms, or the link to them, together with the Required Notice line naming the author.",
    "You may not sublicense or transfer your licences to anyone else, and you may not provide to others any product that competes with this software \u2014 including using it to market a substitute for it.",
    "The software is provided \u201cas is\u201d, without warranty or condition. The author is not liable for any damages arising out of these terms or the use of the software.",
  ],
  full:
`Required Notice: Copyright 2026 Dr Sohil Momin

# PolyForm Perimeter License 1.0.1

<https://polyformproject.org/licenses/perimeter/1.0.1>

## Acceptance

In order to get any license under these terms, you must agree to them as both strict obligations and conditions to all your licenses.

## Copyright License

The licensor grants you a copyright license for the software to do everything you might do with the software that would otherwise infringe the licensor's copyright in it for any permitted purpose.  However, you may only distribute the software according to [Distribution License](#distribution-license) and make changes or new works based on the software according to [Changes and New Works License](#changes-and-new-works-license).

## Distribution License

The licensor grants you an additional copyright license to distribute copies of the software.  Your license to distribute covers distributing the software with changes and new works permitted by [Changes and New Works License](#changes-and-new-works-license).

## Notices

You must ensure that anyone who gets a copy of any part of the software from you also gets a copy of these terms or the URL for them above, as well as copies of any plain-text lines beginning with \`Required Notice:\` that the licensor provided with the software.  For example:

> Required Notice: Copyright Yoyodyne, Inc. (http://example.com)

## Changes and New Works License

The licensor grants you an additional copyright license to make changes and new works based on the software for any permitted purpose.

## Patent License

The licensor grants you a patent license for the software that covers patent claims the licensor can license, or becomes able to license, that you would infringe by using the software.

## Noncompete

Any purpose is a permitted purpose, except for providing to others any product that competes with the software.

## Competition

If you use this software to market a product as a substitute for the functionality or value of the software, it competes with the software. A product may compete regardless how it is designed or deployed. For example, a product may compete even if it provides its functionality via any kind of interface (including services, libraries or plug-ins), even if it is ported to a different platform or programming language, and even if it is provided free of charge.

## Fair Use

You may have "fair use" rights for the software under the law. These terms do not limit them.

## No Other Rights

These terms do not allow you to sublicense or transfer any of your licenses to anyone else, or prevent the licensor from granting licenses to anyone else.  These terms do not imply any other licenses.

## Patent Defense

If you make any written claim that the software infringes or contributes to infringement of any patent, your patent license for the software granted under these terms ends immediately. If your company makes such a claim, your patent license ends immediately for work on behalf of your company.

## Violations

The first time you are notified in writing that you have violated any of these terms, or done anything with the software not covered by your licenses, your licenses can nonetheless continue if you come into full compliance with these terms, and take practical steps to correct past violations, within 32 days of receiving notice.  Otherwise, all your licenses end immediately.

## No Liability

***As far as the law allows, the software comes as is, without any warranty or condition, and the licensor will not be liable to you for any damages arising out of these terms or the use or nature of the software, under any kind of legal claim.***

## Definitions

The **licensor** is the individual or entity offering these terms, and the **software** is the software the licensor makes available under these terms.

A **product** can be a good or service, or a combination of them.

**You** refers to the individual or entity agreeing to these terms.

**Your company** is any legal entity, sole proprietorship, or other kind of organization that you work for, plus all organizations that have control over, are under the control of, or are under common control with that organization.  **Control** means ownership of substantially all the assets of an entity, or the power to direct its management and policies by vote, contract, or otherwise.  Control can be direct or indirect.

**Your licenses** are all the licenses granted to you for the software under these terms.

**Use** means anything you do with the software requiring one of your licenses.
`,
};

/* The in-app "how to use" guide. Each block: {h} heading, {p} paragraph,
 * {list:[...]} bullets, {steps:[...]} numbered steps, {table:{head,rows}}. */
export const HOWTO = [
  { h: "What this app is" },
  { p: "Materia Medica Builder lets you assemble your own materia medica and repertory — remedy by remedy, rubric by rubric — and export the result as a book. Everything is stored in your browser on this device. Nothing is uploaded, and there is no account to create." },
  { list: [
    "Materia Medica — your remedies, each with its own symptoms, chapters and grades.",
    "Repertory — chapters of rubrics, each rubric carrying graded remedies.",
    "Marking — the grading scale you mark remedies with; ship-in presets or your own.",
    "Cases — a private case log with outcome tracking.",
    "Author — your name and book details, stamped into every export.",
    "Data — export and import in JSON, CSV, Excel, PDF, HTML, SQL and SQLite.",
  ] },

  { h: "Getting started" },
  { steps: [
    "Open the Materia Medica tab and add your first remedy (or edit the three starter remedies).",
    "Give it an abbreviation — short forms like Acon or Nat-m are what the repertory shows.",
    "Add symptoms to it: pick a chapter (Mind, Head, Stomach…), write the symptom, and set a grade.",
    "Open the Repertory tab, add a chapter, then add rubrics inside it.",
    "Inside a rubric, type a remedy abbreviation and press Enter to attach it, then choose its grade.",
    "Set your Author details, then go to Data and export your book.",
  ] },
  { p: "Tip: install the app first (see below) so it keeps working with no internet, and export a backup regularly — clearing your browser data will erase your project." },

  { h: "Installing it as an app" },
  { p: "This is a Progressive Web App. Once installed it opens like any other app and works entirely offline." },
  { list: [
    "Android / Chrome: menu (⋮) → Install app, or the install icon in the address bar.",
    "iPhone / iPad: Share → Add to Home Screen.",
    "Desktop (Chrome, Edge): the install icon in the address bar.",
  ] },

  { h: "Building the materia medica" },
  { p: "A remedy holds the fixed facts: name, abbreviation, common name, kingdom, family, source and notes. Its symptoms carry the detail — each symptom has a chapter, its text, a grade, and optional modalities written as “worse night” or “better motion”, separated by semicolons." },
  { p: "Symptom text and notes save automatically when you leave the field." },

  { h: "Building the repertory" },
  { p: "The repertory is organised as chapters → rubrics → graded remedies. A rubric is a symptom heading such as “Anxiety, about health”. A rubric may also have a parent heading (so “Morning” under “Sweat of the feet” reads as “Sweat of the feet, Morning”) and a note." },
  { p: "To attach a remedy, type its abbreviation into the + remedy box inside the rubric and press Enter. Choose the grade from the small dropdown beside it. The remedies you can attach are the ones you created in Materia Medica." },

  { h: "The marking system" },
  { p: "Marks are entirely up to you. Four schemes ship in:" },
  { table: { head: ["Scheme", "Levels"], rows: [
    ["Kent 3-point", "1 plain · 2 italic · 3 bold"],
    ["4-point", "1 plain · 2 italic · 3 bold · 4 CAPITALS"],
    ["Boenninghausen 5-point", "1 plain · 2 italic · 3 bold · 4 bold-italic · 5 CAPITALS"],
    ["Simple 0–2", "– not marked · + present · ++ strong"],
  ] } },
  { p: "Pick one as active, edit any of them, or press “New scheme” to define your own scale — any number of levels, each with a label and a style (plain, italic, bold, bold-italic, capitals or superscript). Rubrics everywhere use the active scheme, and every export renders the grades accordingly." },

  { h: "Your author details" },
  { p: "Fill in the Author tab before you export. Your name, credentials, clinic, book title, edition, year, copyright line and licence are printed into the PDF and HTML documents and carried in the Excel workbook, so the finished book is unmistakably yours." },

  { h: "Logging cases" },
  { p: "The Cases tab is a private clinical log: patient initials, age, gender, chief complaint, the remedy and potency given, the outcome (Cured, Improved, No Change, Aggravated, Suppressed) and follow-up notes. Cases can be filtered by outcome, edited and deleted." },

  { h: "Exporting your book" },
  { table: { head: ["Format", "What you get"], rows: [
    ["JSON — full backup", "Everything, re-importable here to restore the project"],
    ["JSON — OMM", "Repertory and/or materia medica in the reader-app schema"],
    ["CSV", "All datasets as a zip, or one dataset at a time"],
    ["Excel (.xlsx)", "A workbook: Info, Remedies, Symptoms, Repertory, Cases, Marking"],
    ["PDF", "A printable book with your author block and copyright"],
    ["HTML", "A self-contained, styled document you can open or host"],
    ["SQL (.sql)", "INSERT statements for SQLite, Postgres or MySQL"],
    ["SQLite (.sqlite)", "A real database file with remedy, symptom, rubric and case tables"],
  ] } },

  { h: "Importing" },
  { p: "Import accepts a full JSON backup, an OMM repertory or materia-medica file, or CSV. Choose Merge to add to what is already there, or Replace to wipe the project and load the file." },

  { h: "Privacy and backups" },
  { list: [
    "Your data never leaves this device — no server, no account, no analytics.",
    "Clearing your browser data will erase the project: export a JSON backup regularly.",
    "Import that backup on any device to carry your work across.",
  ] },
];

export const FAQ = [
  { q: "Where is my data stored?", a: "In this browser, in an IndexedDB database on your device. It is not uploaded anywhere." },
  { q: "Can I use my own grading scale?", a: "Yes. Marking → New scheme. Define any levels you like and mark them active." },
  { q: "Will my repertory open in the reader app?", a: "Yes — the OMM JSON export uses the same schema your reader app reads." },
  { q: "How do I move everything to a new device?", a: "Data → export JSON (full backup), then Data → import it on the new device." },
  { q: "Is it free?", a: "Yes — free for any purpose, including use in a paid practice or clinic. The one restriction is competition: you may not ship a competing product built from it. See the licence below." },
];
