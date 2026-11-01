// Position GPS pendant toute la partie, et écran maintenu allumé (iOS coupe le GPS des pages
// web quand l'écran se verrouille). Mode simulation pour tester sans courir.

// Appelle rappel({ lat, lon, precision, t }) à chaque position, rappelErreur(message) si le GPS
// est refusé ou absent.
export function suivrePosition(rappel, rappelErreur, { simulation = false } = {}) {
  if (simulation) return simulerCourse(rappel);
  if (!('geolocation' in navigator)) {
    rappelErreur('GPS indisponible sur cet appareil');
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => rappel({ lat: p.coords.latitude, lon: p.coords.longitude, precision: p.coords.accuracy, t: Date.now() }),
    // Seul le refus est signalé ; une attente du GPS (délai, signal perdu) se résout d'elle-même.
    (e) => { if (e.code === 1) rappelErreur('Autorisez la localisation pour courir'); },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

// Nouveau cap (degrés, 0 = nord, > 0 vers l'est) après un pas de 3 m : variation aléatoire
// entre -0,5° et +2,5° (moyenne +1°/pas : un tour complet en ~1 km). `aleatoire` renvoie un nombre dans [0, 1[.
export function pasSimule(cap, aleatoire = Math.random) {
  return cap - 0.5 + 3 * aleatoire();
}

// Course simulée à ~3 m/s, une position par seconde (un pas de 3 m), cap qui dérive à chaque pas
// depuis le nord, bruit de ±2 m sur la position rapportée.
function simulerCourse(rappel) {
  const depart = { lat: 48.8566, lon: 2.3522 };
  const bruit = () => (Math.random() - 0.5) * 4;
  let cap = 0;
  let nord = 0;
  let est = 0;
  const id = setInterval(() => {
    cap = pasSimule(cap);
    nord += 3 * Math.cos((cap * Math.PI) / 180);
    est += 3 * Math.sin((cap * Math.PI) / 180);
    rappel({
      lat: depart.lat + (nord + bruit()) / 111195,
      lon: depart.lon + (est + bruit()) / (111195 * Math.cos((depart.lat * Math.PI) / 180)),
      precision: 8,
      t: Date.now(),
    });
  }, 1000);
  return () => clearInterval(id);
}

// Empêche la mise en veille de l'écran, et le redemande au retour sur la page.
export function garderEcranAllume() {
  if (!('wakeLock' in navigator)) return;
  const demander = () => navigator.wakeLock.request('screen').catch((e) => console.warn('Wake Lock :', e));
  demander();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') demander();
  });
}
