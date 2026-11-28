# Changelog

## 1.1.0 — 2026-11-28

- **Version 1.1.0.** This is the version the app itself reports — in the header chip, in the
  About tab and in `js/docs.js` — so `VERSION` and this changelog now say the same thing.
  Builds and the rolling `app-latest` release are named from `VERSION`.
- **Licence: PolyForm Noncommercial 1.0.0.** One text everywhere: the canonical licence from
  polyformproject.org with the `Required Notice: Copyright 2026 Dr Sohil Momin` line. Free for
  any noncommercial purpose; commercial use, sublicensing and resale are not permitted.
  `LICENSE`, the app's About tab (`js/docs.js`), `docs/GUIDE.md`, the README, the landing page
  and the deploy copy under `docs/play/` all carry it.

## 1.0.0 — 2026-10-25

- **Licence: PolyForm Noncommercial 1.0.0.** Every repository now carries the canonical text
  from polyformproject.org with the Required Notice line, and the four places a repo states
  its licence agree: LICENSE, the SPDX headers, the README and package.json.
- **The public demo is the app.** A build now fails if `docs/play/index.html` is not the app,
  because a demo running older code is two code paths for one program.
