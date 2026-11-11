// Las tres lenguas tienen las mismas claves y todas las que usa el código existen
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { TEXTOS } from '../public/js/textos.js';
import { ORDEN_ETAPAS, ICONOS_FASE, INTERVALOS_TIPO, planesTipo } from '../public/js/etapas.js';

const DIR = new URL('../public/js/', import.meta.url);

test('gl, es y en tienen exactamente las mismas claves', () => {
  const base = Object.keys(TEXTOS.es).sort();
  for (const l of ['gl', 'en']) assert.deepEqual(Object.keys(TEXTOS[l]).sort(), base, `claves de ${l}`);
  for (const l of ['gl', 'es', 'en']) for (const [k, v] of Object.entries(TEXTOS[l])) assert.ok(typeof v === 'string' && v.length, `${l}.${k} vacío`);
});

test('las variables {x} coinciden entre lenguas', () => {
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of Object.keys(TEXTOS.es)) for (const l of ['gl', 'en']) assert.equal(vars(TEXTOS[l][k]), vars(TEXTOS.es[k]), `${l}.${k}`);
});

test('toda clave literal usada en el código existe', () => {
  const usadas = new Set();
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.js') && x !== 'textos.js')) {
    const src = readFileSync(new URL(f, DIR), 'utf8');
    for (const m of src.matchAll(/\bt\('([a-z_]+)'[,)]/g)) usadas.add(m[1]);
  }
  for (const k of usadas) assert.ok(k in TEXTOS.es, `falta la clave «${k}»`);
});

test('claves compuestas (etapa_, modo_, pal_, icono_…) completas', () => {
  const debe = [
    ...ORDEN_ETAPAS.flatMap((e) => ['etapa_' + e, 'etapa_' + e + '_det']),
    ...['aula', 'grupos', 'estudio'].flatMap((m) => ['modo_' + m, 'modo_' + m + '_desc']),
    ...['verde', 'ambar', 'rojo', 'fin'].flatMap((s) => ['pal_' + s, 'sem_' + s, 'grupo_' + s]), 'grupo_listo',
    ...['listo', 'prep', 'trabajo', 'descanso', 'fin'].map((f) => 'fase_int_' + f),
    ...['mitad', 'minuto', 'diez', 'fin'].map((h) => 'hito_' + h),
    ...['bien', 'regular', 'mal'].map((a) => 'animo_' + a),
    ...ICONOS_FASE.map((i) => 'icono_' + i),
    ...INTERVALOS_TIPO.map((i) => 'int_' + i.clave),
    ...['empezar', 'pausar', 'seguir', 'empezar_todos', 'pausar_todos', 'empezar_grupo', 'pausar_grupo', 'error_formato', 'error_version', 'error_tamano'],
    ...ORDEN_ETAPAS.flatMap((e) => planesTipo(e).flatMap((p) => [p.nombre, ...p.fases.map((f) => f.nombre)])),
  ];
  for (const k of debe) assert.ok(k in TEXTOS.es, `falta la clave «${k}»`);
});
