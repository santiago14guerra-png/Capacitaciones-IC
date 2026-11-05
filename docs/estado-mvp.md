# Estado del MVP (noviembre 2026)

Las historias HU-01 a HU-25 y las tareas T-05, T-06 y T-08 están integradas en `develop`, cada una
en su rama `feature/HU-XX-…` o `chore/T-0X-…`. Todas tienen pruebas automáticas (`npm run check`)
y se recorrieron de punta a punta en local a 360 px y 1366 px.

Según la definición de terminado, una historia pasa a «Hecho» cuando además: la revisa otro
integrante, se despliega en `dev` y el responsable de producto la aprueba con evidencia. Por eso
los issues siguen abiertos.

## Pendiente de la empresa (marcado `[PENDIENTE: …]` en el sitio)

No se inventaron datos: se muestran como marcadores hasta que la empresa los entregue. Los de
contacto, tarifas y banco se configuran en `infra/cdk.json` → `negocio`, sin tocar código.

| Dato                                                                                            | Dónde aparece                 | Cómo se completa                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Correo y WhatsApp institucionales                                                               | Pie de página, catálogo       | `CONTACTO_CORREO`, `CONTACTO_WHATSAPP` (número internacional, solo dígitos)                                                                                                                                        |
| Banco, tipo y número de cuenta, titular                                                         | Instrucciones de pago (HU-11) | `BANCO_*`                                                                                                                                                                                                          |
| Tarifas de consulta rápida y asesoría                                                           | Página de tarifas (HU-24)     | `TARIFA_*`                                                                                                                                                                                                         |
| Criterio detallado consulta / asesoría (objetivo 4)                                             | Página de tarifas             | Texto en `web/src/paginas/Tarifas.tsx`                                                                                                                                                                             |
| Razón social, NIT, dirección, plazos de conservación, política de devoluciones, responsabilidad | Política y términos (HU-25)   | Texto final del **abogado**; luego cambiar `VERSION_POLITICA_DATOS`                                                                                                                                                |
| Plantilla de importación de Siigo y código de producto                                          | Excel de HU-19                | Validar con la directora y ajustar `exportacion-siigo.ts`                                                                                                                                                          |
| Categorías iniciales                                                                            | HU-07                         | Propuesta del equipo; se editan desde el panel                                                                                                                                                                     |
| Manual de marca                                                                                 | Colores y tipografía          | Identidad sobria provisional («libro mayor»): verde contable `#1e4d3c`, campo `#16302a`, papel `#f3f3f0`; Source Serif 4 en títulos y Albert Sans en texto. Se cambian en los tokens de `web/src/estilos/base.css` |
| Fichas reales (T-07)                                                                            | Catálogo                      | Se cargan desde el panel                                                                                                                                                                                           |

## Seguridad

El estado de la auditoría de noviembre de 2026 y lo que falta decidir están en
[seguridad.md](seguridad.md).

## Antes del primer despliegue (SG)

1. `cdk bootstrap` y pila `IcGithubOidc`; variable `AWS_ROLE_ARN` en GitHub (ver `infra/README.md`).
2. `npm run sembrar --workspace api -- <NombreTabla>` para las categorías.
3. `npm run crear-personal --workspace api -- <UserPoolId> <correo> administrador|director`.
4. Verificar el dominio en SES con DKIM y salir del sandbox (HU-18), luego desplegar con
   `dominioSes` y `correoRemitente`.
5. **No publicar en producción** hasta el aval del abogado sobre política y términos (Acta 002).

## Decisiones tomadas durante el desarrollo

- El token de acceso de Cognito no trae el correo: la API lo consulta con `AdminGetUser` solo al
  crear el perfil (puerto `DirectorioUsuarios`) y desde ahí usa el del perfil.
- La autorización de datos se exige al crear el perfil y no al editarlo; se guarda fecha y versión.
- Quitar la publicación a una ficha que ya se publicó la deja «Despublicada», no «Borrador»,
  para que quienes la compraron la conserven.
- Tras un pago rechazado, el cliente puede volver a comprar con una referencia nueva.
- El cliente nunca ve un borrador de respuesta: solo con la consulta respondida o cerrada.
- La reescritura de CloudFront solo envía a S3 las rutas con extensión de archivo conocida
  (las compras tienen un punto en su identificador).
