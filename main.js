import * as location from './location.js';

let distanceParcourue = 0;
let canvas = document.getElementById('c');
let ctx = canvas.getContext("2d");
let cw = window.innerWidth;
let ch = window.innerHeight;


setInterval(async () => {
  distanceParcourue += await location.distance();
  canvas.width = cw;
  canvas.height = ch;
  ctx.font = '48px';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(distanceParcourue, cw / 2, ch / 2);
}, 5000);

/*
import * as display from './display.js';
import * as detector from './detector.js';

const FPS = 30;
let feu;
let cartouches = 3;

//init
display.loading();
await Promise.all([display.init(), detector.init()]);
document.addEventListener('click', tir);
setTimeout(loop, 0);

//boucle d'affichage
async function loop() {
  let begin = Date.now();

  display.showFrame();
  feu=await detector.detectFeu();
  display.showFeu(feu);
  display.showCartouches(cartouches);
  display.showCross();

  let delay = 1000 / FPS - (Date.now() - begin);
  setTimeout(loop, delay);
}

function tir(){
  let cw = window.innerWidth;
  let ch = window.innerHeight;
  cartouches = Math.max(0, cartouches - 1);
  if (cartouches == 0) {
    
  }
  if (feu && cartouches != 0) {
    if (Math.sqrt((feu.x + feu.dx / 2 - cw / 2) ** 2 + (feu.y + feu.dy / 6 - ch / 2) ** 2) < feu.dy / 8) {
      feu.status[0] = true;
    }
    if (Math.sqrt((feu.x + feu.dx / 2 - cw / 2) ** 2 + (feu.y + feu.dy / 2 - ch / 2) ** 2) < feu.dy / 8) {
      feu.status[1] = true;
    }
    if (Math.sqrt((feu.x + feu.dx / 2 - cw / 2) ** 2 + (feu.y + 5 * feu.dy / 6 - ch / 2) ** 2) < feu.dy / 8) {
      feu.status[2] = true;
    }
  }
}*/