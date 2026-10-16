"""
E11 (ACS, Fase 2): agrega aserciones de ESQUEMA JSON (pm.response.to.have.jsonSchema) a las
40 solicitudes de la coleccion, sin tocar las aserciones existentes de codigo y contenido.
Es idempotente: si una solicitud ya tiene la prueba de esquema, no la duplica.
Uso: python3 postman/agregar_esquemas.py postman/vaclinic.postman_collection.json
"""
import json
import sys

ERROR = {"type": "object", "required": ["error"],
         "properties": {"error": {"type": "string", "minLength": 1}}}
PENDIENTES = {"type": "array", "items": {"type": "object",
              "required": ["id_orden", "numero_orden", "paciente", "fecha_registro"],
              "properties": {"id_orden": {"type": "integer"}, "numero_orden": {"type": "string"},
                             "paciente": {"type": "string"}, "fecha_registro": {"type": "string"}}}}
ORDEN_CREADA = {"type": "object", "required": ["id_orden", "numero_orden", "codigo_consulta", "detalle"],
                "properties": {"id_orden": {"type": "integer"}, "numero_orden": {"type": "string"},
                               "codigo_consulta": {"type": "string", "minLength": 1},
                               "detalle": {"type": "array", "minItems": 1}}}
LOGIN_PORTAL = {"type": "object", "required": ["token", "expiresInSeconds"],
                "properties": {"token": {"type": "string", "minLength": 20},
                               "expiresInSeconds": {"type": "integer", "minimum": 1}}}
ORDEN_PORTAL = {"type": "object", "required": ["idOrden", "resultados"],
                "properties": {"idOrden": {"type": "integer"}, "resultados": {"type": "array"}}}
TRANSICION = {"type": "object", "required": ["ok", "idResultado", "estadoAnterior", "estadoNuevo"],
              "properties": {"ok": {"type": "boolean", "const": True}, "idResultado": {"type": "integer"},
                             "estadoAnterior": {"type": "string"}, "estadoNuevo": {"type": "string"}}}
HISTORIAL = {"type": "object", "required": ["idResultado", "versiones"],
             "properties": {"idResultado": {"type": "integer"}, "versiones": {"type": "array"}}}

MARCA = "esquema JSON valido"


def esquema_para(nombre):
    n = nombre.lower()
    if any(x in n for x in ["-> 401", "-> 400", "-> 403", "-> 404", "-> 429"]) or "-> 400" in n:
        return "ERROR", ERROR
    if "pendientes-validacion con bypass" in n:
        return "PENDIENTES", PENDIENTES
    if "post orden valida" in n:
        return "ORDEN_CREADA", ORDEN_CREADA
    if "portal login con codigo valido" in n:
        return "LOGIN_PORTAL", LOGIN_PORTAL
    if "get portal/orden" in n:
        return "ORDEN_PORTAL", ORDEN_PORTAL
    if "/historial" in n and "recepcionista" not in n:
        return "HISTORIAL", HISTORIAL
    if n.startswith("patch resultados/1/") and "-> 4" not in n:
        return "TRANSICION", TRANSICION
    return None, None


def main(ruta):
    col = json.load(open(ruta, encoding="utf-8"))
    conteo, sin = {}, []
    for carpeta in col["item"]:
        for r in carpeta["item"]:
            nombre_esq, esq = esquema_para(r["name"])
            if esq is None:
                sin.append(r["name"])
                continue
            ev = next((e for e in r.setdefault("event", []) if e["listen"] == "test"), None)
            if ev is None:
                ev = {"listen": "test", "script": {"type": "text/javascript", "exec": []}}
                r["event"].append(ev)
            exec_ = ev["script"]["exec"]
            if any(MARCA in linea for linea in exec_):
                continue
            exec_.append(f"pm.test('{MARCA} ({nombre_esq})', () => pm.response.to.have.jsonSchema({json.dumps(esq)}));")
            conteo[nombre_esq] = conteo.get(nombre_esq, 0) + 1
    json.dump(col, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(ruta, "a", encoding="utf-8").write("\n")
    print("esquemas agregados:", conteo, "| sin esquema:", sin)


if __name__ == "__main__":
    main(sys.argv[1])
