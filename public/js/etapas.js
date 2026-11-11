// Perfiles por etapa: deciden el aspecto (estilo) y los valores por defecto.
// estilo «amistoso» = infantil y primaria; «lamina» = ESO, bachillerato, FP y docente.
// Los modos «grupos» (proyección) y «estudio» (calma) tienen estilo propio.

export const ETAPAS = {
  infantil: {
    estilo: 'amistoso', vista: 'disco', numeros: false,
    rapidos: [1, 2, 3, 5, 10],
    pomodoro: { trabajo: 10, descanso: 3, ciclos: 2 },
    intervalos: { trabajo: 30, descanso: 30, rondas: 4 },
  },
  primaria: {
    estilo: 'amistoso', vista: 'disco', numeros: true,
    rapidos: [1, 3, 5, 10, 15],
    pomodoro: { trabajo: 15, descanso: 5, ciclos: 3 },
    intervalos: { trabajo: 40, descanso: 20, rondas: 6 },
  },
  eso: {
    estilo: 'lamina', vista: 'digital', numeros: true,
    rapidos: [1, 3, 5, 10, 15, 20],
    pomodoro: { trabajo: 25, descanso: 5, ciclos: 4 },
    intervalos: { trabajo: 40, descanso: 20, rondas: 8 },
  },
  bach: {
    estilo: 'lamina', vista: 'digital', numeros: true,
    rapidos: [5, 10, 15, 25, 50],
    pomodoro: { trabajo: 45, descanso: 10, ciclos: 3 },
    intervalos: { trabajo: 45, descanso: 15, rondas: 8 },
  },
  fp: {
    estilo: 'lamina', vista: 'digital', numeros: true,
    rapidos: [5, 10, 15, 30, 60],
    pomodoro: { trabajo: 45, descanso: 10, ciclos: 3 },
    intervalos: { trabajo: 45, descanso: 15, rondas: 8 },
  },
};

export const ORDEN_ETAPAS = ['infantil', 'primaria', 'eso', 'bach', 'fp'];
export const ETAPA_POR_DEFECTO = 'primaria';

export const etapa = (clave) => ETAPAS[clave] || ETAPAS[ETAPA_POR_DEFECTO];

// Intervalos tipo para Educación Física (segundos)
export const INTERVALOS_TIPO = [
  { clave: 'tabata', trabajo: 20, descanso: 10, rondas: 8 },
  { clave: 'circuito', trabajo: 40, descanso: 20, rondas: 6 },
  { clave: 'estaciones', trabajo: 120, descanso: 30, rondas: 4 },
];

// Iconos disponibles para las fases de un plan de estudio (ver iconos.js)
export const ICONOS_FASE = ['material', 'leer', 'escribir', 'subrayar', 'esquema', 'repasar', 'descanso', 'mover'];

// Planes de estudio predefinidos. «nombre» es una clave de textos.js;
// los planes propios del alumnado llevan «texto» libre en su lugar.
export function planesTipo(claveEtapa) {
  const e = etapa(claveEtapa);
  const p = e.pomodoro;
  const pomodoro = [];
  for (let i = 0; i < p.ciclos; i++) {
    pomodoro.push({ nombre: 'fase_concentrar', icono: 'escribir', min: p.trabajo, tipo: 'trabajo' });
    if (i < p.ciclos - 1) pomodoro.push({ nombre: 'fase_descanso', icono: 'descanso', min: p.descanso, tipo: 'descanso' });
  }
  const peq = claveEtapa === 'infantil' || claveEtapa === 'primaria';
  return [
    { id: 'pomodoro', nombre: 'plan_pomodoro', fases: pomodoro },
    {
      id: 'deberes', nombre: 'plan_deberes', fases: [
        { nombre: 'fase_material', icono: 'material', min: 2, tipo: 'trabajo' },
        { nombre: 'fase_deberes', icono: 'escribir', min: peq ? 15 : 25, tipo: 'trabajo' },
        { nombre: 'fase_descanso', icono: 'mover', min: 5, tipo: 'descanso' },
        { nombre: 'fase_revisar', icono: 'repasar', min: peq ? 5 : 10, tipo: 'trabajo' },
      ],
    },
    {
      id: 'tema', nombre: 'plan_tema', fases: [
        { nombre: 'fase_leer', icono: 'leer', min: peq ? 8 : 15, tipo: 'trabajo' },
        { nombre: 'fase_subrayar', icono: 'subrayar', min: peq ? 7 : 15, tipo: 'trabajo' },
        { nombre: 'fase_descanso', icono: 'descanso', min: 5, tipo: 'descanso' },
        { nombre: 'fase_esquema', icono: 'esquema', min: peq ? 8 : 15, tipo: 'trabajo' },
        { nombre: 'fase_repasar', icono: 'repasar', min: peq ? 5 : 10, tipo: 'trabajo' },
      ],
    },
  ];
}

// Grupos: forma + letra + color, para que nunca dependa solo del color.
// Colores Okabe-Ito (seguros para daltonismo) sobre fondo oscuro.
export const GRUPOS = [
  { letra: 'A', forma: 'circulo', color: '#E69F00' },
  { letra: 'B', forma: 'cuadrado', color: '#56B4E9' },
  { letra: 'C', forma: 'triangulo', color: '#009E73' },
  { letra: 'D', forma: 'rombo', color: '#F0E442' },
  { letra: 'E', forma: 'estrella', color: '#4F9BE0' },
  { letra: 'F', forma: 'hexagono', color: '#F07F3C' },
  { letra: 'G', forma: 'cruz', color: '#CC79A7' },
  { letra: 'H', forma: 'pentagono', color: '#C8C8C8' },
];
