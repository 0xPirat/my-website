# Web Models

Dieser Ordner ist fuer optimierte 3D-Modelle, die das Frontend direkt laden
darf.

Empfohlene Struktur:

- `public/models/<asset-name>/<asset-name>.glb`

Bevorzugtes Format:

- `.glb`

Nicht hier ablegen:

- `.blend`
- Rohtexturen
- Render-Referenzen
- unoptimierte Export-Zwischenstaende

Beispiel fuer einen Loader-Pfad:

```js
loader.load("/public/models/landing-world/landing-world.glb", (gltf) => {
  scene.add(gltf.scene);
});
```
