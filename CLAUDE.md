# Street Biathlon — notes pour Claude

- PWA **vanilla JS sans build** (modules ES), cible iPhone SE 3ᵉ gén. (Safari), hors ligne.
  Ne pas introduire de bundler ni de framework.
- Détection : YOLO11n converti en TF.js (`tools/export_model.sh`, via pipx), `vendor/tf.min.js` 4.22.0.
- Logique pure (`js/game.js`, `js/geometry.js`, `js/tracker.js`, `js/flow.js`, `js/course.js`) testée par `node --test tests/`
  (Node 18 apt, pas de npm). Garder le DOM et `tf` hors de ces modules.
- Tout fichier ajouté doit figurer dans `FICHIERS` de `sw.js`, et `VERSION` doit changer à chaque mise en ligne.
- Dev sur iPhone : `python3 tools/serve.py` (HTTPS auto-signé, IP locale 192.168.1.147:8443).
- Partie = cycle course (100 m à vol d'oiseau au GPS, caméra éteinte) → bouton « Position de tir »
  → tir de 3 balles → course… Tester sans courir avec `?simgps`.
- Feuille de route : faits = tir, cible, course/rechargement. Suite : score/chrono (pénalités ?),
  historique, mise en ligne (licence AGPL).
- Ne pas tester les pages dans Chromium : Samuel teste lui-même (navigateur, iPhone).
- Langue du code et des textes : français.
