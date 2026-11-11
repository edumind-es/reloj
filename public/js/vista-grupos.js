// Modo grupos (proyección): de 2 a 8 temporizadores en rejilla. Cada grupo
// tiene forma + letra + color (nunca solo color). Dos modos:
//  · libre: cada grupo con su tiempo, se manejan por separado o todos a la vez;
//  · estaciones: un tiempo común y los grupos rotan por las estaciones.

import { h, icono, boton, selector, campoNumero } from './dom.js';
import { t } from './i18n.js';
import * as T from './tiempo.js';
import { barra } from './visual.js';
import { GRUPOS } from './etapas.js';

export const estacionDe = (grupo, ronda, n) => (grupo + ronda) % n;

export function montar(raiz, ctx) {
  const g = ctx.estado.grupos;
  const dur = () => g.seg * 1000;
  // Temporizadores sin empezar adoptan la duración configurada
  g.ts = g.ts.map((x) => (T.transcurrido(x, Date.now()) === 0 && !T.enMarcha(x) ? T.crear(dur()) : x));
  if (!g.comun.duracion || (!T.enMarcha(g.comun) && T.transcurrido(g.comun, Date.now()) === 0)) g.comun = T.crear(dur());

  const nombreGrupo = (i) => g.nombres[i] || t('grupo_letra', { l: GRUPOS[i].letra });
  const nombreEstacion = (i) => g.estaciones[i] || t('estacion_n', { n: i + 1 });

  const rejilla = h('div', { class: 'rejilla' });
  const globales = h('div', { class: 'controles controles-grupos' });
  const config = h('div', { class: 'config' });
  const estadoGlobal = h('p', { class: 'estado-global', role: 'status' });
  raiz.append(h('section', { class: 'grupos' }, config, globales, estadoGlobal, rejilla));

  let tarjetas = [];
  let previos = [];
  let previoComun = null;

  function construir() {
    previos = [];
    previoComun = null;
    construirConfig();
    construirGlobales();
    construirRejilla();
    tick(Date.now());
  }

  // ---------- Configuración ----------
  function construirConfig() {
    const fijarN = (n) => { g.n = Math.min(8, Math.max(2, n)); g.ronda = 0; g.completado = false; g.cambioHasta = null; ctx.guardar(); construir(); };
    const mins = campoNumero(t('minutos'), Math.floor(g.seg / 60), { min: 0, max: 240, id: 'g-min' });
    const segs = campoNumero(t('segundos'), g.seg % 60, { min: 0, max: 59, id: 'g-seg' });
    const error = h('p', { class: 'error', role: 'alert' });
    const fijarDur = () => {
      const seg = (Number(mins.input.value) || 0) * 60 + (Number(segs.input.value) || 0);
      if (!(seg >= 10 && seg <= 4 * 3600)) { error.textContent = t('error_duracion_grupos'); return; }
      g.seg = Math.round(seg);
      reiniciarTodo();
      construir();
    };
    for (const i of [mins.input, segs.input]) i.addEventListener('input', () => { error.textContent = ''; });

    const editar = h('details', { class: 'config-bloque nombres' },
      h('summary', {}, icono('editar'), h('span', { text: t('editar_nombres') })),
      h('div', { class: 'nombres-lista' }, ...Array.from({ length: g.n }, (_, i) => h('label', { class: 'campo' },
        h('span', { class: 'campo-grupo', vars: { '--c': GRUPOS[i].color } }, icono(GRUPOS[i].forma), h('span', { text: t('grupo_letra', { l: GRUPOS[i].letra }) })),
        h('input', { type: 'text', maxlength: 30, value: g.nombres[i], placeholder: t('grupo_letra', { l: GRUPOS[i].letra }),
          oninput: (e) => { g.nombres[i] = e.target.value.slice(0, 30); ctx.guardar(); actualizarNombres(); } })))),
      g.modo === 'estaciones' ? h('div', { class: 'nombres-lista' }, ...Array.from({ length: g.n }, (_, i) => h('label', { class: 'campo' },
        h('span', { text: t('estacion_n', { n: i + 1 }) }),
        h('input', { type: 'text', maxlength: 30, value: g.estaciones[i], placeholder: t('estacion_ej'),
          oninput: (e) => { g.estaciones[i] = e.target.value.slice(0, 30); ctx.guardar(); actualizarNombres(); } })))) : null);

    config.replaceChildren(
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('num_grupos') }),
        h('div', { class: 'fila contador' },
          boton('menos', t('quitar_grupo'), () => fijarN(g.n - 1), { soloIcono: true }),
          h('output', { class: 'contador-valor', text: String(g.n) }),
          boton('mas', t('anadir_grupo'), () => fijarN(g.n + 1), { soloIcono: true }))),
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('duracion') }),
        h('div', { class: 'fila' }, mins.el, segs.el, boton('check', t('fijar'), fijarDur)), error),
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('modo_grupos_tipo') }),
        selector(t('modo_grupos_tipo'), [['libre', t('grupos_libre')], ['estaciones', t('grupos_estaciones')]], g.modo,
          (v) => { g.modo = v; reiniciarTodo(); construir(); }),
        g.modo === 'estaciones' ? h('label', { class: 'casilla' },
          h('input', { type: 'checkbox', checked: g.auto, onchange: (e) => { g.auto = e.target.checked; ctx.guardar(); } }),
          h('span', { text: t('rotar_solo', { s: g.pausaCambio }) })) : null),
      editar);
  }

  // ---------- Botones globales ----------
  let principal = null;
  function construirGlobales() {
    principal = h('button', { type: 'button', class: 'btn btn-principal', onclick: () => { ctx.desbloquearAudio(); alternarTodos(); } });
    globales.replaceChildren(...[principal,
      g.modo === 'estaciones' ? boton('rotar', t('rotar_ahora'), rotar) : null,
      boton('reiniciar', t('reiniciar_todos'), () => { reiniciarTodo(); construir(); })].filter(Boolean));
  }

  const algunoEnMarcha = () => (g.modo === 'estaciones' ? T.enMarcha(g.comun) || g.cambioHasta !== null : g.ts.slice(0, g.n).some(T.enMarcha));

  function alternarTodos() {
    const ahora = Date.now();
    if (g.modo === 'estaciones') {
      if (g.cambioHasta !== null) { g.cambioHasta = null; g.comun = T.crear(dur()); }
      else {
        if (g.completado) { g.ronda = 0; g.completado = false; g.comun = T.crear(dur()); }
        g.comun = T.alternar(g.comun, ahora);
      }
    } else if (algunoEnMarcha()) {
      g.ts = g.ts.map((x) => T.pausar(x, ahora));
    } else {
      g.ts = g.ts.map((x, i) => (i < g.n ? T.iniciar(x, ahora) : x));
      previos = [];
    }
    ctx.guardar();
    ctx.pantalla(algunoEnMarcha());
    ctx.anunciar(algunoEnMarcha() ? t('anuncio_todos_empiezan') : t('anuncio_pausa'));
  }

  function reiniciarTodo() {
    g.ts = g.ts.map(() => T.crear(dur()));
    g.comun = T.crear(dur());
    g.ronda = 0;
    g.completado = false;
    g.cambioHasta = null;
    previos = [];
    previoComun = null;
    ctx.guardar();
    ctx.pantalla(false);
  }

  function rotar() {
    g.ronda = (g.ronda + 1) % g.n;
    g.completado = false;
    g.cambioHasta = null;
    g.comun = T.crear(dur());
    previoComun = null;
    ctx.guardar();
    ctx.anunciar(t('anuncio_rotacion', { n: g.ronda + 1 }));
    actualizarNombres();
  }

  // ---------- Tarjetas ----------
  function construirRejilla() {
    rejilla.replaceChildren();
    rejilla.dataset.n = String(g.n);
    tarjetas = Array.from({ length: g.n }, (_, i) => {
      const def = GRUPOS[i];
      const nombre = h('span', { class: 'grupo-nombre' });
      const estacion = g.modo === 'estaciones' ? h('p', { class: 'grupo-estacion' }) : null;
      const digitos = h('span', { class: 'digitos' });
      const bar = barra();
      const palabra = h('span', { class: 'grupo-palabra' });
      const btnPlay = g.modo === 'libre' ? h('button', { type: 'button', class: 'btn', onclick: () => {
        ctx.desbloquearAudio();
        g.ts[i] = T.alternar(g.ts[i], Date.now());
        previos[i] = null;
        ctx.guardar();
        ctx.pantalla(algunoEnMarcha());
      } }) : null;
      const propios = g.modo === 'libre' ? h('div', { class: 'grupo-controles' }, btnPlay,
        boton('reiniciar', t('reiniciar'), () => { g.ts[i] = T.crear(dur()); previos[i] = null; ctx.guardar(); ctx.pantalla(algunoEnMarcha()); }, { soloIcono: true }),
        boton('mas', t('mas_minuto'), () => { g.ts[i] = T.sumar(g.ts[i], 60000, Date.now()); previos[i] = null; ctx.guardar(); }, { soloIcono: true })) : null;
      const el = h('article', { class: 'grupo', vars: { '--c': def.color }, 'aria-labelledby': 'gn' + i },
        h('header', { class: 'grupo-cab' },
          h('span', { class: 'grupo-forma' }, icono(def.forma)),
          h('span', { class: 'grupo-letra', 'aria-hidden': 'true', text: def.letra }),
          h('h2', { id: 'gn' + i, class: 'grupo-titulo' }, nombre)),
        estacion, digitos, bar.el, palabra, propios);
      rejilla.append(el);
      return { el, nombre, estacion, digitos, bar, palabra, btnPlay, ultimoPlay: '' };
    });
    actualizarNombres();
  }

  function actualizarNombres() {
    tarjetas.forEach((c, i) => {
      c.nombre.textContent = nombreGrupo(i);
      if (c.estacion) c.estacion.textContent = '→ ' + nombreEstacion(estacionDe(i, g.ronda, g.n));
    });
  }

  // ---------- Latido ----------
  function tick(ahora) {
    if (g.modo === 'estaciones') tickEstaciones(ahora);
    else tickLibre(ahora);
    const enMarcha = algunoEnMarcha();
    const clave = enMarcha ? 'pausar_todos' : 'empezar_todos';
    if (principal && principal.dataset.clave !== clave) {
      principal.dataset.clave = clave;
      principal.replaceChildren(icono(enMarcha ? 'pausa' : 'play'), h('span', { text: t(clave) }));
    }
  }

  function pintarTarjeta(c, tm, ahora, palabraForzada) {
    const r = T.restante(tm, ahora);
    const f = T.fraccion(tm, ahora);
    const est = T.transcurrido(tm, ahora) === 0 ? 'listo' : T.semaforo(f, { ambar: 0.25, rojo: Math.min(0.2, 10000 / Math.max(1, tm.duracion)) });
    c.digitos.textContent = T.formatear(r);
    c.bar.actualizar(f, est);
    c.el.dataset.estado = est;
    c.palabra.textContent = palabraForzada || t('grupo_' + est);
    if (c.btnPlay) {
      const k = T.enMarcha(tm) ? 'pausa' : 'play';
      if (c.ultimoPlay !== k) {
        c.ultimoPlay = k;
        c.btnPlay.replaceChildren(icono(k));
        c.btnPlay.setAttribute('aria-label', t(T.enMarcha(tm) ? 'pausar_grupo' : 'empezar_grupo', { g: nombreGrupo(tarjetas.indexOf(c)) }));
      }
    }
  }

  function tickLibre(ahora) {
    let alguno = false;
    tarjetas.forEach((c, i) => {
      const tm = g.ts[i];
      const r = T.restante(tm, ahora);
      if (T.enMarcha(tm)) {
        if (previos[i] != null) {
          for (const hito of T.hitos(previos[i], r, tm.duracion)) {
            if (hito === 'fin') { ctx.sonar('fin'); ctx.anunciar(t('anuncio_fin_grupo', { g: nombreGrupo(i) })); }
            else if (hito === 'diez') ctx.sonar('aviso');
          }
        }
        previos[i] = r;
        if (r === 0) { g.ts[i] = T.pausar(tm, ahora); ctx.guardar(); } else alguno = true;
      } else previos[i] = null;
      pintarTarjeta(c, g.ts[i], ahora);
    });
    if (!alguno) ctx.pantalla(false);
    estadoGlobal.textContent = '';
  }

  function tickEstaciones(ahora) {
    // Pausa de cambio entre estaciones: al acabar, arranca solo
    if (g.cambioHasta !== null && ahora >= g.cambioHasta) {
      g.cambioHasta = null;
      g.comun = T.iniciar(T.crear(dur()), ahora);
      previoComun = null;
      ctx.sonar('fase');
      ctx.anunciar(t('anuncio_empieza_estacion', { n: g.ronda + 1 }));
      ctx.guardar();
    }
    const c = g.comun;
    const r = T.restante(c, ahora);
    if (T.enMarcha(c)) {
      if (previoComun !== null) {
        for (const hito of T.hitos(previoComun, r, c.duracion)) if (hito === 'diez') ctx.sonar('aviso');
      }
      previoComun = r;
      if (r === 0) {
        ctx.sonar('fin');
        g.comun = T.pausar(c, ahora);
        if (g.ronda >= g.n - 1) {
          g.completado = true;
          ctx.anunciar(t('circuito_completo'));
          ctx.pantalla(false);
        } else if (g.auto) {
          g.ronda += 1;
          g.comun = T.crear(dur());
          g.cambioHasta = ahora + g.pausaCambio * 1000;
          actualizarNombres();
          ctx.anunciar(t('anuncio_cambio'));
        } else {
          ctx.anunciar(t('anuncio_rotad'));
          ctx.pantalla(false);
        }
        ctx.guardar();
      }
    } else previoComun = null;

    let palabra = null;
    if (g.cambioHasta !== null) palabra = t('cambio_en', { t: T.formatear(g.cambioHasta - ahora) });
    else if (g.completado) palabra = t('circuito_completo');
    else if (T.terminado(g.comun, ahora)) palabra = t('rotad');
    tarjetas.forEach((tj) => pintarTarjeta(tj, g.cambioHasta !== null ? T.crear(dur()) : g.comun, ahora, palabra));
    rejilla.dataset.cambio = String(g.cambioHasta !== null);
    estadoGlobal.textContent = g.completado ? t('circuito_completo') : t('ronda_de', { n: g.ronda + 1, m: g.n });
  }

  construir();
  return {
    tick,
    tecla(e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); principal?.click(); }
      else if ((e.key === 'r' || e.key === 'R')) { reiniciarTodo(); construir(); }
      else if (g.modo === 'estaciones' && (e.key === 'n' || e.key === 'N')) rotar();
      else if (g.modo === 'libre' && /^[1-8]$/.test(e.key) && Number(e.key) <= g.n) tarjetas[Number(e.key) - 1].btnPlay?.click();
    },
    desmontar() { ctx.guardar(); },
  };
}
