import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Regresión real de producción (post-fusión PR #2,
 * feature/auth-propio-sin-firebase): /api/health, /api/notifications/* y
 * /api/ai/* se registran directamente sobre `app` en server.ts, NO dentro
 * de apiRouter. Express prueba app.use()/app.VERB() en el orden en que se
 * registran, nunca por especificidad — así que si `app.use("/api",
 * apiRouter)` se monta ANTES que esas rutas, cualquier petición hacia ellas
 * pasa primero por apiRouter, cae en su middleware global
 * `apiRouter.use(requireStaffAuth, ...)` (agregado para exigir
 * mustChangePassword/TOTP, ver server/routes/index.ts) y se corta con 401
 * antes de llegar siquiera al handler real.
 *
 * Esto rompió /api/health en producción (Render) y en este mismo pipeline
 * de CI (el chequeo de salud nunca recibía 200, no por lentitud de arranque
 * como se sospechó al principio, sino porque la petición sin sesión de
 * personal nunca llegaba a su destino). Esta prueba no ejecuta el servidor
 * completo (requeriría Vite + Postgres reales) — verifica, a nivel de
 * código fuente, que el orden correcto se mantiene, para que una futura
 * edición de server.ts no reintroduzca el mismo bug en silencio.
 */
describe('orden de montaje de rutas en server.ts', () => {
  const codigoFuente = readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');

  function primeraAparicion(patron: RegExp): number {
    const indice = codigoFuente.search(patron);
    expect(indice, `no se encontró el patrón ${patron}`).toBeGreaterThanOrEqual(0);
    return indice;
  }

  it('monta apiRouter DESPUÉS de app.get("/api/health", ...)', () => {
    const indiceHealth = primeraAparicion(/app\.get\(["']\/api\/health["']/);
    const indiceApiRouter = primeraAparicion(/app\.use\(["']\/api["'],\s*apiRouter\)/);
    expect(indiceApiRouter).toBeGreaterThan(indiceHealth);
  });

  it('monta apiRouter DESPUÉS de las rutas públicas /api/notifications/* y /api/ai/*', () => {
    const indiceApiRouter = primeraAparicion(/app\.use\(["']\/api["'],\s*apiRouter\)/);
    for (const ruta of [
      '/api/notifications/firebase/status',
      '/api/notifications/firebase/register-token',
      '/api/notifications/firebase/send-result-ready',
      '/api/notifications/firebase/test-push',
      '/api/ai/summarize-results',
      '/api/ai/draft-report',
      '/api/ai/patient-qa',
      '/api/ai/audit-template'
    ]) {
      const indiceRuta = primeraAparicion(new RegExp(`app\\.(get|post)\\(["']${ruta.replace(/\//g, '\\/')}["']`));
      expect(indiceApiRouter, `apiRouter debe montarse después de ${ruta}`).toBeGreaterThan(indiceRuta);
    }
  });
});

/**
 * Verificación pública de informes (migración 0019): el QR del PDF lo
 * escanea cualquiera, sin sesión. Si `/verificar` se montara DESPUÉS del
 * middleware global requireStaffAuth (API) o del catch-all del SPA (página),
 * el QR devolvería 401 o la pantalla de login/React en vez de la verificación.
 */
describe('orden de montaje de la verificación pública', () => {
  const indexSrc = readFileSync(path.resolve(__dirname, './routes/index.ts'), 'utf8');
  const serverSrc = readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');

  it('/api/verificar se monta ANTES de requireStaffAuth en routes/index.ts', () => {
    const publica = indexSrc.search(/apiRouter\.use\(['"]\/verificar['"]/);
    const protegida = indexSrc.search(/apiRouter\.use\(requireStaffAuth/);
    expect(publica).toBeGreaterThanOrEqual(0);
    expect(protegida).toBeGreaterThanOrEqual(0);
    expect(publica).toBeLessThan(protegida);
  });

  it('la página /verificar se monta en server.ts antes del catch-all SPA (startServer)', () => {
    const pagina = serverSrc.search(/app\.use\(["']\/verificar["']/);
    const spa = serverSrc.search(/async function startServer\(/);
    expect(pagina).toBeGreaterThanOrEqual(0);
    expect(pagina).toBeLessThan(spa);
  });
});
