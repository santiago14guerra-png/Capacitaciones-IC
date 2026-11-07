# Manual de uso de «Respuestas para Personas Naturales»

Guía para el personal de Capacitaciones IC y para explicar el servicio a los clientes. Las
capturas y el video se generan con `npm run demo --workspace e2e` (ver «Recorrido grabado»).

## Clientes

| Quiero…                   | Dónde                                   | Cómo                                                                                                                                           |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Buscar una respuesta      | Inicio o **Catálogo**                   | Escriba la duda con sus palabras. No importan las tildes ni las mayúsculas. También puede filtrar por tema.                                    |
| Ver si una ficha me sirve | Detalle de la ficha                     | La pregunta, el resumen y las normas son gratis. La respuesta completa se ve después de pagar.                                                 |
| Crear mi cuenta           | **Crear cuenta**                        | Llene sus datos de facturación una sola vez, autorice el tratamiento de datos y escriba el código que llega al correo.                         |
| Comprar una respuesta     | Detalle → **Comprar por transferencia** | Transfiera el valor exacto, ponga la **referencia** (RPN-…) en la descripción y adjunte el comprobante (JPG, PNG o PDF de hasta 5 MB).         |
| Leer lo que compré        | **Mi cuenta → Mi biblioteca**           | Cuando la empresa verifica el pago, le llega un correo y la respuesta queda allí.                                                              |
| Preguntar algo nuevo      | **Consultar**                           | Elija el tema y escriba el asunto. Si aparece una ficha que lo resuelve, puede abrirla; si no, envíe la consulta y guarde el radicado (RAD-…). |
| Saber cómo va mi consulta | **Mi cuenta → Mis consultas**           | Allí ve el estado y la respuesta. Si se escaló a asesoría, también las condiciones.                                                            |
| Cambiar mis datos         | **Mi cuenta → Mi perfil**               | Actualice dirección, celular o datos de facturación.                                                                                           |
| Recuperar la contraseña   | **Ingresar → Olvidé mi contraseña**     | Le llega un código al correo.                                                                                                                  |

## Directora administrativa (grupo `administrador`)

1. **Pagos.** En **Panel → Pagos → Por verificar** abra el comprobante y compárelo con la banca en
   línea (valor y referencia). Pulse **Aprobar** o **Rechazar** con un motivo. El cliente recibe
   un correo y, si se aprueba, el acceso queda abierto en ese momento.
2. **Facturación.** En **Panel → Exportar a Siigo** elija el periodo y descargue el Excel (hojas
   «Ventas» y «Terceros») para importarlo en Siigo. El formato es provisional hasta validarlo
   con la plantilla de importación de Siigo.
3. **Indicadores.** **Panel → Indicadores** muestra consultas recibidas, tiempo de respuesta,
   ventas, autoservicio, consultas con cobro, temas y búsquedas sin resultado. Las búsquedas sin
   resultado indican qué fichas conviene escribir.
4. **Categorías.** **Panel → Categorías** permite crear, renombrar, ordenar y desactivar temas.
   El orden del panel es el que ve el público.

## Director técnico (grupo `director`)

1. **Fichas.** En **Panel → Fichas → Nueva ficha** escriba un título como lo preguntaría un
   cliente, la pregunta (sin datos personales), un resumen de hasta 300 caracteres, la respuesta
   completa, las normas, las etiquetas y el precio. Use **Vista previa** antes de publicar. Una
   ficha publicada se puede despublicar; quienes la compraron la conservan.
2. **Consultas.** En **Panel → Consultas** las de más de 48 horas aparecen resaltadas. Abra la
   consulta, clasifíquela como **Consulta rápida** o **Asesoría**, cambie el estado y escriba la
   respuesta. El cliente recibe un correo con un enlace, sin el contenido de la respuesta.
3. **Reutilizar.** En una consulta respondida, **Convertir en ficha** crea un borrador
   anonimizado. Revíselo antes de publicar: la anonimización es automática y puede dejar datos.

## Cuentas del personal

Las cuentas de administración no se crean desde el sitio. Se crean con
`npm run crear-personal --workspace api -- <UserPoolId> <correo> administrador|director`
(ver `infra/README.md`). La persona recibe una contraseña temporal y la cambia al primer ingreso.

## Recorrido grabado

`npm run demo --workspace e2e` levanta la app en local, crea datos de demostración y graba el
flujo completo (visitante, cliente, administradora y director). Deja en `e2e/demo/salida` el
video `recorrido.webm` y 19 capturas. Para convertir el video a MP4:

```bash
ffmpeg -i e2e/demo/salida/recorrido.webm -c:v libx264 -crf 26 -pix_fmt yuv420p recorrido.mp4
```
