import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  OutputFormat,
  type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import type { Construct } from 'constructs';

export const RAIZ = resolve(import.meta.dirname, '../..');
const GRUPOS = ['cliente', 'administrador', 'director'] as const;
const DIAS_SIN_CONFIRMAR = 7;

export interface PlataformaProps extends StackProps {
  ambiente: string;
  /** Publica web/dist en el bucket del sitio. Requiere `npm run build` antes. */
  conWeb?: boolean;
  /** Remitente verificado en SES (HU-18). Sin él, los correos solo se registran en CloudWatch. */
  correoRemitente?: string;
  /** Dominio o correo verificado en SES para Cognito. Sin él, Cognito usa su remitente por defecto. */
  dominioSes?: string;
  /** Contacto, tarifas y datos bancarios (cdk.json → negocio). Vacíos = [PENDIENTE]. */
  negocio?: Record<string, string>;
}

/**
 * T-05 · Infraestructura base: CloudFront, S3, Cognito, API Gateway, Lambda y DynamoDB.
 * Todo es serverless y de pago por uso (Acta 002).
 */
export class PlataformaStack extends Stack {
  constructor(scope: Construct, id: string, props: PlataformaProps) {
    super(scope, id, props);
    const conservar = RemovalPolicy.RETAIN;

    // ---------- Datos ----------
    const tabla = new dynamodb.TableV2(this, 'Tabla', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      removalPolicy: conservar,
      // Las cuotas diarias se borran solas.
      timeToLiveAttribute: 'expira',
      globalSecondaryIndexes: ['gsi1', 'gsi2'].map((n) => ({
        indexName: n,
        partitionKey: { name: `${n}pk`, type: dynamodb.AttributeType.STRING },
        sortKey: { name: `${n}sk`, type: dynamodb.AttributeType.STRING },
      })),
    });

    const archivos = new s3.Bucket(this, 'Archivos', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: conservar,
      // Se conserva la versión confirmada de cada archivo aunque la URL de subida se reutilice.
      versioned: true,
      lifecycleRules: [
        {
          // La API quita la etiqueta al confirmar el comprobante o radicar la consulta.
          id: 'BorrarSinConfirmar',
          tagFilters: { estado: 'sin-confirmar' },
          expiration: Duration.days(DIAS_SIN_CONFIRMAR),
          noncurrentVersionExpiration: Duration.days(DIAS_SIN_CONFIRMAR),
        },
        { id: 'LimpiarMarcadores', expiredObjectDeleteMarker: true },
      ],
    });

    const sitio = new s3.Bucket(this, 'Sitio', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ---------- Funciones ----------
    const base = (entrada: string, extra: Partial<NodejsFunctionProps> = {}) =>
      ({
        entry: resolve(RAIZ, 'api/src', entrada),
        projectRoot: RAIZ,
        depsLockFilePath: resolve(RAIZ, 'package-lock.json'),
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 256,
        timeout: Duration.seconds(10),
        bundling: {
          format: OutputFormat.ESM,
          minify: true,
          sourceMap: true,
          target: 'node22',
          // Dependencias CommonJS (exceljs, sanitize-html) usan require() dentro del módulo ESM.
          banner:
            "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
        },
        ...extra,
      }) satisfies NodejsFunctionProps;
    const registro = (nombre: string) =>
      new logs.LogGroup(this, `Logs${nombre}`, {
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: RemovalPolicy.DESTROY,
      });

    const postConfirmacion = new NodejsFunction(this, 'PostConfirmacion', {
      ...base('triggers/post-confirmacion.ts'),
      logGroup: registro('PostConfirmacion'),
    });
    const mensajes = new NodejsFunction(this, 'Mensajes', {
      ...base('triggers/mensajes.ts'),
      logGroup: registro('Mensajes'),
    });

    // ---------- Autenticación (ADR 0004) ----------
    const usuarios = new cognito.UserPool(this, 'Usuarios', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      signInCaseSensitive: false,
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: true } },
      // HU-02 CA3: mínimo 8 con número; la exigencia de una letra se valida en el formulario.
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: false,
        requireUppercase: false,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(3),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: { postConfirmation: postConfirmacion, customMessage: mensajes },
      email: props.dominioSes
        ? cognito.UserPoolEmail.withSES({
            fromEmail: props.correoRemitente ?? `no-responder@${props.dominioSes}`,
            fromName: 'Capacitaciones IC',
            sesVerifiedDomain: props.dominioSes,
          })
        : cognito.UserPoolEmail.withCognito(),
      removalPolicy: conservar,
    });
    // Política aparte del rol: dentro de él crearía una dependencia circular con el grupo de usuarios.
    postConfirmacion.role?.attachInlinePolicy(
      new iam.Policy(this, 'PostConfirmacionGrupos', {
        statements: [
          new iam.PolicyStatement({
            actions: ['cognito-idp:AdminAddUserToGroup'],
            resources: [usuarios.userPoolArn],
          }),
        ],
      }),
    );
    const cliente = usuarios.addClient('Web', {
      authFlows: { userPassword: true },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      // ADR 0004 y HU-03 CA5: tokens de acceso cortos y sesión máxima de 8 horas.
      accessTokenValidity: Duration.minutes(15),
      idTokenValidity: Duration.minutes(15),
      refreshTokenValidity: Duration.hours(8),
      generateSecret: false,
    });
    for (const g of GRUPOS) {
      new cognito.CfnUserPoolGroup(this, `Grupo-${g}`, {
        userPoolId: usuarios.userPoolId,
        groupName: g,
      });
    }

    // ---------- Distribución ----------
    const reescrituraSpa = new cf.Function(this, 'ReescrituraSpa', {
      runtime: cf.FunctionRuntime.JS_2_0,
      code: cf.FunctionCode.fromInline(
        // Rutas del sitio → index.html; los archivos estáticos (con extensión conocida) pasan.
        // Las rutas pueden tener puntos, p. ej. /compras/<sub>.<fichaId>.
        "function handler(e){var r=e.request;if(!/\\.(js|css|map|svg|png|jpe?g|ico|json|txt|webmanifest|woff2?)$/i.test(r.uri)){r.uri='/index.html';}return r;}",
      ),
    });
    const cabeceras = new cf.ResponseHeadersPolicy(this, 'Cabeceras', {
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cf.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cf.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            `connect-src 'self' https://cognito-idp.${this.region}.amazonaws.com https://*.s3.${this.region}.amazonaws.com`,
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      },
    });

    const distribucion = new cf.Distribution(this, 'Distribucion', {
      defaultRootObject: 'index.html',
      priceClass: cf.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(sitio),
        // HU-03 CA6: toda petición HTTP se redirige a HTTPS.
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cabeceras,
        functionAssociations: [
          { function: reescrituraSpa, eventType: cf.FunctionEventType.VIEWER_REQUEST },
        ],
      },
    });
    const urlSitio = `https://${distribucion.distributionDomainName}`;

    archivos.addCorsRule({
      allowedMethods: [s3.HttpMethods.POST, s3.HttpMethods.GET],
      allowedOrigins: [urlSitio],
      allowedHeaders: ['*'],
      maxAge: 3000,
    });

    // ---------- API ----------
    const api = new NodejsFunction(this, 'Api', {
      ...base('bootstrap/lambda.ts', { memorySize: 512, timeout: Duration.seconds(20) }),
      logGroup: registro('Api'),
      environment: {
        TABLA: tabla.tableName,
        BUCKET_ARCHIVOS: archivos.bucketName,
        USER_POOL_ID: usuarios.userPoolId,
        CLIENT_ID: cliente.userPoolClientId,
        SITIO_URL: urlSitio,
        CORREO_REMITENTE: props.correoRemitente ?? '',
        NODE_OPTIONS: '--enable-source-maps',
        ...Object.fromEntries(
          Object.entries(props.negocio ?? {}).filter(([k, v]) => /^[A-Z_]+$/.test(k) && v),
        ),
      },
    });
    tabla.grantReadWriteData(api);
    archivos.grantReadWrite(api);
    api.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`],
      }),
    );
    api.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminGetUser'],
        resources: [usuarios.userPoolArn],
      }),
    );
    mensajes.addEnvironment('SITIO_URL', urlSitio);

    const httpApi = new HttpApi(this, 'HttpApi', {
      defaultIntegration: new HttpLambdaIntegration('Lambda', api),
      createDefaultStage: true,
    });
    const etapa = httpApi.defaultStage?.node.defaultChild as
      import('aws-cdk-lib/aws-apigatewayv2').CfnStage | undefined;
    etapa?.addPropertyOverride('DefaultRouteSettings', {
      ThrottlingBurstLimit: 50,
      ThrottlingRateLimit: 20,
    });

    distribucion.addBehavior(
      '/api/*',
      new origins.HttpOrigin(`${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`),
      {
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cf.AllowedMethods.ALLOW_ALL,
        cachePolicy: cf.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy: cabeceras,
      },
    );

    // ---------- Sitio web ----------
    const dist = resolve(RAIZ, 'web/dist');
    if (props.conWeb) {
      if (!existsSync(dist))
        throw new Error('Ejecute `npm run build` antes de desplegar con conWeb=true');
      new s3deploy.BucketDeployment(this, 'PublicarSitio', {
        destinationBucket: sitio,
        sources: [
          s3deploy.Source.asset(dist),
          // Configuración que el navegador lee al iniciar; no contiene secretos.
          s3deploy.Source.jsonData('config.json', {
            region: this.region,
            userPoolId: usuarios.userPoolId,
            clientId: cliente.userPoolClientId,
          }),
        ],
        distribution: distribucion,
        distributionPaths: ['/*'],
        memoryLimit: 512,
      });
    }

    new CfnOutput(this, 'SitioUrl', { value: urlSitio });
    new CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new CfnOutput(this, 'UserPoolId', { value: usuarios.userPoolId });
    new CfnOutput(this, 'ClientId', { value: cliente.userPoolClientId });
    new CfnOutput(this, 'NombreTabla', { value: tabla.tableName });
    new CfnOutput(this, 'BucketArchivos', { value: archivos.bucketName });
  }
}
