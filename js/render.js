// Dessin dans le canvas plein écran (coordonnées en points CSS).
import { CARTOUCHES } from './game.js';
import { plaque, placementVideo } from './geometry.js';

// Couleurs de la plaque : face et 4 faces du biseau (la teinte verte signale la phase bonus).
const PLAQUE = { face: '#ecece6', haut: '#ffffff', gauche: '#f8f8f4', bas: '#a9a9a0', droite: '#bdbdb4' };
const PLAQUE_BONUS = { face: '#3fcf5e', haut: '#9af5ae', gauche: '#72e48b', bas: '#1c8a38', droite: '#27a847' };

export function creerRendu(canvas) {
  const ctx = canvas.getContext('2d');
  let largeur = 0;
  let hauteur = 0;
  let margeHaut = 0;

  function redimensionner() {
    const dpr = window.devicePixelRatio || 1;
    largeur = window.innerWidth;
    hauteur = window.innerHeight;
    canvas.width = Math.round(largeur * dpr);
    canvas.height = Math.round(hauteur * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    margeHaut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
  }
  window.addEventListener('resize', redimensionner);
  redimensionner();

  // Vidéo entière, placée selon le cadrage (voir placementVideo : pas de découpe de la source).
  function video(source, c) {
    const ecran = { x: 0, y: 0, w: largeur, h: hauteur };
    const p = placementVideo(c, source.videoWidth, source.videoHeight, largeur, hauteur, ecran, ecran);
    ctx.drawImage(source, p.x, p.y, p.w, p.h);
  }

  // Cible de biathlon : plaque blanche à angles droits en léger relief, ronds creusés,
  // éclats gris aux tirs manqués sur la plaque.
  function cible(boite, listeRonds, touches, impacts, bonus = false) {
    const p = plaque(boite);
    ctx.save();
    // Ombre portée : la plaque semble décollée de la scène.
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    const c = bonus ? PLAQUE_BONUS : PLAQUE;
    ctx.fillStyle = c.face;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
    biseau(p, Math.max(1.5, (p.w - boite.w) * 0.18), c);

    ctx.save();
    listeRonds.forEach((r, i) => {
      const trait = Math.max(1, r.r * 0.14);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, 2 * Math.PI);
      ctx.fillStyle = touches[i] ? '#fff' : '#111';
      ctx.fill();
      if (touches[i]) {
        ctx.strokeStyle = '#a8a8a0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Creux : arête sombre en haut, reflet en bas.
      ctx.lineWidth = trait;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r - trait / 2, Math.PI * 1.1, Math.PI * 1.9);
      ctx.strokeStyle = touches[i] ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.6)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r - trait / 2, Math.PI * 0.15, Math.PI * 0.85);
      ctx.strokeStyle = touches[i] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)';
      ctx.stroke();
    });
    const tailleEclat = Math.max(2, listeRonds[0].r * 0.22);
    for (const { u, v } of impacts) eclat(p.x + u * p.w, p.y + v * p.h, tailleEclat, u, v);
    ctx.restore();
  }

  // Bords de la plaque : haut/gauche éclairés, bas/droite dans l'ombre.
  function biseau(p, b, c) {
    const { x, y, w, h } = p;
    const face = (points, couleur) => {
      ctx.beginPath();
      points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.fillStyle = couleur;
      ctx.fill();
    };
    face([[x, y], [x + w, y], [x + w - b, y + b], [x + b, y + b]], c.haut);
    face([[x, y], [x + b, y + b], [x + b, y + h - b], [x, y + h]], c.gauche);
    face([[x, y + h], [x + b, y + h - b], [x + w - b, y + h - b], [x + w, y + h]], c.bas);
    face([[x + w, y], [x + w, y + h], [x + w - b, y + h - b], [x + w - b, y + b]], c.droite);
  }

  // Petit éclat irrégulier ; sa forme dépend de (u, v) pour rester identique d'une image à l'autre.
  function eclat(x, y, taille, u, v) {
    let graine = (Math.floor(u * 9973) * 31 + Math.floor(v * 7919) * 17) >>> 0;
    const hasard = () => {
      graine = (graine * 1664525 + 1013904223) >>> 0;
      return graine / 4294967296;
    };
    const branches = 5 + Math.floor(hasard() * 2);
    const depart = hasard() * Math.PI;
    ctx.beginPath();
    for (let i = 0; i < branches * 2; i++) {
      const a = depart + (i * Math.PI) / branches + (hasard() - 0.5) * 0.4;
      const r = i % 2 ? taille * (0.35 + hasard() * 0.15) : taille * (0.75 + hasard() * 0.35);
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#8c8c84';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, taille * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = '#4a4a46';
    ctx.fill();
  }

  function rectArrondi(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function viseur() {
    const cx = largeur / 2;
    const cy = hauteur / 2;
    const r = Math.min(largeur, hauteur) * 0.12;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(cx + dx * r * 0.3, cy + dy * r * 0.3);
      ctx.lineTo(cx + dx * r * 1.4, cy + dy * r * 1.4);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  function cartouches(restantes) {
    const w = 14;
    const h = 44;
    const y = margeHaut + 16;
    ctx.save();
    for (let i = 0; i < CARTOUCHES; i++) {
      const x = 16 + i * (w + 10);
      const pleine = i < restantes;
      // Douille
      ctx.fillStyle = pleine ? '#d4a017' : 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = pleine ? '#7a5a00' : 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(x, y + h * 0.35, w, h * 0.65);
      ctx.strokeRect(x, y + h * 0.35, w, h * 0.65);
      // Ogive
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.35);
      ctx.quadraticCurveTo(x, y, x + w / 2, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.35);
      ctx.closePath();
      ctx.fillStyle = pleine ? '#b87333' : 'rgba(255,255,255,0.15)';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function message(texte) {
    ctx.save();
    ctx.font = '600 18px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const y = hauteur - 48;
    const w = ctx.measureText(texte).width + 32;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rectArrondi(largeur / 2 - w / 2, y - 20, w, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(texte, largeur / 2, y);
    ctx.restore();
  }

  // Pastille sombre centrée en (cx, cy) avec un texte ; renvoie rien. Lisible sur tout fond.
  function pastille(texte, cx, cy, police, couleur, echelle = 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(echelle, echelle);
    ctx.font = police;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const h = parseFloat(police.split('px')[0].split(' ').pop()) + 14;
    const w = Math.max(h, ctx.measureText(texte).width + 24);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    rectArrondi(-w / 2, -h / 2, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = couleur;
    ctx.fillText(texte, 0, 1);
    ctx.restore();
  }

  // Score global (haut à droite, `rebond` 0–1 : léger grossissement après une touche) et, sous la
  // plaque de `boite` (null sans feu), les points en jeu (« ? » si `enJeu` est null).
  function points(score, boite, enJeu, rebond = 0) {
    const police = '700 30px -apple-system, system-ui, sans-serif';
    ctx.font = police;
    const w = Math.max(44, ctx.measureText(`${score} pts`).width + 24);
    pastille(`${score} pts`, largeur - 16 - w / 2, margeHaut + 40, police, '#fff', 1 + 0.25 * rebond);
    if (boite) {
      const p = plaque(boite);
      const x = Math.min(Math.max(boite.x + boite.w / 2, 30), largeur - 30);
      // Sans pastille : contour sombre pour rester lisible sur tout fond.
      ctx.save();
      ctx.font = '700 28px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      const texte = enJeu === null ? '?' : `${enJeu}`;
      ctx.strokeText(texte, x, p.y + p.h + 30);
      ctx.fillStyle = enJeu === null ? '#ccc' : '#ffdc00';
      ctx.fillText(texte, x, p.y + p.h + 30);
      ctx.restore();
    }
  }

  // Retour du dernier tir, `age` de 0 à 1 : touche = « +N » qui monte de la cible en s'effaçant,
  // raté = croix rouge brève sous la cible. `boite` : feu visé (null : centre de l'écran).
  function retourTir(tir, boite, age) {
    if (age >= 1) return;
    const x = boite ? boite.x + boite.w / 2 : largeur / 2;
    const y = boite ? boite.y + boite.h / 2 : hauteur / 2;
    ctx.save();
    ctx.globalAlpha = 1 - age * age;
    if (tir.resultat === 'touche') {
      if (tir.gain > 0) pastille(`+${tir.gain}`, x, y - 30 - age * 70, '700 30px -apple-system, system-ui, sans-serif', '#2ecc40');
    } else {
      // Même emplacement et même montée que le « +N » d'une touche.
      ctx.strokeStyle = '#ff4136';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      const r = 16;
      const yc = y - 30 - age * 70;
      ctx.beginPath();
      ctx.moveTo(x - r, yc - r); ctx.lineTo(x + r, yc + r);
      ctx.moveTo(x + r, yc - r); ctx.lineTo(x - r, yc + r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function flash(resultat, intensite) {
    ctx.save();
    ctx.globalAlpha = 0.35 * intensite;
    ctx.fillStyle = resultat === 'touche' ? '#2ecc40' : '#ff4136';
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.restore();
  }

  function effacer() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, largeur, hauteur);
  }

  // Écran de course (caméra éteinte) : distance à vol d'oiseau depuis le départ (sans plafond)
  // et barre qui se remplit jusqu'à l'objectif, verte quand le tir est débloqué.
  // e = course.etat() ; alerte : message exceptionnel (localisation refusée…), sinon null.
  function course(e, alerte, score, derniereSerie) {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = largeur / 2;
    const debloque = e.phase === 'fini';

    const enCourse = e.phase === 'course' || debloque;
    ctx.fillStyle = debloque ? '#2ecc40' : '#fff';
    ctx.font = '700 96px -apple-system, system-ui, sans-serif';
    ctx.fillText(enCourse ? `${Math.floor(e.distance)} m` : '— m', cx, hauteur * 0.4);
    ctx.fillStyle = '#fff';
    ctx.font = '600 28px -apple-system, system-ui, sans-serif';
    ctx.fillText(`${score} pts`, cx, hauteur * 0.2);
    if (derniereSerie) {
      ctx.fillStyle = '#aaa';
      ctx.font = '500 20px -apple-system, system-ui, sans-serif';
      ctx.fillText(`Dernière série : ${derniereSerie.touches}/${CARTOUCHES} — +${derniereSerie.points} pts`, cx, hauteur * 0.2 + 36);
    }

    const bw = Math.min(largeur - 75, 300);
    const bh = 16;
    const bx = cx - bw / 2;
    const by = hauteur * 0.56;
    ctx.fillStyle = '#222';
    rectArrondi(bx, by, bw, bh, bh / 2);
    ctx.fill();
    const part = enCourse ? Math.min(1, e.distance / e.objectif) : 0;
    if (part > 0) {
      ctx.fillStyle = debloque ? '#2ecc40' : '#d4a017';
      rectArrondi(bx, by, Math.max(bh, bw * part), bh, bh / 2);
      ctx.fill();
    }

    if (alerte) {
      ctx.fillStyle = '#ff6b5b';
      ctx.font = '600 16px -apple-system, system-ui, sans-serif';
      ctx.fillText(alerte, cx, by + 48);
    }
    ctx.restore();
  }

  // Cadre de la zone analysée par le modèle (mode debug).
  function zone(z) {
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = z.type === 'cible' ? '#0f0' : z.type === 'centre' ? '#0cf' : '#ff0';
    ctx.strokeRect(z.x + 1, z.y + 1, z.w - 2, z.h - 2);
    ctx.restore();
  }

  function diagnostic(lignes) {
    ctx.save();
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(largeur - 150, margeHaut + 12, 142, lignes.length * 15 + 8);
    ctx.fillStyle = '#0f0';
    lignes.forEach((l, i) => ctx.fillText(l, largeur - 14, margeHaut + 16 + i * 15));
    ctx.restore();
  }

  return {
    get largeur() { return largeur; },
    get hauteur() { return hauteur; },
    video, effacer, cible, viseur, cartouches, message, flash, points, retourTir, course, zone, diagnostic,
  };
}
