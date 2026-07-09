const background = new Audio("/sounds/background.mp3");

background.loop = true;
background.volume = 0.35;
const click = new Audio("/sounds/click.mp3");
const spin = new Audio("/sounds/spin.mp3");
const win = new Audio("/sounds/win.mp3");
const lose = new Audio("/sounds/lose.mp3");

spin.loop = true;

export function playBackground() {
  background.play().catch(() => {});
}

export function stopBackground() {
  background.pause();
  background.currentTime = 0;
}

export function playClick() {
  click.currentTime = 0;
  click.play().catch(() => {});
}

export function playSpin() {
  spin.currentTime = 0;
  spin.play().catch(() => {});
}

export function stopSpin() {
  spin.pause();
  spin.currentTime = 0;
}

export function playWin() {
  win.currentTime = 0;
  win.play().catch(() => {});
}

export function playLose() {
  lose.currentTime = 0;
  lose.play().catch(() => {});
}