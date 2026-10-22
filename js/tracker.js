// Suivi du feu : déplacé à chaque image par le flux optique, recalé à chaque détection,
// avec hystérésis d'apparition/disparition et refus des sauts non confirmés.

export function creerSuivi({
  confirmations = 2,
  persistanceMs = 1000,
  lissageTaille = 0.3,
  confirmationsSaut = 2,
} = {}) {
  let cible = null;
  let vues = 0;
  let derniereVue = -Infinity;
  let candidat = null; // détection lointaine en attente de confirmation
  const cumul = { x: 0, y: 0 }; // déplacement total de l'image depuis le début

  function oublier() {
    cible = null;
    vues = 0;
    candidat = null;
  }

  const centre = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const proches = (a, b) => {
    const ca = centre(a);
    const cb = centre(b);
    return Math.hypot(ca.x - cb.x, ca.y - cb.y) <= Math.max(a.w, a.h);
  };

  return {
    // Déplacement de l'image mesuré entre deux trames (coordonnées écran).
    deplacer(dx, dy) {
      cumul.x += dx;
      cumul.y += dy;
      if (cible) { cible.x += dx; cible.y += dy; }
      if (candidat) { candidat.boite.x += dx; candidat.boite.y += dy; }
    },

    // Déplacement total, à mémoriser au lancement d'une détection pour compenser sa latence.
    get cumul() { return { ...cumul }; },

    // Résultat d'une détection (boîte écran déjà compensée, ou null).
    maj(boite, t) {
      if (!boite) {
        if (t - derniereVue > persistanceMs) oublier();
        return;
      }
      if (cible && !proches(cible, boite)) {
        candidat = candidat && proches(candidat.boite, boite)
          ? { boite: { ...boite }, vues: candidat.vues + 1 }
          : { boite: { ...boite }, vues: 1 };
        if (candidat.vues < confirmationsSaut) return;
        cible = null; // saut confirmé : on repart de la nouvelle boîte
      }
      candidat = null;
      vues++;
      derniereVue = t;
      if (!cible) {
        cible = { ...boite };
        return;
      }
      // Position : la détection fait foi. Taille : légèrement lissée.
      const c = centre(boite);
      const w = cible.w + (boite.w - cible.w) * lissageTaille;
      const h = cible.h + (boite.h - cible.h) * lissageTaille;
      cible = { x: c.x - w / 2, y: c.y - h / 2, w, h };
    },

    // État courant à l'instant t.
    lire(t) {
      if (cible && t - derniereVue > persistanceMs) oublier();
      return { cible, actif: cible !== null && vues >= confirmations };
    },
  };
}
