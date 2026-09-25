"""
Pruebas de sistema / aceptación (pytest + Selenium, navegador real headless)
contra el frontend real de VACLINIC. Corresponden a los casos TC-15 y TC-16
del Plan de Pruebas.

Alcance deliberado: estas pruebas automatizadas verifican que la aplicación
carga y renderiza de verdad en un navegador (humo/aceptación de alto nivel).
La interacción profunda de UI (clics dentro del flujo de inicio de sesión
del personal o del Portal del paciente, validaciones de formulario en
pantalla) queda como prueba MANUAL de UX — así lo pide explícitamente el
enunciado ("estrategia: automatizada con pytest + Selenium; manual para
UX") y evita selectores frágiles atados a clases de Tailwind que cambian
con cada ajuste visual.
"""
import pytest
from selenium.webdriver.common.by import By


@pytest.mark.sistema
def test_tc15_pagina_principal_carga_y_titulo_correcto(driver, base_url):
    """
    TC-15 — Carga de la aplicación en un navegador real.
    Precondición: servidor real corriendo, build de frontend servible.
    Pasos: abrir base_url en Chrome headless real.
    Resultado esperado: el título del documento es
    "LABVACLINIC - Laboratorio Clínico" (definido en index.html) y el nodo
    raíz de React (#root) queda con contenido renderizado (no vacío), es
    decir, la SPA realmente montó — no solo se sirvió el HTML estático.
    """
    driver.get(base_url)
    assert driver.title == "LABVACLINIC - Laboratorio Clínico"

    root = driver.find_element(By.ID, "root")
    driver.implicitly_wait(10)
    assert len(root.get_attribute("innerHTML")) > 0


@pytest.mark.sistema
def test_tc16_formulario_interactivo_visible_al_cargar(driver, base_url):
    """
    TC-16 — La pantalla de bienvenida ofrece un punto de entrada interactivo.
    Precondición: la misma sesión de navegador de TC-15 ya cargó la app.
    Pasos: buscar al menos un elemento de formulario (input o button)
    visible en la página inicial.
    Resultado esperado: existe al menos un <input> o <button> en el DOM
    renderizado, evidencia de que la vista inicial (login de personal o
    bienvenida del Portal, según el flujo con el que arranque la SPA) es
    realmente interactiva y no una pantalla estática o en blanco.
    """
    driver.get(base_url)
    inputs = driver.find_elements(By.TAG_NAME, "input")
    buttons = driver.find_elements(By.TAG_NAME, "button")
    assert (len(inputs) + len(buttons)) > 0
