// Ayudantes de DOM. Nunca se usa innerHTML: todo texto entra con textContent,
// lo que permite exigir Trusted Types en la CSP y cierra la puerta al XSS
// aunque un fichero importado traiga nombres maliciosos.

import { ICONOS } from './iconos.js';

const SVG = 'http://www.w3.org/2000/svg';

export function h(etiqueta, props = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  aplicar(el, props);
  for (const c of hijos.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

export function s(etiqueta, props = {}, ...hijos) {
  const el = document.createElementNS(SVG, etiqueta);
  aplicar(el, props);
  for (const c of hijos.flat(Infinity)) if (c) el.append(c);
  return el;
}

function aplicar(el, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'vars') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val); // CSSOM: permitido por la CSP
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
}

// Icono SVG por nombre (ver iconos.js). Decorativo salvo que se pase etiqueta.
export function icono(nombre, { clase = '', etiqueta = null } = {}) {
  const def = ICONOS[nombre] || ICONOS.punto;
  const svg = s('svg', {
    viewBox: '0 0 24 24',
    class: ('icono ' + (def.relleno ? 'icono-relleno ' : '') + clase).trim(),
    'aria-hidden': etiqueta ? null : 'true',
    role: etiqueta ? 'img' : null,
    'aria-label': etiqueta,
    focusable: 'false',
  });
  for (const [tipo, attrs] of def.partes) svg.append(s(tipo, attrs));
  return svg;
}

// Botón con icono y texto visible (o solo icono con aria-label)
export function boton(nombreIcono, texto, onclick, { clase = '', soloIcono = false, extra = {} } = {}) {
  return h('button', {
    type: 'button', class: ('btn ' + clase).trim(), onclick,
    'aria-label': soloIcono ? texto : null, title: soloIcono ? texto : null, ...extra,
  }, nombreIcono ? icono(nombreIcono) : null, soloIcono ? null : h('span', { text: texto }));
}

export const $ = (sel, raiz = document) => raiz.querySelector(sel);

// Campo numérico con etiqueta visible
export function campoNumero(etiqueta, valor, { min, max, paso = 1, onchange, id }) {
  const input = h('input', { type: 'number', inputmode: 'numeric', min, max, step: paso, value: String(valor), id, onchange });
  return { el: h('label', { class: 'campo' }, h('span', { text: etiqueta }), input), input };
}

// Grupo de botones excluyentes (aria-pressed)
export function selector(etiqueta, opciones, actual, alElegir, { clase = '' } = {}) {
  const cont = h('div', { class: ('selector ' + clase).trim(), role: 'group', 'aria-label': etiqueta });
  const botones = opciones.map(([valor, texto, ic]) => h('button', {
    type: 'button', class: 'btn btn-opcion', 'aria-pressed': String(valor === actual),
    onclick: () => {
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b === botonDe(valor))));
      alElegir(valor);
    },
    dataset: { valor: String(valor) },
  }, ic ? icono(ic) : null, h('span', { text: texto })));
  const botonDe = (v) => botones.find((b) => b.dataset.valor === String(v));
  cont.append(...botones);
  return cont;
}
