import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cadrage, letterbox, versEcran, plusProcheDe, ronds, rondVise } from '../js/geometry.js';

test('cadrage couvre l\'écran puis zoome au centre', () => {
  // Vidéo portrait 720×1280 sur écran 375×667 : même ratio ≈, zoom 2 → moitié centrale.
  const c = cadrage(720, 1280, 360, 640, 2);
  assert.deepEqual(c, { sx: 180, sy: 320, sw: 360, sh: 640 });
  // Vidéo paysage sur écran portrait : on rogne les côtés.
  const p = cadrage(1280, 720, 360, 640, 1);
  assert.equal(p.sh, 720);
  assert.equal(p.sw, 405);
  assert.equal(p.sx, (1280 - 405) / 2);
});

test('letterbox et retour en coordonnées écran', () => {
  const lb = letterbox(360, 640, 320, 320);
  assert.deepEqual(lb, { dx: 70, dy: 0, dw: 180, dh: 320 });
  const e = versEcran({ x: 70, y: 0, w: 180, h: 320 }, lb, 360, 640);
  assert.deepEqual(e, { x: 0, y: 0, w: 360, h: 640 });
});

test('plusProcheDe choisit la boîte la plus centrée', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };
  const b = { x: 45, y: 45, w: 10, h: 10 };
  assert.equal(plusProcheDe([a, b], { x: 50, y: 50 }), b);
  assert.equal(plusProcheDe([], { x: 0, y: 0 }), null);
});

test('ronds alignés sur les 3 lampes', () => {
  const r = ronds({ x: 0, y: 0, w: 30, h: 90 });
  assert.deepEqual(r.map((o) => o.y), [15, 45, 75]);
  assert.ok(r.every((o) => o.x === 15 && o.r === 12));
});

test('rondVise : dans le rond, à côté, et le plus proche', () => {
  const r = ronds({ x: 0, y: 0, w: 30, h: 90 });
  assert.equal(rondVise(r, { x: 15, y: 45 }), 1);
  assert.equal(rondVise(r, { x: 15, y: 30 }), -1);
  assert.equal(rondVise(r, { x: 100, y: 100 }), -1);
  assert.equal(rondVise(r, { x: 20, y: 72 }), 2);
});
