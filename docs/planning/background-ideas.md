# Background Ideas

Stand: 2026-03-24

## Ziel aus der Konversation

- Die Landingpage soll sich aehnlich wie `s-ir.it` anfuehlen: eine starke
  Hintergrundwelt mit vier Bereichen.
- Die Bereiche entsprechen inhaltlich:
  - `Solutions`
  - `Service`
  - `Works`
  - `WhoWeAre`
- Die sichtbare 3D-Welt soll aus Blender kommen und als Web-Hintergrund laufen.
- Die Kamera soll nicht frei navigierbar sein.
- Der Nutzer soll nur sehr leicht mit der Maus links, rechts, oben und unten
  schauen koennen.
- Der initiale Blick soll exakt aus einer bewusst gesetzten Blender-Kamera
  kommen.
- Langfristige Zielidee: ein zentrales Objekt verbindet alle vier Bereiche.
  Beim Wechsel koennte man in dieses Objekt hineinzoomen, die alte Welt
  verschwimmt und die neue Welt entsteht daraus.

## Wichtige Erkenntnisse

- Ein `.glb` ist nicht automatisch gleichbedeutend mit einer verwendbaren
  Blender-Kamera.
- Wenn die Kamera in der Web-App dieselbe Perspektive wie in Blender haben
  soll, muss die Kamera beim glTF-Export mit exportiert werden.
- Wenn die Welt nach dem Import neu zentriert, separat verschoben oder anders
  skaliert wird, kann die Blender-Kamera ihre exakte Perspektive verlieren.
- Die Mausbewegung sollte nicht als freier Orbit gebaut werden.
- Besser ist ein fester Kamera-Basiszustand mit sehr kleiner, weicher
  Parallax-Abweichung.

## Architekturentscheidung

### Option B: vier getrennte Welten

Vorteile:

- jede Welt kann genau fuer ihren Bereich gebaut werden
- klarere Kontrolle ueber Komposition, Licht, Farbe und Detailgrad
- kleinere, getrennte Runtime-Assets
- leichteres Lazy Loading
- sauberere Wartbarkeit im Frontend
- einfacher, jeden Bereich mit eigener Blender-Kamera zu definieren

Nachteile:

- Welten wirken ohne gute Uebergaenge eventuell isoliert
- ein gemeinsames Universum muss visuell ueber Formensprache, Licht und ein
  verbindendes Objekt hergestellt werden

## Entscheidung

Fuer dieses Projekt ist `Option B` gesetzt:

- vier getrennte Welten fuer die vier Bereiche
- ein gemeinsames zentrales Objekt als wiederkehrender Uebergangsanker
- jede Welt bekommt ihre eigene feste Blender-Kamera
- der Szenenwechsel wird als Zoom- und Blur-Transition ueber dieses
  Zentralobjekt inszeniert

## Begruendung

Fuer deine aktuelle Zielidee ist nicht eine einzige Open World am besten,
sondern bewusst dieser Hybrid-Ansatz:

- vier getrennte Welten fuer die vier Bereiche
- ein gemeinsames zentrales Objekt als wiederkehrender Uebergangsanker
- jede Welt bekommt ihre eigene feste Blender-Kamera
- der Szenenwechsel wird als Zoom- und Blur-Transition ueber dieses
  Zentralobjekt inszeniert

Das ist fuer eine Landingpage deutlich kontrollierbarer als eine einzige grosse
Welt. Gleichzeitig bleibt das Gefuehl erhalten, dass alle Bereiche zu einem
gemeinsamen System gehoeren.

## Empfohlenes Zielbild

- `Solutions` hat eine eigene Welt und eigene Kamera.
- `Service` hat eine eigene Welt und eigene Kamera.
- `Works` hat eine eigene Welt und eigene Kamera.
- `WhoWeAre` hat eine eigene Welt und eigene Kamera.
- In allen vier Welten existiert dasselbe oder ein sehr aehnliches
  Zentralobjekt.
- Dieses Objekt steht an einer vergleichbaren visuellen Position im Bild.
- Beim Bereichswechsel zoomt die Kamera kurz in dieses Objekt hinein.
- Die aktive Welt wird weich ausgeblendet oder verschwimmt.
- Die naechste Welt kommt aus demselben Objekt oder aus demselben Fokuspunkt
  wieder heraus.

## Warum diese Empfehlung stark ist

- Die Dramaturgie bleibt filmisch und kontrolliert.
- Die Website muss keine echte Open World simulieren, obwohl sie wie eine
  zusammenhaengende 3D-Erfahrung wirkt.
- Jeder Bereich kann gestalterisch praezise auf seine Botschaft abgestimmt
  werden.
- Der technische Aufwand bleibt deutlich besser beherrschbar.
- Das Zentralobjekt gibt dir eine klare visuelle Signatur fuer die gesamte
  Landingpage.

## Vorschlag fuer das Zentralobjekt

Das Zentralobjekt sollte:

- sofort wiedererkennbar sein
- abstrakt genug sein, um in allen vier Welten glaubwuerdig zu funktionieren
- sich fuer Zoom, Glow, Reflektion, Blur und Uebergang eignen
- eine starke Silhouette haben

Moegliche Richtungen:

- schwebender Prismenkern
- leuchtender Monolith
- kristalliner Ringkern
- technischer Orb mit segmentierten Flaechen
- ruhige, skulpturale Build-IT-Form mit prismatischer Kante

## Prompt-Ideen fuer die Weltentwicklung

### Master Prompt fuer das Gesamtsystem

`Cinematic interactive landing page background with four distinct 3D worlds, each world built around the same central object, dark navy atmosphere, indigo and periwinkle light accents, prism-like geometry, premium business aesthetic, controlled depth, subtle futuristic realism, elegant camera framing, calm but precise mood, built for a website background with fixed composition and slight mouse parallax only`

### Prompt fuer das Zentralobjekt

`A premium central transition object for a business website, sculptural prism core, slightly futuristic, glowing inner edges, periwinkle and indigo highlights, dark reflective material, elegant silhouette, strong center focus, suitable for zoom transitions between four website worlds, minimal but iconic`

### Prompt fuer World 1: Solutions

`3D environment for Solutions, strategic, clear, spatially ordered, architectural logic, premium navy background, indigo light planes, confident composition, one central prism object in focus, cinematic stillness, designed as a website hero background`

### Prompt fuer World 2: Service

`3D environment for Service, modular, precise, crafted, layered structures, premium dark navy atmosphere, cool periwinkle edges, subtle technical depth, one central transition object in focus, elegant and controlled, designed as a website hero background`

### Prompt fuer World 3: Works

`3D environment for Works, more showcase-driven, deeper sense of perspective, structured display energy, premium dark blue world, indigo-violet highlights, central object connecting the space, cinematic framing, polished and business-grade, designed as a website hero background`

### Prompt fuer World 4: WhoWeAre

`3D environment for WhoWeAre, calmer and more human, softer spatial rhythm, premium dark navy world, subtle violet-periwinkle lighting, intimate but precise atmosphere, same central object as anchor, cinematic and trustworthy, designed as a website hero background`

## Technische Leitidee fuer die Umsetzung

- Pro Bereich ein eigenes optimiertes `.glb`
- Pro Bereich eine exportierte Blender-Kamera
- Jede Welt wird im Frontend als eigene Szene oder eigenes Asset behandelt
- Die Kamera bleibt grundsaetzlich fest
- Die Maus veraendert die Ansicht nur minimal
- Der Bereichswechsel wird nicht als harte Umschaltung gebaut, sondern als
  Transition ueber Zoom, Blur und Crossfade

## Konkrete Runtime-Logik

- Landingpage laedt zuerst nur die aktive Welt
- die naechste Welt kann im Hintergrund vorgeladen werden
- beim Wechsel:
  - Kamera zoomt in das Zentralobjekt
  - aktuelle Welt bekommt mehr Blur oder Bloom
  - naechste Welt blendet am selben Fokuspunkt ein
  - Kamera faehrt leicht in die neue Ausgangskomposition zurueck

## Blender-Richtlinien

- Jede Welt bekommt eine klar benannte Kamera, zum Beispiel:
  - `Cam_Solutions`
  - `Cam_Service`
  - `Cam_Works`
  - `Cam_WhoWeAre`
- Jede Kamera wird als finaler Hero-Shot verstanden, nicht als freie
  Arbeitskamera.
- Das Zentralobjekt sollte in allen Welten gleich oder sehr nah verwandt sein.
- Die Kameras sollten in allen Welten aehnliche Bildlogik haben, damit die
  Transition spaeter glaubwuerdig wirkt.
- Beim Export muessen Kameras aktiv mit exportiert werden.
- Fuer die erste technische Integration lieber ohne Draco-Kompression testen.
- Erst nach erfolgreichem Kamera-Test optimieren.

## Frontend-Richtlinien

- HTML-Content bleibt ueber dem Canvas.
- WebGL ist nur die Hintergrundinszenierung.
- Reduced Motion braucht eine ruhige Alternative.
- Auf Mobile wird die Maus-Parallax stark reduziert oder deaktiviert.
- Die Welten duerfen die Lesbarkeit der Headline nicht stoeren.

## Festgehaltene Richtungsentscheidung

- `Option B` ist ausgewaehlt.
- Die Landingpage arbeitet mit vier getrennten Welten.
- Alle vier Welten werden durch ein gemeinsames Zentralobjekt visuell
  zusammengehalten.
- Die Kameraperspektive kommt je Welt aus Blender.
- Die Mausbewegung bleibt sehr leicht und dient nur als Parallax-Effekt.
- Der Wechsel zwischen den Welten soll spaeter ueber Zoom, Blur und Fokus auf
  das Zentralobjekt stattfinden.

## Offene Entscheidungen

- Soll das Zentralobjekt in allen Welten exakt identisch sein oder nur eine
  Variationsfamilie?
- Soll der Wechsel rein ueber Blur und Zoom laufen oder auch ueber Licht-Flash,
  Partikel oder volumetrischen Nebel?
- Soll jede Unterseite spaeter dieselbe Welt noch einmal gross zeigen oder
  bekommt nur die Landingpage diese Hub-Inszenierung?

## Naechste sinnvolle Schritte

- visuelle Richtung des Zentralobjekts festlegen
- entscheiden, ob die vier Welten als vier Blender-Dateien oder als vier
  Collections in einer Datei gepflegt werden
- fuer jeden Bereich einen finalen Blender-Kamerashot bauen
- erstes Test-GLB mit exportierter Kamera erzeugen
- im Frontend zuerst eine einzige Welt mit exakter Kamera uebernehmen
- danach die Wechsel-Transition zwischen zwei Welten bauen
- erst danach das komplette Vier-Welten-System fertigziehen
