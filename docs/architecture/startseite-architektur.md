# Startseiten-Architektur

## Zielbild

Die Startseite darf nicht wie ein Entwickler-Portfolio gelesen werden. Sie muss
wie der Webauftritt eines hochwertigen Anbieters wirken, der lokale Unternehmen
in Rostock strategisch fuehrt, visuell aufwertet und technisch sauber umsetzt.

Leitfrage fuer jede Entscheidung:

Traegt das dazu bei, dass ein lokales Unternehmen buildIT als professionellen
Anbieter fuer moderne Websites wahrnimmt?

## Inhaltsarchitektur

### 1. Scroll Hero
- Aufgabe: Sofortige Differenzierung und Markenwahrnehmung.
- Inhalt: Scroll-gesteuerte Transformation von losen Interface-Bausteinen zur
  fertigen Website-Hero.
- Aussage: Aus Strategie, Design und Technik entsteht ein professioneller
  digitaler Auftritt.

### 2. Positionierung
- Aufgabe: In einem Blick klaeren, fuer wen buildIT arbeitet und welchen Nutzen
  das bringt.
- Inhalt: Moderne Websites fuer Unternehmen in Rostock, klar gestaltet,
  technisch sauber umgesetzt, auf Vertrauen und Anfragen ausgerichtet.

### 3. Leistungen
- Aufgabe: Das Angebot greifbar machen.
- Inhalt: Positionierung, Website-Design, Entwicklung, Motion, Performance,
  Relaunches, Landingpages.

### 4. Warum buildIT
- Aufgabe: Den Unterschied zu generischen Agentur- oder Freelancer-Angeboten
  sichtbar machen.
- Inhalt: Direkte Zusammenarbeit, klare Entscheidungen, hohe Qualitaet,
  kontrollierte Umsetzung.

### 5. Ueber mich
- Aufgabe: Persoenliches Vertrauen aufbauen, ohne in klassische
  Portfolio-Selbstinszenierung zu kippen.
- Inhalt: Ein Ansprechpartner, strategisches Denken, Design- und
  Entwicklungsstaerke aus einer Hand.

### 6. Showcase
- Aufgabe: Beleg fuer Qualitaet und Denkweise.
- Inhalt: Konzeptprojekte oder reale Arbeiten mit Fokus auf Wirkung,
  Branchenpassung und wahrnehmbare Aufwertung.

### 7. Zusammenarbeit
- Aufgabe: Komplexitaet senken und Sicherheit schaffen.
- Inhalt: Diagnose, System, Build, Launch.

### 8. CTA / Kontakt
- Aufgabe: Vertriebsfaehiger Abschluss.
- Inhalt: Niedrigschwellige Anfrage mit klarem Projektkontext.

## Hero-Dramaturgie

### Phase A: Fragment
- Mehrere UI-, Code- und Panel-Elemente schweben frei im Raum.
- Tiefe, Licht, Schatten und leichte Parallaxe vermitteln Wertigkeit.

### Phase B: Alignment
- Beim Scrollen bewegen sich die Elemente kontrolliert in Richtung Ordnung.
- Die Bewegung bleibt ruhig, praezise und physikalisch glaubwuerdig.

### Phase C: Assembly
- Die Bausteine bilden ein strukturiertes Interface.
- Inhaltliche Bedeutung wird sichtbar: Navigation, Content-Flaechen, CTAs,
  Trust-Module.

### Phase D: Reveal
- Die abstrakte Komposition geht in die echte Website-Hero ueber.
- Nutzer scrollen in die fertige Seite hinein statt aus einer Animation heraus.

## Zielstruktur im Projekt

Die statische HTML-Basis bleibt vorerst erhalten. Fuer die naechsten Schritte
wird die Startseite entlang dieser Struktur organisiert:

```text
index.html
case-study.html
docs/
  architecture/
    startseite-architektur.md
    website-gliederung.md
  planning/
  research/
  strategy/
  operations/
src/
  scripts/
    app.js
    hero/
    ui/
    utils/
  styles/
    main.css
    foundations/
    components/
    sections/
assets/
public/
  media/
source-assets/
```

## Technische Architektur

### HTML
- `index.html` bleibt Shell und inhaltlicher Einstiegspunkt.
- Sections bleiben semantisch klar getrennt und bekommen stabile IDs.
- Die Hero wird spaeter als eigener Abschnitt mit Stage, Overlay und
  Content-Ebene ausgebaut.

### JavaScript
- `src/scripts/app.js` ist der Einstiegspunkt.
- `src/scripts/ui/` kapselt Navigation, Reveals, Metriken, Kontaktlogik und
  spaetere section-spezifische Interaktionen.
- `src/scripts/hero/` ist ausschliesslich fuer die Hero-Inszenierung reserviert.
- `src/scripts/utils/` enthaelt gemeinsame Hilfen wie Motion-Preferences.

### CSS
- `src/styles/main.css` ist das produktive Stylesheet fuer alle aktiven Seiten.
- Die Ordner unter `src/styles/` markieren die Zielstruktur fuer den naechsten
  visuellen Umbau der Hero und der einzelnen Startseiten-Sections.

## Naechste Umsetzungsstufe

1. Hero-Shell umbauen: Sticky Scroll-Bereich, Timeline und Layer definieren.
2. Hero-Module bauen: Partikel, Panels, Zielpositionen, Scroll-Interpolation.
3. Positionierungs-Section direkt an das Hero-Ende anschliessen.
4. Danach die restlichen Sections in derselben inhaltlichen Reihenfolge
   schaerfen.

## Aktueller Umsetzungsstand Maerz 2026

- Die Startseite nutzt jetzt eine vollflaechige Szenen-Hero mit vier
  Bereichen: `Warum Wir`, `Schablonen`, `Arbeit`, `Unser Team`.
- Die zentrale 3D-/Code-Komposition bleibt in allen Bereichen gleich.
- Beim Wechsel zerfaellt dieselbe Assembly-Animation kurz in Fragmente und
  setzt sich in der naechsten Szene wieder zusammen.
- Pro Bereich wechselt nur die Hintergrundwelt und die Copy-Position.
- Die Bewegungslogik lebt in `src/scripts/hero/landing-scene-switcher.js`.
