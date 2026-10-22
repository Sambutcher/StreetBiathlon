// Suivi du feu entre deux détections : lissage de la boîte et hystérésis du mode tir.

export function creerSuivi({ confirmations = 2, persistanceMs = 1000, lissage = 0.5 } = {}) {
  let cible = null;
  let vues = 0;
  let derniereVue = -Infinity;

  function oublier() {
    cible = null;
    vues = 0;
  }

  return {
    // À appeler à chaque résultat de détection (boîte écran ou null).
    maj(boite, t) {
      if (!boite) {
        if (t - derniereVue > persistanceMs) oublier();
        return;
      }
      vues++;
      derniereVue = t;
      cible = cible
        ? {
            x: cible.x + (boite.x - cible.x) * lissage,
            y: cible.y + (boite.y - cible.y) * lissage,
            w: cible.w + (boite.w - cible.w) * lissage,
            h: cible.h + (boite.h - cible.h) * lissage,
          }
        : { ...boite };
    },

    // État courant à l'instant t.
    lire(t) {
      if (cible && t - derniereVue > persistanceMs) oublier();
      return { cible, actif: cible !== null && vues >= confirmations };
    },
  };
}
