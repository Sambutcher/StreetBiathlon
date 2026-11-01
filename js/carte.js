// Carte du parcours : tracé sur fond noir, sans fond de plan (appli hors ligne, sans service
// externe). Projection équirectangulaire ajustée au tracé.

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

// Dessine le tracé de resume (voir parcours.js) dans le canvas : départ vert, arrivée rouge,
// pas de tir numérotés (vert si au moins une touche, orange sinon).
export function dessinerCarte(canvas, resume) {
  const dpr = window.devicePixelRatio || 1;
  const l = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(l * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, l, h);
  const tout = [...resume.points, ...resume.tirs];
  const xy = projeter(tout, l, h);
  if (!xy.length) return;
  const trace = xy.slice(0, resume.points.length);
  const pas = xy.slice(resume.points.length);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#d4a017';
  ctx.beginPath();
  trace.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();

  const rond = (p, couleur, rayon, texte) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, rayon, 0, 2 * Math.PI);
    ctx.fillStyle = couleur;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (texte) {
      ctx.fillStyle = '#000';
      ctx.font = '700 12px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(texte, p.x, p.y + 0.5);
    }
  };
  if (trace.length) {
    rond(trace[0], '#2ecc40', 7);
    rond(trace[trace.length - 1], '#ff4136', 7);
  }
  pas.forEach((p, i) => rond(p, resume.tirs[i].touches > 0 ? '#2ecc40' : '#ff851b', 11, String(i + 1)));
}
