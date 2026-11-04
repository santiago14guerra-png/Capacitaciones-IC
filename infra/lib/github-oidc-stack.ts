import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';

export interface GithubOidcProps extends StackProps {
  /** `propietario/repositorio` en GitHub. */
  repositorio: string;
  rama: string;
}

/**
 * T-06 · Rol que GitHub Actions asume con OIDC: sin llaves de acceso guardadas en GitHub.
 * Solo puede asumir los roles de despliegue que crea `cdk bootstrap` y solo desde la rama indicada.
 */
export class GithubOidcStack extends Stack {
  constructor(scope: Construct, id: string, props: GithubOidcProps) {
    super(scope, id, props);
    if (!/^[\w.-]+\/[\w.-]+$/.test(props.repositorio)) {
      throw new Error('Indique el repositorio como propietario/repositorio');
    }

    const proveedor = new iam.OpenIdConnectProvider(this, 'Github', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const rol = new iam.Role(this, 'Despliegue', {
      roleName: 'ic-github-despliegue',
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(proveedor.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${props.repositorio}:ref:refs/heads/${props.rama}`,
        },
      }),
    });
    rol.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      }),
    );

    new CfnOutput(this, 'RolDespliegueArn', { value: rol.roleArn });
  }
}
