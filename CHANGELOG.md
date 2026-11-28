# Changelog

## 1.2.0 — 2026-11-28

- **Licence: PolyForm Perimeter 1.0.1.** Noncommercial 1.0.0 forbade the app's main use — a
  practitioner taking it into a paid clinic — and a sole practice counts as commercial. It also
  granted no way to become licensed, so the honest reader had to stop at the door. Perimeter
  permits any purpose, including paid practice, while keeping the one restriction worth keeping:
  you may not provide to others a product that competes with the software. `LICENSE`, the About
  tab, `docs/GUIDE.md`, the README, the landing page and `docs/play/` all carry it, with the same
  `Required Notice: Copyright 2026 Dr Sohil Momin` line.
- **Version 1.2.0,** in `VERSION`, the header chip, the About tab and the landing page metadata.
- **Copies already shipped stay under 1.0.0.** A licence cannot be widened retroactively, so
  anything downloaded before this release keeps the noncommercial terms it arrived with; update
  to this version to get the Perimeter terms.
- **The SPDX header on `build-apps.yml` reads `LicenseRef-PolyForm-Perimeter-1.0.1`.** Perimeter
  is not on the SPDX licence list (Noncommercial and Small Business are), so a `LicenseRef-`
  identifier is the accurate way to name it rather than inventing a list identifier.

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
