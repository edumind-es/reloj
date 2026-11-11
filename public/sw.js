// Service worker de Reloj EDUmind: la app entera funciona sin conexión.
// Estrategia: precarga de una lista cerrada de ficheros y «primero caché».
// Nunca toca peticiones de otros orígenes (no hay ninguna) ni guarda datos.
// Al cambiar cualquier fichero, subir VERSION: la prueba sw.test.js lo vigila.

const VERSION = 'reloj-v0.1.0-1';
const FICHEROS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/almacen.js',
  'js/avisos.js',
  'js/dom.js',
  'js/etapas.js',
  'js/i18n.js',
  'js/iconos.js',
  'js/textos.js',
  'js/tiempo.js',
  'js/validar.js',
  'js/vista-aula.js',
  'js/vista-estudio.js',
  'js/vista-grupos.js',
  'js/visual.js',
  'fuentes/Archivo.woff2',
  'fuentes/JetBrainsMono.woff2',
  'fuentes/AtkinsonHyperlegible-Regular.woff2',
  'fuentes/AtkinsonHyperlegible-Bold.woff2',
  'iconos/icono.svg',
  'iconos/icono-180.png',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/icono-maskable-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' evita que la caché HTTP cuele una versión vieja
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHEROS.map((f) => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((k) => k.startsWith('reloj-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// La página pide activar la versión nueva cuando el docente pulsa «actualizar»
self.addEventListener('message', (e) => {
  if (e.data === 'activar') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Navegaciones: siempre la portada de la caché (la app usa rutas con #)
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
