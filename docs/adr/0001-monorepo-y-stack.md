# 0001. Monorepo TypeScript: React, Hono y AWS CDK

**Estado:** aceptada

**Contexto.** Cuatro integrantes, siete semanas, AWS serverless acordado con la empresa y un
público adulto que exige una interfaz simple. La tarea T-01 define un monorepo `web/api/infra`.

**Decisión.** TypeScript en todo. `web` con React y Vite (sitio estático en S3 + CloudFront); `api`
con Hono en una Lambda; `infra` con AWS CDK; `shared` con las validaciones que usan front y back.

**Consecuencias.** Un solo lenguaje y validaciones sin duplicar. Hono corre igual en Lambda y en
local. Una sola Lambda simplifica el despliegue y reduce arranques en frío; si un módulo crece, se
puede separar sin tocar los casos de uso.
