# Infraestructura (T-05)

AWS CDK en TypeScript. Las pilas `IcDev` e `IcProd` salen del mismo código:

| Pila           | Contenido                                                                                              | Quién la despliega                                      |
| -------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `IcDev`        | DynamoDB, S3, CloudFront, Cognito, Lambda, API Gateway y alarmas                                       | El pipeline, en cada push a `develop`                   |
| `IcProd`       | Lo mismo, con protección contra borrado, mayor capacidad y dominio propio                              | El pipeline, en cada push a `main`, con aprobación      |
| `IcGithubOidc` | Proveedor OIDC de GitHub y el rol `ic-github-despliegue`                                               | Una sola vez, a mano, con credenciales de administrador |
| `IcCuenta`     | AWS Budgets: avisos al superar USD 1 y USD 5. Solo existe si `correoAlertas` tiene valor en `cdk.json` | Una sola vez, a mano, con credenciales de administrador |

## Primera vez (SG)

```bash
aws sso login --profile ic-admin
export AWS_PROFILE=ic-admin
npx cdk bootstrap aws://<cuenta>/us-east-1      # desde infra/
npm run deploy:oidc --workspace infra           # anota RolDespliegueArn
```

En GitHub → Settings → Secrets and variables → Actions → **Variables**:

| Variable       | Valor                     |
| -------------- | ------------------------- |
| `AWS_ROLE_ARN` | Salida `RolDespliegueArn` |
| `AWS_REGION`   | `us-east-1`               |

Desde ahí, cada push a `develop` despliega `IcDev`.

## Activar producción

Producción no se despliega hasta completar estos pasos y tener el aval legal (`docs/estado-mvp.md`).

1. En GitHub → Settings → Environments, crear `produccion` con **Required reviewers** y limitarlo a la rama `main`.
2. Volver a desplegar el rol, que ahora confía en ese ambiente: `npm run deploy:oidc --workspace infra`.
3. Definir `correoAlertas` en `infra/cdk.json` y crear el presupuesto: `npm run deploy:cuenta --workspace infra`.
4. Crear la zona en Route 53 y copiar todos los registros MX, SPF y DKIM de Squarespace **antes** de cambiar los servidores de nombres.
5. Poner `dominio` y `zonaId` en `ambientes.prod` de `infra/cdk.json`.
6. Definir la variable de GitHub `PROD_HABILITADO=true`.
7. Tras el primer despliegue, cargar categorías y personal con las salidas de `IcProd`.

Los datos de `dev` y `prod` están separados: cada pila tiene su tabla, sus buckets y sus usuarios.

## Personal de la empresa (HU-04 CA3)

El registro público siempre asigna el grupo `cliente`. Las cuentas de administrador y director
se crean con:

```bash
npm run crear-personal --workspace api -- <user-pool-id> correo@dominio administrador
```

## Correo (HU-18)

Mientras el dominio institucional no esté verificado en SES, Cognito usa su remitente por defecto
(límite de 50 correos al día) y la API solo registra los avisos en CloudWatch. Al verificar el
dominio con DKIM y salir del sandbox de SES, se despliega con:

```bash
npx cdk deploy IcDev -c conWeb=true -c dominioSes=<dominio> -c correoRemitente=no-responder@<dominio>
```

## Decisiones

- El bucket de archivos es versionado. Los objetos que nadie confirma (etiqueta `estado=sin-confirmar`) se borran a los 7 días; los comprobantes y adjuntos confirmados no vencen.
- Tabla, grupo de usuarios y bucket de archivos se **conservan** si se borra la pila (datos de clientes).
- El sitio y la API comparten dominio en CloudFront (`/api/*`), así que no hace falta CORS para la API.
- `config.json` se genera en el despliegue con los identificadores de Cognito; no contiene secretos.
- DynamoDB usa capacidad aprovisionada fija: 2 unidades en `dev` y 5 en `prod`, en la tabla y en cada índice. Suman 21 de las 25 gratuitas por cuenta. Se ajusta en `ambientes` de `cdk.json`.
- Región `us-east-1`: tiene todos los servicios usados y el menor precio. Se cambia en `cdk.json`.
