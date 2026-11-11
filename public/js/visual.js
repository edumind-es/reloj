// Piezas visuales reutilizables: disco que se vacía, anillo, semáforo y barra.
// El estado (verde/ámbar/rojo/fin) va en data-estado y el color lo pone el CSS
// de cada estilo; además siempre hay una palabra que lo dice (no solo color).
import { h, s } from './dom.js';

// Cuña del disco: lo que queda, en sentido horario desde las 12
export function cuna(frac, r = 90, cx = 100, cy = 100) {
  const f = Math.min(1, Math.max(0, frac));
  if (f <= 0) return '';
  if (f >= 0.9999) return `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}Z`;
  const a = f * 2 * Math.PI;
  const x = (cx + r * Math.sin(a)).toFixed(2);
  const y = (cy - r * Math.cos(a)).toFixed(2);
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y}Z`;
}

export function disco() {
  const camino = s('path', { class: 'disco-cuna' });
  const marcas = s('g', { class: 'disco-marcas' });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * Math.PI;
    const r1 = i % 3 === 0 ? 80 : 86;
    marcas.append(s('line', {
      x1: (100 + r1 * Math.sin(a)).toFixed(1), y1: (100 - r1 * Math.cos(a)).toFixed(1),
      x2: (100 + 94 * Math.sin(a)).toFixed(1), y2: (100 - 94 * Math.cos(a)).toFixed(1),
    }));
  }
  const svg = s('svg', { viewBox: '0 0 200 200', class: 'disco', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { cx: 100, cy: 100, r: 97, class: 'disco-fondo' }),
    camino, marcas,
    s('circle', { cx: 100, cy: 100, r: 7, class: 'disco-eje' }));
  return {
    el: svg,
    actualizar(frac, estado) {
      camino.setAttribute('d', cuna(frac));
      svg.dataset.estado = estado;
    },
  };
}

const CIRC = 2 * Math.PI * 42;
export function anillo() {
  const arco = s('circle', { cx: 50, cy: 50, r: 42, class: 'anillo-arco', 'stroke-dasharray': CIRC.toFixed(2), transform: 'rotate(-90 50 50)' });
  const svg = s('svg', { viewBox: '0 0 100 100', class: 'anillo', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { cx: 50, cy: 50, r: 42, class: 'anillo-fondo' }), arco);
  return {
    el: svg,
    actualizar(frac, estado) {
      arco.setAttribute('stroke-dashoffset', (CIRC * (1 - Math.min(1, Math.max(0, frac)))).toFixed(2));
      svg.dataset.estado = estado;
    },
  };
}

// Semáforo vertical: la posición (arriba/medio/abajo) también informa
export function semaforo() {
  const luces = ['rojo', 'ambar', 'verde'].map((c, i) => s('circle', { cx: 50, cy: 40 + i * 70, r: 28, class: 'luz luz-' + c }));
  const svg = s('svg', { viewBox: '0 0 100 220', class: 'semaforo', 'aria-hidden': 'true', focusable: 'false' },
    s('rect', { x: 8, y: 4, width: 84, height: 212, rx: 18, class: 'semaforo-caja' }), ...luces);
  return {
    el: svg,
    actualizar(estado) { svg.dataset.estado = estado; },
  };
}

export function barra() {
  const relleno = h('div', { class: 'barra-relleno' });
  const el = h('div', { class: 'barra', 'aria-hidden': 'true' }, relleno);
  return {
    el,
    actualizar(frac, estado) {
      relleno.style.setProperty('width', (Math.min(1, Math.max(0, frac)) * 100).toFixed(2) + '%');
      el.dataset.estado = estado;
    },
  };
}
