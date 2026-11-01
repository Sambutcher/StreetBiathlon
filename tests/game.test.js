import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nouvelEtat, debloquerTir, finSerie, serieTerminee, voirFeu, quitterFeu, tirer, serieEntamee, CARTOUCHES, bilanSerie, multiplicateur } from '../js/game.js';
import { ronds } from '../js/geometry.js';
import { creerSuivi } from '../js/tracker.js';

const cible = { x: 0, y: 0, w: 30, h: 90 }; // boîte du feu ; plaque = marge de 4,5 autour
const haut = { x: 15, y: 15 };
const ailleurs = { x: 200, y: 200 };
const enPosition = () => debloquerTir(nouvelEtat());

test('la partie commence par la course, sans balles', () => {
  const etat = nouvelEtat();
  assert.equal(etat.phase, 'course');
  assert.equal(etat.cartouches, 0);
  assert.equal(tirer(voirFeu(etat), cible, haut).resultat, null, 'pas de tir pendant la course');
});

test('position de tir : 3 cartouches et cible vierge', () => {
  const etat = enPosition();
  assert.equal(etat.phase, 'tir');
  assert.equal(etat.cartouches, CARTOUCHES);
  assert.deepEqual(etat.touches, [false, false, false]);
  assert.deepEqual(etat.impacts, []);
});

test('tir sans feu visible : raté sans cible, cartouche perdue', () => {
  const { etat, resultat, sansCible, gain } = tirer(enPosition(), null, haut);
  assert.equal(resultat, 'rate');
  assert.equal(sansCible, true);
  assert.equal(gain, 0);
  assert.equal(etat.cartouches, CARTOUCHES - 1);
  assert.deepEqual(etat.impacts, []);
  assert.equal(tirer(nouvelEtat(), null, haut).resultat, null, 'pas de tir pendant la course');
});

test('touché blanchit le rond et consomme une cartouche', () => {
  const { etat, resultat } = tirer(voirFeu(enPosition()), cible, haut);
  assert.equal(resultat, 'touche');
  assert.deepEqual(etat.touches, [true, false, false]);
  assert.equal(etat.cartouches, 2);
  assert.ok(serieEntamee(etat));
});

test('raté consomme une cartouche sans blanchir', () => {
  const { etat, resultat } = tirer(voirFeu(enPosition()), cible, ailleurs);
  assert.equal(resultat, 'rate');
  assert.deepEqual(etat.touches, [false, false, false]);
  assert.equal(etat.cartouches, 2);
});

test('un rond déjà blanchi compte comme raté', () => {
  const etat = tirer(voirFeu(enPosition()), cible, haut).etat;
  const r = tirer(etat, cible, haut);
  assert.equal(r.resultat, 'rate');
  assert.deepEqual(r.etat.touches, [true, false, false]);
});

test('3 cartouches maximum', () => {
  let etat = voirFeu(enPosition());
  for (let i = 0; i < 3; i++) etat = tirer(etat, cible, ailleurs).etat;
  assert.equal(etat.cartouches, 0);
  assert.equal(tirer(etat, cible, haut).resultat, null);
});

test('la série survit à la perte du feu tant qu\'il reste des balles', () => {
  let etat = tirer(voirFeu(enPosition()), cible, haut).etat;
  etat = quitterFeu(etat);
  assert.equal(etat.cibleVisible, false);
  assert.equal(etat.cartouches, 2);
  assert.deepEqual(etat.touches, [true, false, false]);
  assert.equal(tirer(etat, cible, haut).sansCible, true, 'tap sans feu : raté dans le vide');
  etat = voirFeu(etat);
  assert.deepEqual(etat.touches, [true, false, false], 'ronds conservés au retour');
});

test('3 balles tirées : fin de série, retour à la course ; quitter le feu ne recharge plus', () => {
  let etat = voirFeu(enPosition());
  assert.ok(!serieTerminee(etat));
  for (let i = 0; i < 3; i++) etat = tirer(etat, cible, haut).etat;
  assert.ok(serieTerminee(etat));
  assert.equal(quitterFeu(etat).cartouches, 0, 'pas de rechargement en quittant le feu');
  etat = finSerie(etat);
  assert.equal(etat.phase, 'course');
  assert.equal(etat.cartouches, 0);
  assert.ok(!serieTerminee(etat));
  etat = debloquerTir(etat);
  assert.equal(etat.cartouches, CARTOUCHES);
  assert.deepEqual(etat.touches, [false, false, false], 'cible vierge après la course');
});

test('suivi : confirmation, position amortie ou recalée, oubli après persistance', () => {
  const s = creerSuivi({ confirmations: 2, persistanceMs: 1000 });
  s.maj({ x: 0, y: 0, w: 10, h: 30 }, 0);
  assert.equal(s.lire(0).actif, false);
  s.maj({ x: 4, y: 0, w: 10, h: 30 }, 100);
  assert.equal(s.lire(100).actif, true);
  assert.equal(s.lire(100).cible.x, 2, 'petit écart (bruit) amorti de moitié');
  s.maj({ x: 12, y: 0, w: 10, h: 30 }, 200);
  assert.equal(s.lire(200).cible.x, 12, 'écart > 25 % de la hauteur : recalage direct');
  s.maj(null, 900);
  assert.equal(s.lire(900).actif, true);
  assert.equal(s.lire(1300).actif, false);
  assert.equal(s.lire(1300).cible, null);
});

test('suivi : taille figée sous un bruit de ±8 %', () => {
  const s = creerSuivi();
  const bruit = [1, 1.08, 0.93, 1.05, 0.92, 1.07, 0.95, 1.03, 0.94, 1.08];
  bruit.forEach((f, i) => s.maj({ x: 100, y: 100, w: 20 * f, h: 60 * f }, i * 100));
  const c = s.lire(1000).cible;
  assert.equal(c.w, 20);
  assert.equal(c.h, 60);
});

test('suivi : la taille suit un vrai changement (+30 %)', () => {
  const s = creerSuivi();
  s.maj({ x: 100, y: 100, w: 20, h: 60 }, 0);
  for (let i = 1; i <= 8; i++) s.maj({ x: 97, y: 91, w: 26, h: 78 }, i * 100);
  const c = s.lire(900).cible;
  assert.ok(Math.abs(c.h - 78) < 78 * 0.03, `hauteur ${c.h} devrait rejoindre 78`);
  assert.ok(Math.abs(c.w - 26) < 26 * 0.03, `largeur ${c.w} devrait rejoindre 26`);
});

test('suivi : la cible suit le flux optique et cumule le déplacement', () => {
  const s = creerSuivi();
  s.maj({ x: 100, y: 100, w: 20, h: 60 }, 0);
  s.deplacer(5, -3);
  s.deplacer(2, 1);
  assert.deepEqual(s.lire(10).cible, { x: 107, y: 98, w: 20, h: 60 });
  assert.deepEqual(s.cumul, { x: 7, y: -2 });
});

test('suivi : un saut lointain exige 2 confirmations', () => {
  const s = creerSuivi();
  s.maj({ x: 100, y: 100, w: 20, h: 60 }, 0);
  s.maj({ x: 100, y: 100, w: 20, h: 60 }, 100);
  s.maj({ x: 300, y: 100, w: 20, h: 60 }, 200);
  assert.equal(s.lire(200).cible.x, 100, 'faux positif isolé ignoré');
  s.maj({ x: 302, y: 100, w: 20, h: 60 }, 300);
  assert.equal(s.lire(300).cible.x, 302, 'saut confirmé');
});

test('raté sur la plaque : un éclat en coordonnées relatives', () => {
  // Plaque : x -4,5 → 34,5 (w 39), y -4,5 → 94,5 (h 99). Entre deux ronds, sur le blanc.
  const { etat, resultat } = tirer(voirFeu(enPosition()), cible, { x: 15, y: 30 });
  assert.equal(resultat, 'rate');
  assert.equal(etat.impacts.length, 1);
  assert.ok(Math.abs(etat.impacts[0].u - 19.5 / 39) < 1e-9);
  assert.ok(Math.abs(etat.impacts[0].v - 34.5 / 99) < 1e-9);
});

test('raté hors plaque ou touché : pas d\'éclat', () => {
  assert.deepEqual(tirer(voirFeu(enPosition()), cible, ailleurs).etat.impacts, []);
  assert.deepEqual(tirer(voirFeu(enPosition()), cible, haut).etat.impacts, []);
});

test('éclats conservés à la perte du feu, effacés au rechargement', () => {
  let etat = tirer(voirFeu(enPosition()), cible, { x: 15, y: 30 }).etat;
  etat = voirFeu(quitterFeu(etat));
  assert.equal(etat.impacts.length, 1);
  etat = tirer(etat, cible, ailleurs).etat;
  etat = tirer(etat, cible, ailleurs).etat;
  assert.deepEqual(debloquerTir(finSerie(etat)).impacts, []);
});

test('une touche ajoute les points au score, un raté non', () => {
  const touche = tirer(voirFeu(enPosition()), cible, haut, 12);
  assert.equal(touche.resultat, 'touche');
  assert.equal(touche.gain, 12);
  assert.equal(touche.etat.score, 12);
  const rate = tirer(voirFeu(enPosition()), cible, ailleurs, 12);
  assert.equal(rate.gain, 0);
  assert.equal(rate.etat.score, 0);
});

test('un rond déjà touché ne rapporte rien et le score survit à la série', () => {
  const premiere = tirer(voirFeu(enPosition()), cible, haut, 7).etat;
  const deuxieme = tirer(premiere, cible, haut, 7);
  assert.equal(deuxieme.gain, 0);
  assert.equal(deuxieme.etat.score, 7);
  assert.equal(debloquerTir(finSerie(deuxieme.etat)).score, 7);
});

test('bilanSerie : ronds touchés et points de la série seulement', () => {
  let etat = tirer(voirFeu(enPosition()), cible, haut, 5).etat;
  etat = debloquerTir(finSerie(etat)); // nouvelle série : le score précédent ne compte pas
  assert.deepEqual(bilanSerie(etat), { touches: 0, points: 0, tirs: [] });
  etat = tirer(voirFeu(etat), cible, haut, 9).etat;
  assert.deepEqual(bilanSerie(etat), { touches: 1, points: 9, tirs: [{ rond: 0, points: 9, double: false, sansCible: false }] });
  assert.equal(etat.score, 14);
});

test('finSerie garde le bilan de la série pour l\'écran de course', () => {
  const etat = finSerie(tirer(voirFeu(enPosition()), cible, haut, 9).etat);
  assert.deepEqual(etat.derniereSerie, { touches: 1, points: 9, tirs: [{ rond: 0, points: 9, double: false, sansCible: false }] });
  assert.equal(etat.phase, 'course');
});

test('bonus : 2 premiers tirs bons → la 3e balle vaut double', () => {
  const milieu = { x: 15, y: 45 };
  const bas = { x: 15, y: 75 };
  let etat = voirFeu(enPosition());
  assert.equal(multiplicateur(etat), 1);
  etat = tirer(etat, cible, haut, 5).etat;
  etat = tirer(etat, cible, milieu, 5).etat;
  assert.equal(multiplicateur(etat), 2);
  const r = tirer(etat, cible, bas, 5);
  assert.equal(r.gain, 10);
  assert.equal(r.etat.score, 20);
});

test('pas de bonus si un des 2 premiers tirs est raté', () => {
  const milieu = { x: 15, y: 45 };
  const bas = { x: 15, y: 75 };
  let etat = voirFeu(enPosition());
  etat = tirer(etat, cible, ailleurs, 5).etat;
  etat = tirer(etat, cible, haut, 5).etat;
  etat = tirer(etat, cible, milieu, 5).etat;
  assert.equal(multiplicateur(etat), 1);
  assert.equal(etat.score, 10);
  assert.equal(tirer(voirFeu(enPosition()), cible, bas, 5).gain, 5);
});

test('détail des balles : rond touché, points, double, raté, sans cible', () => {
  const boite = { x: 100, y: 100, w: 40, h: 120 };
  const [r0, r1] = ronds(boite);
  let etat = voirFeu(debloquerTir(nouvelEtat()));
  etat = tirer(etat, boite, r0, 20).etat;
  etat = tirer(etat, boite, r1, 20).etat;
  etat = tirer(etat, boite, r0, 20).etat; // rond déjà touché : raté
  assert.deepEqual(etat.tirs, [
    { rond: 0, points: 20, double: false, sansCible: false },
    { rond: 1, points: 20, double: false, sansCible: false },
    { rond: null, points: 0, double: false, sansCible: false },
  ]);
  assert.equal(bilanSerie(etat).tirs.length, 3);
  const sans = tirer(debloquerTir(nouvelEtat()), boite, r0, 20).etat;
  assert.deepEqual(sans.tirs, [{ rond: null, points: 0, double: false, sansCible: true }]);
});
