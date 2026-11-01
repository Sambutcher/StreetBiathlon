# Street Biathlon — notes pour Claude

- PWA **vanilla JS sans build** (modules ES), cible iPhone SE 3ᵉ gén. (Safari), hors ligne.
  Ne pas introduire de bundler ni de framework. Licence AGPL-3.0.
- Partie = cycle course (100 m à vol d'oiseau au GPS, caméra éteinte) → bouton « Position de tir »
  → tir de 3 balles → course… Tester sans courir avec `?simgps` (bouton « Skip » : course faite d'un coup), diagnostic avec `?debug`.
- Détection : YOLO11n converti en TF.js, `vendor/tf.min.js` 4.22.0. Le PC de dev n'a pas l'AVX :
  la conversion passe par le workflow manuel `export-model.yml` (ultralytics < 8.4).
- Logique pure (`js/game.js`, `js/geometry.js`, `js/tracker.js`, `js/flow.js`, `js/course.js`, `js/parcours.js`, `js/carte.js`)
  testée par `node --test tests/` (Node 18 apt, pas de npm). Garder le DOM et `tf` hors de ces modules.
- Vidéo : toujours dessinée entière (`placementVideo` de `js/geometry.js`), jamais découpée (bug
  du « quart d'image » sur iOS). Ne pas surveiller `video.currentTime` : avec un flux caméra,
  Safari iOS ne le fait pas avancer de façon fiable. Si le contexte WebGL de TF.js est perdu
  (mémoire graphique saturée), le jeu recharge la page.
- Tout fichier servi doit figurer dans `FICHIERS` de `sw.js` ; `VERSION` (sw.js + index.html)
  change à chaque mise en ligne. `tests/pwa.test.js` vérifie les deux. Depuis 1.0.1, `sw.js` est
  vérifié à chaque ouverture et la page se recharge quand une nouvelle version prend la main.
- Dev sur iPhone : `python3 tools/serve.py` (HTTPS auto-signé, port 8443 ; l'IP du PC change : la lire avec `ip -4 addr`, et supprimer `tools/.cert/` si elle change pour regénérer le certificat).
- Mise en ligne : GitHub Pages sur `main` (https://sambutcher.github.io/StreetBiathlon/),
  merge fait par Samuel ; release `vX.Y.Z` ensuite.
- Sons : `js/son.js`, Web Audio synthétisé (pas de fichiers), coupé par le commutateur silencieux d'iOS ; contexte créé sur clic (Démarrer, Position de tir). Pas de bouton on/off. Impossible à tester sans iPhone : timbres réglés à l'oreille par Samuel.
- Batterie : l'écran de course n'est redessiné que 2 fois/s (`INTERVALLE_RENDU_COURSE_MS`) ; pas de veille écran en course (iOS couperait le GPS).
- Feuille de route : v1.0.0 = tir + course. v1.1.0 = points (1 point par mètre estimé au feu, FOV à calibrer avec ?debug). v1.3.x = suivi (chrono, distance parcourue) et récap de « Fin de course » avec carte sans fond de plan. À venir : pénalités ?, historique persistant.
- Ne pas tester les pages dans Chromium : Samuel teste lui-même (navigateur, iPhone).
- Langue du code et des textes : français.
