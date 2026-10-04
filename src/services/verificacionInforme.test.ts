import { describe, it, expect } from 'vitest';
import { buildVerificationUrl, formatVerificationCode } from './verificacionInforme';

describe('buildVerificationUrl', () => {
  const ORIGEN = 'https://lab.example.com';
  it('arma la URL real con código y prefijo de la huella', () => {
    expect(buildVerificationUrl({ verificationCode: 'ABCDEFGHJKMNPQRS', verificationHash: 'A1B2C3D4E5F60718' + '0'.repeat(48) }, ORIGEN))
      .toBe('https://lab.example.com/verificar/ABCDEFGHJKMNPQRS?h=a1b2c3d4e5f60718');
  });
  it('sin huella, solo el código; sin barra doble con origen terminado en /', () => {
    expect(buildVerificationUrl({ verificationCode: 'ABCDEFGHJKMNPQRS' }, ORIGEN + '/')).toBe('https://lab.example.com/verificar/ABCDEFGHJKMNPQRS');
  });
  it('devuelve null si el informe no fue sellado por el servidor', () => {
    expect(buildVerificationUrl({}, ORIGEN)).toBeNull();
    expect(buildVerificationUrl(undefined, ORIGEN)).toBeNull();
    expect(buildVerificationUrl(null, ORIGEN)).toBeNull();
  });
  it('rechaza códigos que no tienen el formato del servidor (no se fabrican enlaces)', () => {
    expect(buildVerificationUrl({ verificationCode: 'VALID-SANRAFAEL-LAB-2026-0842' }, ORIGEN)).toBeNull();
    expect(buildVerificationUrl({ verificationCode: 'abc' }, ORIGEN)).toBeNull();
  });
  it('ignora una huella con formato inválido', () => {
    expect(buildVerificationUrl({ verificationCode: 'ABCDEFGHJKMNPQRS', verificationHash: '0x79f2c84a' }, ORIGEN))
      .toBe('https://lab.example.com/verificar/ABCDEFGHJKMNPQRS');
  });
});

describe('formatVerificationCode', () => {
  it('agrupa en 4', () => expect(formatVerificationCode('ABCDEFGHJKMNPQRS')).toBe('ABCD-EFGH-JKMN-PQRS'));
  it('null si no es un código válido', () => expect(formatVerificationCode('x')).toBeNull());
});
