# Reloj EDUmind — reloj.edumind.es

Temporizadores para el aula, los grupos y el estudio autónomo, de Infantil a FP.
PWA **local first**: sin servidor de aplicación, sin cuentas, sin analítica y sin red.
Todo se guarda en el dispositivo (`localStorage`) y se puede exportar o importar como `.json`.

## Modos
- **Aula**: cuenta atrás (disco que se vacía, números o semáforo), cronómetro con vueltas e intervalos (Tabata, circuito, estaciones o a medida).
- **Grupos**: de 2 a 8 temporizadores para proyectar. Cada grupo lleva forma, letra y color, para no depender solo del color. Funciona en modo libre o por estaciones con rotación automática.
- **Autogestión**: planes por fases (pomodoro según la etapa, deberes, estudiar un tema o planes propios), espera entre fases, cierre con «¿cómo te fue?» y registro local.

## Estilos según etapa y modo
| Estilo | Cuándo | Rasgos |
|---|---|---|
| `amistoso` | Infantil y Primaria | Atkinson Hyperlegible, formas redondas, palabras en vez de números en Infantil |
| `lamina` | ESO, Bachillerato y FP | EDUmind-Lámina: papel, Archivo + JetBrains Mono, franja de Los Cinco Mundos |
| `proyeccion` | Modo grupos | Fondo negro y colores Okabe-Ito sobre oscuro |
| `calma` | Autogestión | Tonos verdes tranquilos |

Todos tienen modo oscuro, contraste alto y movimiento reducido, y están en gallego, castellano e inglés.

## Estructura
```
public/       raíz que sirve nginx (lo único publicado)
  js/         módulos ES sin dependencias ni compilación
  css/        un único app.css con tokens por estilo
  sw.js       service worker (precarga y uso sin conexión)
test/         node --test (motor, saneado, textos, service worker y CSP)
deploy/       vhost nginx y cabeceras de seguridad
```

## Desarrollo
```bash
npm test
```
No hay paso de compilación: lo que hay en `public/` es lo que se publica.
**Al cambiar cualquier fichero publicado, sube `VERSION` en `public/sw.js`.** Si no, los navegadores siguen usando la copia en caché.

## Seguridad
- CSP `default-src 'none'`, sin `unsafe-inline`, con Trusted Types obligatorio (solo la política `reloj`, que únicamente admite `sw.js`).
- Nunca se usa `innerHTML`; todo texto entra con `textContent`. Las pruebas lo comprueban.
- Lo que se importa y lo que se lee de `localStorage` se sanea (tipos, rangos, longitudes y listas cerradas).
- nginx aplica denegación por defecto: solo sirve las rutas y extensiones de la app, y solo admite GET y HEAD.

## Licencia
Código: AGPL-3.0-or-later o EUPL-1.2. Fuentes: SIL OFL 1.1 (`public/fuentes/*.txt`).
EDUMIND® · LUIS VILELA ACUÑA
