// Reloj EDUmind — carcasa de la app: rutas, cabecera, portada y ajustes.
// Local first: sin servidor, sin cuentas, sin analítica. Todo vive en este
// dispositivo (localStorage) y se puede exportar/importar como fichero.

import { h, icono, boton, $ } from './dom.js';
import { t, fijarIdioma, detectar, idiomaActual } from './i18n.js';
import { cargar, guardar as guardarLocal, borrarTodo } from './almacen.js';
import { etapa, ORDEN_ETAPAS } from './etapas.js';
import { exportar, importar, estado as sanear, IDIOMAS } from './validar.js';
import * as avisos from './avisos.js';
import * as aula from './vista-aula.js';
import * as grupos from './vista-grupos.js';
import * as estudio from './vista-estudio.js';

const VISTAS = { aula, grupos, estudio };
const ICONO_MODO = { aula: 'aula', grupos: 'grupos', estudio: 'estudio' };

let estado = cargar();
let vista = null;
let eventoInstalar = null;

const ctx = {
  get estado() { return estado; },
  guardar: () => guardarLocal(estado),
  etapa: () => etapa(estado.ajustes.etapa),
  claveEtapa: () => estado.ajustes.etapa,
  sonar: (nombre) => avisos.sonar(nombre, estado.ajustes),
  anunciar: avisos.anunciar,
  pantalla: avisos.mantenerPantalla,
  desbloquearAudio: avisos.desbloquearAudio,
  alternarEnfoque,
};

// ---------- Estilo según etapa y modo ----------

function aplicarEstilo(ruta) {
  const b = document.body;
  b.dataset.estilo = ruta === 'grupos' ? 'proyeccion' : ruta === 'estudio' ? 'calma' : ctx.etapa().estilo;
  b.dataset.etapa = estado.ajustes.etapa;
  b.dataset.modo = ruta || 'inicio';
  b.classList.toggle('contraste', estado.ajustes.contraste);
  const tema = { proyeccion: '#0b0b0b', calma: '#e9f2ee', amistoso: '#fff4e2', lamina: '#ece9e1' }[b.dataset.estilo];
  $('meta[name="theme-color"]')?.setAttribute('content', tema);
}

// ---------- Rutas ----------

const rutaActual = () => {
  const r = location.hash.replace(/^#\/?/, '');
  return VISTAS[r] ? r : '';
};

function pintar({ enfocar = false } = {}) {
  vista?.desmontar?.();
  vista = null;
  avisos.mantenerPantalla(false);
  salirEnfoque();
  const ruta = rutaActual();
  aplicarEstilo(ruta);
  pintarCabecera(ruta);
  const main = $('#principal');
  main.replaceChildren();
  if (ruta) vista = VISTAS[ruta].montar(main, ctx);
  else pintarPortada(main);
  pintarPie();
  document.title = (ruta ? t('modo_' + ruta) + ' · ' : '') + t('app_nombre');
  if (enfocar) main.focus({ preventScroll: true });
}

// ---------- Cabecera ----------

function pintarCabecera(ruta) {
  const cab = $('#cabecera');
  const izquierda = ruta
    ? h('a', { class: 'btn btn-volver', href: '#/', 'aria-label': t('volver_inicio') }, icono('volver'), h('span', { text: t('app_corto') }))
    : h('a', { class: 'marca', href: '#/' }, icono('reloj', { clase: 'marca-icono' }), h('span', { text: t('app_nombre') }));
  const titulo = ruta ? h('h1', { class: 'cabecera-titulo' }, icono(ICONO_MODO[ruta]), h('span', { text: t('modo_' + ruta) })) : null;

  const idioma = h('select', {
    class: 'idioma', 'aria-label': t('idioma'),
    onchange: (e) => { estado.ajustes.idioma = e.target.value; ctx.guardar(); fijarIdioma(e.target.value); pintar(); },
  }, ...IDIOMAS.map((i) => h('option', { value: i, text: { gl: 'Galego', es: 'Castellano', en: 'English' }[i] })));
  idioma.value = idiomaActual();

  const acciones = h('div', { class: 'cabecera-acciones' },
    idioma,
    ruta && ruta !== 'estudio' ? boton('pantalla', t('pantalla_completa'), alternarEnfoque, { soloIcono: true, extra: { id: 'btn-enfoque' } }) : null,
    boton('ajustes', t('ajustes'), abrirAjustes, { soloIcono: true }));
  cab.replaceChildren(...[izquierda, titulo, acciones].filter(Boolean));
}

// ---------- Modo pantalla (proyección) ----------
// Oculta la configuración y pide pantalla completa si el navegador la permite
// (en iPhone no existe: basta con la clase «enfoque»).

function alternarEnfoque() {
  if (document.body.classList.contains('enfoque')) salirEnfoque();
  else {
    document.body.classList.add('enfoque');
    const raiz = document.documentElement;
    const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
    if (pedir) { try { const p = pedir.call(raiz); if (p && p.catch) p.catch(() => {}); } catch { /* sin pantalla completa */ } }
  }
  actualizarBotonEnfoque();
}

function salirEnfoque() {
  document.body.classList.remove('enfoque');
  const fs = document.fullscreenElement || document.webkitFullscreenElement;
  if (fs) { const salir = document.exitFullscreen || document.webkitExitFullscreen; try { const p = salir.call(document); if (p && p.catch) p.catch(() => {}); } catch { /* nada */ } }
  actualizarBotonEnfoque();
}

function actualizarBotonEnfoque() {
  const b = $('#btn-enfoque');
  if (!b) return;
  const dentro = document.body.classList.contains('enfoque');
  const txt = dentro ? t('salir_pantalla') : t('pantalla_completa');
  b.setAttribute('aria-label', txt);
  b.title = txt;
  b.replaceChildren(icono(dentro ? 'salir_pantalla' : 'pantalla'));
}

for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) {
  document.addEventListener(ev, () => {
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
      document.body.classList.remove('enfoque');
      actualizarBotonEnfoque();
    }
  });
}

// ---------- Portada ----------

function pintarPortada(main) {
  const etapas = h('div', { class: 'etapas', role: 'group', 'aria-labelledby': 'tit-etapa' },
    ...ORDEN_ETAPAS.map((e) => h('button', {
      type: 'button', class: 'btn etapa', 'aria-pressed': String(e === estado.ajustes.etapa), dataset: { etapa: e },
      onclick: () => { estado.ajustes.etapa = e; ctx.guardar(); pintar(); $(`[data-etapa="${e}"]`)?.focus(); },
    }, h('span', { class: 'etapa-nombre', text: t('etapa_' + e) }), h('span', { class: 'etapa-detalle', text: t('etapa_' + e + '_det') }))));

  const modo = (clave) => h('a', { class: 'modo', href: '#/' + clave },
    icono(ICONO_MODO[clave], { clase: 'modo-icono' }),
    h('span', { class: 'modo-titulo', text: t('modo_' + clave) }),
    h('span', { class: 'modo-desc', text: t('modo_' + clave + '_desc') }));

  main.append(
    h('section', { class: 'portada' },
      h('h1', { class: 'portada-titulo', text: t('portada_titulo') }),
      h('p', { class: 'portada-lema', text: t('portada_lema') }),
      h('h2', { id: 'tit-etapa', class: 'apartado', text: t('elige_etapa') }),
      etapas,
      h('h2', { class: 'apartado', text: t('elige_modo') }),
      h('div', { class: 'modos' }, modo('aula'), modo('grupos'), modo('estudio')),
      h('p', { class: 'privacidad' }, icono('candado'), h('span', { text: t('privacidad') })),
      eventoInstalar ? boton('instalar', t('instalar'), instalar, { clase: 'btn-instalar' }) : null));
}

async function instalar() {
  if (!eventoInstalar) return;
  eventoInstalar.prompt();
  try { await eventoInstalar.userChoice; } catch { /* nada */ }
  eventoInstalar = null;
  if (!rutaActual()) pintar();
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalar = e;
  if (!rutaActual()) pintar();
});

// ---------- Ajustes y datos ----------

function abrirAjustes() {
  const d = $('#dialogo-ajustes');
  const a = estado.ajustes;
  const casilla = (clave, texto) => h('label', { class: 'casilla' },
    h('input', { type: 'checkbox', checked: a[clave], onchange: (e) => { a[clave] = e.target.checked; ctx.guardar(); aplicarEstilo(rutaActual()); } }),
    h('span', { text: texto }));

  const etapaSel = h('select', { id: 'aj-etapa', onchange: (e) => { a.etapa = e.target.value; ctx.guardar(); } },
    ...ORDEN_ETAPAS.map((e) => h('option', { value: e, text: t('etapa_' + e) })));
  etapaSel.value = a.etapa;

  const mensaje = h('p', { class: 'mensaje', role: 'status' });
  const fichero = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr', id: 'aj-fichero', onchange: (e) => importarFichero(e, mensaje) });

  d.replaceChildren(h('form', { method: 'dialog', class: 'dialogo' },
    h('div', { class: 'dialogo-cab' },
      h('h2', { id: 'titulo-ajustes', text: t('ajustes') }),
      h('button', { class: 'btn', value: 'cerrar', 'aria-label': t('cerrar'), title: t('cerrar') }, icono('cerrar'))),
    h('label', { class: 'campo', for: 'aj-etapa' }, h('span', { text: t('etapa') })), etapaSel,
    h('fieldset', {}, h('legend', { text: t('avisos') }),
      casilla('sonido', t('sonido')),
      casilla('vibracion', t('vibracion')),
      boton('sonido', t('probar_sonido'), () => { avisos.desbloquearAudio(); avisos.sonar('fin', a); })),
    h('fieldset', {}, h('legend', { text: t('accesibilidad') }),
      casilla('contraste', t('contraste_alto')),
      h('p', { class: 'nota', text: t('atajos') })),
    h('fieldset', {}, h('legend', { text: t('mis_datos') }),
      h('p', { class: 'nota', text: t('datos_explicacion') }),
      h('div', { class: 'fila' },
        boton('descargar', t('exportar'), exportarFichero),
        h('label', { class: 'btn', for: 'aj-fichero', tabindex: '0', role: 'button', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fichero.click(); } } },
          icono('subir'), h('span', { text: t('importar') })),
        fichero),
      boton('papelera', t('borrar_todo'), () => {
        if (!confirm(t('borrar_todo_confirmar'))) return;
        borrarTodo();
        estado = cargar();
        d.close();
        pintar();
      }, { clase: 'btn-peligro' }),
      mensaje)));
  d.addEventListener('close', () => pintar(), { once: true });
  d.showModal();
}

function exportarFichero() {
  const blob = new Blob([exportar(estado)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `reloj-edumind-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importarFichero(e, mensaje) {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (f.size > 256 * 1024) { mensaje.textContent = t('error_tamano'); return; }
  const r = importar(await f.text());
  if (!r.ok) { mensaje.textContent = t(r.error); return; }
  // Se sustituyen preferencias, nombres, planes y registro; lo que está en marcha se conserva
  estado = sanear({ ...estado, ...r.datos, grupos: { ...estado.grupos, ...r.datos.grupos } });
  ctx.guardar();
  fijarIdioma(detectar(estado.ajustes.idioma));
  mensaje.textContent = t('importado', { n: r.datos.registro.length, p: r.datos.planes.length });
}

// ---------- Pie ----------

let hayActualizacion = false;
function pintarPie() {
  $('#pie').replaceChildren(...[
    h('span', { class: 'pie-marca', text: 'EDUMIND® · LUIS VILELA ACUÑA' }),
    h('span', { text: t('pie_licencia') }),
    h('span', { text: t('pie_local') }),
    hayActualizacion ? boton('reiniciar', t('actualizar'), aplicarActualizacion, { clase: 'btn-actualizar' }) : null].filter(Boolean));
}

// ---------- Service worker (sin conexión) ----------
// La versión nueva NO se activa sola en mitad de una clase: se ofrece un botón.

let swEsperando = null;
function aplicarActualizacion() {
  if (swEsperando) swEsperando.postMessage('activar');
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      // Con Trusted Types obligatorio (CSP), register() exige una URL «de confianza»:
      // la única política, «reloj», solo admite el propio sw.js.
      const politica = window.trustedTypes?.createPolicy('reloj', {
        createScriptURL: (u) => { if (u === 'sw.js') return u; throw new TypeError('URL no permitida'); },
      });
      const reg = await navigator.serviceWorker.register(politica ? politica.createScriptURL('sw.js') : 'sw.js', { scope: './' });
      const avisar = (sw) => { swEsperando = sw; hayActualizacion = true; pintarPie(); };
      if (reg.waiting && navigator.serviceWorker.controller) avisar(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing;
        nuevo?.addEventListener('statechange', () => {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) avisar(nuevo);
        });
      });
      let recargado = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!recargado) { recargado = true; location.reload(); }
      });
    } catch { /* sin service worker: la app funciona igual con conexión */ }
  });
}

// ---------- Arranque ----------

fijarIdioma(detectar(estado.ajustes.idioma));
window.addEventListener('hashchange', () => pintar({ enfocar: true }));
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
  // Espacio/Intro sobre un botón o enlace ya lo activan solos: no duplicar
  if (['BUTTON', 'A', 'SUMMARY', 'LABEL'].includes(tag) && (e.key === ' ' || e.key === 'Enter')) return;
  if ($('#dialogo-ajustes').open) return;
  if ((e.key === 'f' || e.key === 'F') && vista && rutaActual() !== 'estudio') { e.preventDefault(); alternarEnfoque(); return; }
  if (e.key === 'Escape' && document.body.classList.contains('enfoque')) { salirEnfoque(); return; }
  vista?.tecla?.(e);
});
// Un solo latido para toda la app. Al ir por marcas absolutas, aunque el
// navegador lo frene en segundo plano, al volver la cuenta es exacta.
setInterval(() => vista?.tick?.(Date.now()), 100);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') vista?.tick?.(Date.now()); });
// Guardar al salir (por si quedó algo sin guardar)
window.addEventListener('pagehide', () => ctx.guardar());
pintar();
