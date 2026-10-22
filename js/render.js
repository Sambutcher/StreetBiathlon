// Dessin dans le canvas plein écran (coordonnées en points CSS).
import { CARTOUCHES } from './game.js';

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

  function video(source, c) {
    ctx.drawImage(source, c.sx, c.sy, c.sw, c.sh, 0, 0, largeur, hauteur);
  }

  function cible(boite, listeRonds, touches) {
    const marge = boite.w * 0.15;
    ctx.save();
    ctx.fillStyle = '#f4f4f0';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    plaque(boite.x - marge, boite.y - marge, boite.w + 2 * marge, boite.h + 2 * marge, marge);
    ctx.fill();
    ctx.stroke();
    listeRonds.forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, 2 * Math.PI);
      ctx.fillStyle = touches[i] ? '#fff' : '#111';
      ctx.fill();
      if (touches[i]) {
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function plaque(x, y, w, h, r) {
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
    plaque(largeur / 2 - w / 2, y - 20, w, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(texte, largeur / 2, y);
    ctx.restore();
  }

  function flash(resultat, intensite) {
    ctx.save();
    ctx.globalAlpha = 0.35 * intensite;
    ctx.fillStyle = resultat === 'touche' ? '#2ecc40' : '#ff4136';
    ctx.fillRect(0, 0, largeur, hauteur);
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
    video, cible, viseur, cartouches, message, flash, diagnostic,
  };
}
