import { App } from 'aws-cdk-lib';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';
import { PlataformaStack } from '../lib/plataforma-stack.js';

const app = new App();
const ctx = (clave: string) => (app.node.tryGetContext(clave) as string | undefined) || undefined;
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: ctx('region') };

new PlataformaStack(app, 'IcDev', {
  env,
  ambiente: 'dev',
  conWeb: ctx('conWeb') === 'true',
  correoRemitente: ctx('correoRemitente'),
  dominioSes: ctx('dominioSes'),
  description: 'Capacitaciones IC · Respuestas para Personas Naturales · ambiente dev',
});

// Se despliega una sola vez con credenciales de administrador (ver infra/README.md).
new GithubOidcStack(app, 'IcGithubOidc', {
  env,
  repositorio: ctx('repositorioGithub') ?? '',
  rama: ctx('ramaDespliegue') ?? 'develop',
});
