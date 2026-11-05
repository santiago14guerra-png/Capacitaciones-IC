# Comparación con la especificación de la entrega 2

Estado del repositorio frente a las secciones 4.3.3 a 4.3.8 del documento
`Entrega2_Secciones3y4_Equipo5.docx`.

## 4.3.3 Pila tecnológica

Implementada. Se agregaron en esta revisión: React Hook Form (en `useFormulario`, junto con Zod),
capacidad aprovisionada de DynamoDB, ACM y Route 53 opcionales para el dominio, alarmas de
CloudWatch, AWS Budgets y Playwright. Jira está fuera del repositorio.

## 4.3.4 Arquitectura: diferencias decididas

La sección quedó sujeta a revisión. Se conservan los cuatro caminos, con dos cambios frente a la figura:

| Especificación                | Implementación           | Por qué                                                                                                                                       |
| ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Una función Lambda por módulo | Una sola Lambda con Hono | Menos arranques en frío, un solo índice de búsqueda en memoria y despliegue más simple. Los casos de uso se pueden separar después (ADR 0001) |
| API Gateway valida el token   | La Lambda lo valida      | `GET /fichas/{id}` es pública, pero entrega más datos si llega un token; un autorizador en la ruta la dejaría sin acceso anónimo (ADR 0004)   |

## 4.3.5 Rutas

Todas las rutas de la Tabla 10 existen con el método y la ruta del documento. Detalles:

- `POST /compras/{id}/comprobante` entrega la URL prefirmada. Se agregó `PUT` en la misma ruta para
  confirmar la subida, porque el navegador sube directo a S3 y la API necesita saber que terminó.
- `/admin/compras/{id}` y `/admin/consultas/{id}` usan `PATCH` sobre un elemento.
- Rutas adicionales: sesión, configuración pública, detalle de compra, adjuntos, categorías del
  panel y conversión de una consulta en ficha.

## 4.3.6 Modelo de datos: diferencias decididas

Se adoptaron los prefijos del documento (`USER#`, `BUSQ#`, `CATEGORIA`, `COMPRA#<estado>`). Estas
diferencias se conservan a propósito:

| Especificación                   | Implementación                              | Por qué                                                                                            |
| -------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ítem `ACCESO#<ficha>`            | El acceso es la compra en estado `APROBADA` | Dos ítems exigirían una transacción; con uno, aprobar es una sola escritura condicional (ADR 0002) |
| `COMPRA#<referencia>`            | `COMPRA#<fichaId>`                          | Impide comprar dos veces la misma ficha y permite encontrar la compra sin otro índice              |
| Consulta bajo `USER#<id>`        | `CONSULTA#<id>` con índice por usuario      | El panel abre consultas por identificador, sin conocer al cliente                                  |
| Categoría `<orden>#<id>`         | `CAT#<id>` con el orden como atributo       | Reordenar no obliga a borrar y recrear ítems                                                       |
| Respuesta en el ítem de la ficha | Ítem `CONTENIDO` aparte                     | Listar el catálogo no puede devolver una respuesta paga por error                                  |
| Un índice (GSI1)                 | Dos índices                                 | GSI2 lista compras por fecha y consultas por usuario                                               |

## 4.3.7 Seguridad

Implementada en el código, salvo lo que depende de la cuenta: MFA del usuario raíz e IAM Identity
Center (T-02). Estado de la auditoría en [seguridad.md](seguridad.md).

## 4.3.8 Construcción y despliegue

Implementado. Playwright corre en cada pull request contra la aplicación local, no contra `dev`:
así no depende de cuentas reales de Cognito ni del correo. Producción se activa con los pasos de
[infra/README.md](../infra/README.md#activar-producción).
