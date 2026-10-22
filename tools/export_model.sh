#!/usr/bin/env bash
# Convertit YOLO11n (COCO) au format TensorFlow.js dans models/yolo11n/.
# Une seule fois : le résultat est commité, le jeu n'a pas besoin de Python.
#
# Usage : tools/export_model.sh [hauteur] [largeur]   (multiples de 32, défaut 384 224 = portrait)
set -euo pipefail

HAUTEUR="${1:-384}"
LARGEUR="${2:-224}"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
TRAVAIL="$(mktemp -d)"
trap 'rm -rf "$TRAVAIL"' EXIT

# ultralytics < 8.4 : les versions suivantes ne savent plus exporter en TF.js.
# PyTorch CPU pour éviter plusieurs Go de CUDA inutiles.
command -v yolo >/dev/null || pipx install "ultralytics<8.4" \
  --pip-args="--index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple"

cd "$TRAVAIL"
yolo export model=yolo11n.pt format=tfjs imgsz="$HAUTEUR,$LARGEUR"

rm -rf "$RACINE/models/yolo11n"
mkdir -p "$RACINE/models"
cp -r yolo11n_web_model "$RACINE/models/yolo11n"
ls -la "$RACINE/models/yolo11n"
echo "Pense à mettre à jour la liste du modèle et VERSION dans sw.js."
