// Traducción mínima: gallego, castellano e inglés. Sin dependencias.
import { TEXTOS } from './textos.js';

let idioma = 'es';

export function detectar(preferido) {
  if (preferido && TEXTOS[preferido]) return preferido;
  const lista = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''])
    .map((x) => String(x).toLowerCase());
  for (const l of lista) {
    if (l.startsWith('gl')) return 'gl';
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
  }
  return 'es';
}

export function fijarIdioma(i) {
  idioma = TEXTOS[i] ? i : 'es';
  document.documentElement.lang = idioma;
}

export const idiomaActual = () => idioma;

export function t(clave, vars) {
  let s = TEXTOS[idioma][clave] ?? TEXTOS.es[clave] ?? clave;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return s;
}

// Nombre visible de una fase o plan: clave de texto o texto libre del alumnado
export const nombreDe = (o) => (o.nombre ? t(o.nombre) : o.texto || '·');

export function fechaCorta(iso) {
  const loc = { gl: 'gl-ES', es: 'es-ES', en: 'en-GB' }[idioma];
  try {
    return new Date(iso).toLocaleString(loc, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso.slice(0, 16).replace('T', ' '); }
}
