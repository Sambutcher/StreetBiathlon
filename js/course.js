// Course entre deux tirs : il faut être à plus de `distance` mètres (à vol d'oiseau) du point
// de départ pour débloquer le tir ; revenir en deçà le rebloque. Pur, sans dépendance au navigateur.
// Une position (fix) : { lat, lon, precision (m), t (ms) }.

const RAYON_TERRE = 6371000;
const rad = (d) => (d * Math.PI) / 180;

// Distance en mètres entre deux positions (haversine).
export function distanceM(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function creerCourse({ distance = 100, precisionMax = 30, memoireMs = 10000, confirmations = 2 } = {}) {
  let recentes = []; // positions assez précises des dernières secondes
  let derniere = null; // dernière position reçue, même imprécise (affichage de la précision)
  let lancee = false;
  let depart = null;
  let parcourue = 0;
  let loin = 0; // positions consécutives au-delà de la distance

  return {
    ajouter(fix) {
      derniere = fix;
      if (fix.precision > precisionMax) return;
      recentes = [...recentes.filter((f) => fix.t - f.t <= memoireMs), fix];
      if (!lancee) return;
      if (!depart) {
        depart = fix;
        return;
      }
      parcourue = distanceM(depart, fix);
      // Une position aberrante isolée ne suffit pas : il en faut plusieurs de suite.
      loin = parcourue >= distance ? loin + 1 : 0;
    },

    // Nouveau départ : la meilleure position récente, sinon la prochaine position précise.
    demarrer(t) {
      const candidates = recentes.filter((f) => t - f.t <= memoireMs);
      depart = candidates.length
        ? candidates.reduce((meilleure, f) => (f.precision <= meilleure.precision ? f : meilleure)) // à égalité, la plus récente
        : null;
      lancee = true;
      parcourue = 0;
      loin = 0;
    },

    etat() {
      const phase = !lancee ? 'arret' : !depart ? 'gps' : loin >= confirmations ? 'fini' : 'course';
      return { phase, distance: parcourue, objectif: distance, precision: derniere ? derniere.precision : null };
    },
  };
}
