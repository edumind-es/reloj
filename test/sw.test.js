// El service worker precarga exactamente los ficheros publicados
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const sw = readFileSync(join(PUB, 'sw.js'), 'utf8');
const lista = JSON.parse(sw.match(/const FICHEROS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));

function todos(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? todos(p) : [relative(PUB, p)];
  });
}

test('cada fichero que usa la app está en la precarga (y no sobra ninguno)', () => {
  const ignorar = (f) => f === 'sw.js' || f.endsWith('.txt') || f === 'iconos/icono-maskable.svg';
  const publicados = todos(PUB).filter((f) => !ignorar(f)).sort();
  const precarga = lista.filter((f) => f !== './').sort();
  assert.deepEqual(precarga, publicados);
});

test('no hay scripts, estilos ni manejadores inline (CSP estricta)', () => {
  const html = readFileSync(join(PUB, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, 'script inline');
  assert.doesNotMatch(html, /<style/i, 'style inline');
  assert.doesNotMatch(html, /\sstyle=/i, 'atributo style');
  assert.doesNotMatch(html, /\son[a-z]+=/i, 'manejador onX');
});

test('el código nunca usa innerHTML, eval ni red', () => {
  for (const f of todos(join(PUB, 'js'))) {
    const src = readFileSync(join(PUB, f), 'utf8');
    assert.doesNotMatch(src, /\.(inner|outer)HTML|insertAdjacentHTML|document\.write|\beval\(|new Function|fetch\(|XMLHttpRequest|WebSocket|sendBeacon/, f);
  }
});
