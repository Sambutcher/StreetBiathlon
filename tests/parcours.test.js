import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerParcours, formaterDuree, formaterDistance, formaterSecondes, allure, statistiques } from '../js/parcours.js';
import { projeter } from '../js/carte.js';
import { pasSimule } from '../js/position.js';

const M = 1 / 111195; // 1 m en degrés de latitude
const fix = (nord, t, precision = 5) => ({ lat: 48 + nord * M, lon: 2, precision, t });

test('distance cumulée le long du tracé', () => {
  const p = creerParcours(0);
  [0, 3, 6, 9].forEach((n, i) => p.ajouter(fix(n, i * 1000)));
  assert.ok(Math.abs(p.distance() - 9) < 0.05);
});

test('rejette imprécisions, sauts GPS et bruit à l’arrêt', () => {
  const p = creerParcours(0);
  p.ajouter(fix(0, 0));
  p.ajouter(fix(3, 1000, 50)); // imprécis
  p.ajouter(fix(500, 2000)); // saut
  p.ajouter(fix(1, 3000)); // < 2 m
  assert.equal(p.distance(), 0);
  assert.equal(p.resume(5000).points.length, 1);
});

test('marquerTir mémorise la position et le bilan', () => {
  const p = creerParcours(0);
  p.ajouter(fix(0, 0));
  p.ajouter(fix(10, 4000));
  p.marquerTir({ touches: 2, points: 40 });
  p.marquerTir(undefined);
  const r = p.resume(10000);
  assert.equal(r.tirs.length, 1);
  assert.equal(r.tirs[0].touches, 2);
  assert.equal(r.duree, 10000);
});

test('formats', () => {
  assert.equal(formaterDuree(754000), '12:34');
  assert.equal(formaterDuree(3723000), '1:02:03');
  assert.equal(formaterDistance(850), '850 m');
  assert.equal(formaterDistance(2410), '2,41 km');
  assert.equal(formaterSecondes(4230), '4,2 s');
  assert.equal(allure(330000, 1000), '5:30');
  assert.equal(allure(1000, 5), null);
});

test('statistiques', () => {
  const r = { duree: 3600000, distance: 10000, points: [], delais: [3000, 2000, 4000], debutsSeries: [60000, 180000, 240000], tirs: [{ touches: 3, points: 90 }, { touches: 1, points: 20 }] };
  const s = statistiques(r, 110);
  assert.equal(s.tirs, 6);
  assert.equal(s.touches, 4);
  assert.equal(s.reussite, 67);
  assert.equal(s.meilleureSerie, 90);
  assert.equal(s.tempsMoyenTir, 3000);
  assert.equal(s.tempsMoyenTour, 900000);
  assert.equal(statistiques({ ...r, debutsSeries: [5] }, 0).tempsMoyenTour, 1800000);
  assert.equal(statistiques({ ...r, debutsSeries: [] }, 0).tempsMoyenTour, null);
  assert.equal(statistiques({ ...r, delais: [] }, 0).tempsMoyenTir, null);
  assert.equal(statistiques({ ...r, tirs: [] }, 0).reussite, null);
});

test('projection de la carte', () => {
  assert.deepEqual(projeter([], 300, 200), []);
  assert.deepEqual(projeter([{ lat: 48, lon: 2 }], 300, 200), [{ x: 150, y: 100 }]);
  const [a, b] = projeter([{ lat: 48, lon: 2 }, { lat: 48.001, lon: 2 }], 300, 200);
  assert.ok(b.y < a.y, 'le nord est en haut');
  assert.ok(a.y <= 176 + 1e-9 && b.y >= 24 - 1e-9, 'dans les marges');
  assert.ok(Math.abs(a.x - 150) < 1e-9);
});

test('cap simulé : variation de -0,5° à +2,5° par pas', () => {
  assert.ok(Math.abs(pasSimule(5, () => 0) - 4.5) < 1e-9);
  assert.ok(Math.abs(pasSimule(5, () => 0.999999) - 7.5) < 1e-4);
});
