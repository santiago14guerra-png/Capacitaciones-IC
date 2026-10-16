# Historias de usuario — Respuestas para Personas Naturales

Proyecto **Capacitaciones IC** · Sistemas de Información · Universidad EAFIT · Metodología **Scrum**

- **Producto:** plataforma web que convierte las consultas tributarias resueltas por los directores en fichas de respuesta reutilizables y vendibles, y formaliza la recepción y el cobro de nuevas consultas.
- **Backlog:** 8 épicas · 33 historias de usuario · 7 tareas técnicas.
- **Sprints:** de dos semanas; capacidad estimada del equipo de 30 a 35 puntos por sprint.
- **Sprint activo:** **Sprint 1 (12 – 25 oct 2026)** — todas sus historias están **En progreso**.

## Equipo

| Integrante | Alias | Foco principal |
|---|---|---|
| Santiago Guerra Vásquez | SG | Autenticación, roles e infraestructura base |
| Juan Felipe Gallón Maldonado | JFG | Panel de administración y gestión de contenidos |
| Miguel Muñoz Jiménez | MM | Catálogo, búsqueda y modelo de datos |
| Simón Madrid Noreña | SM | Interfaz pública, formularios y pruebas |

## Índice de talla (esfuerzo / dificultad)

El esfuerzo se estima en puntos de historia (serie de Fibonacci) con planning poker y se traduce a una talla para leerlo de un vistazo.

| Talla | Puntos | Significado | Ejemplo |
|---|---|---|---|
| **S** | 2 | Cambio acotado, un solo componente, sin incertidumbre técnica. | HU-04 Acceso al panel |
| **M** | 3 | Funcionalidad completa pero conocida, pocas reglas de negocio. | HU-01 Página de inicio |
| **L** | 5 | Varias reglas de validación o integración con servicios de AWS; requiere pruebas cuidadosas. | HU-09 Búsqueda |
| **XL** | 8 | Integración externa o diseño nuevo con riesgo técnico; conviene dividirla. | HU-27 Pasarela de pagos |
| **XXL** | 13 | Producto en sí mismo; debe descomponerse antes de entrar a un sprint. | HU-31 Herramienta de renta |

**Prioridad (MoSCoW):** Must = imprescindible para el MVP · Should = importante, no bloquea · Could = deseable · Won't = fuera de alcance por ahora.

## Resumen del backlog

| ID | Historia | Épica | Prioridad | Pts | Talla | Sprint | Responsables | Estado |
|---|---|---|---|---|---|---|---|---|
| HU-01 | Página de inicio y propuesta de valor | EP2 | Must | 3 | M | S1 | SM, JFG | 🟡 En progreso |
| HU-02 | Registro con datos de facturación | EP1 | Must | 5 | L | S1 | SG, SM | 🟡 En progreso |
| HU-03 | Inicio y cierre de sesión | EP1 | Must | 3 | M | S1 | SG, MM | 🟡 En progreso |
| HU-04 | Acceso al panel con rol administrador | EP1 | Must | 2 | S | S1 | SG, JFG | 🟡 En progreso |
| HU-05 | Crear ficha de respuesta | EP3 | Must | 5 | L | S1 | JFG, MM | 🟡 En progreso |
| HU-06 | Editar y despublicar fichas | EP3 | Must | 3 | M | S1 | JFG, SM | 🟡 En progreso |
| HU-07 | Gestionar categorías temáticas | EP3 | Should | 2 | S | S1 | JFG, MM | 🟡 En progreso |
| HU-08 | Explorar catálogo por categoría | EP2 | Must | 3 | M | S1 | MM, SM | 🟡 En progreso |
| HU-09 | Buscar respuestas por palabra clave | EP2 | Must | 5 | L | S1 | MM, SM | 🟡 En progreso |
| HU-10 | Ver detalle de ficha con vista previa | EP2 | Must | 3 | M | S1 | SM, MM | 🟡 En progreso |
| HU-11 | Solicitar compra con instrucciones de transferencia | EP4 | Must | 5 | L | S2 | SG, MM | ⚪ Por hacer |
| HU-12 | Cargar comprobante de pago | EP4 | Must | 3 | M | S2 | SG, SM | ⚪ Por hacer |
| HU-13 | Verificar o rechazar pagos | EP4 | Must | 5 | L | S2 | JFG, SM | ⚪ Por hacer |
| HU-14 | Mi biblioteca de fichas | EP4 | Must | 3 | M | S2 | MM, SG | ⚪ Por hacer |
| HU-15 | Enviar consulta nueva estructurada | EP5 | Must | 5 | L | S2 | SM, MM | ⚪ Por hacer |
| HU-16 | Bandeja de consultas con estados | EP5 | Must | 5 | L | S2 | JFG, MM | ⚪ Por hacer |
| HU-17 | Seguimiento de mis consultas | EP5 | Should | 3 | M | S2 | SM, JFG | ⚪ Por hacer |
| HU-18 | Notificaciones por correo | EP5 | Should | 3 | M | S2 | SG, JFG | ⚪ Por hacer |
| HU-19 | Exportar datos de facturación para Siigo | EP6 | Must | 3 | M | S3 | JFG, SG | ⚪ Por hacer |
| HU-20 | Convertir una respuesta en ficha | EP7 | Must | 3 | M | S3 | MM, JFG | ⚪ Por hacer |
| HU-21 | Panel de indicadores | EP7 | Should | 5 | L | S3 | MM, JFG | ⚪ Por hacer |
| HU-22 | Recuperar contraseña | EP1 | Should | 3 | M | S3 | SG, SM | ⚪ Por hacer |
| HU-23 | Editar mi perfil y datos de facturación | EP1 | Should | 2 | S | S3 | SM, SG | ⚪ Por hacer |
| HU-24 | Página de tarifas y alcance del servicio | EP5 | Should | 2 | S | S3 | SM, JFG | ⚪ Por hacer |
| HU-25 | Política de tratamiento de datos y términos | EP1 | Must | 2 | S | S3 | SG, JFG | ⚪ Por hacer |
| HU-26 | Suscripción mensual o anual | EP8 | Could | 8 | XL | Post | — | 📋 Backlog |
| HU-27 | Pago en línea con pasarela (PSE / tarjeta) | EP8 | Could | 8 | XL | Post | — | 📋 Backlog |
| HU-28 | Factura electrónica automática vía API de Siigo | EP8 | Could | 8 | XL | Post | — | 📋 Backlog |
| HU-29 | Indicadores económicos en el sitio | EP8 | Could | 3 | M | Post | — | 📋 Backlog |
| HU-30 | Agenda de seminarios e inscripción | EP8 | Could | 5 | L | Post | — | 📋 Backlog |
| HU-31 | Herramienta en línea de declaración de renta | EP8 | Won't | 13 | XXL | Post | — | 📋 Backlog |
| HU-32 | Boletín de novedades normativas | EP8 | Could | 5 | L | Post | — | 📋 Backlog |
| HU-33 | Registro e inicio con Google | EP8 | Could | 3 | M | Post | — | 📋 Backlog |

### Carga por sprint

| Sprint | Fechas | Objetivo | Puntos | Historias |
|---|---|---|---|---|
| Sprint 1 | 12 – 25 oct | El equipo de IC puede cargar respuestas y cualquier persona puede encontrarlas, registrarse e iniciar sesión. | 34 | HU-01 a HU-10 |
| Sprint 2 | 26 oct – 8 nov | El cliente paga por transferencia, recibe acceso y envía consultas nuevas por un canal trazable. | 32 | HU-11 a HU-18 |
| Sprint 3 | 9 – 22 nov | MVP listo para piloto: exportación a Siigo, indicadores, ajustes legales y pruebas con usuarios. | 20 | HU-19 a HU-25 |

### Carga por integrante en el Sprint 1

| Integrante | Principal en | Apoya en | Puntos como principal |
|---|---|---|---|
| SG | HU-02, HU-03, HU-04 | — | 10 |
| JFG | HU-05, HU-06, HU-07 | HU-01, HU-04 | 10 |
| MM | HU-08, HU-09 | HU-03, HU-05, HU-07, HU-10 | 8 |
| SM | HU-01, HU-10 | HU-02, HU-06, HU-08, HU-09 | 6 |

Cada historia la trabajan **dos integrantes juntos** (sin dividirla en partes): el primero responde por ella y el segundo la co-desarrolla y revisa el pull request.

## Definición de terminado

Una historia está terminada cuando:

1. Cumple todos sus criterios de aceptación y el responsable de producto la aprueba en la revisión del sprint.
2. El código está integrado en la rama principal mediante un pull request revisado por otro integrante.
3. Está desplegada por el pipeline en el ambiente `dev` de AWS y funciona con HTTPS en celular y en escritorio.
4. No expone datos personales ni contenido pago a usuarios sin permiso.
5. El tablero la muestra en «Hecho» con evidencia (captura o video corto).

---

# Sprint 1 — En progreso (12 – 25 oct 2026)

**Objetivo:** el equipo de IC puede cargar respuestas y cualquier persona puede encontrarlas, registrarse e iniciar sesión. Los criterios están en formato Dado / Cuando / Entonces o como reglas verificables, de modo que cada uno pueda convertirse en un caso de prueba.

## HU-01 · Página de inicio y propuesta de valor

> **Como** visitante, **quiero** entender en la página de inicio qué ofrece el servicio y cómo funciona, **para** decidir si me sirve antes de registrarme.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP2 | Must | 3 | **M** | SM (principal), JFG | 🟡 En progreso | Figura 2 |

**Criterios de aceptación**
- **CA1.** Dado que ingreso al dominio, cuando carga la página, entonces veo el nombre del servicio, una frase de propuesta de valor y el buscador sin necesidad de desplazarme.
- **CA2.** Se muestra la sección «Cómo funciona» con tres pasos: buscar la respuesta, adquirirla y, si no existe, enviar la consulta.
- **CA3.** Se muestran las categorías activas; al hacer clic en una, se abre el catálogo filtrado por esa categoría.
- **CA4.** Se muestran las seis fichas publicadas más recientes con título, resumen y precio.
- **CA5.** El pie de página incluye correo institucional, enlace de WhatsApp y enlace a la política de tratamiento de datos.
- **CA6.** La página se visualiza sin desplazamiento horizontal en celular (360 px de ancho) y en escritorio (1366 px).

## HU-02 · Registro con datos de facturación

> **Como** persona natural, **quiero** crear una cuenta con mis datos personales y de facturación una sola vez, **para** no tener que enviarlos por WhatsApp cada vez que compre un servicio.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP1 | Must | 5 | **L** | SG (principal), SM | 🟡 En progreso | Figura 5 |

**Criterios de aceptación**
- **CA1.** El formulario solicita: nombres y apellidos, tipo de documento (CC, CE, NIT, pasaporte), número de documento, correo, celular, dirección, ciudad, contraseña y confirmación; todos son obligatorios.
- **CA2.** Dado un correo ya registrado, cuando envío el formulario, entonces veo «Este correo ya tiene una cuenta» con enlace a iniciar sesión, y no se crea una cuenta duplicada.
- **CA3.** Se valida el formato del correo, que el número de documento contenga solo dígitos (excepto pasaporte), que la contraseña tenga mínimo 8 caracteres con al menos una letra y un número, y que ambas contraseñas coincidan; cada error aparece junto al campo correspondiente.
- **CA4.** La casilla de autorización de tratamiento de datos personales (Ley 1581 de 2012) es obligatoria y enlaza a la política; sin marcarla el botón «Crear cuenta» permanece deshabilitado. Se guarda la fecha y hora de la autorización.
- **CA5.** La contraseña la gestiona Amazon Cognito con la política mínima definida; nunca se guarda en la base de datos de la aplicación ni aparece en los registros (logs).
- **CA6.** Dado un registro exitoso, entonces recibo en mi correo un código de verificación; al ingresarlo, la cuenta queda activa en el grupo «cliente» de Cognito, mis datos de facturación quedan guardados en mi perfil, la sesión se inicia y vuelvo a la página desde la que llegué.

## HU-03 · Inicio y cierre de sesión

> **Como** cliente registrado, **quiero** iniciar y cerrar sesión con mi correo y contraseña, **para** acceder a mi cuenta de forma segura.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP1 | Must | 3 | **M** | SG (principal), MM | 🟡 En progreso | Figura 6 |

**Criterios de aceptación**
- **CA1.** Dado que ingreso correo y contraseña válidos, cuando presiono «Ingresar», entonces accedo y veo mi nombre en el encabezado.
- **CA2.** Dado que alguno de los datos es incorrecto, entonces veo el mensaje genérico «Correo o contraseña incorrectos», sin indicar cuál de los dos falló.
- **CA3.** Tras intentos fallidos consecutivos se aplica el bloqueo temporal progresivo de Cognito (desde el quinto intento y hasta 15 minutos) y se informa al usuario que debe esperar.
- **CA4.** Cuando presiono «Cerrar sesión», la sesión se invalida en el servidor; si uso el botón «Atrás» del navegador no puedo ver páginas privadas.
- **CA5.** La sesión dura como máximo 8 horas (vigencia del token de actualización configurada en Cognito); después se pide ingresar de nuevo.
- **CA6.** Todo el sitio y la API se sirven por HTTPS; CloudFront redirige cualquier petición HTTP a HTTPS.

## HU-04 · Acceso al panel con rol administrador

> **Como** directora administrativa, **quiero** ingresar a un panel de administración protegido, **para** gestionar la plataforma sin que los clientes puedan entrar a él.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP1 | Must | 2 | **S** | SG (principal), JFG | 🟡 En progreso | Figura 7 |

**Criterios de aceptación**
- **CA1.** Dado que inicio sesión con una cuenta de los grupos «administrador» o «director» de Cognito, entonces veo el enlace «Panel» en el encabezado; con el grupo «cliente» no aparece.
- **CA2.** Dado un visitante o cliente que abre una URL del panel o llama directamente una ruta `/admin` de la API, entonces la API responde 401 o 403 según el token y no entrega ningún dato (la verificación de grupo se hace en el servidor, no solo en la interfaz).
- **CA3.** Las cuentas de administrador y director solo las crea otro administrador (consola de Cognito o script de carga inicial); el registro público siempre asigna el grupo «cliente».
- **CA4.** Cada acción en rutas `/admin` queda registrada en CloudWatch con usuario, fecha, hora y ruta, sin datos personales del cliente.

## HU-05 · Crear ficha de respuesta

> **Como** director técnico, **quiero** crear una ficha con la pregunta, el resumen, la respuesta completa y la norma que la sustenta, **para** convertir una consulta ya resuelta en un activo reutilizable.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP3 | Must | 5 | **L** | JFG (principal), MM | 🟡 En progreso | Figura 8 |

**Criterios de aceptación**
- **CA1.** El formulario de ficha incluye: título (máx. 120 caracteres), pregunta del caso, resumen público (máx. 300 caracteres), respuesta completa (editor con negrita, listas y enlaces), categoría, etiquetas, normas de referencia, precio en COP y estado (Borrador / Publicada).
- **CA2.** Para guardar como «Publicada» son obligatorios título, pregunta, resumen, respuesta completa, categoría y precio; un «Borrador» puede guardarse incompleto.
- **CA3.** El precio acepta enteros mayores o iguales a 0; precio 0 significa ficha gratuita para usuarios con sesión iniciada.
- **CA4.** Dado que guardo una ficha como «Publicada», entonces aparece en el catálogo y en la búsqueda; si la guardo como «Borrador», ningún cliente puede verla.
- **CA5.** El sistema registra autor, fecha de creación y fecha de última actualización.
- **CA6.** El botón «Vista previa» muestra la ficha tal como la verá el cliente antes de publicarla.

## HU-06 · Editar y despublicar fichas

> **Como** directora administrativa, **quiero** editar o despublicar una ficha existente, **para** mantener las respuestas alineadas con la normativa vigente.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP3 | Must | 3 | **M** | JFG (principal), SM | 🟡 En progreso | Figura 7 |

**Criterios de aceptación**
- **CA1.** El panel lista las fichas con título, categoría, estado, precio y fecha de actualización, con filtro por estado y búsqueda por título.
- **CA2.** Dado que edito y guardo una ficha publicada, entonces la fecha «Vigente a» que ve el cliente se actualiza automáticamente.
- **CA3.** Dado que despublico una ficha, entonces deja de aparecer en el catálogo y en la búsqueda, pero no se elimina de la base de datos (se conserva para quienes ya la adquirieron).
- **CA4.** Solo los borradores que nunca se publicaron pueden eliminarse definitivamente, previa confirmación.

## HU-07 · Gestionar categorías temáticas

> **Como** directora administrativa, **quiero** crear y ordenar las categorías temáticas del catálogo, **para** que las fichas queden organizadas como los clientes las buscan.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP3 | Should | 2 | **S** | JFG (principal), MM | 🟡 En progreso | Figuras 7 y 8 |

**Criterios de aceptación**
- **CA1.** Puedo crear, renombrar, ordenar y desactivar categorías desde el panel.
- **CA2.** Dado que intento desactivar una categoría con fichas publicadas, entonces el sistema me informa cuántas fichas tiene y me pide reasignarlas antes de continuar.
- **CA3.** El sistema se entrega con la carga inicial de categorías acordada con la directora (propuesta: Arrendamientos, Pensionados, Asalariados e independientes, Sucesiones y herencias, Patrimonio y bienes, Declaración de renta, Obligaciones con la DIAN).
- **CA4.** El orden definido en el panel es el mismo en que aparecen las categorías en la página de inicio y en el catálogo.

## HU-08 · Explorar catálogo por categoría

> **Como** visitante, **quiero** ver el catálogo de respuestas filtrado por categoría, **para** encontrar casos parecidos al mío.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP2 | Must | 3 | **M** | MM (principal), SM | 🟡 En progreso | Figura 3 |

**Criterios de aceptación**
- **CA1.** El catálogo muestra solo fichas publicadas, en tarjetas con título, resumen, categoría, etiquetas, precio y fecha «Vigente a».
- **CA2.** Puedo filtrar por una o varias categorías y ordenar por «Más recientes» o por «Precio».
- **CA3.** Se muestran 12 fichas por página con paginación.
- **CA4.** Dado que un filtro no arroja resultados, entonces veo un mensaje y la opción de contactar a la empresa (en el Sprint 2 se reemplaza por «Enviar mi consulta»).
- **CA5.** El catálogo es accesible sin iniciar sesión.

## HU-09 · Buscar respuestas por palabra clave

> **Como** visitante, **quiero** buscar respuestas escribiendo mi duda con mis propias palabras, **para** no tener que escribirle a los directores si la respuesta ya existe.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP2 | Must | 5 | **L** | MM (principal), SM | 🟡 En progreso | Figuras 2 y 3 |

**Criterios de aceptación**
- **CA1.** La búsqueda considera título, pregunta, resumen y etiquetas de las fichas publicadas.
- **CA2.** La búsqueda no distingue mayúsculas ni tildes: «pension» encuentra «Pensión».
- **CA3.** Los resultados se ordenan por relevancia y el término buscado aparece resaltado.
- **CA4.** Si escribo menos de 3 caracteres, no se ejecuta la búsqueda y se muestra una indicación.
- **CA5.** Cada búsqueda queda registrada (término, fecha y número de resultados) para identificar temas sin respuesta (insumo del objetivo 6).
- **CA6.** Con 500 fichas cargadas, los resultados aparecen en menos de 2 segundos.

## HU-10 · Ver detalle de ficha con vista previa

> **Como** visitante, **quiero** ver la pregunta, el resumen y la norma de una ficha antes de pagarla, **para** saber si realmente resuelve mi caso.

| Épica | Prioridad | Puntos | Talla | Responsables | Estado | Mockup |
|---|---|---|---|---|---|---|
| EP2 | Must | 3 | **M** | SM (principal), MM | 🟡 En progreso | Figura 4 |

**Criterios de aceptación**
- **CA1.** La ficha muestra título, pregunta, resumen, categoría, etiquetas, normas de referencia, precio y fecha «Vigente a».
- **CA2.** Dado que no tengo acceso a la ficha, entonces la respuesta completa no se envía al navegador (no aparece en el código fuente ni en las peticiones) y en su lugar se muestra un bloque bloqueado.
- **CA3.** Dado que no he iniciado sesión, cuando presiono «Obtener respuesta», entonces se me lleva a iniciar sesión o registrarme y, al terminar, regreso a la misma ficha.
- **CA4.** Las fichas con precio 0 se muestran completas a cualquier usuario con sesión iniciada.
- **CA5.** Se muestran hasta tres fichas relacionadas de la misma categoría.
- **CA6.** Se muestra el aviso «Información de carácter general que no reemplaza una asesoría personalizada» con un enlace para solicitar asesoría.

## Tareas técnicas habilitadoras

| ID | Tarea | Sprint | Responsable | Estado |
|---|---|---|---|---|
| T-01 | Crear repositorio GitHub (monorepo `web` / `api` / `infra`) y tablero de Jira | Sprint 0 | SG | ✅ Hecho |
| T-02 | Crear la cuenta AWS a nombre de la empresa: plan pago con créditos, MFA en la raíz, IAM Identity Center para el equipo y alertas de AWS Budgets | Sprint 0 | SG | ✅ Hecho |
| T-03 | Diseñar mockups y validarlos con la directora (Acta 002) | Sprint 0 | SM | ✅ Hecho |
| T-04 | Diseñar el modelo de datos de DynamoDB (tabla única y patrones de acceso) | Sprint 1 | MM | 🟡 En progreso |
| T-05 | Infraestructura base con AWS CDK en ambiente `dev`: CloudFront, S3, Cognito, API Gateway, Lambda y DynamoDB | Sprint 1 | SG, MM | 🟡 En progreso |
| T-06 | Pipeline de GitHub Actions con OIDC: pruebas en cada pull request y despliegue automático a `dev` | Sprint 1 | JFG | 🟡 En progreso |
| T-07 | Cargar 15–20 fichas reales entregadas por la empresa | Sprint 1 | JFG, SM | 🟡 En progreso |

---

# Sprint 2 — Por hacer (26 oct – 8 nov 2026)

**Objetivo:** el cliente paga por transferencia, recibe acceso y envía consultas nuevas por un canal trazable. Los criterios son preliminares y se completarán en el refinamiento previo al sprint.

## HU-11 · Solicitar compra con instrucciones de transferencia

> **Como** cliente registrado, **quiero** solicitar la compra de una ficha y recibir los datos bancarios con una referencia única, **para** pagar por transferencia como acostumbro, sin pasarelas en las que no confío.

**EP4 · Must · 5 pts · Talla L · Responsables: SG (principal), MM · ⚪ Por hacer**

- Se genera una referencia única por compra (p. ej. `RPN-000123`).
- Se muestran banco, tipo y número de cuenta, titular, valor y referencia.
- La compra queda en estado «Pendiente de pago».

## HU-12 · Cargar comprobante de pago

> **Como** cliente registrado, **quiero** adjuntar el comprobante de mi transferencia en la plataforma, **para** no tener que enviarlo por WhatsApp y que quede asociado a mi compra.

**EP4 · Must · 3 pts · Talla M · Responsables: SG (principal), SM · ⚪ Por hacer**

- Acepta JPG, PNG o PDF de máximo 5 MB, controlado por la política de la URL prefirmada.
- El archivo se sube directo al bucket S3 privado con una URL válida 5 minutos; solo el cliente y los administradores pueden descargarlo.
- La compra cambia a «En verificación».

## HU-13 · Verificar o rechazar pagos

> **Como** directora administrativa, **quiero** ver en una sola bandeja los pagos pendientes con su comprobante y aprobarlos o rechazarlos, **para** habilitar el acceso sin buscar capturas en conversaciones.

**EP4 · Must · 5 pts · Talla L · Responsables: JFG (principal), SM · ⚪ Por hacer**

- La bandeja lista compras «En verificación» con cliente, ficha, valor, referencia y comprobante.
- Aprobar habilita el acceso de inmediato; rechazar exige un motivo que ve el cliente.
- Cada decisión registra usuario, fecha y hora.

## HU-14 · Mi biblioteca de fichas

> **Como** cliente registrado, **quiero** ver en mi cuenta todas las fichas que he adquirido, **para** volver a consultarlas cuando las necesite.

**EP4 · Must · 3 pts · Talla M · Responsables: MM (principal), SG · ⚪ Por hacer**

- Lista las fichas con acceso aprobado y su fecha de compra.
- Muestra el estado de las compras pendientes.
- Una ficha despublicada sigue disponible para quien la compró, con el aviso «En revisión».

## HU-15 · Enviar consulta nueva estructurada

> **Como** cliente registrado, **quiero** enviar una consulta que no encontré en el catálogo mediante un formulario guiado, **para** recibir una respuesta sin depender de un chat personal.

**EP5 · Must · 5 pts · Talla L · Responsables: SM (principal), MM · ⚪ Por hacer**

- Mientras escribo el asunto, se sugieren fichas existentes relacionadas.
- Campos: categoría, asunto, descripción y adjunto opcional (máx. 5 MB).
- Se asigna un número de radicado y la fecha de recepción.

## HU-16 · Bandeja de consultas con estados

> **Como** director técnico, **quiero** gestionar las consultas recibidas con estados y clasificarlas como consulta rápida o asesoría, **para** priorizar mi tiempo y no perder ninguna solicitud.

**EP5 · Must · 5 pts · Talla L · Responsables: JFG (principal), MM · ⚪ Por hacer**

- Estados: Recibida, En análisis, Respondida, Escalada a asesoría, Cerrada.
- Clasificación obligatoria: Consulta rápida o Asesoría.
- Filtro por estado, categoría y antigüedad; se resaltan las de más de 48 horas.

## HU-17 · Seguimiento de mis consultas

> **Como** cliente registrado, **quiero** ver el estado y la respuesta de mis consultas en mi cuenta, **para** saber cuándo tendré respuesta sin preguntar por WhatsApp.

**EP5 · Should · 3 pts · Talla M · Responsables: SM (principal), JFG · ⚪ Por hacer**

- El cliente ve sus consultas con radicado, estado y fecha.
- La respuesta se muestra dentro de la plataforma.
- Si fue escalada, ve las condiciones de la asesoría.

## HU-18 · Notificaciones por correo

> **Como** cliente registrado, **quiero** recibir un correo cuando mi pago sea verificado o mi consulta sea respondida, **para** enterarme sin tener que entrar a revisar.

**EP5 · Should · 3 pts · Talla M · Responsables: SG (principal), JFG · ⚪ Por hacer**

- Se envía correo (Amazon SES) al verificar o rechazar un pago y al responder una consulta.
- El correo no incluye el contenido de la respuesta, solo un enlace a la plataforma.
- Se envía desde el dominio institucional verificado en SES (DKIM), fuera del modo sandbox.

---

# Sprint 3 — Por hacer (9 – 22 nov 2026)

**Objetivo:** MVP listo para piloto. Los criterios de aceptación se redactarán en el refinamiento previo al sprint.

## HU-19 · Exportar datos de facturación para Siigo

> **Como** directora administrativa, **quiero** descargar en Excel los datos fiscales de las compras verificadas en un periodo, **para** facturar en Siigo sin volver a digitar los datos de cada cliente.

**EP6 · Must · 3 pts · Talla M · Responsables: JFG (principal), SG · ⚪ Por hacer** — Riesgo: validar con la directora el formato exacto de importación de terceros y ventas antes del sprint.

## HU-20 · Convertir una respuesta en ficha

> **Como** director técnico, **quiero** convertir la respuesta de una consulta en una ficha nueva, anonimizando los datos del cliente, **para** que cada consulta respondida alimente el repositorio.

**EP7 · Must · 3 pts · Talla M · Responsables: MM (principal), JFG · ⚪ Por hacer**

## HU-21 · Panel de indicadores

> **Como** directora administrativa, **quiero** ver indicadores de consultas por semana, tiempo de respuesta, temas, búsquedas sin resultado y ventas, **para** medir los objetivos del proyecto y decidir qué contenido crear.

**EP7 · Should · 5 pts · Talla L · Responsables: MM (principal), JFG · ⚪ Por hacer**

## HU-22 · Recuperar contraseña

> **Como** cliente registrado, **quiero** restablecer mi contraseña mediante un enlace a mi correo, **para** recuperar el acceso sin pedir ayuda a la empresa.

**EP1 · Should · 3 pts · Talla M · Responsables: SG (principal), SM · ⚪ Por hacer**

## HU-23 · Editar mi perfil y datos de facturación

> **Como** cliente registrado, **quiero** actualizar mi dirección, celular y datos de facturación, **para** que mis facturas salgan con la información correcta.

**EP1 · Should · 2 pts · Talla S · Responsables: SM (principal), SG · ⚪ Por hacer**

## HU-24 · Página de tarifas y alcance del servicio

> **Como** visitante, **quiero** conocer qué cubre una consulta rápida, qué es una asesoría y cuánto cuesta cada una, **para** saber qué esperar antes de pagar.

**EP5 · Should · 2 pts · Talla S · Responsables: SM (principal), JFG · ⚪ Por hacer**

## HU-25 · Política de tratamiento de datos y términos

> **Como** visitante, **quiero** leer la política de tratamiento de datos y los términos de uso, **para** saber cómo se protege la información que entrego.

**EP1 · Must · 2 pts · Talla S · Responsables: SG (principal), JFG · ⚪ Por hacer** — Requiere revisión de un abogado antes del despliegue público (Ley 1581 de 2012).

---

# Post-MVP — Backlog (EP8)

Funcionalidades deseadas por la empresa que quedan fuera del MVP. Sin responsable hasta que entren a un sprint.

## HU-26 · Suscripción mensual o anual

> **Como** cliente frecuente, **quiero** pagar una suscripción que me dé acceso a todo el catálogo, **para** no pagar ficha por ficha.

**Could · 8 pts · Talla XL**

## HU-27 · Pago en línea con pasarela (PSE / tarjeta)

> **Como** cliente registrado, **quiero** pagar en línea y recibir acceso inmediato, **para** no esperar la verificación manual.

**Could · 8 pts · Talla XL**

## HU-28 · Factura electrónica automática vía API de Siigo

> **Como** directora administrativa, **quiero** que la factura se genere en Siigo al verificarse el pago, **para** eliminar por completo la digitación.

**Could · 8 pts · Talla XL**

## HU-29 · Indicadores económicos en el sitio

> **Como** visitante, **quiero** ver UVT, TRM, salario mínimo e IPC vigentes, **para** tener a mano los valores de referencia tributaria.

**Could · 3 pts · Talla M**

## HU-30 · Agenda de seminarios e inscripción

> **Como** profesional contable, **quiero** ver los próximos seminarios e inscribirme en la plataforma, **para** no depender del correo masivo para enterarme.

**Could · 5 pts · Talla L**

## HU-31 · Herramienta en línea de declaración de renta

> **Como** contribuyente, **quiero** usar la plantilla parametrizada de renta desde la web, **para** preparar mi declaración con el criterio de IC.

**Won't · 13 pts · Talla XXL** — debe descomponerse antes de planificarse.

## HU-32 · Boletín de novedades normativas

> **Como** cliente registrado, **quiero** recibir la interpretación de IC sobre decretos y resoluciones nuevas, **para** mantenerme actualizado.

**Could · 5 pts · Talla L**

## HU-33 · Registro e inicio con Google

> **Como** visitante, **quiero** registrarme con mi cuenta de Google, **para** crear la cuenta más rápido.

**Could · 3 pts · Talla M**
