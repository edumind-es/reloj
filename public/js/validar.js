// Saneado de todo lo que entra desde fuera del código: localStorage y ficheros
// importados. Nada se confía: tipos, longitudes y rangos se fuerzan aquí, y los
// textos se pintan después SIEMPRE con textContent (nunca como HTML).

import { MAX_MS } from './tiempo.js';
import { ORDEN_ETAPAS, ETAPA_POR_DEFECTO, ICONOS_FASE } from './etapas.js';

export const IDIOMAS = ['gl', 'es', 'en'];
export const MAX_IMPORTACION = 256 * 1024; // 256 KB
export const MAX_REGISTRO = 500;
export const MAX_PLANES = 20;
export const MAX_FASES = 20;
export const FIRMA = 'reloj.edumind.es';
export const VERSION = 1;

const CONTROL = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g; // control y bidi

export function texto(v, max = 40, def = '') {
  if (typeof v !== 'string') return def;
  return v.replace(CONTROL, '').trim().slice(0, max);
}

export function entero(v, min, max, def) {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export const bool = (v, def) => (typeof v === 'boolean' ? v : def);
export const uno = (v, lista, def) => (lista.includes(v) ? v : def);

export function temporizador(v) {
  const o = v && typeof v === 'object' ? v : {};
  const inicio = typeof o.inicio === 'number' && Number.isFinite(o.inicio) && o.inicio > 0 ? Math.round(o.inicio) : null;
  return {
    duracion: entero(o.duracion, 0, MAX_MS, 0),
    inicio,
    acumulado: entero(o.acumulado, 0, MAX_MS, 0),
  };
}

export function ajustes(v) {
  const o = v && typeof v === 'object' ? v : {};
  return {
    idioma: uno(o.idioma, IDIOMAS, null), // null = detectar del navegador
    etapa: uno(o.etapa, ORDEN_ETAPAS, ETAPA_POR_DEFECTO),
    sonido: bool(o.sonido, true),
    vibracion: bool(o.vibracion, true),
    contraste: bool(o.contraste, false),
  };
}

export function fase(v) {
  const o = v && typeof v === 'object' ? v : {};
  const f = {
    icono: uno(o.icono, ICONOS_FASE, 'escribir'),
    min: entero(o.min, 1, 180, 5),
    tipo: uno(o.tipo, ['trabajo', 'descanso'], 'trabajo'),
  };
  // Fases de planes tipo llevan clave de texto; las propias, texto libre
  if (typeof o.nombre === 'string' && /^fase_[a-z]+$/.test(o.nombre)) f.nombre = o.nombre;
  else f.texto = texto(o.texto, 30, '') || '·';
  return f;
}

export function plan(v) {
  const o = v && typeof v === 'object' ? v : {};
  const fases = Array.isArray(o.fases) ? o.fases.slice(0, MAX_FASES).map(fase) : [];
  if (!fases.length) return null;
  return {
    id: texto(o.id, 24, '') || 'p' + Math.random().toString(36).slice(2, 10),
    texto: texto(o.texto, 40, '') || '·',
    fases,
  };
}

export function entradaRegistro(v) {
  const o = v && typeof v === 'object' ? v : {};
  const fecha = typeof o.fecha === 'string' && !Number.isNaN(Date.parse(o.fecha)) ? new Date(o.fecha).toISOString() : null;
  if (!fecha) return null;
  return {
    fecha,
    plan: texto(o.plan, 40, '·'),
    min: entero(o.min, 0, 24 * 60, 0),
    fases: entero(o.fases, 0, MAX_FASES, 0),
    total: entero(o.total, 0, MAX_FASES, 0),
    animo: uno(o.animo, ['bien', 'regular', 'mal', null], null),
  };
}

const lista = (v, max, fn) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : []);

// Datos que se exportan e importan: preferencias, nombres, planes y registro.
// Los temporizadores en marcha NO viajan entre aparatos.
export function datosPortables(v) {
  const o = v && typeof v === 'object' ? v : {};
  const g = o.grupos && typeof o.grupos === 'object' ? o.grupos : {};
  return {
    ajustes: ajustes(o.ajustes),
    grupos: {
      nombres: lista(g.nombres, 8, (x) => texto(x, 30, '')).concat(Array(8).fill('')).slice(0, 8),
      estaciones: lista(g.estaciones, 8, (x) => texto(x, 30, '')).concat(Array(8).fill('')).slice(0, 8),
    },
    planes: lista(o.planes, MAX_PLANES, plan),
    registro: lista(o.registro, MAX_REGISTRO, entradaRegistro),
  };
}

export function exportar(datos, ahora = new Date()) {
  return JSON.stringify({ app: FIRMA, version: VERSION, fecha: ahora.toISOString(), datos: datosPortables(datos) }, null, 2);
}

// Devuelve { ok: true, datos } o { ok: false, error: clave de texto }
export function importar(textoFichero) {
  if (typeof textoFichero !== 'string' || textoFichero.length > MAX_IMPORTACION) return { ok: false, error: 'error_tamano' };
  let o;
  try { o = JSON.parse(textoFichero); } catch { return { ok: false, error: 'error_formato' }; }
  if (!o || typeof o !== 'object' || o.app !== FIRMA) return { ok: false, error: 'error_formato' };
  if (o.version !== VERSION) return { ok: false, error: 'error_version' };
  return { ok: true, datos: datosPortables(o.datos) };
}

// ---------- Estado completo guardado en este dispositivo ----------
// Además de lo portable, guarda los temporizadores en marcha para que una
// recarga accidental (o cerrar la tablet) no pierda la cuenta.

const VISTAS_CUENTA = ['disco', 'digital', 'semaforo'];

export function aula(v) {
  const o = v && typeof v === 'object' ? v : {};
  const i = o.int && typeof o.int === 'object' ? o.int : {};
  const cuenta = temporizador(o.cuenta);
  if (!cuenta.duracion) cuenta.duracion = 5 * 60000;
  return {
    tipo: uno(o.tipo, ['cuenta', 'crono', 'intervalos'], 'cuenta'),
    vista: uno(o.vista, VISTAS_CUENTA, null), // null = la de la etapa
    numeros: bool(o.numeros, null),
    cuenta,
    crono: temporizador(o.crono),
    vueltas: Array.isArray(o.vueltas) ? o.vueltas.slice(0, 50).map((x) => entero(x, 0, MAX_MS, 0)) : [],
    int: {
      trabajo: entero(i.trabajo, 5, 3600, 40),
      descanso: entero(i.descanso, 0, 3600, 20),
      rondas: entero(i.rondas, 1, 50, 6),
      prep: bool(i.prep, true),
    },
    intT: temporizador(o.intT),
  };
}

export function gruposVivo(v) {
  const o = v && typeof v === 'object' ? v : {};
  const ts = Array.isArray(o.ts) ? o.ts.slice(0, 8).map(temporizador) : [];
  while (ts.length < 8) ts.push(temporizador({}));
  return {
    n: entero(o.n, 2, 8, 4),
    seg: entero(o.seg, 10, 4 * 3600, 5 * 60),
    modo: uno(o.modo, ['libre', 'estaciones'], 'libre'),
    ronda: entero(o.ronda, 0, 7, 0),
    auto: bool(o.auto, true),
    pausaCambio: entero(o.pausaCambio, 0, 120, 15),
    cambioHasta: typeof o.cambioHasta === 'number' && Number.isFinite(o.cambioHasta) ? o.cambioHasta : null,
    completado: bool(o.completado, false),
    ts,
    comun: temporizador(o.comun),
  };
}

export function estudioVivo(v) {
  const o = v && typeof v === 'object' ? v : {};
  const a = o.activo && typeof o.activo === 'object' ? o.activo : null;
  let activo = null;
  if (a && Array.isArray(a.fases) && a.fases.length) {
    const fases = a.fases.slice(0, MAX_FASES).map(fase);
    activo = {
      texto: texto(a.texto, 40, '·'),
      fases,
      indice: entero(a.indice, 0, fases.length - 1, 0),
      t: temporizador(a.t),
      espera: bool(a.espera, false),
      inicio: typeof a.inicio === 'string' && !Number.isNaN(Date.parse(a.inicio)) ? a.inicio : new Date().toISOString(),
      hechas: entero(a.hechas, 0, MAX_FASES, 0),
      msTrabajo: entero(a.msTrabajo, 0, MAX_MS, 0),
      final: bool(a.final, false),
    };
  }
  return {
    sel: texto(o.sel, 24, 'pomodoro') || 'pomodoro',
    auto: bool(o.auto, false),
    activo,
  };
}

export function estado(v) {
  const o = v && typeof v === 'object' ? v : {};
  const port = datosPortables(o);
  return {
    ...port,
    grupos: { ...gruposVivo(o.grupos), ...port.grupos },
    aula: aula(o.aula),
    estudio: estudioVivo(o.estudio),
  };
}
