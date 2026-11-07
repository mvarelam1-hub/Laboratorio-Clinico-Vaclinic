// VACLINIC - Fase 2 (ACS) - E14: prueba de carga contra el ambiente desplegado en la nube.
//
// Endpoints criticos (RNF-07 del E1, "login de portal, consulta de orden"):
//   1) POST /api/portal/login   - login del portal del paciente (codigo de consulta)
//   2) GET  /api/portal/orden   - consulta de la orden ya autenticada
//   (y, como tercer punto de medicion, GET /api/portal/informes)
//
// HALLAZGO DE DISENO que condiciona la prueba (RNF-03): el login del portal tiene un limitador
// de tasa de 20 intentos por IP cada 15 minutos (server/routes/portal.ts). Desde una sola IP
// es IMPOSIBLE hacer miles de logins validos: del intento 21 en adelante el servidor responde
// 429 por diseno. Por eso:
//   - Escenario "consulta": rampa 0 -> 50 VUs, sostenida 5 min, con UN token obtenido en setup()
//     (el token dura 15 min y la prueba dura ~6.5 min). Mide orden e informes bajo carga real.
//   - Escenario "login": ritmo bajo y constante; sus latencias se reportan APARTE (separando
//     200 de 429) y NO entran en los umbrales de RNF-07, porque el 429 es el comportamiento
//     correcto del limitador. Se documenta en la conclusion de E14.
//
// Variables de entorno:  BASE_URL (por defecto el ambiente de Render)  y  CODIGO_CONSULTA_VALIDO
// (codigo de un paciente/orden de PRUEBA creado para esto; nunca datos reales de pacientes).
//
//   CODIGO_CONSULTA_VALIDO=XXXX k6 run load-test/k6-vaclinic-e14.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://laboratorio-clinico-vaclinic.onrender.com';
const CODIGO = __ENV.CODIGO_CONSULTA_VALIDO || '';
// Solo para ensayos cortos de verificacion del script; para E14 se usan los valores por defecto.
const RAMPA = __ENV.RAMPA || '1m';
const SOSTENIDO = __ENV.SOSTENIDO || '5m';
const DURACION_LOGIN = __ENV.DURACION_LOGIN || '6m30s';

export const options = {
  scenarios: {
    consulta: {
      executor: 'ramping-vus',
      exec: 'consulta',
      startVUs: 0,
      stages: [
        { duration: RAMPA, target: 50 }, // rampa 0 -> 50 VUs
        { duration: SOSTENIDO, target: 50 }, // sostenido 5 minutos (minimo exigido)
        { duration: '30s', target: 0 }, // enfriamiento
      ],
      gracefulRampDown: '30s',
    },
    login: {
      executor: 'constant-arrival-rate',
      exec: 'login',
      rate: 1,
      timeUnit: '3s', // 1 intento cada 3 s: 20 intentos entran en el primer minuto, luego 429
      duration: DURACION_LOGIN,
      preAllocatedVUs: 2,
      maxVUs: 5,
    },
  },
  thresholds: {
    // Criterio medible de RNF-07 (E1): promedio <= 500 ms y p95 <= 1000 ms, sobre las consultas.
    'http_req_duration{endpoint:portal_orden}': ['avg<=500', 'p(95)<=1000'],
    'http_req_duration{endpoint:portal_informes}': ['avg<=500', 'p(95)<=1000'],
    'http_req_failed{endpoint:portal_orden}': ['rate<0.01'],
    'http_req_failed{endpoint:portal_informes}': ['rate<0.01'],
  },
};

const loginOk = new Trend('login_200_ms', true);
const login429 = new Trend('login_429_ms', true);

export function setup() {
  if (!CODIGO) {
    throw new Error('Falta CODIGO_CONSULTA_VALIDO (codigo de un paciente de PRUEBA).');
  }
  // Calentamiento: el plan gratuito de Render duerme el servicio (cold start).
  http.get(`${BASE_URL}/api/health`, { timeout: '120s' });
  const r = http.post(`${BASE_URL}/api/portal/login`, JSON.stringify({ codigo: CODIGO }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'setup_login' },
  });
  if (r.status !== 200) {
    throw new Error(`Login de setup fallo con HTTP ${r.status}. Revisa el codigo o espera 15 min si hay 429.`);
  }
  return { token: r.json('token') };
}

export function consulta(data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  const o = http.get(`${BASE_URL}/api/portal/orden`, { headers, tags: { endpoint: 'portal_orden' } });
  check(o, { 'orden: HTTP 200': (r) => r.status === 200 });
  const i = http.get(`${BASE_URL}/api/portal/informes`, { headers, tags: { endpoint: 'portal_informes' } });
  check(i, { 'informes: HTTP 200': (r) => r.status === 200 });
  sleep(1);
}

export function login() {
  const r = http.post(`${BASE_URL}/api/portal/login`, JSON.stringify({ codigo: CODIGO }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'portal_login' },
  });
  if (r.status === 200) loginOk.add(r.timings.duration);
  if (r.status === 429) login429.add(r.timings.duration);
  check(r, { 'login: 200 o 429 (limitador), nunca 5xx': (x) => x.status === 200 || x.status === 429 });
}

export function handleSummary(data) {
  const v = (m, k) => (data.metrics[m] && data.metrics[m].values[k] !== undefined ? data.metrics[m].values[k].toFixed(1) : 'n/d');
  const txt = [
    '=== Resumen E14 (RNF-07: promedio <= 500 ms, p95 <= 1000 ms bajo 50 VUs x 5 min) ===',
    `orden     avg=${v('http_req_duration{endpoint:portal_orden}', 'avg')} ms  p95=${v('http_req_duration{endpoint:portal_orden}', 'p(95)')} ms`,
    `informes  avg=${v('http_req_duration{endpoint:portal_informes}', 'avg')} ms  p95=${v('http_req_duration{endpoint:portal_informes}', 'p(95)')} ms`,
    `login 200 avg=${v('login_200_ms', 'avg')} ms | login 429 avg=${v('login_429_ms', 'avg')} ms (informativo)`,
    `throughput total: ${v('http_reqs', 'rate')} req/s`,
    `tasa de error orden: ${data.metrics['http_req_failed{endpoint:portal_orden}'] ? (data.metrics['http_req_failed{endpoint:portal_orden}'].values.rate * 100).toFixed(2) : 'n/d'} % | informes: ${data.metrics['http_req_failed{endpoint:portal_informes}'] ? (data.metrics['http_req_failed{endpoint:portal_informes}'].values.rate * 100).toFixed(2) : 'n/d'} %`,
    '',
  ].join('\n');
  return { 'load-test/resultados_e14.json': JSON.stringify(data, null, 2), stdout: txt };
}
