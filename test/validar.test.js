// Pruebas del saneado de datos guardados e importados
import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../public/js/validar.js';

test('textos: recorta, quita control y bidi, rechaza no-cadenas', () => {
  assert.equal(V.texto('  hola\u0000‮ mundo ', 40), 'hola mundo');
  assert.equal(V.texto('x'.repeat(100), 10).length, 10);
  assert.equal(V.texto({}, 10, 'def'), 'def');
});

test('números: acota y redondea', () => {
  assert.equal(V.entero(999, 1, 50, 6), 50);
  assert.equal(V.entero('7', 1, 50, 6), 7);
  assert.equal(V.entero('x', 1, 50, 6), 6);
  assert.equal(V.entero(Infinity, 1, 50, 6), 6);
});

test('estado vacío o corrupto da valores por defecto válidos', () => {
  for (const crudo of [null, 'texto', 42, [], { aula: 'x', grupos: [], estudio: 7 }]) {
    const e = V.estado(crudo);
    assert.equal(e.ajustes.etapa, 'primaria');
    assert.equal(e.aula.tipo, 'cuenta');
    assert.equal(e.aula.cuenta.duracion, 300000);
    assert.equal(e.grupos.ts.length, 8);
    assert.equal(e.grupos.nombres.length, 8);
    assert.equal(e.estudio.activo, null);
  }
});

test('importar: firma, versión y tamaño', () => {
  assert.equal(V.importar('no json').error, 'error_formato');
  assert.equal(V.importar(JSON.stringify({ app: 'otra', version: 1 })).error, 'error_formato');
  assert.equal(V.importar(JSON.stringify({ app: V.FIRMA, version: 99 })).error, 'error_version');
  assert.equal(V.importar('x'.repeat(V.MAX_IMPORTACION + 1)).error, 'error_tamano');
});

test('exportar e importar ida y vuelta, sin temporizadores en marcha', () => {
  const e = V.estado({
    ajustes: { idioma: 'gl', etapa: 'eso', sonido: false },
    grupos: { nombres: ['Leóns', '<img src=x onerror=alert(1)>'], ts: [{ duracion: 1000, inicio: 5, acumulado: 0 }] },
    planes: [{ id: 'p1', texto: 'Mi plan', fases: [{ texto: 'Leer', icono: 'leer', min: 10, tipo: 'trabajo' }] }],
    registro: [{ fecha: '2026-11-10T10:00:00Z', plan: 'Mi plan', min: 10, fases: 1, total: 1, animo: 'bien' }],
  });
  const r = V.importar(V.exportar(e));
  assert.ok(r.ok);
  assert.equal(r.datos.ajustes.idioma, 'gl');
  assert.equal(r.datos.grupos.nombres[1], '<img src=x onerror=alert(1)>', 'se guarda como texto: se pinta con textContent');
  assert.equal(r.datos.planes[0].fases[0].min, 10);
  assert.equal(r.datos.registro[0].animo, 'bien');
  assert.equal(r.datos.grupos.ts, undefined, 'los temporizadores no viajan');
});

test('planes: fases saneadas, iconos y tipos de una lista cerrada', () => {
  const p = V.plan({ texto: 'X', fases: [{ texto: 'a', icono: 'javascript:', min: 9999, tipo: 'raro' }, ...Array(50).fill({ texto: 'b' })] });
  assert.equal(p.fases.length, V.MAX_FASES);
  assert.equal(p.fases[0].icono, 'escribir');
  assert.equal(p.fases[0].min, 180);
  assert.equal(p.fases[0].tipo, 'trabajo');
  assert.equal(V.plan({ texto: 'vacío', fases: [] }), null);
  // Claves de texto solo con el patrón fase_*
  assert.equal(V.fase({ nombre: 'fase_leer' }).nombre, 'fase_leer');
  assert.equal(V.fase({ nombre: '__proto__' }).nombre, undefined);
});

test('registro: fechas inválidas fuera, ánimo de lista cerrada', () => {
  assert.equal(V.entradaRegistro({ fecha: 'ayer' }), null);
  assert.equal(V.entradaRegistro({ fecha: '2026-01-01', animo: 'feliz' }).animo, null);
});
