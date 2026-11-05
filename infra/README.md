# Infraestructura (T-05)

AWS CDK en TypeScript. Dos pilas:

| Pila           | Contenido                                                                                                                                  | Quién la despliega                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `IcDev`        | DynamoDB (tabla única), S3 (sitio y archivos privados), CloudFront, Cognito con grupos y disparadores, Lambda de la API y API Gateway HTTP | El pipeline (T-06), en cada push a `develop`            |
| `IcGithubOidc` | Proveedor OIDC de GitHub y el rol `ic-github-despliegue`                                                                                   | Una sola vez, a mano, con credenciales de administrador |

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
- Región `us-east-1`: tiene todos los servicios usados y el menor precio. Se cambia en `cdk.json`.
