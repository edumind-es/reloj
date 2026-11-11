// Modo autogestión: el alumnado elige (o crea) un plan de estudio por fases,
// lo ejecuta solo en su tablet y al final dice cómo le fue. El registro se
// queda en el dispositivo. Por defecto, entre fase y fase espera a que el
// niño o la niña pulse (así un descanso no «se come» la siguiente fase).

import { h, icono, boton } from './dom.js';
import { t, nombreDe, fechaCorta } from './i18n.js';
import * as T from './tiempo.js';
import { anillo } from './visual.js';
import { planesTipo, ICONOS_FASE } from './etapas.js';
import { plan as sanearPlan, fase as sanearFase, MAX_FASES, MAX_PLANES, MAX_REGISTRO } from './validar.js';

const MIN = 60000;
const totalMin = (p) => p.fases.reduce((s, f) => s + f.min, 0);

export function montar(raiz, ctx) {
  const est = ctx.estado.estudio;
  const et = ctx.etapa();
  const seccion = h('section', { class: 'estudio' });
  raiz.append(seccion);

  let pantalla = null; // { tick, tecla }
  const planes = () => [...planesTipo(ctx.claveEtapa()), ...ctx.estado.planes];
  const planSel = () => planes().find((p) => p.id === est.sel) || planes()[0];

  function mostrar() {
    seccion.replaceChildren();
    const a = est.activo;
    pantalla = !a ? seleccion() : a.final ? final() : enCurso();
    pantalla.tick?.(Date.now());
  }

  // ---------- Elegir plan ----------
  function seleccion() {
    const lista = h('div', { class: 'planes', role: 'list' });
    for (const p of planes()) {
      const propio = !!p.texto;
      const elegir = h('button', {
        type: 'button', class: 'plan', 'aria-pressed': String(p.id === planSel().id),
        onclick: () => { est.sel = p.id; ctx.guardar(); mostrar(); },
      },
        h('span', { class: 'plan-nombre', text: nombreDe(p) }),
        h('span', { class: 'plan-total', text: t('n_min', { n: totalMin(p) }) }),
        h('span', { class: 'plan-fases' }, ...p.fases.map((f) => h('span', { class: 'chip', dataset: { tipo: f.tipo } },
          icono(f.icono), h('span', { text: `${nombreDe(f)} · ${f.min}′` })))));
      const acciones = h('div', { class: 'plan-acciones' },
        propio
          ? [boton('editar', t('editar'), () => editor(p), { soloIcono: true }),
            boton('papelera', t('borrar'), () => {
              if (!confirm(t('borrar_plan_confirmar', { p: nombreDe(p) }))) return;
              ctx.estado.planes = ctx.estado.planes.filter((x) => x.id !== p.id);
              if (est.sel === p.id) est.sel = 'pomodoro';
              ctx.guardar();
              mostrar();
            }, { soloIcono: true })]
          : boton('editar', t('copiar_editar'), () => editor({ ...p, id: null, texto: nombreDe(p), fases: p.fases.map((f) => ({ ...f, texto: nombreDe(f), nombre: undefined })) }), { soloIcono: true }));
      lista.append(h('div', { class: 'plan-fila', role: 'listitem' }, elegir, acciones));
    }

    const empezar = h('button', { type: 'button', class: 'btn btn-principal', onclick: () => iniciarPlan(planSel()) },
      icono('play'), h('span', { text: t('empezar_plan') }));

    seccion.append(
      h('h2', { class: 'apartado', text: t('elige_plan') }),
      lista,
      h('div', { class: 'fila' },
        ctx.estado.planes.length < MAX_PLANES ? boton('mas', t('crear_plan'), () => editor(null)) : null,
        h('label', { class: 'casilla' },
          h('input', { type: 'checkbox', checked: est.auto, onchange: (e) => { est.auto = e.target.checked; ctx.guardar(); } }),
          h('span', { text: t('pasar_solo') }))),
      h('div', { class: 'controles' }, empezar),
      registro());
    return {
      tecla(e) { if (e.key === 'Enter' && e.target === document.body) empezar.click(); },
    };
  }

  function iniciarPlan(p) {
    ctx.desbloquearAudio();
    const fases = p.fases.map((f) => ({ ...f }));
    est.activo = {
      texto: nombreDe(p), fases, indice: 0,
      t: T.iniciar(T.crear(fases[0].min * MIN), Date.now()),
      espera: false, inicio: new Date().toISOString(), hechas: 0, msTrabajo: 0, final: false,
    };
    ctx.guardar();
    ctx.pantalla(true);
    ctx.sonar('fase');
    ctx.anunciar(t('anuncio_fase', { f: nombreDe(fases[0]), m: fases[0].min }));
    mostrar();
  }

  // ---------- Plan en curso ----------
  function enCurso() {
    const a = est.activo;
    const pasos = h('ol', { class: 'pasos' }, ...a.fases.map((f, i) => h('li', {
      class: 'paso', dataset: { tipo: f.tipo, estado: i < a.indice ? 'hecho' : i === a.indice ? 'actual' : 'pendiente' },
      'aria-current': i === a.indice ? 'step' : null,
    }, icono(i < a.indice ? 'check' : f.icono), h('span', { text: nombreDe(f) }))));

    const an = anillo();
    const numFase = h('p', { class: 'nota', text: t('fase_de', { n: a.indice + 1, m: a.fases.length }) });
    const nombre = h('p', { class: 'fase-nombre' }, icono(a.fases[a.indice].icono), h('span', { text: nombreDe(a.fases[a.indice]) }));
    const digitos = h('span', { class: 'digitos' + (et.numeros ? '' : ' sr') });
    const palabra = h('span', { class: 'palabra' });
    const resto = h('p', { class: 'nota' });
    const centro = h('div', { class: 'estudio-centro', dataset: { tipo: a.fases[a.indice].tipo } },
      h('div', { class: 'figura' }, an.el),
      h('div', { class: 'lectura' }, numFase, nombre, digitos, palabra, resto));

    const principal = h('button', { type: 'button', class: 'btn btn-principal', onclick: () => {
      ctx.desbloquearAudio();
      if (a.espera) { a.espera = false; a.t = T.iniciar(a.t, Date.now()); ctx.sonar('fase'); }
      else a.t = T.alternar(a.t, Date.now());
      ctx.guardar();
      ctx.pantalla(true);
      mostrar();
    } });
    const enMarcha = T.enMarcha(a.t);
    const siguiente = a.fases[a.indice];
    principal.append(icono(enMarcha ? 'pausa' : 'play'),
      h('span', { text: a.espera ? t('empezar_fase', { f: nombreDe(siguiente) }) : enMarcha ? t('pausar') : t('seguir') }));

    const avisoEspera = a.espera ? h('div', { class: 'aviso-espera', role: 'status' },
      h('p', { class: 'aviso-titulo', text: siguiente.tipo === 'descanso' ? t('bien_hecho_descansa') : t('fase_terminada') }),
      h('p', { text: t('ahora_toca', { f: nombreDe(siguiente), m: siguiente.min }) })) : null;

    seccion.append(
      h('h2', { class: 'apartado', text: a.texto }),
      pasos, ...(avisoEspera ? [avisoEspera] : []), centro,
      h('div', { class: 'controles' },
        principal,
        boton('siguiente', t('saltar_fase'), () => avanzar(Date.now(), false), { soloIcono: true }),
        boton('parar', t('terminar'), () => {
          if (!confirm(t('terminar_confirmar'))) return;
          const ahora = Date.now();
          if (!a.espera && a.fases[a.indice].tipo === 'trabajo') a.msTrabajo += T.transcurrido(a.t, ahora);
          a.final = true;
          a.t = T.pausar(a.t, ahora);
          ctx.guardar();
          ctx.pantalla(false);
          mostrar();
        }, { soloIcono: true })));
    if (a.espera) principal.focus();

    let previo = null;
    return {
      tick(ahora) {
        const r = T.restante(a.t, ahora);
        const f = T.fraccion(a.t, ahora);
        const s = T.semaforo(f);
        an.actualizar(a.espera ? 1 : f, a.espera ? 'listo' : s);
        digitos.textContent = T.formatear(a.espera ? a.t.duracion : r);
        palabra.textContent = a.espera ? '' : et.numeros ? (T.enMarcha(a.t) ? '' : t('en_pausa')) : t('pal_' + s);
        const restoMs = a.fases.slice(a.indice + 1).reduce((x, y) => x + y.min * MIN, 0) + (a.espera ? a.t.duracion : r);
        resto.textContent = t('queda_plan', { t: T.formatear(restoMs) });
        if (!a.espera && T.enMarcha(a.t)) {
          if (previo !== null && a.t.duracion > 3 * MIN && T.cruzado(previo, r, MIN)) { ctx.sonar('aviso'); ctx.anunciar(t('hito_minuto')); }
          previo = r;
          if (r === 0) avanzar(ahora, true);
        } else previo = null;
      },
      tecla(e) {
        if (e.key === ' ' && e.target === document.body) { e.preventDefault(); principal.click(); }
      },
    };
  }

  // Pasa a la siguiente fase (completada o saltada)
  function avanzar(ahora, completada) {
    const a = est.activo;
    const actual = a.fases[a.indice];
    if (!a.espera && actual.tipo === 'trabajo') a.msTrabajo += completada ? actual.min * MIN : T.transcurrido(a.t, ahora);
    if (completada) a.hechas += 1;
    if (a.indice >= a.fases.length - 1) {
      a.final = true;
      a.t = T.pausar(a.t, ahora);
      ctx.sonar('fin');
      ctx.anunciar(t('plan_terminado'));
      ctx.pantalla(false);
    } else {
      a.indice += 1;
      const sig = a.fases[a.indice];
      a.t = T.crear(sig.min * MIN);
      if (est.auto) { a.t = T.iniciar(a.t, ahora); a.espera = false; } else a.espera = true;
      ctx.sonar(sig.tipo === 'descanso' ? 'descanso' : 'fase');
      ctx.anunciar(t('anuncio_fase', { f: nombreDe(sig), m: sig.min }));
    }
    ctx.guardar();
    mostrar();
  }

  // ---------- Final: ¿cómo te fue? ----------
  function final() {
    const a = est.activo;
    const guardar = (animo) => {
      ctx.estado.registro.unshift({
        fecha: a.inicio, plan: a.texto, min: Math.round(a.msTrabajo / MIN),
        fases: a.hechas, total: a.fases.length, animo,
      });
      ctx.estado.registro = ctx.estado.registro.slice(0, MAX_REGISTRO);
      est.activo = null;
      ctx.guardar();
      ctx.anunciar(t('guardado'));
      mostrar();
    };
    const completo = a.hechas === a.fases.length;
    seccion.append(h('div', { class: 'final' },
      icono(completo ? 'check' : 'bandera', { clase: 'final-icono' }),
      h('h2', { class: 'final-titulo', text: completo ? t('plan_terminado') : t('sesion_terminada') }),
      h('p', { text: t('resumen', { f: a.hechas, m: a.fases.length, min: Math.round(a.msTrabajo / MIN) }) }),
      h('h3', { class: 'apartado', text: t('como_te_fue') }),
      h('div', { class: 'animos' }, ...['bien', 'regular', 'mal'].map((k) => h('button', {
        type: 'button', class: 'btn animo', dataset: { animo: k }, onclick: () => guardar(k),
      }, icono(k), h('span', { text: t('animo_' + k) })))),
      boton(null, t('guardar_sin_responder'), () => guardar(null), { clase: 'btn-discreto' })));
    return {};
  }

  // ---------- Registro ----------
  function registro() {
    const reg = ctx.estado.registro;
    const lunes = new Date();
    lunes.setHours(0, 0, 0, 0);
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    const semana = reg.filter((r) => new Date(r.fecha) >= lunes);
    const minSemana = semana.reduce((s, r) => s + r.min, 0);
    return h('section', { class: 'registro', 'aria-labelledby': 'tit-registro' },
      h('h2', { id: 'tit-registro', class: 'apartado', text: t('mis_sesiones') }),
      reg.length
        ? [h('p', { class: 'registro-semana', text: t('esta_semana', { min: minSemana, n: semana.length }) }),
          h('ol', { class: 'registro-lista' }, ...reg.slice(0, 30).map((r) => h('li', {},
            h('span', { class: 'registro-fecha', text: fechaCorta(r.fecha) }),
            h('span', { class: 'registro-plan', text: r.plan }),
            h('span', { class: 'nota', text: t('registro_detalle', { min: r.min, f: r.fases, m: r.total }) }),
            r.animo ? h('span', { class: 'registro-animo', dataset: { animo: r.animo } }, icono(r.animo), h('span', { text: t('animo_' + r.animo) })) : h('span')))),
          boton('papelera', t('borrar_registro'), () => {
            if (!confirm(t('borrar_registro_confirmar'))) return;
            ctx.estado.registro = [];
            ctx.guardar();
            mostrar();
          }, { clase: 'btn-discreto' })]
        : h('p', { class: 'nota', text: t('registro_vacio') }));
  }

  // ---------- Editor de planes propios ----------
  function editor(original) {
    const borrador = {
      id: original?.id || null,
      texto: original ? original.texto || nombreDe(original) : '',
      fases: original ? original.fases.map((f) => ({ texto: f.texto || nombreDe(f), icono: f.icono, min: f.min, tipo: f.tipo }))
        : [{ texto: '', icono: 'leer', min: 10, tipo: 'trabajo' }],
    };
    const error = h('p', { class: 'error', role: 'alert' });
    const filas = h('ol', { class: 'editor-fases' });
    const nombrePlan = h('input', { type: 'text', id: 'ed-nombre', maxlength: 40, value: borrador.texto, placeholder: t('plan_nombre_ej'),
      oninput: (e) => { borrador.texto = e.target.value; error.textContent = ''; } });

    const pintarFilas = () => {
      filas.replaceChildren(...borrador.fases.map((f, i) => {
        const sel = h('select', { 'aria-label': t('icono'), onchange: (e) => { f.icono = e.target.value; } },
          ...ICONOS_FASE.map((k) => h('option', { value: k, text: t('icono_' + k) })));
        sel.value = f.icono;
        const tipo = h('select', { 'aria-label': t('tipo_fase'), onchange: (e) => { f.tipo = e.target.value; } },
          h('option', { value: 'trabajo', text: t('tipo_trabajo') }), h('option', { value: 'descanso', text: t('tipo_descanso') }));
        tipo.value = f.tipo;
        return h('li', { class: 'editor-fila' },
          h('input', { type: 'text', maxlength: 30, value: f.texto, 'aria-label': t('fase_n', { n: i + 1 }), placeholder: t('fase_nombre_ej'),
            oninput: (e) => { f.texto = e.target.value; error.textContent = ''; } }),
          sel,
          h('input', { type: 'number', min: 1, max: 180, value: String(f.min), inputmode: 'numeric', 'aria-label': t('minutos'), class: 'editor-min',
            oninput: (e) => { f.min = Number(e.target.value); error.textContent = ''; } }),
          tipo,
          boton('arriba', t('subir_fase'), () => { if (i > 0) { [borrador.fases[i - 1], borrador.fases[i]] = [borrador.fases[i], borrador.fases[i - 1]]; pintarFilas(); } }, { soloIcono: true }),
          boton('abajo', t('bajar_fase'), () => { if (i < borrador.fases.length - 1) { [borrador.fases[i + 1], borrador.fases[i]] = [borrador.fases[i], borrador.fases[i + 1]]; pintarFilas(); } }, { soloIcono: true }),
          boton('cerrar', t('quitar_fase'), () => { if (borrador.fases.length > 1) { borrador.fases.splice(i, 1); pintarFilas(); } }, { soloIcono: true }));
      }));
    };
    pintarFilas();

    const guardar = () => {
      if (!borrador.texto.trim()) { error.textContent = t('error_plan_nombre'); nombrePlan.focus(); return; }
      if (borrador.fases.some((f) => !f.texto.trim())) { error.textContent = t('error_fase_nombre'); return; }
      if (borrador.fases.some((f) => !(Number.isInteger(f.min) && f.min >= 1 && f.min <= 180))) { error.textContent = t('error_fase_min'); return; }
      const limpio = sanearPlan({ id: borrador.id || undefined, texto: borrador.texto, fases: borrador.fases.map(sanearFase) });
      if (!limpio) { error.textContent = t('error_fase_nombre'); return; }
      const lista = ctx.estado.planes;
      const i = lista.findIndex((p) => p.id === limpio.id);
      if (i >= 0) lista[i] = limpio; else lista.push(limpio);
      est.sel = limpio.id;
      ctx.guardar();
      mostrar();
    };

    seccion.replaceChildren(h('div', { class: 'editor' },
      h('h2', { class: 'apartado', text: original?.id ? t('editar_plan') : t('crear_plan') }),
      h('label', { class: 'campo', for: 'ed-nombre' }, h('span', { text: t('plan_nombre') })), nombrePlan,
      h('h3', { class: 'config-titulo', text: t('fases') }),
      filas,
      borrador.fases.length < MAX_FASES ? boton('mas', t('anadir_fase'), () => {
        borrador.fases.push({ texto: '', icono: 'escribir', min: 10, tipo: 'trabajo' });
        pintarFilas();
        filas.lastElementChild?.querySelector('input')?.focus();
      }) : null,
      error,
      h('div', { class: 'fila' },
        boton('check', t('guardar_plan'), guardar, { clase: 'btn-principal' }),
        boton(null, t('cancelar'), mostrar, { clase: 'btn-discreto' }))));
    nombrePlan.focus();
    pantalla = {};
  }

  mostrar();
  return {
    tick: (ahora) => pantalla?.tick?.(ahora),
    tecla: (e) => pantalla?.tecla?.(e),
    desmontar() { ctx.guardar(); },
  };
}
