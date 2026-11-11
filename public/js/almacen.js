// Almacén local: un único objeto JSON en localStorage, saneado al leer.
// Nada sale nunca de este dispositivo.
import { estado as sanear } from './validar.js';

const CLAVE = 'reloj.edumind.v1';

export function cargar() {
  let crudo = null;
  try { crudo = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { crudo = null; }
  return sanear(crudo);
}

export function guardar(estado) {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); return true; } catch { return false; }
}

export function borrarTodo() {
  try { localStorage.removeItem(CLAVE); } catch { /* modo privado */ }
}
