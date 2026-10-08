import { describe, it, expect } from 'vitest';
import { loadRecentAccounts, rememberAccount, forgetAccount, filterAccounts } from './recentStaffAccounts';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
    data
  };
}

describe('recentStaffAccounts', () => {
  it('guarda la cuenta usada, la más reciente primero y sin duplicar', () => {
    const s = fakeStorage();
    rememberAccount({ email: 'Ana@Vaclinic.com', fullName: 'Ana' }, s, new Date('2026-10-01T10:00:00Z'));
    rememberAccount({ email: 'luis@vaclinic.com', fullName: 'Luis' }, s);
    const lista = rememberAccount({ email: 'ana@vaclinic.com', fullName: 'Ana Pérez', roleName: 'Bioanalista' }, s);
    expect(lista.map((c) => c.email)).toEqual(['ana@vaclinic.com', 'luis@vaclinic.com']);
    expect(lista[0].fullName).toBe('Ana Pérez');
  });

  it('nunca guarda contraseñas ni tokens (solo correo, nombre, rol y fecha)', () => {
    const s = fakeStorage();
    rememberAccount({ email: 'a@b.com', fullName: 'A', roleName: 'R', password: 'secreto', token: 'abc' } as any, s);
    const raw = Object.values(s.data).join('');
    expect(raw).not.toMatch(/secreto|abc|password|token/i);
  });

  it('limita a 6 cuentas', () => {
    const s = fakeStorage();
    for (let i = 0; i < 10; i++) rememberAccount({ email: `u${i}@x.com`, fullName: `U${i}` }, s);
    expect(loadRecentAccounts(s)).toHaveLength(6);
    expect(loadRecentAccounts(s)[0].email).toBe('u9@x.com');
  });

  it('olvida una cuenta', () => {
    const s = fakeStorage();
    rememberAccount({ email: 'a@x.com', fullName: 'A' }, s);
    rememberAccount({ email: 'b@x.com', fullName: 'B' }, s);
    expect(forgetAccount('A@x.com', s).map((c) => c.email)).toEqual(['b@x.com']);
  });

  it('tolera almacenamiento corrupto, ausente o con datos inválidos', () => {
    expect(loadRecentAccounts(fakeStorage({ vaclinic_recent_staff_accounts_v1: '{no json' }))).toEqual([]);
    expect(loadRecentAccounts(fakeStorage({ vaclinic_recent_staff_accounts_v1: JSON.stringify([{ x: 1 }, 'a', null]) }))).toEqual([]);
    expect(loadRecentAccounts(null)).toEqual([]);
    expect(() => rememberAccount({ email: 'a@x.com', fullName: 'A' }, null)).not.toThrow();
    const lleno = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(() => rememberAccount({ email: 'a@x.com', fullName: 'A' }, lleno)).not.toThrow();
  });

  it('ignora correos inválidos', () => {
    const s = fakeStorage();
    expect(rememberAccount({ email: 'sin-arroba', fullName: 'X' }, s)).toEqual([]);
  });

  it('filtra por correo o nombre sin distinguir mayúsculas ni acentos', () => {
    const lista = [
      { email: 'maria@x.com', fullName: 'María López', lastUsedAt: '' },
      { email: 'jose@x.com', fullName: 'José Pérez', lastUsedAt: '' }
    ];
    expect(filterAccounts(lista, 'maria').map((c) => c.email)).toEqual(['maria@x.com']);
    expect(filterAccounts(lista, 'PEREZ').map((c) => c.email)).toEqual(['jose@x.com']);
    expect(filterAccounts(lista, '  ')).toHaveLength(2);
    expect(filterAccounts(lista, 'zzz')).toEqual([]);
  });
});
