// Caméra arrière dans un <video> caché.

export async function demarrerCamera(video) {
  const flux = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
  });
  video.srcObject = flux;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  return video;
}
