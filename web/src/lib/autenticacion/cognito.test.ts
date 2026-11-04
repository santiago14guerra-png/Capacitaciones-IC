import { describe, expect, it } from 'vitest';
import { codigoCognito } from './cognito';

describe('errores de Cognito', () => {
  it('distingue el bloqueo por intentos de las credenciales incorrectas', () => {
    expect(codigoCognito('NotAuthorizedException', 'Incorrect username or password.')).toBe(
      'CREDENCIALES',
    );
    expect(codigoCognito('NotAuthorizedException', 'Password attempts exceeded')).toBe('BLOQUEADO');
    expect(codigoCognito('UserNotFoundException')).toBe('CREDENCIALES');
    expect(codigoCognito('UsernameExistsException')).toBe('CORREO_EXISTE');
    expect(codigoCognito('com.amazon#CodeMismatchException')).toBe('CODIGO_INVALIDO');
  });
});
