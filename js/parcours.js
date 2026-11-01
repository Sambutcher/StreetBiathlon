// Suivi du parcours pendant toute la partie : tracé GPS, distance réellement parcourue (cumul le
// long du tracé), pas de tir et bilan de chaque série. Pur, sans dépendance au navigateur.
import { distanceM } from './course.js';
import { CARTOUCHES } from './game.js';

const PRECISION_MAX = 30; // m, comme course.js
const VITESSE_MAX = 12; // m/s, au-delà : saut GPS
const PAS_MIN = 2; // m, en deçà : bruit à l'arrêt, ignoré

export function creerParcours(debutMs) {
  const points = []; // { lat, lon, t }
  const tirs = []; // { lat, lon, touches, points }
  const delais = []; // durée (ms) de chaque tir : depuis l'affichage de la caméra, puis depuis le tir précédent
  const debutsSeries = []; // instants (ms) d'affichage de la caméra, un par séquence de tir
  let distance = 0;

  return {
    ajouter(fix) {
      if (fix.precision > PRECISION_MAX) return;
      const p = { lat: fix.lat, lon: fix.lon, t: fix.t };
      const dernier = points[points.length - 1];
      if (!dernier) {
        points.push(p);
        return;
      }
      const d = distanceM(dernier, p);
      const dt = (p.t - dernier.t) / 1000;
      if (dt > 0 && d / dt > VITESSE_MAX) return;
      if (d < PAS_MIN) return;
      distance += d;
      points.push(p);
    },

    // Pas de tir à la dernière position connue ; bilan = { touches, points } de la série.
    marquerTir(bilan) {
      const dernier = points[points.length - 1];
      if (!dernier || !bilan) return;
      tirs.push({ lat: dernier.lat, lon: dernier.lon, touches: bilan.touches, points: bilan.points });
    },

    enregistrerDebutSerie(t) {
      debutsSeries.push(t);
    },

    enregistrerDelai(ms) {
      delais.push(ms);
    },

    distance: () => distance,

    resume(finMs) {
      return { duree: finMs - debutMs, distance, points: [...points], tirs: [...tirs], delais: [...delais], debutsSeries: [...debutsSeries] };
    },
  };
}

// 754 s → « 12:34 » ; au-delà d'une heure → « 1:02:03 ».
export function formaterDuree(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const deux = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${deux(m)}:${deux(s)}` : `${m}:${deux(s)}`;
}

// 850 → « 850 m » ; 2410 → « 2,41 km ».
export function formaterDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2).replace('.', ',')} km`;
}

// 4230 → « 4,2 s ».
export function formaterSecondes(ms) {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
}

// Allure en min/km sous forme « 5:30 », null si la distance est trop courte pour conclure.
export function allure(dureeMs, distanceMetres) {
  if (distanceMetres < 10) return null;
  const s = Math.round(dureeMs / distanceMetres); // secondes par km
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Statistiques du récapitulatif à partir de resume() et du score final.
export function statistiques(resume, score) {
  const series = resume.tirs.length;
  const touches = resume.tirs.reduce((n, t) => n + t.touches, 0);
  const tirsTotal = series * CARTOUCHES;
  const heures = resume.duree / 3600000;
  return {
    score,
    series,
    touches,
    tirs: tirsTotal,
    reussite: tirsTotal ? Math.round((touches / tirsTotal) * 100) : null,
    meilleureSerie: series ? Math.max(...resume.tirs.map((t) => t.points)) : null,
    tempsMoyenTir: resume.delais && resume.delais.length ? resume.delais.reduce((a, b) => a + b, 0) / resume.delais.length : null,
    // Temps moyen d'un tour : écart moyen entre les débuts de deux séquences de tir successives.
    tempsMoyenTour: resume.debutsSeries && resume.debutsSeries.length > 1
      ? (resume.debutsSeries[resume.debutsSeries.length - 1] - resume.debutsSeries[0]) / (resume.debutsSeries.length - 1)
      : null,
    allure: allure(resume.duree, resume.distance),
    vitesseKmh: heures > 0 && resume.distance >= 10 ? resume.distance / 1000 / heures : null,
  };
}
