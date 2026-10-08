/**
 * Conexión única a PostgreSQL para todo el backend.
 * Antes de la Etapa 2/3 este archivo no existía: nada en server.ts se
 * conectaba a una base de datos real (todo vivía en localStorage del navegador).
 *
 * DATABASE_URL se lee SIEMPRE de una variable de entorno (nunca hardcodeada).
 * En producción debe apuntar al proyecto Neon del usuario; en desarrollo local
 * apunta al Postgres de prueba usado para validar las migraciones de la Etapa 2.
 */
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Falla rápido y con un mensaje claro en vez de intentar conectarse a
  // localhost por defecto (eso escondería el error hasta producción).
  console.error('[DB] Falta la variable de entorno DATABASE_URL. Revisa .env.example.');
}

export const pool = new Pool({
  connectionString,
  // Neon y la mayoría de proveedores gratuitos exigen TLS; en desarrollo
  // local contra un Postgres sin TLS esto se desactiva por PGSSLMODE.
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en una conexión inactiva del pool:', err.message);
});

/**
 * Ejecuta `fn` dentro de una transacción real, con `app.current_user_id` y
 * `app.motivo_cambio` fijados vía SET LOCAL para que los triggers de auditoría
 * (migración 0005) sepan quién y por qué hizo el cambio.
 *
 * Este helper existe porque en la Etapa 2 se comprobó (evidencia real, no
 * teórica) que SET LOCAL fuera de una transacción no tiene efecto: por eso
 * TODA escritura sensible del backend debe pasar por aquí, nunca ejecutar
 * un UPDATE suelto contra `pool.query(...)`.
 */
export async function withAuditContext<T>(
  params: { userId: number; motivo: string },
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', String(params.userId)]);
    await client.query('SELECT set_config($1, $2, true)', ['app.motivo_cambio', params.motivo]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
