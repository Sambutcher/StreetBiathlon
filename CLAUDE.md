# Street Biathlon — notes pour Claude

- PWA **vanilla JS sans build** (modules ES), cible iPhone SE 3ᵉ gén. (Safari), hors ligne.
  Ne pas introduire de bundler ni de framework.
- Détection : YOLO11n converti en TF.js (`tools/export_model.sh`, via pipx), `vendor/tf.min.js` 4.22.0.
- Logique pure (`js/game.js`, `js/geometry.js`, `js/tracker.js`) testée par `node --test tests/`
  (Node 18 apt, pas de npm). Garder le DOM et `tf` hors de ces modules.
- Tout fichier ajouté doit figurer dans `FICHIERS` de `sw.js`, et `VERSION` doit changer à chaque mise en ligne.
- Dev sur iPhone : `python3 tools/serve.py` (HTTPS auto-signé, IP locale 192.168.1.147:8443).
- Feuille de route : étape 1 = caméra, détection, cible 3 ronds, tir. Suite : rechargement par
  la course (GPS), score/chrono, historique.
- Langue du code et des textes : français.
