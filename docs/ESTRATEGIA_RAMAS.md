# Estrategia de ramas y control de cambios (ACS, Fase 2, E9)

Equipo (Grupo 3): Juan Jose Flores Figueroa, Josue Fernando Navas Najera, Marlon Isai Varela Marroquin.
Repositorio: VACLINIC (`Laboratorio-Clinico-Vaclinic`).

> Esta version reemplaza a la anterior (GitHub Flow con una sola rama `master`), que NO cumplia lo
> que pide E9: ramas DEV, QA y PROD con politica de promocion.

## Ramas permanentes (una por ambiente)

| Rama | Ambiente | Quien escribe | Que contiene |
|------|----------|---------------|--------------|
| `dev` | Desarrollo / integracion | Solo via Pull Request desde ramas de trabajo | Ultimo trabajo integrado, aun sin validar por QA |
| `qa` | Aseguramiento de calidad | Solo via Pull Request desde `dev` | Version candidata, sometida a pruebas completas |
| `main` (= PROD) | Produccion (Render) | Solo via Pull Request desde `qa` | Lo que ve el usuario final |

## Ramas de trabajo (cortas)

`feature/<tema>` para funcionalidades y pruebas, `fix/<tema>` para correcciones, `docs/<tema>` para documentacion.
Siempre se crean **desde `dev`** y se fusionan **a `dev`** por Pull Request.

## Politica de promocion

```
feature/* --PR--> dev --PR--> qa --PR--> main (PROD)
```

1. **Hacia `dev`**: PR con descripcion de que cambia y por que; pipeline en verde (compilacion, unitarias, analisis
   estatico, API) y **al menos 1 revision aprobada de un integrante distinto del autor**.
2. **Hacia `qa`**: PR `dev -> qa` cuando `dev` este estable. Mismas condiciones, mas: sin issues Blocker/Critical nuevos en
   SonarCloud y el Quality Gate aprobado.
3. **Hacia `main`**: PR `qa -> main` solo con el pipeline de `qa` en verde y revision de un integrante distinto del autor.
   El despliegue a Render lo dispara unicamente el pipeline, y solo tras la fusion en `main`.
4. **Nadie hace push directo** a `dev`, `qa` ni `main`. Las correcciones urgentes siguen el mismo camino
   (`fix/*` -> `dev` -> `qa` -> `main`), solo que mas rapido.

## Bloqueo por pipeline

El workflow `CI/CD Fase 2 (E13)` corre en `dev`, `qa` y `main`. Con las reglas de proteccion descritas en
`docs/PROTECCION_RAMAS.md`, GitHub **impide fusionar** un PR hacia `qa` o `main` mientras alguno de los jobs
(`compilacion`, `pruebas-unitarias`, `analisis-estatico`, `pruebas-api`) este en rojo o sin ejecutar.

## Revision de Pull Requests (que se espera encontrar en cada una)

La revision no es un "LGTM": el revisor deja al menos un comentario sobre el contenido (logica, casos de prueba que
faltan, nombres, riesgos) y el autor responde o corrige. Ejemplos de lo que se comenta: una prueba unitaria que no
cubre el caso limite, una aserción de API que solo valida el codigo HTTP y no el contenido, un secreto escrito en
el codigo, un nombre de variable ambiguo.

## Roles (enunciado, seccion 3)

- Analista de Pruebas: Marlon Isai Varela Marroquin.
- Ingeniero de Automatizacion: Josue Fernando Navas Najera.
- Ingeniero de Plataforma / DevOps: Juan Jose Flores Figueroa.

Cada persona abre PRs sobre su area y revisa los PRs de otra persona (rotacion: Marlon revisa a Josue, Josue a Juan Jose,
Juan Jose a Marlon).
