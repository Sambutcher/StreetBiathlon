import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nouvelEtat, entrerTir, sortirTir, tirer, CARTOUCHES } from '../js/game.js';
import { ronds } from '../js/geometry.js';
import { creerSuivi } from '../js/tracker.js';

const cible = ronds({ x: 0, y: 0, w: 30, h: 90 });
const haut = { x: 15, y: 15 };
const ailleurs = { x: 200, y: 200 };

test('pas de tir hors du mode tir', () => {
  const { etat, resultat } = tirer(nouvelEtat(), cible, haut);
  assert.equal(resultat, null);
  assert.equal(etat.cartouches, CARTOUCHES);
});

test('touché blanchit le rond et consomme une cartouche', () => {
  const { etat, resultat } = tirer(entrerTir(nouvelEtat()), cible, haut);
  assert.equal(resultat, 'touche');
  assert.deepEqual(etat.touches, [true, false, false]);
  assert.equal(etat.cartouches, 2);
});

test('raté consomme une cartouche sans blanchir', () => {
  const { etat, resultat } = tirer(entrerTir(nouvelEtat()), cible, ailleurs);
  assert.equal(resultat, 'rate');
  assert.deepEqual(etat.touches, [false, false, false]);
  assert.equal(etat.cartouches, 2);
});

test('un rond déjà blanchi compte comme raté', () => {
  let etat = tirer(entrerTir(nouvelEtat()), cible, haut).etat;
  const r = tirer(etat, cible, haut);
  assert.equal(r.resultat, 'rate');
  assert.deepEqual(r.etat.touches, [true, false, false]);
});

test('3 cartouches maximum', () => {
  let etat = entrerTir(nouvelEtat());
  for (let i = 0; i < 3; i++) etat = tirer(etat, cible, ailleurs).etat;
  assert.equal(etat.cartouches, 0);
  assert.equal(tirer(etat, cible, haut).resultat, null);
});

test('sortir du mode tir recharge et réinitialise la cible', () => {
  const etat = tirer(entrerTir(nouvelEtat()), cible, haut).etat;
  assert.deepEqual(sortirTir(etat), nouvelEtat());
});

test('suivi : confirmation, lissage et oubli après persistance', () => {
  const s = creerSuivi({ confirmations: 2, persistanceMs: 1000, lissage: 0.5 });
  s.maj({ x: 0, y: 0, w: 10, h: 30 }, 0);
  assert.equal(s.lire(0).actif, false);
  s.maj({ x: 10, y: 0, w: 10, h: 30 }, 100);
  assert.equal(s.lire(100).actif, true);
  assert.equal(s.lire(100).cible.x, 5);
  s.maj(null, 900);
  assert.equal(s.lire(900).actif, true);
  assert.equal(s.lire(1200).actif, false);
  assert.equal(s.lire(1200).cible, null);
});
