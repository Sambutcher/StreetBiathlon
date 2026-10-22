// État du jeu, sans dépendance au navigateur : chaque fonction renvoie un nouvel état.
// Une série (cartouches, ronds blanchis, éclats) survit à la perte du feu tant qu'il reste des balles.
import { ronds, rondVise, plaque, dansRect } from './geometry.js';

export const CARTOUCHES = 3;

export function nouvelEtat() {
  return { cartouches: CARTOUCHES, touches: [false, false, false], impacts: [], cibleVisible: false };
}

export function serieEntamee(etat) {
  return etat.cartouches < CARTOUCHES;
}

export function voirFeu(etat) {
  return etat.cibleVisible ? etat : { ...etat, cibleVisible: true };
}

// Provisoire : on recharge en quittant le feu après les 3 balles, en attendant le
// rechargement par la course.
export function quitterFeu(etat) {
  if (etat.cartouches === 0) return nouvelEtat();
  return etat.cibleVisible ? { ...etat, cibleVisible: false } : etat;
}

// Tir au point `viseur` sur la cible dessinée autour de `boite`.
// resultat : 'touche', 'rate', ou null si le tir est impossible (pas de feu, plus de balles).
// Un raté sur la plaque laisse un éclat, mémorisé en coordonnées relatives à la plaque (0–1)
// pour suivre la cible quand elle bouge ou change de taille.
export function tirer(etat, boite, viseur) {
  if (!etat.cibleVisible || etat.cartouches === 0) return { etat, resultat: null };
  const i = rondVise(ronds(boite), viseur);
  const touche = i >= 0 && !etat.touches[i];
  const touches = touche ? etat.touches.map((t, j) => t || j === i) : etat.touches;
  let impacts = etat.impacts;
  const p = plaque(boite);
  if (!touche && dansRect(viseur, p)) {
    impacts = [...impacts, { u: (viseur.x - p.x) / p.w, v: (viseur.y - p.y) / p.h }];
  }
  return {
    etat: { ...etat, cartouches: etat.cartouches - 1, touches, impacts },
    resultat: touche ? 'touche' : 'rate',
  };
}
