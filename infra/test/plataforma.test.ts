import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, it } from 'vitest';
import { definicionTabla } from '../../api/src/adapters/dynamodb/esquema.js';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';
import { PlataformaStack } from '../lib/plataforma-stack.js';

let t: Template;
beforeAll(() => {
  const app = new App();
  const stack = new PlataformaStack(app, 'Prueba', {
    env: { account: '111111111111', region: 'us-east-1' },
    ambiente: 'prueba',
  });
  t = Template.fromStack(stack);
}, 120_000);

describe('T-05 infraestructura', () => {
  it('crea la tabla con la misma llave e índices que usa la API', () => {
    const local = definicionTabla('x');
    t.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      KeySchema: local.KeySchema,
      GlobalSecondaryIndexes: Match.arrayWith(
        local.GlobalSecondaryIndexes!.map((i) =>
          Match.objectLike({ IndexName: i.IndexName, KeySchema: i.KeySchema }),
        ),
      ),
    });
  });

  it('configura Cognito: contraseña mínima, sesión de 8 horas y token de 15 minutos', () => {
    t.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: { PasswordPolicy: Match.objectLike({ MinimumLength: 8, RequireNumbers: true }) },
      UsernameAttributes: ['email'],
    });
    t.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      AccessTokenValidity: 15,
      RefreshTokenValidity: 480,
      EnableTokenRevocation: true,
      PreventUserExistenceErrors: 'ENABLED',
      GenerateSecret: false,
    });
    for (const g of ['cliente', 'administrador', 'director']) {
      t.hasResourceProperties('AWS::Cognito::UserPoolGroup', { GroupName: g });
    }
  });

  it('redirige HTTP a HTTPS en el sitio y en la API (HU-03 CA6)', () => {
    const d = t.findResources('AWS::CloudFront::Distribution');
    const cfg = Object.values(d)[0]!.Properties.DistributionConfig;
    expect(cfg.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    expect(cfg.CacheBehaviors).toHaveLength(1);
    expect(cfg.CacheBehaviors[0].PathPattern).toBe('/api/*');
    expect(cfg.CacheBehaviors[0].ViewerProtocolPolicy).toBe('redirect-to-https');
  });

  it('mantiene privados los buckets', () => {
    const buckets = Object.values(t.findResources('AWS::S3::Bucket'));
    expect(buckets.length).toBeGreaterThanOrEqual(2);
    for (const b of buckets) {
      expect(b.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    }
  });

  it('versiona los archivos y borra solo lo que nadie confirmó', () => {
    t.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'BorrarSinConfirmar',
            TagFilters: [{ Key: 'estado', Value: 'sin-confirmar' }],
            ExpirationInDays: 7,
            NoncurrentVersionExpiration: { NoncurrentDays: 7 },
          }),
        ]),
      },
    });
  });

  it('activa el vencimiento de las cuotas diarias', () => {
    t.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      TimeToLiveSpecification: { AttributeName: 'expira', Enabled: true },
    });
  });

  it('la API puede leer versiones y quitar etiquetas del bucket', () => {
    const permisos = JSON.stringify(t.findResources('AWS::IAM::Policy'));
    expect(permisos).toContain('s3:GetObject*');
    expect(permisos).toContain('s3:DeleteObject*');
  });

  it('el disparador solo actúa sobre el grupo de usuarios de esta pila', () => {
    const permisos = JSON.stringify(t.findResources('AWS::IAM::Policy'));
    expect(permisos).toContain('cognito-idp:AdminAddUserToGroup');
    expect(permisos).not.toContain('userpool/*');
  });

  it('el navegador solo se conecta a Cognito y a S3 de la región', () => {
    const politica = JSON.stringify(t.findResources('AWS::CloudFront::ResponseHeadersPolicy'));
    expect(politica).toContain('https://*.s3.us-east-1.amazonaws.com');
    expect(politica).not.toContain('https://*.amazonaws.com');
  });

  it('el bucket de archivos no acepta orígenes locales', () => {
    expect(JSON.stringify(t.findResources('AWS::S3::Bucket'))).not.toContain('localhost');
  });

  it('aplica el límite de tasa a la etapa por defecto de la API', () => {
    t.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      StageName: '$default',
      DefaultRouteSettings: { ThrottlingBurstLimit: 50, ThrottlingRateLimit: 20 },
    });
  });

  it('pasa a la Lambda de la API lo que necesita y nada de desarrollo local', () => {
    t.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Environment: {
        Variables: Match.objectLike({
          TABLA: Match.anyValue(),
          USER_POOL_ID: Match.anyValue(),
          CLIENT_ID: Match.anyValue(),
          BUCKET_ARCHIVOS: Match.anyValue(),
        }),
      },
    });
  });
});

describe('T-06 rol OIDC', () => {
  it('solo confía en la rama de despliegue del repositorio', () => {
    const app = new App();
    const s = new GithubOidcStack(app, 'Oidc', {
      env: { account: '111111111111', region: 'us-east-1' },
      repositorio: 'org/repo',
      rama: 'develop',
    });
    Template.fromStack(s).hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                'token.actions.githubusercontent.com:sub': 'repo:org/repo:ref:refs/heads/develop',
              },
            },
          }),
        ],
      },
    });
  });
});

describe('reescritura del sitio', () => {
  it('envía rutas con puntos a index.html y deja pasar los archivos', () => {
    const f = Object.values(t.findResources('AWS::CloudFront::Function'))[0]!;
    const codigo: string = f.Properties.FunctionCode;
    const handler = new Function(`${codigo}; return handler;`)();
    const uri = (u: string) => handler({ request: { uri: u } }).uri;
    expect(uri('/compras/abc-123.def-456')).toBe('/index.html');
    expect(uri('/fichas/x')).toBe('/index.html');
    expect(uri('/assets/index-abc.js')).toBe('/assets/index-abc.js');
    expect(uri('/config.json')).toBe('/config.json');
  });
});
