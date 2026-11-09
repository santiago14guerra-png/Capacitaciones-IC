import { Stack, type StackProps } from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import type { Construct } from 'constructs';

export interface CuentaProps extends StackProps {
  correoAlertas: string;
}

const LIMITE_USD = 5;
/** Porcentajes del límite: USD 1 y USD 5. */
const UMBRALES = [20, 100];

/** Recursos de toda la cuenta de AWS, compartidos por los ambientes. */
export class CuentaStack extends Stack {
  constructor(scope: Construct, id: string, props: CuentaProps) {
    super(scope, id, props);
    new budgets.CfnBudget(this, 'Presupuesto', {
      budget: {
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: LIMITE_USD, unit: 'USD' },
      },
      notificationsWithSubscribers: UMBRALES.map((threshold) => ({
        notification: {
          notificationType: 'ACTUAL',
          comparisonOperator: 'GREATER_THAN',
          threshold,
          thresholdType: 'PERCENTAGE',
        },
        subscribers: [{ subscriptionType: 'EMAIL', address: props.correoAlertas }],
      })),
    });
  }
}
