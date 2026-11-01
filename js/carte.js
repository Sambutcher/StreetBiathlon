// Carte du parcours : tracé sur fond noir, sans fond de plan (appli hors ligne, sans service
// externe). Projection équirectangulaire ajustée au tracé.

// Couleur d'un pas de tir selon les cibles touchées sur 3 : rouge 0, orange 1, jaune 2, vert 3.
export const COULEURS_PAS = ['#ff4136', '#ff851b', '#ffdc00', '#2ecc40'];
export const couleurPas = (touches) => COULEURS_PAS[Math.max(0, Math.min(3, touches))];

// Indice du pas de tir `pas` ([{x, y}]) le plus proche de (x, y) à moins de `rayon` px, sinon -1.
export function pasProche(pas, x, y, rayon = 30) {
  let meilleur = -1;
  let dMin = rayon;
  pas.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= dMin) { dMin = d; meilleur = i; }
  });
  return meilleur;
}

// Positions {lat, lon} → points {x, y} dans un rectangle largeur × hauteur, marge comprise,
// nord en haut, échelle identique sur les deux axes. Un tracé vide donne [], un seul point le centre.
export function projeter(positions, largeur, hauteur, marge = 24) {
  if (!positions.length) return [];
  const lat0 = positions.reduce((s, p) => s + p.lat, 0) / positions.length;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const xs = positions.map((p) => p.lon * kx);
  const ys = positions.map((p) => -p.lat);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const etendue = Math.max(x1 - x0, y1 - y0);
  const echelle = etendue > 0 ? Math.min((largeur - 2 * marge) / (x1 - x0 || etendue), (hauteur - 2 * marge) / (y1 - y0 || etendue)) : 1;
  const ox = (largeur - (x1 - x0) * echelle) / 2;
  const oy = (hauteur - (y1 - y0) * echelle) / 2;
  return positions.map((_, i) => ({ x: ox + (xs[i] - x0) * echelle, y: oy + (ys[i] - y0) * echelle }));
}

// Dessine le tracé de resume (voir parcours.js) dans le canvas, qui occupe tout l'écran :
// fond quadrillé, tracé doré lumineux, départ vert, arrivée rouge, pas de tir en cibles numérotées
// (cœur rouge / orange / jaune / vert pour 0 / 1 / 2 / 3 cibles touchées). Renvoie les positions écran
// des pas de tir ([{x, y}]), pour les rendre cliquables. `haut` et `bas` : bandes (px) réservées aux
// éléments posés par-dessus (score, chiffres, bouton), où le tracé ne passe pas.
export function dessinerCarte(canvas, resume, { haut = 0, bas = 0 } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const l = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(l * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, l, h);
  ctx.strokeStyle = '#1a212b';
  ctx.lineWidth = 1;
  for (let x = 0; x <= l; x += 37.5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 37.5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(l, y); ctx.stroke(); }

  const tout = [...resume.points, ...resume.tirs];
  const zoneH = Math.max(60, h - haut - bas);
  const xy = projeter(tout, l, zoneH, 36).map((p) => ({ x: p.x, y: p.y + haut }));
  if (!xy.length) return [];
  const trace = xy.slice(0, resume.points.length);
  const pas = xy.slice(resume.points.length);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const tracer = () => {
    ctx.beginPath();
    trace.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  };
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.shadowColor = '#d4a017';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 10;
  tracer();
  ctx.restore();
  ctx.strokeStyle = '#e8b923';
  ctx.lineWidth = 5;
  tracer();

  const rond = (p, couleur, rayon) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, rayon, 0, 2 * Math.PI);
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };
  if (trace.length) {
    rond(trace[0], '#2ecc40', 9);
    rond(trace[trace.length - 1], '#ff4136', 9);
  }
  pas.forEach((p, i) => {
    rond(p, '#fff', 17);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, 2 * Math.PI);
    ctx.fillStyle = couleurPas(resume.tirs[i].touches);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '700 14px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), p.x, p.y + 0.5);
  });
  return pas;
}
