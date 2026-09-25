"""
Pruebas de integración de API (pytest + requests) contra el backend real de
VACLINIC (Express + PostgreSQL). Corresponden a los casos TC-06 a TC-10 del
Plan de Pruebas.
"""
import time
import pytest


@pytest.mark.integracion
def test_tc06_health_check_reporta_bd_conectada(api, base_url):
    """
    TC-06 — Health check del backend.
    Precondición: servidor y base de datos levantados con migraciones aplicadas.
    Pasos: GET /api/health.
    Resultado esperado: 200, status=ok, db=ok, con la última migración aplicada.
    """
    r = api.get(f"{base_url}/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"
    assert body["migraciones"]["aplicadas"] >= 12


@pytest.mark.integracion
def test_tc07_whoami_sin_token_rechazado(api, base_url):
    """
    TC-07 — Ruta de personal sin autenticación.
    Precondición: ninguna (petición anónima).
    Pasos: GET /api/auth/whoami sin cabecera Authorization.
    Resultado esperado: 401 y mensaje indicando que falta el token.
    """
    r = api.get(f"{base_url}/api/auth/whoami")
    assert r.status_code == 401
    assert "token" in r.json()["error"].lower()


@pytest.mark.integracion
def test_tc08_whoami_con_bypass_devuelve_usuario_real(api, base_url, staff_auth_headers):
    """
    TC-08 — Identidad de personal autenticado.
    Precondición: usuario semilla director_laboratorio con uid mapeado al bypass de CI.
    Pasos: GET /api/auth/whoami con Authorization: Bearer DEV_BYPASS.
    Resultado esperado: 200 con nombreCompleto y roleId reales de la base de datos.
    """
    r = api.get(f"{base_url}/api/auth/whoami", headers=staff_auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["roleId"] == "director_laboratorio"
    assert body["nombreCompleto"]


@pytest.mark.integracion
def test_tc09_crear_orden_sin_permiso_es_rechazada(api, base_url):
    """
    TC-09 — Autorización por rol (RBAC) al crear una orden.
    Precondición: ninguna cuenta de personal autenticada (petición anónima → 401
    antes de llegar a la verificación de permiso; ver TC-07 para el caso 403 con
    un rol autenticado sin el permiso, cubierto por la suite Vitest nativa en
    ordenes.test.ts, que sí puede simular un rol "bioanalista" autenticado sin
    depender de una fila de base de datos real).
    Pasos: POST /api/ordenes sin cabecera Authorization.
    Resultado esperado: 401, ninguna orden creada.
    """
    r = api.post(f"{base_url}/api/ordenes", json={"idPaciente": 1, "examenesIds": [1]})
    assert r.status_code == 401


@pytest.mark.integracion
def test_tc10_flujo_completo_orden_y_consulta_portal(api, base_url, staff_auth_headers):
    """
    TC-10 — Flujo de negocio de punta a punta: creación de orden → código de
    consulta → acceso del paciente por el Portal.
    Precondición: paciente id=1 y examen id=1 existentes (semilla de datos).
    Pasos:
      1. POST /api/ordenes (personal autenticado) con idPaciente=1, examenesIds=[1].
      2. Tomar el codigo_consulta devuelto.
      3. POST /api/portal/login (sin autenticación de personal) con ese código.
    Resultado esperado: la orden se crea (201) con un codigo_consulta de 8
    caracteres, y ese código autentica al paciente en el Portal (200, con un
    token de sesión de paciente).
    """
    r_orden = api.post(
        f"{base_url}/api/ordenes",
        json={"idPaciente": 1, "examenesIds": [1]},
        headers=staff_auth_headers,
    )
    assert r_orden.status_code == 201
    codigo = r_orden.json()["codigo_consulta"]
    assert codigo and len(codigo) == 8

    r_portal = api.post(f"{base_url}/api/portal/login", json={"codigo": codigo})
    assert r_portal.status_code == 200
    portal_body = r_portal.json()
    assert "token" in portal_body
    assert portal_body["expiresInSeconds"] > 0
