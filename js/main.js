import { demarrerCamera } from './camera.js';
import { chargerDetecteur, detecter } from './detector.js';
import { creerRendu } from './render.js';
import { creerSuivi } from './tracker.js';
import { nouvelEtat, entrerTir, sortirTir, tirer } from './game.js';
import { cadrage, letterbox, versEcran, plusProcheDe, ronds } from './geometry.js';

const ZOOM = 2;
const INTERVALLE_DETECTION_MS = 80;
const DUREE_FLASH_MS = 250;
const URL_MODELE = 'models/yolo11n/model.json';

const accueil = document.getElementById('accueil');
const bouton = document.getElementById('demarrer');
const statut = document.getElementById('statut');
const video = document.getElementById('video');
const canvas = document.getElementById('jeu');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker :', e));
}

bouton.addEventListener('click', async () => {
  bouton.disabled = true;
  try {
    statut.textContent = 'Ouverture de la caméra…';
    await demarrerCamera(video);
    statut.textContent = 'Chargement du détecteur…';
    const entree = await chargerDetecteur(URL_MODELE);
    accueil.hidden = true;
    lancer(entree);
  } catch (e) {
    console.error(e);
    statut.textContent = `Impossible de démarrer : ${e.message || e}`;
    bouton.disabled = false;
  }
});

function lancer(entree) {
  const rendu = creerRendu(canvas);
  const suivi = creerSuivi();
  const canvasEntree = document.createElement('canvas');
  canvasEntree.width = entree.largeur;
  canvasEntree.height = entree.hauteur;
  const ctxEntree = canvasEntree.getContext('2d', { willReadFrequently: true });

  let etat = nouvelEtat();
  let cible = null;
  let detectionEnCours = false;
  let derniereDetection = 0;
  let dernierTir = { resultat: null, t: -Infinity };

  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (!cible) return;
    const centre = { x: rendu.largeur / 2, y: rendu.hauteur / 2 };
    const r = tirer(etat, ronds(cible), centre);
    etat = r.etat;
    if (r.resultat) dernierTir = { resultat: r.resultat, t: performance.now() };
  });

  // Une seule inférence à la fois, sur la même zone que celle affichée.
  function lancerDetection(c, t) {
    detectionEnCours = true;
    derniereDetection = t;
    const lb = letterbox(c.sw, c.sh, canvasEntree.width, canvasEntree.height);
    ctxEntree.fillStyle = 'rgb(114,114,114)';
    ctxEntree.fillRect(0, 0, canvasEntree.width, canvasEntree.height);
    ctxEntree.drawImage(video, c.sx, c.sy, c.sw, c.sh, lb.dx, lb.dy, lb.dw, lb.dh);
    detecter(canvasEntree)
      .then((boites) => {
        const ecran = boites.map((b) => versEcran(b, lb, rendu.largeur, rendu.hauteur));
        const centre = { x: rendu.largeur / 2, y: rendu.hauteur / 2 };
        suivi.maj(plusProcheDe(ecran, centre), performance.now());
      })
      .catch((e) => console.error(e))
      .finally(() => { detectionEnCours = false; });
  }

  function image(t) {
    const c = cadrage(video.videoWidth, video.videoHeight, rendu.largeur, rendu.hauteur, ZOOM);
    if (!detectionEnCours && t - derniereDetection >= INTERVALLE_DETECTION_MS) lancerDetection(c, t);

    const lu = suivi.lire(t);
    etat = lu.actif ? entrerTir(etat) : sortirTir(etat);
    cible = lu.actif ? lu.cible : null;

    rendu.video(video, c);
    if (etat.mode === 'tir') {
      rendu.cible(cible, ronds(cible), etat.touches);
      rendu.viseur();
      rendu.cartouches(etat.cartouches);
      if (etat.cartouches === 0) rendu.message('Plus de cartouches');
    } else {
      rendu.message('Cherchez un feu…');
    }
    const age = t - dernierTir.t;
    if (age < DUREE_FLASH_MS) rendu.flash(dernierTir.resultat, 1 - age / DUREE_FLASH_MS);

    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
}
