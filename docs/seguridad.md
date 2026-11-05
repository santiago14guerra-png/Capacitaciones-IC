# Seguridad: seguimiento de la auditoría de noviembre de 2026

La auditoría revisó solo el código, en el commit `2b3017f`. No encontró hallazgos confirmados;
dejó cinco pendientes de validación y una lista de endurecimiento. Este es su estado.

## Pendientes de validación

| #   | Tema                                  | Estado                 | Qué se hizo                                                                                                                                                                                    |
| --- | ------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dependencias con permiso OIDC         | Corregido en el código | `npm ci`, build y synth corren en un job sin OIDC. El job de despliegue instala con `--ignore-scripts` y despliega el ensamblado ya sintetizado. Falta la protección de `develop` (ver abajo). |
| 2   | Comprobante reemplazable              | Corregido              | Bucket versionado. Al confirmar se guarda la versión de S3, y quien revisa descarga esa versión aunque se reutilice la URL.                                                                    |
| 3   | API sin WAF, límite compartido        | **Decisión pendiente** | `cdk synth` confirma que el límite (20 por segundo, ráfaga de 50) se aplica a la etapa `$default` y es compartido. Sigue sin WAF y la API sigue accesible sin pasar por CloudFront.            |
| 4   | Búsqueda anónima escribe por petición | Mitigado               | Máximo 30 registros por minuto por instancia de la API. Si se supera, la búsqueda responde igual, pero esa búsqueda no cuenta en los indicadores.                                              |
| 5   | Adjuntos sin cuota ni vencimiento     | Corregido              | 20 URL de subida por cuenta al día (comprobantes y adjuntos; responde 429). Lo no confirmado se borra a los 7 días.                                                                            |

## Endurecimiento

| #   | Tema                                           | Estado                                                                                                                                             |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | MFA para personal                              | **Pendiente.** Necesita pantallas de inscripción y de código, y probarse contra Cognito real                                                       |
| 2   | Token de actualización en `localStorage`       | Sin cambios; mitigado por CSP y DOMPurify                                                                                                          |
| 3   | Transporte de desarrollo en el paquete web     | Corregido: el build de producción no lo incluye                                                                                                    |
| 4   | CSP                                            | `connect-src` limitado a Cognito y S3 de la región. `style-src 'unsafe-inline'` sigue                                                              |
| 5   | CORS con `localhost` en el bucket              | Corregido; en local se usa `almacen-local`                                                                                                         |
| 6   | Disparador con `userpool/*`                    | Corregido: solo el grupo de usuarios de la pila                                                                                                    |
| 7   | Acciones por etiqueta                          | Corregido: fijadas por SHA                                                                                                                         |
| 8   | `innerHTML` sin sanear en el editor            | Corregido                                                                                                                                          |
| 9   | Código de restablecimiento en la URL           | Sin cambios; es parte de HU-22                                                                                                                     |
| 10  | Nombre de usuario sin escapar en la plantilla  | No aplica en el disparador: Cognito entrega un marcador y pone el valor después                                                                    |
| 11  | Revisión de datos personales antes de publicar | Sin cambios; proceso del director                                                                                                                  |
| 12  | Categorías sin escritura condicional           | Sin cambios; riesgo menor                                                                                                                          |
| 13  | Contraseña y `USER_PASSWORD_AUTH`              | Sin cambios; la política viene de HU-02                                                                                                            |
| 14  | Token de acceso vigente 15 minutos tras salir  | Aceptado: es la vigencia del ADR 0004                                                                                                              |
| 15  | `npm audit`                                    | Ejecutado: 13 avisos moderados, 4 en dependencias de ejecución (`uuid` vía `exceljs` y `minimatch` vía `aws-cdk-lib`). Sin corrección que no rompa |
| 16  | Retención de comprobantes y adjuntos           | **Pendiente**: decisión de negocio y legal                                                                                                         |

## Decisiones y tareas de los dueños

1. **Proteger `develop` en GitHub** con revisión obligatoria y `CI` en verde. Desplegar depende de ello.
2. **WAF u origen privado para la API.** Tiene costo fijo mensual, por lo que requiere una decisión.
3. **MFA para administrador y director** antes de cargar datos reales.
4. **Plazo de retención** de comprobantes y adjuntos, con el abogado.

Limitación conocida: un cliente puede confirmar otro comprobante mientras su pago sigue en
verificación. Quien aprueba ve el último confirmado al descargar; si el cliente lo cambia entre
la descarga y la decisión, la aprobación no lo detecta.

Comportamiento en S3 sin probar: las pruebas usan `almacen-local`. La primera subida en `dev`
debe confirmar la etiqueta, el borrado de la etiqueta y la descarga por versión.
