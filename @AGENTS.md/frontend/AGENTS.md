# Frontend Agents

Diese Datei definiert die reduzierte, aber belastbare Frontend-Struktur fuer
diese Website. Sie ist bewusst schlank gehalten und organisiert die Arbeit
ueber alle Seiten hinweg als ein gemeinsames System.

## Zweck

Das Frontend-Team arbeitet mit drei klaren Sub-Agents:

1. Frontend Style Agent
2. Frontend Animation Agent
3. Frontend Information Architecture Agent

Der Frontend Style Agent schuetzt den visuellen Auftritt.
Der Frontend Animation Agent schuetzt die Bewegungsqualitaet.
Der Frontend Information Architecture Agent schuetzt Seitenarchitektur, Navigation und die innere Logik der Website.

## Offizielle Agentennamen

- `Frontend Style Agent`
- `Frontend Animation Agent`
- `Frontend Information Architecture Agent`

## Website-Scope

Der gemeinsame Scope umfasst die komplette oeffentliche Website:

- Landingpage
- Work Approach
- Unser Team
- Projektanfrage
- Impressum
- Datenschutz

Falls weitere Sprachversionen oder zusaetzliche Rechtsseiten gepflegt werden,
gelten dieselben Regeln auch dort.

## Kernziel

- Die Website soll wie aus einem Guss wirken.
- Stil, Struktur, Navigation und technische Umsetzung muessen seitenuebergreifend konsistent bleiben.
- Ein freigegebenes Referenzbild oder Moodbild wird systemisch auf die ganze Website uebertragen.
- Animationen sollen Qualitaet, Orientierung und Modernitaet unterstuetzen, nicht ablenken.
- Die innere Logik der Website muss klar, belastbar und spaeter erweiterbar sein.

## Stack-Perspektive fuer anspruchsvolle Motion

- Das Frontend darf heute in einer schlanken DOM-Struktur leben und spaeter nach `Nuxt 3 + TypeScript + Prismic` migriert oder erweitert werden.
- Diese Datei ist deshalb fuer zwei Zustaende verbindlich: aktuelle DOM/GSAP-Arbeit und kuenftige komponentenbasierte Nuxt-Arbeit.
- Animation wird immer stufenweise gedacht: CSS/DOM zuerst, dann `GSAP` fuer saubere Orchestrierung, dann `Three.js` fuer echte 3D-Szenen, `WebXR` nur als optionale Erweiterung.
- Die technisch leichtere Stufe gewinnt, solange sie die gestalterische Aufgabe sauber loest.

## Verbindliche Markenreferenz

Die aktuelle Hauptreferenz fuer das Frontend ist das buildIT-Zeichen mit
dunklem Navy-Fond, indigo-violetten Flaechen, hellen Periwinkle-Kanten und
ineinandergreifender prismatischer Geometrie.

Diese Referenz ist nicht nur fuer die Startseite gedacht, sondern fuer die
komplette Website. Jeder Frontend-Agent muss daraus ein wiedererkennbares
System ableiten.

### Pflichtmerkmale fuer alle Frontend-Arbeiten

- Grundpalette bleibt im Spektrum aus Deep Navy, Indigo, Violett, Lilac und kuehlem Periwinkle.
- Tuerkis-, Gruen-, Orange- oder warm-beige Akzentwelten duerfen den Hauptauftritt nicht dominieren.
- Formen leiten sich aus Hexagon-Anmutung, Diagonalen, angeschnittenen Kanten, Banden und prismatischen Flaechen ab.
- Karten, Buttons, Panels, Divider, Hintergruende und Illustrationsflaechen greifen dieselbe Geometrie auf.
- Licht sitzt bevorzugt an Kanten und Flaechenuebergaengen, nicht als diffuse Effektwolke ohne Formbezug.
- Tiefe entsteht ueber Ueberlagerung, Schattenstaffelung und kontrollierte Highlights statt ueber starke Skeuomorphie.
- Rechtliche Seiten bleiben ruhiger, muessen aber dieselbe Palette, dieselben Kantenmotive und dieselbe Materialitaet behalten.

### Uebersetzungsregel

Die Referenz wird nicht als einzelnes Logo-Element kopiert. Sie wird in ein
robustes Frontend-System uebersetzt:

- Hintergruende tragen prismatische Lichtbahnen oder geometrische Strukturen.
- Komponenten zeigen klare Kantenfuehrung und gezielte beveled Details.
- Motion folgt denselben Linien und Flaechen statt runder, verspielter Bewegungen.
- Seitenstruktur, Navigation und Abschnittslogik muessen ebenso praezise und bewusst wirken wie der Stil.
- Neue Sektionen muessen auch ohne Logo klar als buildIT erkennbar bleiben.

## Ownership-Matrix

### Visuelles System

- Fuehrend: Frontend Style Agent
- Mitwirkend: Frontend Animation Agent

### Motion-System

- Fuehrend: Frontend Animation Agent
- Mitwirkend: Frontend Style Agent
- Mitwirkend: Tech Agent, sobald Runtime, CMS-Daten, Asset-Load oder Renderpfad betroffen sind

### Render- und Runtime-Architektur

- Fuehrend: Tech Agent
- Mitwirkend: Frontend Animation Agent
- Mitwirkend: Frontend Information Architecture Agent, sobald Seiten- oder Komponentenstruktur betroffen ist

### CMS-, Content- und Szenenvertraege

- Fuehrend: Tech Agent
- Mitwirkend: Frontend Animation Agent
- Mitwirkend: Copy Agent, sobald redaktionelle Felder oder Inhaltslogik betroffen sind

### Seitenarchitektur und Navigationslogik

- Fuehrend: Frontend Information Architecture Agent

### Accessibility und Responsive Behavior

- Gemeinsame Pflicht aller Frontend-Agents

## Verbindliche technische Leitplanken

- Ueberschriften, Kernaussagen, CTAs und legal relevante Inhalte muessen ohne WebGL, ohne 3D und ohne Scroll-Magie lesbar bleiben.
- Browser- und Geraete-APIs laufen nur clientseitig; SSR, Hydration und Route-Wechsel werden bei Motion-Entscheidungen aktiv mitgedacht.
- Schwere 3D-Assets, Texturen und XR-spezifischer Code werden nur lazy geladen und nur dort, wo sie narrativen oder funktionalen Mehrwert liefern.
- `Prismic` oder anderes CMS darf Animationen steuern, aber nur ueber klar definierte Felder und Zustandsmodelle, nicht ueber unkontrollierte freie Datenstrukturen.
- `Blender`-Quellen bleiben Authoring-Artefakte; in die Runtime gelangen nur optimierte Web-Assets.
- `WebXR` ist immer optional. Jede XR-Idee braucht eine gleichwertige Nicht-XR-Nutzung und darf keine Hauptnavigation oder Conversion blockieren.

## Performance- und Accessibility-Mindestregeln

- Motion darf Scrollen, Pointer-Interaktion und Lesbarkeit auf mobilen Geraeten nicht destabilisieren.
- Reduced Motion ist nicht nur ein Schalter fuer weniger Effekte, sondern braucht eine echte alternative Darstellung ohne Informationsverlust.
- Rechtliche Seiten bleiben nahezu statisch und tragen keine schweren Szenen, Shader oder 3D-Modelle.
- Canvas-, WebGL- und XR-Inhalte brauchen klare Fallbacks, Fokuslogik und eine Route, die ohne diese Technologien benutzbar bleibt.
- Jede neue Motion-Stufe braucht eine klare Exit-Strategie fuer Cleanup, Unmount und Ressourcenfreigabe.

## Schnittstelle zum Project Structure Agent

- Projektweite Ordnerlogik, Ablageorte und Redundanzvermeidung liegen nicht im Frontend-Team, sondern im `../project-structure/AGENTS.md`.
- Sobald Seitenlogik neue Datei-, Template- oder Komponentenstrukturen im Projekt ausloest, stimmt sich der Frontend Information Architecture Agent mit dem Project Structure Agent ab.

## Seitenlogik

- Die Landingpage positioniert das Angebot und fuehrt in die Projektanfrage.
- Work Approach zeigt bisherige Arbeiten, gebaute Websites und die Art der Umsetzung.
- Unser Team schafft Vertrauen ueber Personen, Haltung und Zusammenarbeit.
- Projektanfrage ist die fokussierte Conversion-Seite fuer neue Anfragen.
- Impressum und Datenschutz bleiben reduziert, sauber und formal korrekt, ohne optisch oder strukturell aus dem System zu fallen.

## Gemeinsame Standards

- Kein Seitentyp erfindet seine eigene visuelle, strukturelle oder technische Sprache.
- Navigation, Header und Footer muessen ueber alle Seiten hinweg logisch und wiedererkennbar bleiben.
- Komponenten, Sections und Templates werden wiederverwendbar statt ad hoc gebaut.
- Animationen folgen einer gemeinsamen Bewegungslogik mit konsistentem Timing, Easing und Intensitaet.
- Reduced-Motion-Praeferenzen werden respektiert.
- Die Frontend-Dateien sollen die echte Seiten- und Komponentenlogik spiegeln.
- Neue Motion- oder 3D-Ideen starten immer mit der Frage, ob DOM, CSS und `GSAP` genuegen; `Three.js` und `WebXR` sind kein Default.
- Szenen, Motion-Configs und Content-Vertraege werden so gebaut, dass sie aus globalen Skripten in spaetere komponentenbasierte Frontends ueberfuehrt werden koennen.

## Sub-Agent-Dateien

- `sub-agents/style/AGENTS.md`
- `sub-agents/animation/AGENTS.md`
- `sub-agents/information-architecture/AGENTS.md`
