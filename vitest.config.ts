import { defineConfig } from 'vitest/config';

// Configuración de pruebas unitarias para el entregable E10 (ACS, Fase 2).
// environment 'node' porque las pruebas escritas cubren lógica de backend
// (Express routers, autenticación, tokens) y utilidades puras de frontend
// (src/utils/referenceRangeEvaluator.ts) que no requieren DOM.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      // Cobertura medida SOLO sobre los módulos críticos identificados en el
      // entregable E2 (sección 2.5), contra la línea base de 0% registrada
      // en la sección 2.4 del enunciado de ACS.
      include: [
        'server/routes/resultados.ts',
        'server/routes/ordenes.ts',
        'server/routes/portal.ts',
        'server/auth-firebase.ts',
        'server/permissions-middleware.ts',
        'src/shared/permissions.ts',
        'server/token.ts',
      ],
    },
  },
});
