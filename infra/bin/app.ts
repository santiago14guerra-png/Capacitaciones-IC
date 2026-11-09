import { App } from 'aws-cdk-lib';
import { CuentaStack } from '../lib/cuenta-stack.js';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';
import { PlataformaStack } from '../lib/plataforma-stack.js';

interface ConfigAmbiente {
  capacidad: number;
  dominio?: string;
  zonaId?: string;
}

const app = new App();
const ctx = (clave: string) => (app.node.tryGetContext(clave) as string | undefined) || undefined;
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: ctx('region') };

const negocio = app.node.tryGetContext('negocio') as Record<string, string> | undefined;
const ambientes = app.node.tryGetContext('ambientes') as Record<'dev' | 'prod', ConfigAmbiente>;
const correoAlertas = ctx('correoAlertas');
const comunes = {
  env,
  conWeb: ctx('conWeb') === 'true',
  correoRemitente: ctx('correoRemitente'),
  dominioSes: ctx('dominioSes'),
  correoAlertas,
  negocio,
};

new PlataformaStack(app, 'IcDev', {
  ...comunes,
  ambiente: 'dev',
  capacidad: ambientes.dev.capacidad,
  description: 'Capacitaciones IC · Respuestas para Personas Naturales · ambiente dev',
});

new PlataformaStack(app, 'IcProd', {
  ...comunes,
  ambiente: 'prod',
  capacidad: ambientes.prod.capacidad,
  proteccionBorrado: true,
  dominio:
    ambientes.prod.dominio && ambientes.prod.zonaId
      ? { nombre: ambientes.prod.dominio, zonaId: ambientes.prod.zonaId }
      : undefined,
  description: 'Capacitaciones IC · Respuestas para Personas Naturales · producción',
});

// Se despliega una sola vez con credenciales de administrador (ver infra/README.md).
new GithubOidcStack(app, 'IcGithubOidc', {
  env,
  repositorio: ctx('repositorioGithub') ?? '',
  rama: ctx('ramaDespliegue') ?? 'develop',
  ambienteProduccion: 'produccion',
});

// Presupuesto de la cuenta. Requiere `correoAlertas` y se despliega a mano una sola vez.
if (correoAlertas) new CuentaStack(app, 'IcCuenta', { env, correoAlertas });
