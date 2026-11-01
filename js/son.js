// Sons synthétisés (Web Audio, aucun fichier) : sur iOS, le commutateur silencieux les coupe.
// Le contexte audio se crée et se réveille sur un geste de l'utilisateur (`activerSon`) ; sans lui,
// toutes les fonctions sont sans effet. Timbres à régler à l'oreille avec les constantes ci-dessous.

const VOLUME = 1; // gain général
const DELAI_IMPACT = 0.07; // s entre le coup de feu et son résultat (touche / raté)

let ctx = null;
let bufferBruit = null;

// À appeler dans un gestionnaire de clic.
export function activerSon() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') ctx.resume();
  } catch (e) {
    console.warn('Son indisponible :', e);
  }
}

function pret() {
  return ctx !== null && ctx.state === 'running';
}

// Note qui glisse de `freq` à `fin` en `duree` secondes, s'éteignant en fondu.
function note(freq, debut, duree, { type = 'sine', volume = 0.25, fin = freq } = {}) {
  const t = ctx.currentTime + debut;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(fin, t + duree);
  gain.gain.setValueAtTime(volume * VOLUME, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duree);
}

// Bruit blanc filtré (claquements, souffles).
function bruit(debut, duree, { filtre = 'lowpass', freq = 2000, volume = 0.4 } = {}) {
  if (!bufferBruit) {
    bufferBruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bufferBruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + debut;
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = bufferBruit;
  f.type = filtre;
  f.frequency.value = freq;
  gain.gain.setValueAtTime(volume * VOLUME, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
  src.connect(f).connect(gain).connect(ctx.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duree);
}

// Coup de feu : claquement très bref et sec (bruit aigu + toc court).
export function tir() {
  if (!pret()) return;
  bruit(0, 0.035, { filtre: 'highpass', freq: 2200, volume: 0.6 });
  note(180, 0, 0.04, { type: 'triangle', fin: 70, volume: 0.25 });
}

// Touche : « ting » métallique.
export function touche() {
  if (!pret()) return;
  note(1320, DELAI_IMPACT, 0.5, { volume: 0.25 });
  note(1980, DELAI_IMPACT, 0.35, { volume: 0.12 });
}

// Touche sur la balle doublée : le « ting » précédé d'une petite montée.
export function bonus() {
  if (!pret()) return;
  [1047, 1319, 1568].forEach((f, i) => note(f, DELAI_IMPACT + i * 0.08, 0.3, { type: 'triangle', volume: 0.22 }));
  note(2093, DELAI_IMPACT + 0.24, 0.6, { volume: 0.2 });
}

// Raté : souffle sourd et note qui tombe.
export function rate() {
  if (!pret()) return;
  bruit(DELAI_IMPACT, 0.18, { freq: 700, volume: 0.25 });
  note(300, DELAI_IMPACT, 0.22, { type: 'triangle', fin: 110, volume: 0.15 });
}

// Détente sans cartouche : clic sec.
export function vide() {
  if (!pret()) return;
  bruit(0, 0.03, { filtre: 'bandpass', freq: 2500, volume: 0.35 });
  note(220, 0, 0.05, { type: 'square', fin: 120, volume: 0.08 });
}

// 100 m faits, le tir est débloqué : double bip.
export function tirDebloque() {
  if (!pret()) return;
  note(880, 0, 0.11, { type: 'square', volume: 0.12 });
  note(880, 0.17, 0.11, { type: 'square', volume: 0.12 });
}
