# Estrategia de ramas (ACS, Fase 2, E9)

Equipo: Grupo 3 (Juan Jose Flores Figueroa, Josue Fernando Navas Najera, Marlon Isai Varela Marroquin).
Repositorio: VACLINIC.

## Modelo

Trunk-based simplificado (GitHub Flow):

- master: rama principal, siempre desplegable. Nadie hace commits directos aqui para trabajo en progreso.
- feature/<nombre-corto>: una rama por entregable o tarea (ejemplo real: feature/ci-pipeline, esta misma rama).
- fix/<nombre-corto>: para correcciones puntuales que no son una funcionalidad nueva.

## Flujo de trabajo

1. Crear la rama desde master: feature/<nombre-corto>.
2. Hacer commits pequenos y descriptivos en esa rama (prefijos usados en este repositorio: chore, test, fix, ci, docs).
3. Abrir un Pull Request de la rama hacia master, describiendo que cambia y por que.
4. Revision: al menos un integrante del equipo distinto del autor revisa el PR antes de aprobarlo (en un repositorio de 3 personas, revision cruzada entre los 3).
5. La verificacion automatica de CI (E13, .github/workflows/ci.yml) debe pasar en el PR antes de fusionar.
6. Fusionar con squash merge (un solo commit limpio en master) y eliminar la rama.

## Ejemplo real de este proyecto

La rama feature/ci-pipeline (este mismo cambio) agrega el pipeline de integracion continua y esta misma estrategia de ramas, y se fusiona a master mediante un Pull Request real, no con un commit directo.

## Por que este modelo y no GitFlow completo

El equipo es de 3 personas con entregas academicas cortas (Fases 1 y 2 del curso ACS), sin necesidad de mantener multiples versiones en produccion en paralelo. GitHub Flow (master + ramas de feature + PR) da la trazabilidad y revision que pide el E9 sin la sobrecarga de ramas develop/release que GitFlow agrega para proyectos con ciclos de release mas largos.
