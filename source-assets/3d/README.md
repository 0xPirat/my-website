# Raw 3D Assets (local only)

Lege hier deine lokalen Blender-Quellen und Rohdaten ab, zum Beispiel:

- `.blend`
- `.fbx`
- hochaufgeloeste Texturen
- Referenzbilder
- Export-Zwischenstaende

Empfohlene lokale Struktur:

- `source-assets/3d/<asset-name>/<asset-name>.blend`
- `source-assets/3d/<asset-name>/textures/...`
- `source-assets/3d/<asset-name>/refs/...`

Wichtig:

- Dieser Ordner ist nur fuer Authoring-Quellen gedacht.
- Lade keine Dateien von hier direkt ins Frontend.
- Das Web-Modell gehoert nach `public/models/`.
- Laufzeit-Texturen gehoeren nach `public/textures/`.

Empfohlenes Web-Format aus Blender:

- `.glb` fuer das eigentliche Website-Modell

Dieser Ordner ist absichtlich so konfiguriert, dass Inhalte **nicht** in Git
landen. Nur diese README und die lokale `.gitignore` bleiben versioniert.
