# Despliegue de reloj.edumind.es

Nada de esto se aplica solo. Los pasos que tocan `/etc` los hace Luis o un script de `/var/www/.edumind_ops/` aprobado expresamente.

1. **DNS**: registro A (y AAAA, si procede) de `reloj.edumind.es` hacia el servidor, en Cloudflare, como el resto de subdominios (el vhost incluye `cloudflare-origin-guard.inc`).
2. **Certificado y nginx**, con un único script, idempotente, que revierte si `nginx -t` falla:
   ```bash
   python3 /var/www/.edumind_ops/reloj_site_install.py
   ```
   ```bash
   sudo python3 /var/www/.edumind_ops/reloj_site_install.py
   ```
   El primero es una simulación: comprueba y cuenta lo que haría, sin tocar nada. El segundo emite el certificado (con un vhost temporal para el reto ACME), instala el vhost y las cabeceras de `deploy/`, recarga nginx y verifica el resultado.
   Para cambios posteriores en `deploy/`, volver a lanzarlo: se salta la emisión si el certificado ya existe.
3. **Comprobar a mano** (el script ya hace lo mismo desde el servidor):
   - `curl -sI https://reloj.edumind.es/` → 200 y cabecera CSP;
   - `curl -s https://reloj.edumind.es/healthz` → `reloj ok`;
   - `curl -sI https://reloj.edumind.es/package.json` → 404 (denegación por defecto);
   - abrir la app, instalarla y probar sin conexión.

La raíz es `/var/www/reloj/public`: el repo, las pruebas y `deploy/` quedan fuera de la web.
