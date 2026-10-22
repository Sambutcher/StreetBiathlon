// État du jeu, sans dépendance au navigateur : chaque fonction renvoie un nouvel état.
// Une série (cartouches + ronds blanchis) survit à la perte du feu tant qu'il reste des balles.
import { rondVise } from './geometry.js';

export const CARTOUCHES = 3;

export function nouvelEtat() {
  return { cartouches: CARTOUCHES, touches: [false, false, false], cibleVisible: false };
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

// Tir au point `viseur` sur les ronds de la cible.
// resultat : 'touche', 'rate', ou null si le tir est impossible (pas de feu, plus de balles).
export function tirer(etat, listeRonds, viseur) {
  if (!etat.cibleVisible || etat.cartouches === 0) return { etat, resultat: null };
  const i = rondVise(listeRonds, viseur);
  const touche = i >= 0 && !etat.touches[i];
  const touches = touche ? etat.touches.map((t, j) => t || j === i) : etat.touches;
  return {
    etat: { ...etat, cartouches: etat.cartouches - 1, touches },
    resultat: touche ? 'touche' : 'rate',
  };
}
