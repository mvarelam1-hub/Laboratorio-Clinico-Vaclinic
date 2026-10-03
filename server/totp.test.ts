import { describe, it, expect } from 'vitest';
import {
  generateTotpSecret,
  generateTotpToken,
  totpAuthUri,
  verifyTotpToken,
  isTotpMandatoryForRole,
  MANDATORY_TOTP_ROLES
} from './totp';

/**
 * Pruebas unitarias de server/totp.ts (TOTP RFC 6238 implementado desde
 * cero con `crypto` nativo, sin librerías externas). Función pura, sin
 * base de datos ni red: no necesita ningún doble de prueba.
 */
describe('generateTotpSecret', () => {
  it('genera un secreto en Base32 (solo A-Z y 2-7) no vacío y distinto cada vez', () => {
    const s1 = generateTotpSecret();
    const s2 = generateTotpSecret();
    expect(s1).toMatch(/^[A-Z2-7]+$/);
    expect(s1.length).toBeGreaterThan(0);
    expect(s1).not.toBe(s2);
  });
});

describe('totpAuthUri', () => {
  it('arma una URI otpauth:// válida con issuer, cuenta y parámetros estándar', () => {
    const secret = generateTotpSecret();
    const uri = totpAuthUri(secret, 'director.demo@vaclinic.test');
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain('VACLINIC');
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('acepta un issuer personalizado', () => {
    const secret = generateTotpSecret();
    const uri = totpAuthUri(secret, 'alguien@ejemplo.com', 'OtroEmisor');
    expect(uri).toContain('issuer=OtroEmisor');
  });
});

describe('verifyTotpToken', () => {
  it('un código generado para "ahora" verifica correctamente', () => {
    const secret = generateTotpSecret();
    const ahora = new Date();
    const codigo = generateTotpToken(secret, ahora);
    expect(verifyTotpToken(secret, codigo, ahora)).toBe(true);
  });

  it('un código incorrecto (o con otro secreto) es rechazado', () => {
    const secret = generateTotpSecret();
    const ahora = new Date();
    const codigoReal = generateTotpToken(secret, ahora);
    // Cambiar un dígito garantiza un código distinto de 6 dígitos.
    const ultimo = Number(codigoReal[5]);
    const codigoFalso = codigoReal.slice(0, 5) + String((ultimo + 1) % 10);
    expect(verifyTotpToken(secret, codigoFalso, ahora)).toBe(false);
  });

  it('rechaza entradas que no son exactamente 6 dígitos', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpToken(secret, '12345')).toBe(false);
    expect(verifyTotpToken(secret, 'abcdef')).toBe(false);
    expect(verifyTotpToken(secret, '')).toBe(false);
  });

  it('acepta el código del paso ANTERIOR (ventana ±1 paso = ±30s) para absorber desfase de reloj', () => {
    const secret = generateTotpSecret();
    const ahora = new Date();
    const pasoAnterior = new Date(ahora.getTime() - 30_000);
    const codigoAnterior = generateTotpToken(secret, pasoAnterior);
    expect(verifyTotpToken(secret, codigoAnterior, ahora)).toBe(true);
  });

  it('acepta el código del paso SIGUIENTE (ventana ±1 paso)', () => {
    const secret = generateTotpSecret();
    const ahora = new Date();
    const pasoSiguiente = new Date(ahora.getTime() + 30_000);
    const codigoSiguiente = generateTotpToken(secret, pasoSiguiente);
    expect(verifyTotpToken(secret, codigoSiguiente, ahora)).toBe(true);
  });

  it('rechaza un código fuera de la ventana (2 pasos = 60s de diferencia)', () => {
    const secret = generateTotpSecret();
    const ahora = new Date();
    const dosPasosAntes = new Date(ahora.getTime() - 60_000);
    const codigoLejano = generateTotpToken(secret, dosPasosAntes);
    expect(verifyTotpToken(secret, codigoLejano, ahora)).toBe(false);
  });
});

describe('isTotpMandatoryForRole / MANDATORY_TOTP_ROLES', () => {
  it('exige TOTP para director_laboratorio y administrador_ti', () => {
    expect(isTotpMandatoryForRole('director_laboratorio')).toBe(true);
    expect(isTotpMandatoryForRole('administrador_ti')).toBe(true);
  });

  it('no exige TOTP para el resto de roles de LabStaffRole', () => {
    expect(isTotpMandatoryForRole('bioanalista')).toBe(false);
    expect(isTotpMandatoryForRole('bioanalista_senior')).toBe(false);
    expect(isTotpMandatoryForRole('tecnico_flebotomista')).toBe(false);
    expect(isTotpMandatoryForRole('recepcionista')).toBe(false);
    expect(isTotpMandatoryForRole('auditor_calidad')).toBe(false);
  });

  it('MANDATORY_TOTP_ROLES contiene exactamente los dos roles documentados', () => {
    expect([...MANDATORY_TOTP_ROLES].sort()).toEqual(['administrador_ti', 'director_laboratorio']);
  });
});
