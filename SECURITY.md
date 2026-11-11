# Política de seguridad

## Cómo informar de un fallo

**No abras un issue público.** Escribe a **contacto@edumind.es** con el asunto `[Seguridad]`.

También puedes usar el aviso privado de GitHub: pestaña **Security → Report a vulnerability** de este repositorio.

Incluye, en la medida en que puedas: qué has encontrado, cómo reproducirlo, qué impacto crees que tiene y en qué versión o URL lo has visto.

## Qué puedes esperar

| | |
|---|---|
| Acuse de recibo | en 72 horas |
| Primera valoración | en 7 días naturales |
| Corrección de fallos graves | lo antes posible, con aviso a quien informó antes de publicarla |

Este proyecto lo mantiene una sola persona compaginándolo con la docencia. Los plazos son compromisos de buena fe, no un SLA contractual. Si un aviso queda sin respuesta, insiste: se habrá perdido, no ignorado.

## Divulgación responsable

Te pedimos que no hagas público el fallo hasta que exista una corrección o hayan pasado 90 días desde el aviso. A cambio, se te acredita en las notas de la versión salvo que prefieras el anonimato.

No hay programa de recompensas: es un proyecto educativo sin financiación.

## Datos de alumnado

Si el fallo expone datos personales de menores, **dilo en la primera línea del correo**. Esos avisos se tratan como prioridad absoluta y por delante de cualquier otra consideración.

Nunca incluyas datos reales de alumnado en el aviso, ni siquiera como prueba del fallo: descríbelo, no lo adjuntes.

## Alcance

Reloj EDUmind es una aplicación web estática *local first*: no tiene servidor de aplicación, cuentas, base de datos ni secretos, y no hace peticiones de red. Los datos (ajustes, planes y sesiones) solo viven en el navegador de cada dispositivo.

Interesan especialmente los fallos que permitan ejecutar código a través de un fichero importado, saltarse la política de seguridad de contenidos (CSP o Trusted Types) o hacer que la app envíe datos fuera del dispositivo.

Si despliegas un fork, sirve `public/` con las cabeceras de `deploy/reloj-security-headers.inc` (o equivalentes).
