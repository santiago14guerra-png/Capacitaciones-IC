export interface ConfigCliente {
  /** `cognito` en AWS; `local` usa la API de desarrollo sin Cognito. */
  modo: 'cognito' | 'local';
  region?: string;
  userPoolId?: string;
  clientId?: string;
}

let actual: ConfigCliente | null = null;

/** En AWS, CDK publica /config.json con los identificadores de Cognito (no son secretos). */
export async function cargarConfig(): Promise<ConfigCliente> {
  if (actual) return actual;
  const env = import.meta.env;
  if (env.VITE_USER_POOL_ID) {
    actual = {
      modo: 'cognito',
      region: env.VITE_REGION,
      userPoolId: env.VITE_USER_POOL_ID,
      clientId: env.VITE_CLIENT_ID,
    };
  } else if (env.DEV || env.MODE === 'test') {
    actual = { modo: 'local' };
  } else {
    const r = await fetch('/config.json', { cache: 'no-store' });
    actual = { modo: 'cognito', ...((await r.json()) as Omit<ConfigCliente, 'modo'>) };
  }
  return actual;
}
