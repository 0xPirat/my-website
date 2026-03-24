# Agent Registry

Diese Struktur ist die kanonische Ablage fuer alle Agenten und Sub-Agents in
diesem Repository. Fachliche Agent-Dokumente liegen nicht mehr in `docs`,
sondern gesammelt unter `@AGENTS.md/`.

## Zweck

- die Zusammenarbeit aller Agents klar regeln
- Ueberschneidungen zwischen Agents frueh sichtbar machen
- alle Agenten an einem festen Ort halten
- Parent-Agents und Sub-Agents sauber trennen
- klare Ordnerlogik fuer spaetere Erweiterungen schaffen
- Frontend, Kernrollen und kuenftige Spezialrollen belastbar organisieren

## Grundregeln

- Jeder Agent hat einen klar begrenzten Scope.
- Agents sollen sich nicht gegenseitig in denselben Verantwortungsbereich schneiden.
- Sobald eine Aenderung mehrere Bereiche betrifft, wird sie zwischen den betroffenen Agents abgestimmt.
- Parent-Agents halten gemeinsame Regeln fest, Sub-Agents fuehren sie in ihrem Scope aus.

## Geschuetzte Nutzerinhalte

- `notizen.txt` ist eine geschuetzte Nutzerdatei.
- Vom Nutzer gepflegte Bilder, Texte, Notizen und sonstige eigene Inhalte sind geschuetzt.
- Kein Agent darf `notizen.txt` aendern, verschieben, umbenennen, loeschen oder automatisch formatieren.
- Kein Agent darf nutzereigene Bilder, Texte, Notizen oder sonstige Inhalte ohne ausdrueckliche Freigabe loeschen.
- Kein Agent darf Nutzertexte oder Notizen eigenmaechtig umschreiben, umstrukturieren oder als Arbeitsdatei ueberschreiben.
- Kein Agent darf nutzerseitige Aenderungen einfach entfernen, nur weil sie unordentlich, redundant oder ersetzbar wirken.
- Wenn eine Aufgabe mit geschuetzten Nutzerinhalten kollidiert, wird dort nicht gearbeitet und zuerst Ruecksprache gehalten.

## Ordnerstruktur

- `core/AGENTS.md` enthaelt die uebergeordneten Projekt-Agents.
- `core/<name>/AGENTS.md` enthaelt spezialisierte Core-Rollen wie Reviews.
- `frontend/AGENTS.md` enthaelt das Frontend-System und seine Website-Regeln.
- `project-structure/AGENTS.md` enthaelt die projektweite Logik fuer Ordner, Ablage und Redundanzvermeidung.
- `frontend/sub-agents/<name>/AGENTS.md` enthaelt genau einen klar benannten Frontend-Sub-Agent.

## Aktuelle Struktur

1. Core Agents
2. Core Spezialrollen
3. Frontend Agents
4. Project Structure Agent
5. Frontend Sub-Agents

### Frontend Sub-Agents

- Frontend Style Agent
- Frontend Animation Agent
- Frontend Information Architecture Agent

## Ablageregeln

- Jede neue Agent-Rolle bekommt einen eigenen Ordner mit eigener `AGENTS.md`.
- Sub-Agents liegen immer unter dem zustaendigen Parent-Agent.
- Spezialisierte Core-Rollen duerfen unter `core/<name>/AGENTS.md` abgelegt werden.
- `docs/` ist nicht die kanonische Agentenablage.
- Referenzen in anderen Dateien sollen auf diese Struktur zeigen.
