"""
Configuración compartida de la suite de pruebas en Python (pytest + Selenium)
del Entregable DevOps 2 (ACS, Fase 2).

Por qué pytest + Selenium sobre un proyecto Node.js/TypeScript: el enunciado
pide explícitamente esta estrategia de automatización. Selenium y pytest
son agnósticos al lenguaje del backend porque prueban la aplicación "de
afuera hacia adentro" (HTTP real + navegador real contra la URL real), igual
que lo haría un usuario o un cliente HTTP cualquiera. Esta suite en Python
es una capa adicional de pruebas de integración/sistema/aceptación/
seguridad/rendimiento que se SUMA a la suite nativa ya existente del
proyecto (Vitest + Supertest, 19 archivos, 230+ aserciones, entregable E10),
no la reemplaza: las pruebas unitarias de lógica interna (rutas Express,
utilidades TypeScript) siguen siendo responsabilidad de Vitest, que es la
herramienta nativa del stack real del proyecto.

BASE_URL apunta por defecto a una instancia local de VACLINIC levantada en
la propia corrida de CI (ver .github/workflows/ci-cd-e12.yml), con una base
de datos PostgreSQL real y efímera — nunca contra la base de datos de
producción (Neon), para no alterar datos reales de pacientes ni consumir la
capa gratuita de Render con carga de pruebas.
"""
import os
import time
import pytest
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

BASE_URL = os.environ.get("VACLINIC_BASE_URL", "http://localhost:3000")
DEV_BYPASS_TOKEN = "DEV_BYPASS"  # Solo funciona si el servidor tiene NODE_ENV != production
def _default_chromedriver_path() -> str:
    try:
        from chromedriver_py import binary_path
        return binary_path
    except ImportError:
        return "/opt/node22/bin/chromedriver"


def _default_chrome_binary() -> str:
    """
    Prioriza el Chromium de Playwright ya preinstalado en este entorno
    (/opt/pw-browsers), y si no existe cae al Chrome del sistema.
    En CI (GitHub Actions) se usa el Chrome que instala
    browser-actions/setup-chrome (ver .github/workflows/ci-cd-e12.yml),
    indicado por la variable de entorno CHROME_BINARY.
    """
    import glob
    candidatos = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")
    if candidatos:
        return candidatos[0]
    return "/opt/google/chrome/chrome"


CHROMEDRIVER_PATH = os.environ.get("CHROMEDRIVER_PATH", _default_chromedriver_path())
CHROME_BINARY = os.environ.get("CHROME_BINARY", _default_chrome_binary())


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api():
    """Sesión de requests reutilizable para las pruebas de integración/seguridad."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def staff_auth_headers():
    """
    Cabecera de autenticación de personal usando el bypass de desarrollo
    (DEV_AUTH_BYPASS_UID), documentado en server/auth-firebase.ts y en el
    README del proyecto. El servidor de CI se levanta con
    NODE_ENV=development y DEV_AUTH_BYPASS_UID mapeado a un usuario real
    de la base de datos semilla (director_laboratorio), para poder ejercer
    rutas protegidas sin depender de credenciales reales de Firebase.
    """
    return {"Authorization": f"Bearer {DEV_BYPASS_TOKEN}"}


@pytest.fixture(scope="session")
def driver():
    """WebDriver de Chrome headless para las pruebas de sistema/aceptación."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1366,900")
    if os.path.exists(CHROME_BINARY):
        options.binary_location = CHROME_BINARY

    service = Service(executable_path=CHROMEDRIVER_PATH) if os.path.exists(CHROMEDRIVER_PATH) else Service()
    drv = webdriver.Chrome(service=service, options=options)
    drv.implicitly_wait(5)
    yield drv
    drv.quit()


def wait_for_server(url: str, timeout_seconds: int = 60):
    """Espera activamente a que el servidor real responda antes de correr la suite."""
    deadline = time.time() + timeout_seconds
    last_error = None
    while time.time() < deadline:
        try:
            r = requests.get(f"{url}/api/health", timeout=3)
            if r.status_code == 200:
                return True
        except requests.exceptions.RequestException as exc:
            last_error = exc
        time.sleep(1)
    raise RuntimeError(f"El servidor de VACLINIC no respondió en {timeout_seconds}s en {url}: {last_error}")


@pytest.fixture(scope="session", autouse=True)
def ensure_server_up():
    wait_for_server(BASE_URL)
