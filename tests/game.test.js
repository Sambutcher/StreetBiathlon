import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nouvelEtat, voirFeu, quitterFeu, tirer, serieEntamee, CARTOUCHES } from '../js/game.js';
import { ronds } from '../js/geometry.js';
import { creerSuivi } from '../js/tracker.js';

const cible = ronds({ x: 0, y: 0, w: 30, h: 90 });
const haut = { x: 15, y: 15 };
const ailleurs = { x: 200, y: 200 };

test('pas de tir sans feu visible', () => {
  const { etat, resultat } = tirer(nouvelEtat(), cible, haut);
  assert.equal(resultat, null);
  assert.equal(etat.cartouches, CARTOUCHES);
});

test('touché blanchit le rond et consomme une cartouche', () => {
  const { etat, resultat } = tirer(voirFeu(nouvelEtat()), cible, haut);
  assert.equal(resultat, 'touche');
  assert.deepEqual(etat.touches, [true, false, false]);
  assert.equal(etat.cartouches, 2);
  assert.ok(serieEntamee(etat));
});

test('raté consomme une cartouche sans blanchir', () => {
  const { etat, resultat } = tirer(voirFeu(nouvelEtat()), cible, ailleurs);
  assert.equal(resultat, 'rate');
  assert.deepEqual(etat.touches, [false, false, false]);
  assert.equal(etat.cartouches, 2);
});

test('un rond déjà blanchi compte comme raté', () => {
  const etat = tirer(voirFeu(nouvelEtat()), cible, haut).etat;
  const r = tirer(etat, cible, haut);
  assert.equal(r.resultat, 'rate');
  assert.deepEqual(r.etat.touches, [true, false, false]);
});

test('3 cartouches maximum', () => {
  let etat = voirFeu(nouvelEtat());
  for (let i = 0; i < 3; i++) etat = tirer(etat, cible, ailleurs).etat;
  assert.equal(etat.cartouches, 0);
  assert.equal(tirer(etat, cible, haut).resultat, null);
});

test('la série survit à la perte du feu tant qu\'il reste des balles', () => {
  let etat = tirer(voirFeu(nouvelEtat()), cible, haut).etat;
  etat = quitterFeu(etat);
  assert.equal(etat.cibleVisible, false);
  assert.equal(etat.cartouches, 2);
  assert.deepEqual(etat.touches, [true, false, false]);
  assert.equal(tirer(etat, cible, haut).resultat, null, 'tap sans feu ignoré');
  etat = voirFeu(etat);
  assert.deepEqual(etat.touches, [true, false, false], 'ronds conservés au retour');
});

test('rechargement : 3 balles tirées puis feu quitté', () => {
  let etat = voirFeu(nouvelEtat());
  for (let i = 0; i < 3; i++) etat = tirer(etat, cible, haut).etat;
  assert.equal(etat.cartouches, 0);
  assert.deepEqual(voirFeu(etat), etat, 'pas de rechargement tant que le feu est visible');
  assert.deepEqual(quitterFeu(etat), nouvelEtat());
});

test('suivi : confirmation, recalage sans retard et oubli après persistance', () => {
  const s = creerSuivi({ confirmations: 2, persistanceMs: 1000, lissageTaille: 0.5 });
  s.maj({ x: 0, y: 0, w: 10, h: 30 }, 0);
  assert.equal(s.lire(0).actif, false);
  s.maj({ x: 4, y: 0, w: 10, h: 30 }, 100);
  assert.equal(s.lire(100).actif, true);
  assert.equal(s.lire(100).cible.x, 4, 'position de la détection, sans lerp');
  s.maj(null, 900);
  assert.equal(s.lire(900).actif, true);
  assert.equal(s.lire(1200).actif, false);
  assert.equal(s.lire(1200).cible, null);
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
