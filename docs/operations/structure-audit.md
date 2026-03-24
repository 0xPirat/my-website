# Struktur-Audit

Stand: 2026-03-09

## Aktive Projektstruktur

- Root: oeffentliche HTML-Routen und Projekt-Metadaten
- `src/scripts/`: aktives Frontend-JavaScript
- `src/styles/main.css`: produktives Stylesheet
- `public/media/`: produktive Bilder und Videos
- `public/models/`, `public/textures/`: optimierte Web-Assets fuer 3D
- `source-assets/`: Rohdaten und nicht produktive Quellmedien
- `docs/architecture/`, `docs/planning/`, `docs/research/`, `docs/strategy/`, `docs/operations/`: fachlich getrennte Dokumentation
- `archive/legacy/frontend/`: abgeloeste Frontend-Staende
- `@AGENTS.md/`: kanonische Agentenablage

## Verschobene Dateien

- `case-study-template.html` -> `case-study.html`
- `work-approach.html` -> Prozess-Inhalt auf der Landingpage
- `styles-v2.css` -> `src/styles/main.css`
- `script.js`, `script-v2.js`, `styles.css` -> `archive/legacy/frontend/`
- aktive Medien aus `pictures/` -> `public/media/`
- ungenutzte Medienvarianten aus `pictures/` -> `source-assets/`
- verstreute Notizen und Research-Dateien aus dem Root -> `docs/`
- `REVIEWER.md` -> `@AGENTS.md/core/reviewer/AGENTS.md`

## Gepruefte Redundanzen

- JavaScript-Duplikation reduziert: Die aktiven Seiten nutzen jetzt nur noch `src/scripts/app.js`.
- CSS-Duplikation reduziert: Es gibt nur noch ein produktives Stylesheet unter `src/styles/main.css`.
- Medienvarianten getrennt: `portrait-johannes-benedict.jpg` ist das aktive Webbild, waehrend `ich.heic`, `ich.heic.png` und `ich.jpg` als Quellvarianten unter `source-assets/images/portraits/` liegen.
- Research und Arbeitsnotizen liegen nicht mehr doppelt im Root und in Fachordnern.

## Offene Beobachtungen

- `privacy.html` und `datenschutz.html` behandeln denselben Themenbereich in unterschiedlichen Sprachen; das ist inhaltlich verwandt, aber keine technische Dublette.
- Der alte Ordner `pictures/` enthaelt aktuell nur noch System-Metadaten und ist fachlich nicht mehr Teil der Zielstruktur.
