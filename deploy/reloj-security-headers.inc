# Cabeceras de seguridad de reloj.edumind.es.
# Se incluye DENTRO de cada location que declare add_header propio: nginx
# descarta las cabeceras heredadas del server en cuanto un bloque hijo declara la suya.
#
# CSP estricta: la app no tiene ni una línea de JS o CSS inline, no carga nada
# de terceros y no hace peticiones de red (todo es local). Trusted Types exige
# que ningún código meta HTML como texto; la única política, «reloj», solo deja
# registrar /sw.js.

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), interest-cohort=(), browsing-topics=(), fullscreen=(self), screen-wake-lock=(self)" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; object-src 'none'; require-trusted-types-for 'script'; trusted-types reloj; upgrade-insecure-requests" always;
