// État du jeu, sans dépendance au navigateur : chaque fonction renvoie un nouvel état.
import { rondVise } from './geometry.js';

export const CARTOUCHES = 3;

export function nouvelEtat() {
  return { mode: 'recherche', cartouches: CARTOUCHES, touches: [false, false, false] };
}

export function entrerTir(etat) {
  return etat.mode === 'tir' ? etat : { ...etat, mode: 'tir' };
}

// Provisoire : on recharge en quittant le feu, en attendant le rechargement par la course.
export function sortirTir(etat) {
  return etat.mode === 'recherche' ? etat : nouvelEtat();
}

// Tir au point `viseur` sur les ronds de la cible.
// resultat : 'touche', 'rate', ou null si le tir est impossible.
export function tirer(etat, listeRonds, viseur) {
  if (etat.mode !== 'tir' || etat.cartouches === 0) return { etat, resultat: null };
  const i = rondVise(listeRonds, viseur);
  const touche = i >= 0 && !etat.touches[i];
  const touches = touche ? etat.touches.map((t, j) => t || j === i) : etat.touches;
  return {
    etat: { ...etat, cartouches: etat.cartouches - 1, touches },
    resultat: touche ? 'touche' : 'rate',
  };
}
