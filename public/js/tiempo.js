// Motor de tiempo: funciones puras, sin DOM ni almacenamiento.
// El tiempo se calcula SIEMPRE a partir de marcas absolutas (ms de época):
// así no se desfasa aunque el navegador frene los intervalos en segundo plano,
// y un temporizador en marcha sobrevive a una recarga de la página.

export const MAX_MS = 24 * 60 * 60 * 1000; // tope: 24 h

const acotar = (n, min, max) => Math.min(max, Math.max(min, n));

// ---------- Temporizador simple (cuenta atrás o cronómetro) ----------

export function crear(duracionMs = 0) {
  return { duracion: acotar(Math.round(duracionMs) || 0, 0, MAX_MS), inicio: null, acumulado: 0 };
}

export const enMarcha = (t) => t.inicio !== null;

export function transcurrido(t, ahora) {
  const tramo = t.inicio !== null ? Math.max(0, ahora - t.inicio) : 0;
  return t.acumulado + tramo;
}

export function restante(t, ahora) {
  return Math.max(0, t.duracion - transcurrido(t, ahora));
}

// Fracción que queda (1 = entero, 0 = terminado)
export function fraccion(t, ahora) {
  return t.duracion > 0 ? restante(t, ahora) / t.duracion : 0;
}

export function terminado(t, ahora) {
  return t.duracion > 0 && restante(t, ahora) === 0;
}

export function iniciar(t, ahora) {
  if (t.inicio !== null) return t;
  // Si ya había terminado, arrancar de nuevo desde cero
  if (terminado(t, ahora)) return { ...t, acumulado: 0, inicio: ahora };
  return { ...t, inicio: ahora };
}

export function pausar(t, ahora) {
  if (t.inicio === null) return t;
  return { ...t, acumulado: transcurrido(t, ahora), inicio: null };
}

export const alternar = (t, ahora) => (enMarcha(t) ? pausar(t, ahora) : iniciar(t, ahora));

export const reiniciar = (t) => ({ ...t, inicio: null, acumulado: 0 });

// Cambia la duración total; si se pasa a menos de lo ya transcurrido, termina
export function fijarDuracion(t, ms) {
  return { ...t, duracion: acotar(Math.round(ms) || 0, 0, MAX_MS) };
}

// Suma (o resta, con ms negativo) tiempo a una cuenta atrás en curso
export function sumar(t, ms, ahora) {
  const nueva = acotar(t.duracion + ms, 0, MAX_MS);
  // No dejar que restar «vuelva atrás» por debajo de lo ya consumido
  return { ...t, duracion: Math.max(nueva, Math.min(t.duracion, transcurrido(t, ahora))) };
}

// ---------- Secuencias (intervalos, estaciones, plan de estudio) ----------

// fases: [{ ms, ... }]; rondas: cuántas veces se repite la lista completa
export function duracionSecuencia(fases, rondas = 1) {
  const una = fases.reduce((s, f) => s + Math.max(0, f.ms || 0), 0);
  return una * Math.max(1, rondas);
}

// Dónde estamos dentro de una secuencia tras «ms» transcurridos
export function posicion(fases, rondas, ms) {
  const total = duracionSecuencia(fases, rondas);
  const una = total / Math.max(1, rondas);
  if (!fases.length || una <= 0) return { indice: 0, ronda: 0, restanteFase: 0, duracionFase: 0, fin: true };
  if (ms >= total) {
    const ult = fases.length - 1;
    return { indice: ult, ronda: rondas - 1, restanteFase: 0, duracionFase: fases[ult].ms, fin: true };
  }
  const ronda = Math.floor(ms / una);
  let resto = ms - ronda * una;
  for (let i = 0; i < fases.length; i++) {
    const d = Math.max(0, fases[i].ms || 0);
    if (resto < d) return { indice: i, ronda, restanteFase: d - resto, duracionFase: d, fin: false };
    resto -= d;
  }
  // Inalcanzable salvo redondeos: tratar como fin
  const ult = fases.length - 1;
  return { indice: ult, ronda, restanteFase: 0, duracionFase: fases[ult].ms, fin: true };
}

// ---------- Utilidades de presentación ----------

// Formato reloj: «mm:ss» o «h:mm:ss». En cuenta atrás se redondea hacia arriba
// para que el 00:00 aparezca solo cuando de verdad ha terminado.
export function formatear(ms, { haciaArriba = true } = {}) {
  const seg = Math.max(0, haciaArriba ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const dd = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dd(m)}:${dd(s)}` : `${dd(m)}:${dd(s)}`;
}

// Estado de semáforo según la fracción que queda
export function semaforo(frac, { ambar = 0.5, rojo = 0.2 } = {}) {
  if (frac <= 0) return 'fin';
  if (frac <= rojo) return 'rojo';
  if (frac <= ambar) return 'ambar';
  return 'verde';
}

// ¿Se ha cruzado el umbral entre la lectura anterior y la actual? (cuenta atrás)
export const cruzado = (antes, ahora, umbral) => antes > umbral && ahora <= umbral;

// Hitos que merecen aviso (sonido + lector de pantalla) entre dos lecturas
export function hitos(antes, ahora, duracion) {
  const lista = [];
  if (duracion >= 4 * 60000 && cruzado(antes, ahora, duracion / 2)) lista.push('mitad');
  if (duracion > 2 * 60000 && cruzado(antes, ahora, 60000)) lista.push('minuto');
  if (duracion > 30000 && cruzado(antes, ahora, 10000)) lista.push('diez');
  if (cruzado(antes, ahora, 0)) lista.push('fin');
  return lista;
}
