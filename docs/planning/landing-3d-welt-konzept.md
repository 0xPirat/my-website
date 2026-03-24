# Landing 3D Welt Konzept

Stand: 2026-03-18

## Zielbild

- Jede Landingpage startet mit einer sichtbaren 3D-Welt.
- Die Szene soll raeumlich und hochwertig wirken, ohne freie Navigation zu
  brauchen.
- Motion bleibt Progressive Enhancement. Text, CTA und Orientierung muessen
  auch ohne WebGL funktionieren.

## Gewuenschte Dramaturgie

### 1. Entry

- Beim Aufruf erscheint sofort eine 3D-Buehne.
- Kleine Lichtpartikel bewegen sich dauerhaft im Raum.
- Die Kamera oder Leinwand reagiert leicht auf den Mauszeiger nach links,
  rechts, oben und unten, damit ein subtiler 3D-Eindruck entsteht.

### 2. Idle-Zustand

- In der Mitte steht eine Skulptur.
- Die Skulptur traegt Augen.
- Die Augen bewegen sich fortlaufend und ruhig zufaellig nach links, rechts,
  oben und unten.
- Die Bewegung laeuft als Endlosschleife, soll wach wirken, aber nicht hektisch
  werden.

### 3. Scroll-Trigger

- Sobald der Nutzer aktiv in die Szene scrollt, endet die Zufallsbewegung.
- Die Augen stoppen und richten sich auf den Mittelpunkt aus.
- Die Skulptur schaut den Nutzer direkt an.

### 4. Transition in den Content

- Die Umgebungswelt tritt zurueck oder loest sich auf.
- Die Kamera zoomt in das linke Auge der Skulptur.
- Im linken Auge entsteht ein weisser Fill oder Flash.
- Nach dem Whiteout wird in die eigentliche Seite uebergeben.

### 5. Nach der Sequenz

- Die Seite laeuft normal weiter.
- Die 3D-Sequenz darf Navigation, Lesbarkeit und Conversion nicht blockieren.

## Technische Leitplanken

- Reduced Motion braucht eine echte Alternative ohne Kamerafahrt, Partikel und
  Zoom.
- Blender bleibt Authoring; in die Runtime gelangen nur optimierte Web-Assets.
- Scroll-getriebene Kamera, Fokus und Whiteout sollten bevorzugt in
  `GSAP + Three.js` gesteuert werden, nicht komplett in Blender gebacken.
- Die Grundszene sollte moeglichst als gemeinsames System fuer mehrere
  Landingpages wiederverwendbar sein.

## Projekt-Ablage fuer diese Idee

- Rohdaten: `source-assets/3d/landing-world/`
- Web-Modell: `public/models/landing-world/landing-world.glb`
- Laufzeit-Texturen: `public/textures/landing-world/`
- Three.js Szene: `src/scripts/three/landing-world-scene.js`
- Scroll-Logik: `src/scripts/hero/landing-world-scroll.js`

## Empfohlener Blender-Export

- Primaeres Web-Format: `.glb`
- Materialien moeglichst sauber im Modell mitgeben
- Animationen als getrennte Clips anlegen, zum Beispiel:
  - `eyes_idle`
  - `eyes_focus`
- Kamerazoom in das linke Auge bevorzugt im Frontend steuern, damit Timing,
  Scroll-Trigger und Responsive-Verhalten sauber bleiben

## Vor dem Export pruefen

- Transforms anwenden
- Pivot- und Origin-Punkte sauber setzen
- nur benoetigte Objekte exportieren
- Polycount fuer Web reduzieren
- Texturen fuer Web optimieren
- Licht backen, wenn keine echte Echtzeit-Lichtshow noetig ist

## Aktuelle Anknuepfungspunkte im Projekt

- Landing-Hub: `index.html`
- Szenenwechsel: `src/scripts/hero/landing-scene-switcher.js`
- bestehende Three.js Referenz: `src/scripts/three/schablonen-room-scene.js`

## Offene Punkte fuer die naechste Runde

- Ein zentrales Auge oder mehrere Augen in der Skulptur?
- Eine gemeinsame 3D-Welt fuer alle vier Landing-Bereiche oder Varianten
  derselben Welt?
- Whiteout als Material/Shader-Effekt oder als Overlay im DOM?
- Soll die 3D-Einleitung nur auf `index.html` starten oder auch auf den
  einzelnen Unterseiten?
