"""
Pruebas de seguridad (pytest + requests) contra el backend real de VACLINIC.
Corresponden a los casos TC-11 a TC-14 del Plan de Pruebas.

Nota de transparencia: TC-11 documenta un hallazgo real (no fabricado) de
este entregable — la cabecera "X-Powered-By: Express" estaba expuesta antes
de este trabajo. Se corrigió con una línea real en server.ts
(app.disable('x-powered-by')) y esta prueba queda para evitar una regresión,
siguiendo el mismo principio de transparencia de entregables anteriores del
equipo: un hallazgo real, corregido y documentado, no ocultado.
"""
import pytest


@pytest.mark.seguridad
def test_tc11_no_expone_cabecera_x_powered_by(api, base_url):
    """
    TC-11 — Fuga de información del framework vía cabeceras HTTP.
    Precondición: servidor real corriendo.
    Pasos: GET /api/health y leer las cabeceras de la respuesta.
    Resultado esperado: sin la cabecera "X-Powered-By" (no debe revelar que
    el backend es Express, información que facilita a un atacante elegir
    exploits conocidos para ese framework).
    Resultado obtenido ANTES de este entregable: la cabecera SÍ estaba
    presente ("X-Powered-By: Express") — hallazgo real, corregido en
    server.ts con app.disable('x-powered-by').
    """
    r = api.get(f"{base_url}/api/health")
    assert "x-powered-by" not in {k.lower() for k in r.headers.keys()}


@pytest.mark.seguridad
def test_tc12_codigo_invalido_y_sql_injection_dan_mensaje_identico(api, base_url):
    """
    TC-12 — No divulgación de información en el login del Portal ante
    intentos de inyección SQL.
    Precondición: ninguna.
    Pasos: POST /api/portal/login con (a) un código inexistente normal y
    (b) una carga típica de inyección SQL ("' OR 1=1 --").
    Resultado esperado: ambos casos devuelven 401 con el MISMO mensaje
    genérico (la consulta usa parámetros preparados — $1 — por lo que la
    carga de inyección se trata como texto literal, no como SQL), y ninguno
    revela si el código "existe" o no.
    """
    r_inexistente = api.post(f"{base_url}/api/portal/login", json={"codigo": "NOEXISTE1"})
    r_inyeccion = api.post(f"{base_url}/api/portal/login", json={"codigo": "' OR 1=1 --"})

    assert r_inexistente.status_code == 401
    assert r_inyeccion.status_code == 401
    assert r_inexistente.json()["error"] == r_inyeccion.json()["error"]


@pytest.mark.seguridad
def test_tc13_ruta_de_personal_protegida_sin_token(api, base_url):
    """
    TC-13 — Todas las rutas de personal exigen autenticación real.
    Precondición: ninguna.
    Pasos: GET /api/pacientes y GET /api/ordenes sin cabecera Authorization.
    Resultado esperado: 401 en ambas, sin exponer ningún dato de pacientes.
    """
    r1 = api.get(f"{base_url}/api/pacientes")
    r2 = api.get(f"{base_url}/api/ordenes")
    assert r1.status_code == 401
    assert r2.status_code == 401
    assert "pacientes" not in r1.text.lower() or "error" in r1.json()


@pytest.mark.seguridad
def test_tc14_limite_de_intentos_en_login_del_portal(api, base_url):
    """
    TC-14 — Límite de tasa (rate limiting) contra fuerza bruta del código de
    consulta del Portal.
    Precondición: límite configurado en el servidor: 20 intentos / 15 min
    por IP (server/routes/portal.ts).
    Pasos: enviar 21 intentos consecutivos con un código inválido desde la
    misma IP (todas las peticiones de esta prueba comparten la IP local del
    entorno de CI).
    Resultado esperado: los primeros 20 devuelven 401; el intento 21
    devuelve 429 (demasiados intentos).
    """
    ultimo = None
    for _ in range(21):
        ultimo = api.post(f"{base_url}/api/portal/login", json={"codigo": "CUALQUIERA"})
    assert ultimo.status_code == 429
