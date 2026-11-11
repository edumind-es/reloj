// Modo aula: un temporizador grande. Cuenta atrás (disco, números o
// semáforo), cronómetro con vueltas e intervalos de trabajo/descanso (EF).

import { h, icono, boton, selector, campoNumero } from './dom.js';
import { t } from './i18n.js';
import * as T from './tiempo.js';
import { disco, anillo, semaforo, barra } from './visual.js';
import { INTERVALOS_TIPO } from './etapas.js';

const MIN = 60000;

// Fases de una sesión de intervalos (lista plana; la última no lleva descanso)
export function fasesIntervalos({ trabajo, descanso, rondas, prep }) {
  const f = [];
  if (prep) f.push({ tipo: 'prep', ms: 5000, ronda: 0 });
  for (let r = 0; r < rondas; r++) {
    f.push({ tipo: 'trabajo', ms: trabajo * 1000, ronda: r });
    if (descanso > 0 && r < rondas - 1) f.push({ tipo: 'descanso', ms: descanso * 1000, ronda: r });
  }
  return f;
}

export function montar(raiz, ctx) {
  const st = ctx.estado.aula;
  const et = ctx.etapa();
  const amistoso = et.estilo === 'amistoso';

  const escenario = h('div', { class: 'escenario', role: 'region', 'aria-label': t('temporizador') });
  const controles = h('div', { class: 'controles' });
  const config = h('div', { class: 'config' });
  const tipos = selector(t('tipo_temporizador'), [
    ['cuenta', t('tipo_cuenta'), 'reloj'],
    ['crono', t('tipo_crono'), 'bandera'],
    ['intervalos', t('tipo_intervalos'), 'repasar'],
  ], st.tipo, (v) => { st.tipo = v; ctx.guardar(); construir(); });

  raiz.append(h('section', { class: 'aula' }, h('div', { class: 'config config-tipo' }, tipos), escenario, controles, config));

  let actual = null; // { tick, tecla }

  function construir() {
    escenario.replaceChildren();
    controles.replaceChildren();
    config.replaceChildren();
    escenario.removeAttribute('data-estado');
    escenario.removeAttribute('data-fase');
    actual = { cuenta: cuentaAtras, crono: cronometro, intervalos }[st.tipo]();
    actual.tick(Date.now());
  }

  // Botón principal Empezar / Pausar / Seguir, compartido
  function botonPrincipal(onclick) {
    const b = h('button', { type: 'button', class: 'btn btn-principal', onclick: () => { ctx.desbloquearAudio(); onclick(); } });
    let previo = '';
    return {
      el: b,
      actualizar(enMarcha, empezado) {
        const clave = enMarcha ? 'pausar' : empezado ? 'seguir' : 'empezar';
        if (clave === previo) return;
        previo = clave;
        b.replaceChildren(icono(enMarcha ? 'pausa' : 'play'), h('span', { text: t(clave) }));
      },
    };
  }

  // ---------- Cuenta atrás ----------
  function cuentaAtras() {
    const vista = st.vista || et.vista;
    const numeros = st.numeros ?? et.numeros;
    let previo = null;

    const pieza = vista === 'disco' ? disco() : vista === 'semaforo' ? semaforo() : null;
    const digitos = h('span', { class: 'digitos' + (vista !== 'digital' && !numeros ? ' sr' : '') });
    const palabra = h('span', { class: 'palabra' });
    const bar = vista === 'digital' ? barra() : null;
    escenario.dataset.vista = vista;
    if (pieza) escenario.append(h('div', { class: 'figura' }, pieza.el));
    escenario.append(h('div', { class: 'lectura' }, digitos, bar ? bar.el : null, palabra));

    const principal = botonPrincipal(() => {
      st.cuenta = T.alternar(st.cuenta, Date.now());
      previo = T.restante(st.cuenta, Date.now());
      ctx.guardar();
      ctx.pantalla(T.enMarcha(st.cuenta));
      ctx.anunciar(T.enMarcha(st.cuenta) ? t('anuncio_empieza', { t: T.formatear(previo) }) : t('anuncio_pausa'));
    });
    const sumar = (ms) => { st.cuenta = T.sumar(st.cuenta, ms, Date.now()); previo = null; ctx.guardar(); };
    const reiniciar = () => { st.cuenta = T.reiniciar(st.cuenta); previo = null; ctx.guardar(); ctx.pantalla(false); };
    controles.append(
      boton('menos', t('menos_minuto'), () => sumar(-MIN), { soloIcono: true }),
      principal.el,
      boton('reiniciar', t('reiniciar'), reiniciar, { soloIcono: true }),
      boton('mas', t('mas_minuto'), () => sumar(MIN), { soloIcono: true }));

    const fijar = (ms) => { st.cuenta = T.crear(ms); previo = null; ctx.guardar(); ctx.pantalla(false); construir(); };
    const mins = campoNumero(t('minutos'), Math.floor(st.cuenta.duracion / MIN), { min: 0, max: 600, id: 'c-min' });
    const segs = campoNumero(t('segundos'), Math.floor((st.cuenta.duracion % MIN) / 1000), { min: 0, max: 59, id: 'c-seg' });
    const error = h('p', { class: 'error', role: 'alert' });
    const fijarPersonal = () => {
      const ms = (Number(mins.input.value) || 0) * MIN + (Number(segs.input.value) || 0) * 1000;
      if (!(ms >= 1000 && ms <= T.MAX_MS)) { error.textContent = t('error_duracion'); return; }
      fijar(ms);
    };
    for (const i of [mins.input, segs.input]) i.addEventListener('input', () => { error.textContent = ''; });

    config.append(
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('duracion') }),
        h('div', { class: 'rapidos' }, ...et.rapidos.map((m) => boton(null, t('n_min', { n: m }), () => fijar(m * MIN), {
          clase: 'btn-rapido', extra: { 'aria-pressed': String(st.cuenta.duracion === m * MIN) },
        }))),
        h('div', { class: 'fila' }, mins.el, segs.el, boton('check', t('fijar'), fijarPersonal)),
        error),
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('aspecto') }),
        selector(t('aspecto'), [['disco', t('vista_disco')], ['digital', t('vista_digital')], ['semaforo', t('vista_semaforo')]], vista,
          (v) => { st.vista = v; ctx.guardar(); construir(); }),
        vista !== 'digital' ? h('label', { class: 'casilla' },
          h('input', { type: 'checkbox', checked: numeros, onchange: (e) => { st.numeros = e.target.checked; ctx.guardar(); construir(); } }),
          h('span', { text: t('mostrar_numeros') })) : null),
      h('p', { class: 'nota atajos', text: t('atajos') }));

    const palabraDe = (est, f) => {
      if (vista === 'semaforo') return t('sem_' + est);
      if (amistoso) return t('pal_' + est);
      return est === 'fin' ? t('pal_cumplido') : t('queda_pct', { p: Math.round(f * 100) });
    };

    return {
      tick(ahora) {
        const c = st.cuenta;
        const r = T.restante(c, ahora);
        const f = T.fraccion(c, ahora);
        const empezado = T.transcurrido(c, ahora) > 0;
        const est = T.semaforo(f);
        pieza?.actualizar(...(vista === 'disco' ? [f, est] : [est]));
        bar?.actualizar(f, est);
        digitos.textContent = T.formatear(r);
        palabra.textContent = empezado ? palabraDe(est, f) : (vista === 'digital' || numeros) ? t('listo') : t('listo_para', { t: T.formatear(c.duracion) });
        escenario.dataset.estado = empezado ? est : 'listo';
        // Avisos solo con el reloj en marcha y entre dos lecturas seguidas
        if (previo !== null && T.enMarcha(c)) {
          for (const hito of T.hitos(previo, r, c.duracion)) {
            ctx.sonar(hito === 'fin' ? 'fin' : 'aviso');
            ctx.anunciar(t('hito_' + hito));
          }
        }
        previo = T.enMarcha(c) ? r : null;
        if (T.enMarcha(c) && r === 0) { st.cuenta = T.pausar(c, ahora); ctx.guardar(); ctx.pantalla(false); }
        principal.actualizar(T.enMarcha(st.cuenta), empezado && r > 0);
      },
      tecla(e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); principal.el.click(); }
        else if (e.key === 'r' || e.key === 'R') reiniciar();
        else if (e.key === '+') sumar(MIN);
        else if (e.key === '-') sumar(-MIN);
      },
    };
  }

  // ---------- Cronómetro ----------
  function cronometro() {
    const digitos = h('span', { class: 'digitos' });
    const decimas = h('span', { class: 'decimas' });
    const lista = h('ol', { class: 'vueltas', 'aria-label': t('vueltas'), reversed: true });
    escenario.dataset.vista = 'crono';
    escenario.append(h('div', { class: 'lectura' }, h('span', { class: 'digitos-fila' }, digitos, decimas)));

    const pintarVueltas = () => {
      lista.replaceChildren(...st.vueltas.map((ms, i) => {
        const parcial = ms - (st.vueltas[i + 1] || 0);
        return h('li', {}, h('span', { text: t('vuelta_n', { n: st.vueltas.length - i }) }),
          h('span', { class: 'mono', text: T.formatear(ms, { haciaArriba: false }) }),
          h('span', { class: 'mono nota', text: '+' + T.formatear(parcial, { haciaArriba: false }) }));
      }));
    };
    const principal = botonPrincipal(() => { st.crono = T.alternar(st.crono, Date.now()); ctx.guardar(); ctx.pantalla(T.enMarcha(st.crono)); });
    const vuelta = () => {
      if (!T.enMarcha(st.crono) || st.vueltas.length >= 50) return;
      st.vueltas.unshift(Math.floor(T.transcurrido(st.crono, Date.now())));
      ctx.guardar();
      pintarVueltas();
    };
    const reiniciar = () => { st.crono = T.reiniciar(st.crono); st.vueltas = []; ctx.guardar(); ctx.pantalla(false); pintarVueltas(); };
    controles.append(principal.el, boton('bandera', t('vuelta'), vuelta), boton('reiniciar', t('reiniciar'), reiniciar, { soloIcono: true }));
    config.append(lista, h('p', { class: 'nota atajos', text: t('atajos_crono') }));
    pintarVueltas();

    return {
      tick(ahora) {
        const ms = T.transcurrido(st.crono, ahora);
        digitos.textContent = T.formatear(ms, { haciaArriba: false });
        decimas.textContent = '.' + Math.floor((ms % 1000) / 100);
        principal.actualizar(T.enMarcha(st.crono), ms > 0);
      },
      tecla(e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); principal.el.click(); }
        else if (e.key === 'v' || e.key === 'V' || e.key === 'l' || e.key === 'L') vuelta();
        else if (e.key === 'r' || e.key === 'R') reiniciar();
      },
    };
  }

  // ---------- Intervalos ----------
  function intervalos() {
    let fases = fasesIntervalos(st.int);
    const total = () => T.duracionSecuencia(fases);
    if (st.intT.duracion !== total()) st.intT = T.crear(total());
    let fasePrevia = null;
    let segPrevio = null;

    const an = anillo();
    const nombreFase = h('span', { class: 'palabra palabra-fase' });
    const digitos = h('span', { class: 'digitos' });
    const ronda = h('span', { class: 'ronda' });
    const resto = h('span', { class: 'nota' });
    escenario.dataset.vista = 'intervalos';
    escenario.append(h('div', { class: 'figura' }, an.el), h('div', { class: 'lectura' }, nombreFase, digitos, ronda, resto));

    const principal = botonPrincipal(() => {
      st.intT = T.alternar(st.intT, Date.now());
      ctx.guardar();
      ctx.pantalla(T.enMarcha(st.intT));
    });
    const reiniciar = () => { st.intT = T.crear(total()); fasePrevia = null; ctx.guardar(); ctx.pantalla(false); };
    const saltar = () => {
      const pos = T.posicion(fases, 1, T.transcurrido(st.intT, Date.now()));
      if (pos.fin) return;
      const hasta = fases.slice(0, pos.indice + 1).reduce((s, f) => s + f.ms, 0);
      st.intT = { ...st.intT, acumulado: hasta, inicio: T.enMarcha(st.intT) ? Date.now() : null };
      ctx.guardar();
    };
    controles.append(principal.el, boton('siguiente', t('saltar_fase'), saltar, { soloIcono: true }), boton('reiniciar', t('reiniciar'), reiniciar, { soloIcono: true }));

    const reconfigurar = (cambios) => {
      Object.assign(st.int, cambios);
      fases = fasesIntervalos(st.int);
      st.intT = T.crear(total());
      ctx.guardar();
      construir();
    };
    const trab = campoNumero(t('trabajo_s'), st.int.trabajo, { min: 5, max: 3600, id: 'i-trab' });
    const desc = campoNumero(t('descanso_s'), st.int.descanso, { min: 0, max: 3600, id: 'i-desc' });
    const rond = campoNumero(t('rondas'), st.int.rondas, { min: 1, max: 50, id: 'i-rond' });
    const error = h('p', { class: 'error', role: 'alert' });
    const aplicar = () => {
      const tr = Number(trab.input.value), de = Number(desc.input.value), ro = Number(rond.input.value);
      if (!(tr >= 5 && tr <= 3600 && de >= 0 && de <= 3600 && ro >= 1 && ro <= 50 && Number.isInteger(ro))) { error.textContent = t('error_intervalos'); return; }
      reconfigurar({ trabajo: Math.round(tr), descanso: Math.round(de), rondas: ro });
    };
    for (const i of [trab.input, desc.input, rond.input]) i.addEventListener('input', () => { error.textContent = ''; });
    config.append(
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('intervalos_tipo') }),
        h('div', { class: 'rapidos' }, ...INTERVALOS_TIPO.map((p) => boton(null, t('int_' + p.clave) + ` · ${p.trabajo}/${p.descanso} ×${p.rondas}`,
          () => reconfigurar({ trabajo: p.trabajo, descanso: p.descanso, rondas: p.rondas }), { clase: 'btn-rapido' })))),
      h('div', { class: 'config-bloque' },
        h('h2', { class: 'config-titulo', text: t('a_medida') }),
        h('div', { class: 'fila' }, trab.el, desc.el, rond.el, boton('check', t('fijar'), aplicar)),
        error,
        h('label', { class: 'casilla' },
          h('input', { type: 'checkbox', checked: st.int.prep, onchange: (e) => reconfigurar({ prep: e.target.checked }) }),
          h('span', { text: t('preparacion') })),
        h('p', { class: 'nota', text: t('duracion_total', { t: T.formatear(total()) }) })),
      h('p', { class: 'nota atajos', text: t('atajos_intervalos') }));

    return {
      tick(ahora) {
        const ms = T.transcurrido(st.intT, ahora);
        const pos = T.posicion(fases, 1, ms);
        const f = fases[pos.indice];
        const empezado = ms > 0;
        const tipoFase = pos.fin ? 'fin' : empezado ? f.tipo : 'listo';
        escenario.dataset.fase = tipoFase;
        an.actualizar(pos.fin ? 0 : pos.restanteFase / pos.duracionFase, tipoFase);
        nombreFase.textContent = t('fase_int_' + tipoFase);
        digitos.textContent = T.formatear(pos.fin ? 0 : pos.restanteFase);
        const rondasHechas = Math.min(st.int.rondas, f.ronda + 1);
        ronda.textContent = t('ronda_de', { n: rondasHechas, m: st.int.rondas });
        resto.textContent = t('queda_total', { t: T.formatear(T.restante(st.intT, ahora)) });

        if (T.enMarcha(st.intT)) {
          if (fasePrevia !== null && pos.indice !== fasePrevia && !pos.fin) {
            ctx.sonar(f.tipo === 'descanso' ? 'descanso' : 'fase');
            ctx.anunciar(t('fase_int_' + f.tipo) + '. ' + ronda.textContent);
          }
          const seg = Math.ceil(pos.restanteFase / 1000);
          if (segPrevio !== null && seg < segPrevio && seg >= 1 && seg <= 3 && !pos.fin) ctx.sonar('cuenta');
          segPrevio = seg;
          if (pos.fin) {
            ctx.sonar('fin');
            ctx.anunciar(t('fase_int_fin'));
            st.intT = T.pausar(st.intT, ahora);
            ctx.guardar();
            ctx.pantalla(false);
          }
          fasePrevia = pos.indice;
        } else { fasePrevia = pos.fin ? null : pos.indice; segPrevio = null; }
        principal.actualizar(T.enMarcha(st.intT), empezado && !pos.fin);
      },
      tecla(e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); principal.el.click(); }
        else if (e.key === 'r' || e.key === 'R') reiniciar();
        else if (e.key === 'n' || e.key === 'N') saltar();
      },
    };
  }

  construir();
  return {
    tick: (ahora) => actual?.tick(ahora),
    tecla: (e) => actual?.tecla?.(e),
    desmontar() { ctx.guardar(); },
  };
}
