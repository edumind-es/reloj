// Iconos propios (24×24). Trazo por defecto; «relleno» para formas macizas.
// Dibujados para esta app: sin dependencias ni licencias de terceros.

const p = (d) => ['path', { d }];
const c = (cx, cy, r) => ['circle', { cx, cy, r }];
const punto = (cx, cy) => ['circle', { cx, cy, r: 1.2, class: 'macizo' }];

export const ICONOS = {
  punto: { partes: [c(12, 12, 3)] },
  reloj: { partes: [c(12, 13, 8), p('M12 9v4l3 2'), p('M9 2h6')] },
  play: { relleno: true, partes: [p('M7 4.5v15l12.5-7.5z')] },
  pausa: { relleno: true, partes: [['rect', { x: 6, y: 4.5, width: 4, height: 15, rx: 1 }], ['rect', { x: 14, y: 4.5, width: 4, height: 15, rx: 1 }]] },
  parar: { relleno: true, partes: [['rect', { x: 6, y: 6, width: 12, height: 12, rx: 1.5 }]] },
  reiniciar: { partes: [p('M4 12a8 8 0 1 0 2.4-5.7'), p('M4 4v4.5h4.5')] },
  mas: { partes: [p('M12 5v14M5 12h14')] },
  menos: { partes: [p('M5 12h14')] },
  pantalla: { partes: [p('M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5')] },
  salir_pantalla: { partes: [p('M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5')] },
  ajustes: { partes: [p('M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1'), c(15, 6, 2), c(9, 12, 2), c(17, 18, 2)] },
  volver: { partes: [p('M15 5l-7 7 7 7')] },
  siguiente: { relleno: true, partes: [p('M5 5v14l9-7z'), ['rect', { x: 15, y: 5, width: 3, height: 14, rx: 1 }]] },
  bandera: { partes: [p('M6 21V4h11l-2 4 2 4H6')] },
  rotar: { partes: [p('M4 12a8 8 0 0 1 14-5.3'), p('M20 12a8 8 0 0 1-14 5.3'), p('M18.5 3v4h-4'), p('M5.5 21v-4h4')] },
  editar: { partes: [p('M4 20h4L19 9l-4-4L4 16z'), p('M13 7l4 4')] },
  papelera: { partes: [p('M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13')] },
  descargar: { partes: [p('M12 4v11M7 10l5 5 5-5M5 20h14')] },
  subir: { partes: [p('M12 20V9M7 14l5-5 5 5M5 4h14')] },
  campana: { partes: [p('M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z'), p('M10 20a2 2 0 0 0 4 0')] },
  sonido: { partes: [p('M4 9h4l5-4v14l-5-4H4z'), p('M16.5 9a4 4 0 0 1 0 6'), p('M19 6.5a7.5 7.5 0 0 1 0 11')] },
  check: { partes: [p('M5 12.5l4.5 4.5L19 7')] },
  arriba: { partes: [p('M6 15l6-6 6 6')] },
  abajo: { partes: [p('M6 9l6 6 6-6')] },
  cerrar: { partes: [p('M6 6l12 12M18 6L6 18')] },
  instalar: { partes: [['rect', { x: 6, y: 2.5, width: 12, height: 19, rx: 2 }], p('M12 7v7M9 11l3 3 3-3')] },
  candado: { partes: [['rect', { x: 5, y: 10, width: 14, height: 11, rx: 2 }], p('M8 10V7a4 4 0 0 1 8 0v3')] },
  // Modos
  aula: { partes: [['rect', { x: 3, y: 4, width: 18, height: 12, rx: 1 }], p('M8 20h8M12 16v4'), c(12, 10, 3.5), p('M12 8.5V10l1 .8')] },
  grupos: { partes: [c(7, 8, 2.5), c(17, 8, 2.5), c(7, 17, 2.5), c(17, 17, 2.5)] },
  estudio: { partes: [p('M3 6c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z'), p('M12 7v13')] },
  // Caras para «¿cómo te fue?»
  bien: { partes: [c(12, 12, 9), punto(9, 10), punto(15, 10), p('M8 14a4.5 4.5 0 0 0 8 0')] },
  regular: { partes: [c(12, 12, 9), punto(9, 10), punto(15, 10), p('M8.5 15h7')] },
  mal: { partes: [c(12, 12, 9), punto(9, 10), punto(15, 10), p('M8 16.5a4.5 4.5 0 0 1 8 0')] },
  // Fases de estudio
  material: { partes: [p('M6 9a6 6 0 0 1 12 0v11H6z'), p('M9 9V7a3 3 0 0 1 6 0v2'), p('M9 14h6')] },
  leer: { partes: [p('M3 6c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z'), p('M12 7v13')] },
  escribir: { partes: [p('M4 20l1-5L16 4l4 4L9 19z'), p('M14 6l4 4')] },
  subrayar: { partes: [p('M7 4v6a5 5 0 0 0 10 0V4'), p('M4 20h16')] },
  esquema: { partes: [p('M10 6h10M10 12h10M10 18h10'), c(5, 6, 1.5), c(5, 12, 1.5), c(5, 18, 1.5)] },
  repasar: { partes: [p('M4 12a8 8 0 1 0 2.4-5.7'), p('M4 4v4.5h4.5'), p('M12 8v4.5l3 2')] },
  descanso: { partes: [p('M4 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z'), p('M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16'), p('M8 3.5v2.5M12 3.5v2.5')] },
  mover: { partes: [c(14, 4.5, 2), p('M7 12l3.5-4 3.5 3 3 1'), p('M10.5 8l-1 6 4 3v4'), p('M9.5 14L7 20')] },
  // Formas de grupo (macizas)
  circulo: { relleno: true, partes: [c(12, 12, 9)] },
  cuadrado: { relleno: true, partes: [['rect', { x: 3.5, y: 3.5, width: 17, height: 17 }]] },
  triangulo: { relleno: true, partes: [p('M12 3l10 18H2z')] },
  rombo: { relleno: true, partes: [p('M12 2l10 10-10 10L2 12z')] },
  estrella: { relleno: true, partes: [p('M12 2l3 7h7l-5.6 4.4 2.1 7.6L12 16.6 5.5 21l2.1-7.6L2 9h7z')] },
  hexagono: { relleno: true, partes: [p('M7 3h10l5 9-5 9H7l-5-9z')] },
  cruz: { relleno: true, partes: [p('M9 3h6v6h6v6h-6v6H9v-6H3V9h6z')] },
  pentagono: { relleno: true, partes: [p('M12 2l10 7.5L18 22H6L2 9.5z')] },
};
