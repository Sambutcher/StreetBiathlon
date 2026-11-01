import test from 'node:test';
import assert from 'node:assert/strict';
import { couleurPas, pasProche } from '../js/carte.js';

test('couleur du pas de tir : rouge, orange, jaune, vert', () => {
  assert.deepEqual([0, 1, 2, 3].map(couleurPas), ['#ff4136', '#ff851b', '#ffdc00', '#2ecc40']);
});

test('pasProche : le plus proche dans le rayon, sinon -1', () => {
  const pas = [{ x: 10, y: 10 }, { x: 100, y: 100 }];
  assert.equal(pasProche(pas, 95, 105), 1);
  assert.equal(pasProche(pas, 12, 8), 0);
  assert.equal(pasProche(pas, 50, 50), -1);
});
