# E14 - Prueba de carga (k6)

Requisito: ambiente desplegado en la nube (Render), k6, >= 2 endpoints criticos, rampa 0 -> 50 VUs sostenida >= 5 min,
metricas de promedio, p95, throughput y tasa de error, y conclusion escrita contra los RNF de E1 (RNF-07).

## Forma recomendada: desde GitHub Actions (no depende de la red de nadie)
1. Crear en produccion **un paciente y una orden de prueba** (por ejemplo "Paciente de Prueba - Carga E14") y anotar su codigo de consulta.
2. Guardarlo como secreto `CODIGO_CARGA` (Settings > Secrets and variables > Actions).
3. Actions > **Carga k6 (E14)** > Run workflow.
4. Al terminar, bajar el artefacto `resultados-carga-e14` (JSON completo) y copiar el resumen que imprime el log.

## Forma manual
```
BASE_URL=https://laboratorio-clinico-vaclinic.onrender.com CODIGO_CONSULTA_VALIDO=<codigo> k6 run load-test/k6-vaclinic-e14.js
```

## Por que el login se mide aparte
`POST /api/portal/login` limita a 20 intentos por IP cada 15 minutos (RNF-03, `server/routes/portal.ts`). Con 50 usuarios virtuales
desde una IP, casi todos los logins responden 429 **por diseno**. Por eso el escenario `consulta` obtiene UN token y carga
`GET /api/portal/orden` y `GET /api/portal/informes`, y el escenario `login` se reporta aparte (200 vs 429). La conclusion de E14
debe decir esto explicitamente: RNF-07 aplicado al login solo es verificable hasta el limite de RNF-03.

## Cuidados
- El plan gratuito de Render duerme el servicio: el `setup()` lo despierta; si aun asi hay latencias altas al inicio, declararlo.
- No usar datos reales de pacientes.
- Guardar el JSON real como evidencia; no transcribir numeros a mano.
