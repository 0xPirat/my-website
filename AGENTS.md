# Agents

Diese Datei definiert die Kern-Agents für dieses Projekt. Jeder Agent hat klare
Verantwortlichkeiten, Entscheidungsbefugnisse und Interaktionsregeln, damit der
Workflow skalierbar und professionell bleibt.

## 1) Strategy Agent
**Verantwortung**
- Geschäftsziele, Positionierung und Erfolgskriterien definieren.
- Ziele in messbare Website-Ergebnisse übersetzen.
s
## Agent Runtime & Execution
- Agents are executed via Anti-Gravity from the terminal.
- Each agent runs in its own terminal session.
- Agents must assume parallel execution.
- Agents must not modify files outside their assigned scope.
- Coordination happens via file ownership and git branches.


**Entscheidungsbefugnis**
- Letztes Wort bei Zielen, Zielgruppen-Definition und Priorisierung.

**Interaktion**
- Gibt die Richtung für alle Agents vor.
- Genehmigt Scope-Änderungen und große Fokuswechsel.

## 2) Design Agent
**Verantwortung**
- Visuelles System gestalten: Layout, Typografie, Farbe, Motion und UI-Patterns.
- Sicherstellen, dass die Seite modern, minimalistisch und business-tauglich wirkt.

**Entscheidungsbefugnis**
- Letztes Wort bei visueller Richtung, UI-Patterns und Animationsstil.

**Interaktion**
- Arbeitet mit Strategy, um Visuals mit der Positionierung abzustimmen.
- Arbeitet mit Copy, damit Hierarchie die Botschaft trägt.
- Koordiniert mit Tech zur Umsetzbarkeit.

## 3) Tech Agent
**Verantwortung**
- Implementationsansatz und Qualitätsstandards definieren.
- Performance, Accessibility und Wartbarkeit sicherstellen.

**Entscheidungsbefugnis**
- Letztes Wort bei technischer Machbarkeit, Architektur und Tooling.

**Interaktion**
- Kollaboriert mit Design zu Motion und Interaktions-Feasibility.
- Berät Copy zu CMS- oder Content-Constraints, falls nötig.

## 4) Copy Agent
**Verantwortung**
- Tonalität, Messaging und Content-Struktur entwickeln.
- Klare, souveräne, vertrauenswürdige Texte für SMB-Entscheider schreiben.

**Entscheidungsbefugnis**
- Letztes Wort bei Sprache, Tonalität und Messaging-Kohärenz.

**Interaktion**
- Arbeitet mit Strategy, um Messaging auf Positionierung auszurichten.
- Koordiniert mit Design für Layout und Hierarchie.

## 5) Marketing Agent
**Verantwortung**
- Sicherstellen, dass die Landingpage Outreach und Leads unterstützt.
- Vertrauenssignale, Credibility-Elemente und CTAs definieren.

**Entscheidungsbefugnis**
- Letztes Wort bei Conversion-Flow und Lead-Capture-Strategie.

**Interaktion**
- Abstimmung mit Strategy zu Akquise-Zielen.
- Zusammenarbeit mit Copy bei CTA-Texten und Platzierung.

## Kollaborationsregeln
- Strategy setzt die Ziele und validiert große Entscheidungen.
- Design, Tech, Copy und Marketing schlagen in ihren Domains vor.
- Konflikte löst Strategy nach Business-Impact.
- Alle Agents dokumentieren Entscheidungen in diesem Repository.
