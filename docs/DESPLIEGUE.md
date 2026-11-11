# Despliegue de reloj.edumind.es

Nada de esto se aplica solo. Los pasos que tocan `/etc` los hace Luis o un script de `/var/www/.edumind_ops/` aprobado expresamente.

1. **DNS**: registro A (y AAAA, si procede) de `reloj.edumind.es` hacia el servidor, en Cloudflare, como el resto de subdominios (el vhost incluye `cloudflare-origin-guard.inc`).
2. **Certificado**: emitirlo con certbot para `reloj.edumind.es` (ver la memoria del servidor sobre la ruta de certbot en sudo).
3. **nginx**:
   - copiar `deploy/reloj-security-headers.inc` y `deploy/reloj.edumind.es.conf` a `/etc/nginx/sites-available/`;
   - enlazar en `sites-enabled`;
   - `nginx -t` y recargar.
4. **Comprobar**:
   - `curl -sI https://reloj.edumind.es/` → 200 y cabecera CSP;
   - `curl -s https://reloj.edumind.es/healthz` → `reloj ok`;
   - `curl -sI https://reloj.edumind.es/package.json` → 404 (denegación por defecto);
   - abrir la app, instalarla y probar sin conexión.

La raíz es `/var/www/reloj/public`: el repo, las pruebas y `deploy/` quedan fuera de la web.
