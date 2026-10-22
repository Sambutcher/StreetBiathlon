# Street Biathlon

Biathlon urbain sur téléphone : la caméra cherche les **feux tricolores**, les remplace par une
**cible de biathlon à 3 ronds**, et on tire en tapant l'écran pour **blanchir** les ronds.

PWA installable, jouable **hors ligne**, pensée d'abord pour iPhone (testée sur iPhone SE 3ᵉ gén.).

## Jouer

1. Ouvrir https://sambutcher.github.io/StreetBiathlon/ dans Safari.
2. Partager → **Sur l'écran d'accueil** (une première ouverture en ligne met tout en cache).
3. Lancer, **Démarrer**, autoriser la caméra, viser un feu.

En mode tir : 3 cartouches, une croix de visée au centre ; un tap = un tir. Les cartouches
reviennent quand on quitte le feu (provisoire, en attendant le rechargement à la course).

## Développement

Aucun build : fichiers statiques et modules ES.

```bash
node --test tests/          # tests unitaires (Node ≥ 18, aucune dépendance)
python3 tools/serve.py      # HTTPS sur https://<ip-du-pc>:8443 (certificat auto-signé)
```

Sur l'iPhone, ouvrir l'adresse affichée et accepter le certificat. La caméra et la détection
fonctionnent ; le mode hors ligne (service worker) ne se teste que sur GitHub Pages, Safari
refusant les service workers avec un certificat auto-signé.

| Fichier | Rôle |
|---|---|
| `js/main.js` | démarrage, boucle d'affichage, tirs |
| `js/camera.js` | caméra arrière |
| `js/detector.js` | YOLO11n via TensorFlow.js : décodage, NMS, classe « traffic light » |
| `js/tracker.js` | lissage de la cible et hystérésis du mode tir |
| `js/game.js` | état du jeu (pur, testé) |
| `js/geometry.js` | cadrage, letterbox, ronds, test de touche (pur, testé) |
| `js/render.js` | dessin canvas |
| `sw.js` | cache hors ligne |

**À chaque mise en ligne, changer `VERSION` dans `sw.js`**, sinon les téléphones gardent
l'ancienne version en cache.

## Modèle de détection

`models/yolo11n/` est YOLO11n (COCO) converti en TensorFlow.js, entrée 224×384 (portrait) :

```bash
tools/export_model.sh            # installe ultralytics via pipx si besoin
```

Puis mettre à jour la liste des fichiers du modèle dans `sw.js`.

Le zoom numérique (`ZOOM` dans `js/main.js`) agrandit le centre de l'image : les feux lointains
couvrent plus de pixels pour le modèle.

## Licences

- YOLO11n © Ultralytics, **AGPL-3.0** : le jeu qui l'embarque doit rester open source
  sous une licence compatible (fichier `LICENSE` à ajouter).
- TensorFlow.js 4.22.0 (`vendor/`), Apache-2.0.
