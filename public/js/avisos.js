// Avisos: sonido (Web Audio, generado, sin ficheros), vibración, pantalla
// encendida (Wake Lock) y anuncios para lectores de pantalla.

let audio = null;

// Los navegadores exigen un gesto del usuario para activar el audio:
// se llama desde cualquier pulsación de «Empezar».
export function desbloquearAudio() {
  try {
    if (!audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audio = new Ctx();
    }
    if (audio && audio.state === 'suspended') audio.resume();
  } catch { audio = null; }
}

function tono(freq, inicio, dur, vol = 0.22) {
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.exponentialRampToValueAtTime(vol, inicio + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  o.connect(g).connect(audio.destination);
  o.start(inicio);
  o.stop(inicio + dur + 0.05);
}

// [frecuencia Hz, retardo s, duración s]: tonos suaves, sin estridencias
const MELODIAS = {
  aviso: [[660, 0, 0.3]],
  cuenta: [[880, 0, 0.12]],
  fase: [[784, 0, 0.22], [988, 0.16, 0.35]],
  descanso: [[659, 0, 0.3], [523, 0.22, 0.5]],
  fin: [[523, 0, 0.4], [659, 0.22, 0.4], [784, 0.44, 0.7], [1047, 0.7, 0.9]],
};

const VIBRACION = { aviso: [120], cuenta: [60], fase: [150, 80, 150], descanso: [300], fin: [250, 120, 250, 120, 500] };

export function sonar(nombre, { sonido = true, vibracion = true } = {}) {
  if (sonido && audio && audio.state === 'running') {
    const t0 = audio.currentTime + 0.02;
    for (const [f, d, l] of MELODIAS[nombre] || []) tono(f, t0 + d, l);
  }
  if (vibracion && navigator.vibrate) {
    try { navigator.vibrate(VIBRACION[nombre] || [100]); } catch { /* sin vibración */ }
  }
}

// Región aria-live: solo se anuncian hitos, nunca cada segundo
let region = null;
export function anunciar(texto) {
  region ??= document.getElementById('anuncios');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => { region.textContent = texto; }, 60);
}

// Mantener la pantalla encendida mientras haya un temporizador en marcha
let bloqueo = null;
let querido = false;
export async function mantenerPantalla(si) {
  querido = si;
  try {
    if (si && !bloqueo && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      bloqueo = await navigator.wakeLock.request('screen');
      bloqueo.addEventListener('release', () => { bloqueo = null; });
    } else if (!si && bloqueo) {
      await bloqueo.release();
      bloqueo = null;
    }
  } catch { bloqueo = null; }
}
document.addEventListener('visibilitychange', () => {
  if (querido && document.visibilityState === 'visible') mantenerPantalla(true);
});
