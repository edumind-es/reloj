// Pruebas del motor de tiempo (funciones puras)
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/js/tiempo.js';

test('cuenta atrás: iniciar, pausar y seguir con marcas absolutas', () => {
  let t = T.crear(60000);
  assert.equal(T.restante(t, 1000), 60000);
  t = T.iniciar(t, 1000);
  assert.equal(T.restante(t, 11000), 50000);
  t = T.pausar(t, 11000);
  assert.equal(T.restante(t, 999999), 50000, 'en pausa no corre');
  t = T.iniciar(t, 20000);
  assert.equal(T.restante(t, 30000), 40000);
  assert.equal(T.restante(t, 999999), 0);
  assert.ok(T.terminado(t, 999999));
});

test('iniciar tras terminar vuelve a empezar desde cero', () => {
  let t = T.iniciar(T.crear(1000), 0);
  t = T.pausar(t, 5000);
  assert.ok(T.terminado(t, 5000));
  t = T.iniciar(t, 6000);
  assert.equal(T.restante(t, 6500), 500);
});

test('sumar y restar tiempo no retrocede por debajo de lo consumido', () => {
  let t = T.iniciar(T.crear(120000), 0);
  t = T.sumar(t, 60000, 10000);
  assert.equal(T.restante(t, 10000), 170000);
  t = T.sumar(t, -999999, 10000);
  assert.equal(T.restante(t, 10000), 0);
  assert.ok(t.duracion >= 10000);
});

test('duración acotada a 24 h', () => {
  assert.equal(T.crear(1e12).duracion, T.MAX_MS);
  assert.equal(T.crear(-5).duracion, 0);
  assert.equal(T.crear(NaN).duracion, 0);
});

test('formatear redondea hacia arriba en cuenta atrás', () => {
  assert.equal(T.formatear(0), '00:00');
  assert.equal(T.formatear(1), '00:01');
  assert.equal(T.formatear(59999), '01:00');
  assert.equal(T.formatear(59999, { haciaArriba: false }), '00:59');
  assert.equal(T.formatear(3600000 + 61000), '1:01:01');
});

test('semáforo por fracción restante', () => {
  assert.equal(T.semaforo(1), 'verde');
  assert.equal(T.semaforo(0.5), 'ambar');
  assert.equal(T.semaforo(0.2), 'rojo');
  assert.equal(T.semaforo(0), 'fin');
});

test('hitos: mitad, minuto, diez segundos y fin', () => {
  const d = 10 * 60000;
  assert.deepEqual(T.hitos(300001, 299999, d), ['mitad']);
  assert.deepEqual(T.hitos(60001, 59999, d), ['minuto']);
  assert.deepEqual(T.hitos(10001, 9999, d), ['diez']);
  assert.deepEqual(T.hitos(1, 0, d), ['fin']);
  assert.deepEqual(T.hitos(0, 0, d), [], 'sin repetición al estar parado en 0');
  assert.deepEqual(T.hitos(31000, 29000, 31000), [], 'cuentas cortas: sin avisos intermedios');
});

test('posición en una secuencia de fases', () => {
  const f = [{ ms: 1000 }, { ms: 2000 }];
  assert.deepEqual(T.posicion(f, 2, 0), { indice: 0, ronda: 0, restanteFase: 1000, duracionFase: 1000, fin: false });
  assert.equal(T.posicion(f, 2, 1500).indice, 1);
  assert.equal(T.posicion(f, 2, 1500).restanteFase, 1500);
  assert.equal(T.posicion(f, 2, 3500).ronda, 1);
  assert.equal(T.posicion(f, 2, 6000).fin, true);
  assert.equal(T.duracionSecuencia(f, 3), 9000);
  assert.equal(T.posicion([], 1, 0).fin, true);
});
