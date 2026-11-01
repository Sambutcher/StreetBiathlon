// État du jeu, sans dépendance au navigateur : chaque fonction renvoie un nouvel état.
// Une partie alterne course (caméra éteinte, 100 m pour débloquer le tir) et tir (3 balles).
// Pendant le tir, la série (cartouches, ronds blanchis, éclats) survit à la perte du feu.
import { ronds, rondVise, plaque, dansRect } from './geometry.js';

export const CARTOUCHES = 3;

const cibleVierge = () => ({ touches: [false, false, false], impacts: [] });

// Une partie commence par la course jusqu'au pas de tir.
export function nouvelEtat() {
  return { phase: 'course', cartouches: 0, ...cibleVierge(), cibleVisible: false, score: 0 };
}

// En position de tir : carabine chargée, cible vierge.
export function debloquerTir(etat) {
  return { ...etat, phase: 'tir', cartouches: CARTOUCHES, ...cibleVierge(), cibleVisible: false, scoreDebutSerie: etat.score };
}

// Bilan de la série en cours : ronds touchés et points marqués depuis la position de tir.
export function bilanSerie(etat) {
  return { touches: etat.touches.filter(Boolean).length, points: etat.score - etat.scoreDebutSerie };
}

// Série terminée : retour à la course.
// Le bilan de la série (`derniereSerie`) reste affiché sur l'écran de course suivant.
export function finSerie(etat) {
  const derniereSerie = etat.phase === 'tir' ? bilanSerie(etat) : etat.derniereSerie;
  return { ...etat, phase: 'course', cartouches: 0, cibleVisible: false, derniereSerie };
}

export function serieTerminee(etat) {
  return etat.phase === 'tir' && etat.cartouches === 0;
}

export function serieEntamee(etat) {
  return etat.phase === 'tir' && etat.cartouches < CARTOUCHES;
}

export function voirFeu(etat) {
  return etat.cibleVisible ? etat : { ...etat, cibleVisible: true };
}

export function quitterFeu(etat) {
  return etat.cibleVisible ? { ...etat, cibleVisible: false } : etat;
}

// Tir au point `viseur` sur la cible dessinée autour de `boite`.
// resultat : 'touche', 'rate', ou null si le tir est impossible (pas de feu, plus de balles).
// Une touche ajoute `points` au score ; `gain` vaut les points marqués par ce tir.
// Un raté sur la plaque laisse un éclat, mémorisé en coordonnées relatives à la plaque (0–1)
// pour suivre la cible quand elle bouge ou change de taille.
export function tirer(etat, boite, viseur, points = 0) {
  if (etat.phase !== 'tir' || !etat.cibleVisible || etat.cartouches === 0) return { etat, resultat: null, gain: 0 };
  const i = rondVise(ronds(boite), viseur);
  const touche = i >= 0 && !etat.touches[i];
  const touches = touche ? etat.touches.map((t, j) => t || j === i) : etat.touches;
  let impacts = etat.impacts;
  const p = plaque(boite);
  if (!touche && dansRect(viseur, p)) {
    impacts = [...impacts, { u: (viseur.x - p.x) / p.w, v: (viseur.y - p.y) / p.h }];
  }
  return {
    etat: { ...etat, cartouches: etat.cartouches - 1, touches, impacts, score: etat.score + (touche ? points : 0) },
    resultat: touche ? 'touche' : 'rate',
    gain: touche ? points : 0,
  };
}
