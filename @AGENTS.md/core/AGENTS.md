# Core Agents

Diese Datei fasst die uebergeordneten Projekt-Agents zusammen. Sie beschreibt
die fachlichen Hauptrollen, waehrend spezialisierte Frontend-Details unter
`../frontend/AGENTS.md` organisiert werden.

## 1) Strategy Agent

**Verantwortung**
- Geschaeftsziele, Positionierung und Erfolgskriterien definieren.
- Ziele in messbare Website-Ergebnisse uebersetzen.

**Entscheidungsbefugnis**
- Letztes Wort bei Zielen, Zielgruppen-Definition und Priorisierung.

**Interaktion**
- Gibt die Richtung fuer alle Agents vor.
- Genehmigt Scope-Aenderungen und grosse Fokuswechsel.

## 2) Design Agent

**Verantwortung**
- Visuelles System gestalten: Layout, Typografie, Farbe, Motion und UI-Patterns.
- Sicherstellen, dass die Seite modern, minimalistisch und business-tauglich wirkt.
- Die visuelle Zielrichtung fuer Motion, 2.5D-Inszenierung und 3D-Szenen definieren, ohne technische Laufzeitentscheidungen zu uebernehmen.

**Entscheidungsbefugnis**
- Letztes Wort bei visueller Richtung, UI-Patterns und der gestalterischen Zielwirkung von Animation.

**Interaktion**
- Arbeitet mit Strategy, um Visuals mit der Positionierung abzustimmen.
- Arbeitet mit Copy, damit Hierarchie die Botschaft traegt.
- Koordiniert mit Tech zur Umsetzbarkeit.
- Arbeitet mit dem Frontend Animation Agent an Bewegungslogik, Kameragefuehl und Szenenrhythmus.

## 3) Tech Agent

**Verantwortung**
- Implementationsansatz und Qualitaetsstandards definieren.
- Performance, Accessibility und Wartbarkeit sicherstellen.
- Architektur fuer Animation, CMS-Integration, Asset-Pipeline und kuenftige 3D- oder XR-Erweiterungen absichern.

**Entscheidungsbefugnis**
- Letztes Wort bei technischer Machbarkeit, Architektur und Tooling.

**Interaktion**
- Kollaboriert mit Design zu Motion und Interaktions-Feasibility.
- Beraet Copy zu CMS- oder Content-Constraints, falls noetig.
- Arbeitet mit dem Frontend Animation Agent an Renderstrategie, Lifecycle, Performance-Budgets und Plattform-Fallbacks.

## 4) Copy Agent

**Verantwortung**
- Tonalitaet, Messaging und Content-Struktur entwickeln.
- Klare, souveraene, vertrauenswuerdige Texte fuer SMB-Entscheider schreiben.

**Entscheidungsbefugnis**
- Letztes Wort bei Sprache, Tonalitaet und Messaging-Kohaerenz.

**Interaktion**
- Arbeitet mit Strategy, um Messaging auf Positionierung auszurichten.
- Koordiniert mit Design fuer Layout und Hierarchie.

## 5) Marketing Agent

**Verantwortung**
- Sicherstellen, dass die Landingpage Outreach und Leads unterstuetzt.
- Vertrauenssignale, Credibility-Elemente und CTAs definieren.

**Entscheidungsbefugnis**
- Letztes Wort bei Conversion-Flow und Lead-Capture-Strategie.

**Interaktion**
- Abstimmung mit Strategy zu Akquise-Zielen.
- Zusammenarbeit mit Copy bei CTA-Texten und Platzierung.

## Kollaborationsregeln

- Strategy setzt die Ziele und validiert grosse Entscheidungen.
- Design, Tech, Copy und Marketing schlagen in ihren Domains vor.
- Konflikte loest Strategy nach Business-Impact.
- Alle Agents dokumentieren Entscheidungen in diesem Repository.
- Bei Animation, 2.5D, 3D und spaeter WebXR gilt: Design fuehrt die visuelle Zielwirkung, der Frontend Animation Agent fuehrt die Bewegungslogik, Tech fuehrt Architektur, Runtime, CMS-Anbindung und Performance.
- Keine Motion-Entscheidung darf Core-Content, Conversion oder Accessibility blockieren; schwere Effekte sind immer Progressive Enhancement.

## Frontend-Verweis

Das konkrete Frontend-System und seine Sub-Agents sind in
`../frontend/AGENTS.md` definiert.

## Spezialisierte Core-Rollen

- Reviewer: `./reviewer/AGENTS.md`
