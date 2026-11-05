# Modelo de datos (T-04)

Tabla única `pk` / `sk` con dos índices secundarios (`gsi1pk/gsi1sk`, `gsi2pk/gsi2sk`).

| Entidad            | pk                    | sk                           | gsi1                                   | gsi2                                       |
| ------------------ | --------------------- | ---------------------------- | -------------------------------------- | ------------------------------------------ |
| Ficha (metadatos)  | `FICHA#<id>`          | `META`                       | `FICHAS#<estado>` / `<actualizadaEn>`  | —                                          |
| Contenido de ficha | `FICHA#<id>`          | `CONTENIDO`                  | —                                      | —                                          |
| Categoría          | `CATEGORIAS`          | `CAT#<id>`                   | —                                      | —                                          |
| Perfil             | `USUARIO#<sub>`       | `PERFIL`                     | —                                      | —                                          |
| Compra             | `USUARIO#<sub>`       | `COMPRA#<fichaId>`           | `COMPRAS#<estado>` / `<actualizadaEn>` | `COMPRAS` / `<creadaEn>`                   |
| Consulta           | `CONSULTA#<id>`       | `META`                       | `CONSULTAS` / `<recibidaEn>`           | `USUARIO#<sub>#CONSULTAS` / `<recibidaEn>` |
| Búsqueda           | `BUSQUEDAS#<aaaa-mm>` | `<fecha>#<uuid>`             | —                                      | —                                          |
| Contador           | `CONTADOR`            | `COMPRA` o `CONSULTA`        | —                                      | —                                          |
| Cuota de subidas   | `USUARIO#<sub>`       | `CUOTA#SUBIDAS#<aaaa-mm-dd>` | —                                      | —                                          |

## Patrones de acceso

| Necesidad                                  | Operación                                                        |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Listar fichas publicadas (sin respuesta)   | Query gsi1 `FICHAS#PUBLICADA`                                    |
| Listar fichas por estado en el panel       | Query gsi1                                                       |
| Abrir una ficha / su contenido             | GetItem                                                          |
| Saber si un usuario accedió a una ficha    | GetItem `USUARIO#<sub>` + `COMPRA#<fichaId>` y estado `APROBADA` |
| Biblioteca del cliente                     | Query `USUARIO#<sub>`, prefijo `COMPRA#`                         |
| Bandeja de pagos                           | Query gsi1 `COMPRAS#EN_VERIFICACION`                             |
| Compras en un periodo (Siigo, indicadores) | Query gsi2 `COMPRAS` entre fechas                                |
| Bandeja de consultas                       | Query gsi1 `CONSULTAS`                                           |
| Consultas del cliente                      | Query gsi2                                                       |
| Búsquedas sin resultado                    | Query por mes                                                    |
| Referencia `RPN-000123` y radicado         | UpdateItem `ADD` atómico                                         |

El ítem de cuota tiene el atributo `expira` (TTL de la tabla) y desaparece a los dos días.

El identificador público de una compra es `<sub>.<fichaId>`: de él sale la llave sin otro índice.
