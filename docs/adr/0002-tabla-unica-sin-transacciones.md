# 0002. Tabla única y acceso derivado de la compra

**Estado:** aceptada

**Contexto.** Aprobar un pago debe habilitar el acceso de inmediato y sin estados intermedios. Un
ítem de «acceso» aparte exigiría una transacción entre dos ítems.

**Decisión.** Una compra por par usuario–ficha (`USUARIO#<sub>` / `COMPRA#<fichaId>`). El acceso es
que esa compra esté `APROBADA`. Aprobar es una escritura condicional sobre un solo ítem. Se evita
además la doble compra por construcción.

**Consecuencias.** No hay transacciones, lo que permite probar y desarrollar con `dynalite`
(emulador en JavaScript sin soporte de transacciones) usando el mismo adaptador que en AWS. Una
suscripción (HU-26) se agregará como otra fuente de acceso, sin cambiar las compras existentes.
