import * as location from './location.js';
import * as display from './display.js';
import * as detector from './detector.js';

const FPS = 30;
const distRechargement = 100;

let feu={
  'x': 0,
  'y': 0,
  'dx': 0,
  'dy': 0,
  'status': [false, false, false],
  'visible': false
};
let cartouches = 3;
let distance;
let score=0;

//init
display.loading();
await Promise.all([display.init(), detector.init()]);
document.addEventListener('click', tir);
setTimeout(loop, 0);

//boucle d'affichage
async function loop() {
  let begin = Date.now();

  display.showFrame();
  display.showCross();
  display.showCartouches(cartouches);
  display.showScore(score);
  let detection = await detector.detectFeu();
  if (detection) {
    feu = {
      'x': detection.x,
      'y': detection.y,
      'dx': detection.dx,
      'dy': detection.dy,
      'status': feu.status,
      'visible': true
    }
    display.showFeu(feu);
  } else {
    feu.visible = false;
  }
  
  
  if (cartouches==0){
    display.showDistance(distance/distRechargement);
  }

  let delay = Math.max(0,1000 / FPS - (Date.now() - begin));
  setTimeout(loop, delay);
}

async function tir() {
  let cw = window.innerWidth;
  let ch = window.innerHeight;
  cartouches = Math.max(0, cartouches - 1);
  if (cartouches == 0) {
    document.removeEventListener('click', tir);
    await location.initRechargement();
    rechargement();
  }
  if (feu.visible) {
    if (Math.sqrt((feu.x + feu.dx / 2 - cw / 2) ** 2 + (feu.y + feu.dy / 6 - ch / 2) ** 2) < feu.dy / 8) {
      feu.status[0] = true;
      display.splash("green");
      score++;
    } else if (Math.sqrt((feu.x + feu.dx / 2 - cw / 2) ** 2 + (feu.y + feu.dy / 2 - ch / 2) ** 2) < feu.dy / 8) {
      feu.status[1] = true;
      display.splash("green");
      score++;
    } else if (Math.sqrt((feu.x + feu.dx / 2 - cw / 2) ** 2 + (feu.y + 5 * feu.dy / 6 - ch / 2) ** 2) < feu.dy / 8) {
      feu.status[2] = true;
      display.splash("green");
      score++;
    } else {
      display.splash("red");
    }
  } else {
    display.splash("red");
  }
}

async function rechargement() {
  distance = await location.distanceToRef();

  if (distance > distRechargement) {
    document.addEventListener('click', tir);
    cartouches = 3;
    feu.status = [false, false, false];
  } else {
    setTimeout(rechargement,5000)
  }
}

