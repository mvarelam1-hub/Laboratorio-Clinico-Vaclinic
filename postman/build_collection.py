"""
Genera la coleccion de Postman para el E11 (ACS, Fase 2) a partir de una
definicion en Python -- mas facil de mantener sin errores de JSON a mano.
Uso: python3 postman/build_collection.py > postman/vaclinic.postman_collection.json
"""
import json

BASE = "{{baseUrl}}"


def req(name, method, url, body=None, headers=None, tests=""):
    item = {
        "name": name,
        "request": {
            "method": method,
            "header": [{"key": k, "value": v} for k, v in (headers or {}).items()],
            "url": {"raw": BASE + url, "host": [BASE], "path": url.lstrip("/").split("/")},
        },
        "response": [],
    }
    if body is not None:
        item["request"]["header"].append({"key": "Content-Type", "value": "application/json"})
        item["request"]["body"] = {"mode": "raw", "raw": json.dumps(body)}
    if tests:
        item["event"] = [{
            "listen": "test",
            "script": {"type": "text/javascript", "exec": tests.strip("\n").split("\n")},
        }]
    return item


def folder(name, items):
    return {"name": name, "item": items}


auth_bypass = {"Authorization": "Bearer DEV_BYPASS"}

folder1 = folder("01 - Autenticacion de personal", [
    req(
        "GET pendientes-validacion sin token -> 401",
        "GET", "/api/ordenes/pendientes-validacion",
        tests="""
pm.test('status 401', () => pm.response.to.have.status(401));
"""),
    req(
        "GET pendientes-validacion con bypass (director) -> 200",
        "GET", "/api/ordenes/pendientes-validacion", headers=auth_bypass,
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('respuesta es un arreglo', () => Array.isArray(pm.response.json()));
"""),
])

folder2 = folder("02 - Ordenes (particion de equivalencia CP-05..CP-07)", [
    req(
        "POST orden valida (clase valida) -> 201",
        "POST", "/api/ordenes", body={"idPaciente": 1, "examenesIds": [1]}, headers=auth_bypass,
        tests="""
pm.test('status 201', () => pm.response.to.have.status(201));
const body = pm.response.json();
pm.test('trae id_orden y numero_orden', () => {
    pm.expect(body.id_orden).to.be.a('number');
    pm.expect(body.numero_orden).to.be.a('string');
});
pm.collectionVariables.set('nuevaOrdenId', body.id_orden);
"""),
    req(
        "POST orden examenesIds vacio (clase invalida) -> 400",
        "POST", "/api/ordenes", body={"idPaciente": 1, "examenesIds": []}, headers=auth_bypass,
        tests="""
pm.test('status 400', () => pm.response.to.have.status(400));
"""),
    req(
        "POST orden sin idPaciente (clase invalida) -> 400",
        "POST", "/api/ordenes", body={"examenesIds": [1]}, headers=auth_bypass,
        tests="""
pm.test('status 400', () => pm.response.to.have.status(400));
"""),
    req(
        "POST orden con examen inexistente -> 400 y ROLLBACK (CP-07)",
        "POST", "/api/ordenes", body={"idPaciente": 1, "examenesIds": [1, 999999]}, headers=auth_bypass,
        tests="""
pm.test('status 400', () => pm.response.to.have.status(400));
"""),
])

folder3 = folder("03 - Resultados y Portal - ciclo de vida real (integracion)", [
    req(
        "Portal login con codigo valido -> 200",
        "POST", "/api/portal/login", body={"codigo": "DEMO1234"},
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
const body = pm.response.json();
pm.test('trae token', () => pm.expect(body.token).to.be.a('string'));
pm.collectionVariables.set('portalToken', body.token);
"""),
    req(
        "GET portal/orden ANTES de publicar -> resultado Borrador oculto (0)",
        "GET", "/api/portal/orden", headers={"Authorization": "Bearer {{portalToken}}"},
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('0 resultados visibles (Borrador se filtra)', () => {
    pm.expect(pm.response.json().resultados).to.have.lengthOf(0);
});
"""),
    req(
        "PATCH resultados/1/validar -> Validado",
        "PATCH", "/api/resultados/1/validar", headers=auth_bypass,
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('estadoNuevo Validado', () => pm.expect(pm.response.json().estadoNuevo).to.eql('Validado'));
"""),
    req(
        "PATCH resultados/1/publicar -> Publicado",
        "PATCH", "/api/resultados/1/publicar", headers=auth_bypass,
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('estadoNuevo Publicado', () => pm.expect(pm.response.json().estadoNuevo).to.eql('Publicado'));
"""),
    req(
        "GET portal/orden DESPUES de publicar -> resultado visible (CP-42)",
        "GET", "/api/portal/orden", headers={"Authorization": "Bearer {{portalToken}}"},
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
const body = pm.response.json();
pm.test('1 resultado visible con valor correcto', () => {
    pm.expect(body.resultados).to.have.lengthOf(1);
    pm.expect(body.resultados[0].valor).to.eql('150');
});
"""),
    req(
        "GET resultados/1/historial -> version registrada por el trigger real de auditoria",
        "GET", "/api/resultados/1/historial", headers=auth_bypass,
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('al menos una version en el historial', () => {
    pm.expect(pm.response.json().versiones.length).to.be.above(0);
});
"""),
    req(
        "PATCH resultados/1/corregir SIN motivo -> 400 (CP-11)",
        "PATCH", "/api/resultados/1/corregir", body={}, headers=auth_bypass,
        tests="""
pm.test('status 400', () => pm.response.to.have.status(400));
"""),
    req(
        "PATCH resultados/1/corregir CON motivo -> En correccion",
        "PATCH", "/api/resultados/1/corregir", body={"motivo": "Repeticion de prueba (E11)"}, headers=auth_bypass,
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('estadoNuevo En correccion', () => pm.expect(pm.response.json().estadoNuevo).to.eql('En correccion'));
"""),
    req(
        "GET portal/orden DESPUES de corregir -> vuelve a ocultarse (0)",
        "GET", "/api/portal/orden", headers={"Authorization": "Bearer {{portalToken}}"},
        tests="""
pm.test('status 200', () => pm.response.to.have.status(200));
pm.test('0 resultados visibles otra vez', () => {
    pm.expect(pm.response.json().resultados).to.have.lengthOf(0);
});
"""),
    req(
        "PATCH resultados/999999/validar -> 404 (no existe)",
        "PATCH", "/api/resultados/999999/validar", headers=auth_bypass,
        tests="""
pm.test('status 404', () => pm.response.to.have.status(404));
"""),
    req(
        "PATCH resultados/1/volar -> 400 (accion no reconocida)",
        "PATCH", "/api/resultados/1/volar", headers=auth_bypass,
        tests="""
pm.test('status 400', () => pm.response.to.have.status(400));
pm.test('lista acciones validas en el mensaje', () => {
    pm.expect(pm.response.json().error).to.match(/validar, publicar, corregir/);
});
"""),
])

# Folder 4: valores limite del rate limit del portal (RF-14). El folder 3 ya
# consumio 1 intento exitoso de /api/portal/login desde esta IP, dentro de la
# misma ventana de 15 minutos (el limitador es en memoria, por proceso). Aqui
# se agregan 20 intentos con codigo invalido: los primeros 19 (acumulado 2-20)
# deben responder 401 (codigo no encontrado), y el intento 20 de este folder
# (acumulado 21) debe responder 429 (limite excedido).
rate_limit_items = []
for i in range(1, 21):
    expected = 429 if i == 20 else 401
    rate_limit_items.append(req(
        f"Intento fallido #{i} (acumulado {i + 1}) -> {expected}",
        "POST", "/api/portal/login", body={"codigo": f"NOEXISTE{i}"},
        tests=f"""
pm.test('status {expected}', () => pm.response.to.have.status({expected}));
"""))
folder4 = folder("04 - Portal, valores limite de tasa (RF-14)", rate_limit_items)

folder5 = folder(
    "05 - Autorizacion negativa con rol limitado (ejecutar aparte, servidor con "
    "DEV_AUTH_BYPASS_UID=uid-recepcionista-e11)",
    [
        req(
            "PATCH resultados/1/validar como recepcionista -> 403",
            "PATCH", "/api/resultados/1/validar", headers=auth_bypass,
            tests="""
pm.test('status 403', () => pm.response.to.have.status(403));
"""),
        req(
            "GET resultados/1/historial como recepcionista -> 403",
            "GET", "/api/resultados/1/historial", headers=auth_bypass,
            tests="""
pm.test('status 403', () => pm.response.to.have.status(403));
"""),
        req(
            "GET ordenes/resultados-criticos como recepcionista -> 403",
            "GET", "/api/ordenes/resultados-criticos", headers=auth_bypass,
            tests="""
pm.test('status 403', () => pm.response.to.have.status(403));
"""),
    ],
)

collection = {
    "info": {
        "name": "VACLINIC API - E11 (ACS Fase 2)",
        "description": (
            "Pruebas de API reales (no unitarias, no mockeadas) contra el servidor "
            "Express real de VACLINIC y una base de datos PostgreSQL local con el "
            "esquema real (db/migrations) mas datos de prueba. Ejecutar con Newman: "
            "ver postman/README.md."
        ),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:3000"},
        {"key": "portalToken", "value": ""},
        {"key": "nuevaOrdenId", "value": ""},
    ],
    "item": [folder1, folder2, folder3, folder4, folder5],
}

print(json.dumps(collection, indent=2, ensure_ascii=False))
