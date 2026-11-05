# 0005. Ambientes dev y prod en la misma cuenta

**Estado:** aceptada

**Contexto.** La entrega 2 pide los ambientes `dev` y `prod` con el mismo código, y aprobación
manual para pasar a producción. La empresa tendrá una sola cuenta de AWS.

**Decisión.** Dos pilas (`IcDev`, `IcProd`) de la misma clase. `develop` despliega `dev`
automáticamente. `main` despliega `prod` a través del ambiente `produccion` de GitHub, que exige
aprobación. El rol OIDC acepta ese ambiente, no la rama `main`, para que nadie evite la aprobación.
El flujo de producción no hace nada hasta definir `PROD_HABILITADO=true`.

**Consecuencias.** Cada ambiente tiene datos y usuarios propios, y la asignación gratuita de
DynamoDB se reparte entre ambos. Dos ambientes en una cuenta no aíslan los permisos: el rol de
despliegue puede tocar las dos pilas. Si la empresa crece, conviene pasar `prod` a otra cuenta.
