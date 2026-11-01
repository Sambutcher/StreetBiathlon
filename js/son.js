// Sons synthétisés (Web Audio, aucun fichier) : sur iOS, le commutateur silencieux les coupe.
// Le contexte audio se crée et se réveille sur un geste de l'utilisateur (`activerSon`) ; sans lui,
// toutes les fonctions sont sans effet. Timbres à régler à l'oreille avec les constantes ci-dessous.

const VOLUME = 1; // gain général
// Bips des 100 m (seul son renforcé) : aigus, longs, répétés, derrière un compresseur.
const BIPS_DEBLOCAGE = 3; // nombre de bips
const FREQ_DEBLOCAGE = 1760; // Hz, zone où l'oreille est la plus sensible
const VOLUME_DEBLOCAGE = 4; // gain avant compresseur
const DELAI_IMPACT = 0.07; // s entre le coup de feu et son résultat (touche / raté)

let ctx = null;
let bufferBruit = null;
let compresseur = null;

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

// Coup de feu : claquement sec et sourd.
export function tir() {
  if (!pret()) return;
  bruit(0, 0.09, { filtre: 'bandpass', freq: 1000, volume: 0.55 });
  note(100, 0, 0.12, { type: 'triangle', fin: 35, volume: 0.45 });
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

// Détente sans cartouche : clic sec.
export function vide() {
  if (!pret()) return;
  bruit(0, 0.03, { filtre: 'bandpass', freq: 2500, volume: 0.35 });
  note(220, 0, 0.05, { type: 'square', fin: 120, volume: 0.08 });
}

// 100 m faits, le tir est débloqué : bips répétés, aigus et forts (niveau tenu puis extinction).
export function tirDebloque() {
  if (!pret()) return;
  if (!compresseur) {
    compresseur = ctx.createDynamicsCompressor();
    compresseur.threshold.value = -6;
    compresseur.knee.value = 0;
    compresseur.ratio.value = 20;
    compresseur.attack.value = 0.002;
    compresseur.connect(ctx.destination);
  }
  for (let i = 0; i < BIPS_DEBLOCAGE; i++) {
    const t = ctx.currentTime + i * 0.28;
    const duree = 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = FREQ_DEBLOCAGE;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(VOLUME_DEBLOCAGE, t + 0.004);
    gain.gain.setValueAtTime(VOLUME_DEBLOCAGE, t + duree * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
    osc.connect(gain).connect(compresseur);
    osc.start(t);
    osc.stop(t + duree);
  }
}

// Tir sans cible : « bug » d'ordinateur, buzz carré qui chute en trois saccades.
export function bug() {
  if (!pret()) return;
  [0, 0.11, 0.22].forEach((d, i) => note(300 - i * 70, d, 0.09, { type: 'sawtooth', fin: 90, volume: 0.22 }));
  bruit(0.05, 0.25, { filtre: 'highpass', freq: 3000, volume: 0.12 });
}
