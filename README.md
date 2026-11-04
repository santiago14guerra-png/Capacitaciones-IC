# Capacitaciones IC — Respuestas para Personas Naturales

Plataforma web (AWS serverless) para publicar, buscar y vender respuestas tributarias para personas naturales.

- [Historias de usuario, tallas, responsables y estado por sprint](docs/historias-de-usuario.md)
- [Estado del MVP y datos pendientes de la empresa](docs/estado-mvp.md)

## Estructura

| Carpeta   | Contenido                                                                          |
| --------- | ---------------------------------------------------------------------------------- |
| `shared/` | Constantes, validaciones (zod) y contratos que usan el navegador y la API          |
| `api/`    | API Hono con arquitectura hexagonal ([docs/arquitectura.md](docs/arquitectura.md)) |
| `web/`    | Sitio React + Vite                                                                 |
| `infra/`  | AWS CDK ([infra/README.md](infra/README.md))                                       |

## Desarrollo local

Requiere Node 22 (`.nvmrc`). No necesita cuenta de AWS: la API usa DynamoDB emulado (`dynalite`)
y tokens de desarrollo.

```bash
npm ci
npm run dev        # API en :3001 y sitio en http://localhost:5173
npm run check      # lint, tipos, pruebas y build
```

Cuentas locales (clave `Clave1234`): `administrador@ic.local`, `director@ic.local`, `cliente@ic.local`.
El código de verificación en local siempre es `123456`; los correos se imprimen en la consola de la API.
