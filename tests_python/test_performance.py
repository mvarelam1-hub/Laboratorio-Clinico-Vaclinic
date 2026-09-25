"""
Pruebas básicas de rendimiento (pytest + requests) contra el backend real de
VACLINIC. Corresponden a los casos TC-17 y TC-18 del Plan de Pruebas.

Alcance deliberado: se ejecuta contra la instancia LOCAL levantada en CI
(base de datos y servidor reales, pero efímeros), nunca contra el despliegue
de producción en Render (capa gratuita) — una prueba de carga real contra
ese entorno gratuito podría saturarlo o afectar el uso real del equipo. Los
umbrales son deliberadamente permisivos (pensados para un runner compartido
de GitHub Actions, no para una medición de capacidad productiva), pero la
medición en sí es real: son latencias medidas de peticiones HTTP reales.
"""
import time
import statistics
import concurrent.futures
import pytest


@pytest.mark.rendimiento
def test_tc17_latencia_promedio_health_check(api, base_url):
    """
    TC-17 — Latencia del endpoint de salud bajo carga secuencial ligera.
    Precondición: servidor real corriendo.
    Pasos: 20 peticiones GET /api/health secuenciales, midiendo el tiempo
    de cada una.
    Resultado esperado: las 20 responden 200 y el promedio es menor a 500 ms
    (umbral generoso para un runner compartido de CI).
    """
    tiempos = []
    for _ in range(20):
        inicio = time.perf_counter()
        r = api.get(f"{base_url}/api/health")
        tiempos.append(time.perf_counter() - inicio)
        assert r.status_code == 200

    promedio = statistics.mean(tiempos)
    assert promedio < 0.5, f"Latencia promedio {promedio*1000:.1f} ms supera el umbral de 500 ms"


@pytest.mark.rendimiento
def test_tc18_diez_peticiones_concurrentes_sin_errores(base_url):
    """
    TC-18 — Estabilidad ante concurrencia básica.
    Precondición: servidor real corriendo.
    Pasos: 10 peticiones GET /api/health disparadas de forma concurrente
    (10 hilos).
    Resultado esperado: las 10 responden 200 en menos de 5 segundos en
    total, sin excepciones de conexión.
    """
    import requests

    def hacer_peticion():
        return requests.get(f"{base_url}/api/health", timeout=5)

    inicio = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        resultados = list(executor.map(lambda _: hacer_peticion(), range(10)))
    duracion = time.perf_counter() - inicio

    assert all(r.status_code == 200 for r in resultados)
    assert duracion < 5.0, f"10 peticiones concurrentes tardaron {duracion:.2f}s (umbral 5s)"
