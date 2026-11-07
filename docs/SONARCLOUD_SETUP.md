# SonarCloud (E12) - pasos manuales

1. Entrar a https://sonarcloud.io con *Log in with GitHub* usando la cuenta `mvarelam1-hub` (lo hace una persona, no el pipeline).
2. *+ > Analyze new project*, elegir la organizacion de GitHub e **importar `Laboratorio-Clinico-Vaclinic`**.
   Como el repositorio es privado, el plan gratuito de SonarCloud puede no cubrirlo: si lo rechaza, usar una de estas salidas
   (la decision es del equipo): hacer el repositorio publico, usar el periodo de prueba, o instalar SonarQube Community en local.
3. En el proyecto: *Administration > Analysis Method* y **desactivar "Automatic Analysis"** (si esta activo, choca con el analisis del pipeline).
4. Copiar los valores **Project Key** y **Organization** a `sonar-project.properties` si difieren de los que ya trae.
5. *My Account > Security > Generate Token* y guardarlo como secreto `SONAR_TOKEN` del repositorio. Nunca se pega en el codigo ni en el chat.
6. Ejecutar el workflow en `dev`. El job `3. Analisis estatico + Quality Gate` falla si el Quality Gate no se aprueba.
   Con el plan gratuito este job solo corre en `main` y en PRs con destino `main` (ver la seccion siguiente).

## Plan gratuito de SonarCloud: efecto en el pipeline (decision del equipo)
El equipo usa el plan gratuito de SonarCloud. Segun la documentacion de planes de SonarQube Cloud, ese plan:
- analiza solo la rama principal (`main`);
- analiza los Pull Requests solo cuando su destino es `main`;
- no permite quality gates ni perfiles de calidad personalizados, asi que se usa el gate por defecto ("Sonar way"),
  cuyo umbral de cobertura sobre codigo nuevo es 80 %.

Consecuencia: en `dev` y `qa` no hay analisis y consultar el estado del Quality Gate falla con el mensaje
`Organization is not allowed to access data from non main branches` (visto en el log de la etapa 3 asociada al
PR #29, commit c72e6dc). Por eso, en `.github/workflows/ci-cd-fase2.yml`:
- la etapa 3 (analisis estatico + Quality Gate) solo se ejecuta en pushes a `main` y en Pull Requests con destino
  `main` (`if: github.ref == 'refs/heads/main' || github.base_ref == 'main'`);
- en `dev` y `qa` esa etapa aparece como omitida (Skipped) y la etapa 4 (pruebas de API) se ejecuta igual
  (`if: ${{ !failure() && !cancelled() }}`), sin ocultar fallos de las etapas 1 y 2;
- el Quality Gate se hace cumplir al promover codigo a `main` (PR `qa -> main`): el check de Sonar debe ser
  obligatorio en la regla de proteccion de `main`, y no en las de `dev` y `qa`.
  
## Evidencia que pide el enunciado
- **Reporte inicial** (antes de corregir): captura del dashboard con bugs, vulnerabilidades, code smells, duplicacion y deuda tecnica.
- **Remediacion**: corregir al menos los issues Blocker y Critical (filtro *Severity* en la pestana Issues).
- **Comparativa antes/despues** en una tabla (mismos 5 indicadores) y captura del Quality Gate en *Passed*; si no se aprueba, un plan de remediacion justificado.
- La cobertura que ve Sonar sale de `coverage/lcov.info`: requiere agregar `'lcov'` a `coverage.reporter` en `vitest.config.ts`.
