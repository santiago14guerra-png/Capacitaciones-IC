# Cómo trabajamos

## Ramas

| Rama | Propósito | Despliegue |
| --- | --- | --- |
| `main` | Código revisado y listo para producción. Protegida. | Ninguno por ahora; producción requiere el aval legal (ver README). |
| `develop` | Integración del equipo. | Automático al ambiente `dev` de AWS. |
| `feature/HU-XX-descripcion` | Una historia de usuario. Sale de `develop`. | — |
| `chore/T-XX-descripcion` | Una tarea técnica. Sale de `develop`. | — |
| `fix/descripcion` | Corrección. Sale de `develop`. | — |

Flujo: rama de trabajo → PR a `develop` (revisado por el otro responsable de la historia) →
despliegue a `dev` → PR de `develop` a `main` al cierre del sprint.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/es/), con el ID en el alcance:

```
feat(HU-09): ignorar tildes y mayúsculas en la búsqueda
fix(HU-13): impedir la doble aprobación de un pago
chore(T-06): agregar pipeline de despliegue a dev
```

## Antes de abrir un PR

```bash
npm run check
```
