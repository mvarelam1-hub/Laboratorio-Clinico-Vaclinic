# Proteccion de ramas y colaboradores (E9) - pasos manuales en GitHub

Estos pasos solo los puede hacer el **dueno del repositorio** (cuenta `mvarelam1-hub`) desde la web de GitHub.

## 1. Agregar a los otros dos integrantes como colaboradores
Settings > Collaborators > Add people: Josue Fernando Navas Najera y Juan Jose Flores Figueroa (con permiso *Write*).
Sin esto no pueden abrir ni revisar Pull Requests, y E9 exige minimo 3 PRs con revision efectiva de otro integrante.

## 2. Crear las ramas de ambiente
En la pestana *Code*, desplegar el selector de ramas, escribir `dev` y elegir *Create branch: dev from main*; repetir con `qa`.

## 3. Reglas de proteccion (Settings > Branches > Add branch ruleset)
Crear una regla para cada una de `qa` y `main` (y, si se desea, `dev`):

- **Require a pull request before merging**, con **Required approvals = 1** y *Dismiss stale approvals*.
- **Require status checks to pass before merging** y marcar como obligatorios los 4 checks del workflow
  `CI/CD Fase 2 (E13)`: `1. Compilacion (tipos + build)`, `2. Pruebas unitarias con cobertura (E10)`,
  `3. Analisis estatico + Quality Gate (E12)` y `4. Pruebas de API con Newman (E11)`.
  (Los checks aparecen en la lista despues de la primera ejecucion del workflow.)
- **Require branches to be up to date before merging**.
- **Block force pushes** y **Restrict deletions**.
- Si se quiere incluir al dueno: desactivar *Allow bypass*; si no, el dueno puede saltarse las reglas y la evidencia pierde valor.

## 4. Secretos del repositorio (Settings > Secrets and variables > Actions)
| Secreto | Para que | Como se obtiene |
|---------|----------|-----------------|
| `SONAR_TOKEN` | Analisis en SonarCloud (E12) | SonarCloud > My Account > Security |
| `RENDER_DEPLOY_HOOK_URL` | Despliegue controlado por el pipeline (E13) | Render > servicio > Settings > Deploy Hook |
| `CODIGO_CARGA` | Prueba de carga k6 (E14) | Codigo de consulta de un paciente de PRUEBA |

Recomendado: en Render, Settings > *Auto-Deploy = Off*, para que **solo el pipeline** despliegue (si el pipeline falla, no se
despliega).

## 5. Verificacion (para la evidencia de E9)
- Settings > Branches (o Rules) muestra las reglas de `qa` y `main`.
- Un PR de prueba con el pipeline en rojo muestra el boton *Merge* deshabilitado: capturar pantalla.
- La pestana *Pull requests > Closed* muestra >= 3 PRs, cada uno con revision de otra persona (y sus comentarios).
