# SonarCloud (E12) - pasos manuales

1. Entrar a https://sonarcloud.io con *Log in with GitHub* usando la cuenta `mvarelam1-hub` (lo hace una persona, no el pipeline).
2. *+ > Analyze new project*, elegir la organizacion de GitHub e **importar `Laboratorio-Clinico-Vaclinic`**.
   Como el repositorio es privado, el plan gratuito de SonarCloud puede no cubrirlo: si lo rechaza, usar una de estas salidas
   (la decision es del equipo): hacer el repositorio publico, usar el periodo de prueba, o instalar SonarQube Community en local.
3. En el proyecto: *Administration > Analysis Method* y **desactivar "Automatic Analysis"** (si esta activo, choca con el analisis del pipeline).
4. Copiar los valores **Project Key** y **Organization** a `sonar-project.properties` si difieren de los que ya trae.
5. *My Account > Security > Generate Token* y guardarlo como secreto `SONAR_TOKEN` del repositorio. Nunca se pega en el codigo ni en el chat.
6. Ejecutar el workflow en `dev`. El job `3. Analisis estatico + Quality Gate` falla si el Quality Gate no se aprueba.

## Evidencia que pide el enunciado
- **Reporte inicial** (antes de corregir): captura del dashboard con bugs, vulnerabilidades, code smells, duplicacion y deuda tecnica.
- **Remediacion**: corregir al menos los issues Blocker y Critical (filtro *Severity* en la pestana Issues).
- **Comparativa antes/despues** en una tabla (mismos 5 indicadores) y captura del Quality Gate en *Passed*; si no se aprueba, un plan de remediacion justificado.
- La cobertura que ve Sonar sale de `coverage/lcov.info`: requiere agregar `'lcov'` a `coverage.reporter` en `vitest.config.ts`.
