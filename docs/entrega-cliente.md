# Entrega a Capacitaciones IC

Inventario de lo que el equipo entrega a la empresa al cierre del curso y de lo que falta para
operar en producción.

## Qué se entrega

| Artefacto                                                     | Dónde                                         |
| ------------------------------------------------------------- | --------------------------------------------- |
| Código fuente completo (sitio, API e infraestructura)         | Este repositorio                              |
| Backlog: 8 épicas, 33 historias y tareas técnicas, por sprint | Issues y milestones del repositorio           |
| Arquitectura y decisiones técnicas                            | `docs/arquitectura.md`, `docs/adr/`           |
| Modelo de datos                                               | `docs/modelo-datos.md`                        |
| Comparación con la especificación de la entrega 2             | `docs/especificacion-entrega2.md`             |
| Seguridad: auditoría y pendientes                             | `docs/seguridad.md`                           |
| Manual de uso para clientes y personal                        | `docs/manual-usuario.md`                      |
| Guía para desplegar y activar producción                      | `infra/README.md`                             |
| Datos que la empresa debe completar                           | `docs/estado-mvp.md`                          |
| Videotutorial y capturas                                      | Se generan con `npm run demo --workspace e2e` |

## Traspaso de propiedad

1. **Repositorio.** Transferirlo a una cuenta u organización de GitHub de la empresa
   (Settings → Transfer ownership), o dar a la empresa permiso de administración.
2. **Cuenta de AWS.** Debe estar a nombre de la empresa (T-02): plan pago, MFA en el usuario
   raíz, IAM Identity Center para el equipo y presupuesto `IcCuenta`. Al cerrar el curso se
   retiran los accesos de los estudiantes.
3. **Dominio.** Sigue en Squarespace hasta la salida a producción. Antes de mover el DNS a
   Route 53 se copian los registros MX, SPF y DKIM del correo.
4. **Variables de GitHub.** `AWS_ROLE_ARN`, `AWS_REGION` y, para producción,
   `PROD_HABILITADO`. Ninguna es secreta: el despliegue no guarda llaves de AWS.

## Antes de abrir el servicio al público

- Aval del abogado sobre la política de tratamiento de datos y los términos (Acta 002).
- Datos bancarios, tarifas, contacto y fichas reales (`docs/estado-mvp.md`).
- Plantilla de importación de Siigo validada con la directora.
- MFA para las cuentas de administración y director (`docs/seguridad.md`).
- Dominio verificado en SES y fuera del sandbox para enviar correos.

## Costo de operación

La estimación de la entrega 2 es de USD 0,75 al mes después de los créditos, para 2.000 visitas,
120 consultas y 150 compras mensuales. El presupuesto `IcCuenta` avisa por correo al superar USD 1
y USD 5.
