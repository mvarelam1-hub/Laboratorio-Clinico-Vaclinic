/**
 * Navegación con el teclado en cualquier tabla del sistema.
 *
 *  ↑ / ↓      misma celda de la fila anterior / siguiente
 *  Enter      baja a la siguiente fila (en campos de texto y numéricos)
 *  ← / →      celda vecina de la misma fila; en un campo de texto solo cuando
 *             el cursor está al inicio / al final, para no estorbar la edición
 *  Listas desplegables: ↑ / ↓ siguen cambiando la opción; ← / → y Enter salen de la lista.
 *
 * En TODA la aplicación: campos, casillas, botones, enlaces y filas de lista.
 * Funciona con campos, listas, casillas, botones y enlaces dentro de filas
 * (`<tr>` o `role="row"`) de una `<table>` o `role="grid"`. Fuera de las tablas,
 * en cualquier formulario o ventana de la aplicación, ↑ / ↓ en un campo de texto
 * pasan al campo vecino según su posición en pantalla: ↑ ↓ ← → (← → solo al borde del texto; Enter conserva su función normal). Se desactiva con
 * `data-sin-flechas` en el control o en un contenedor, y no actúa en áreas de
 * texto, en elementos editables ni en listas de sugerencias abiertas.
 */

const TIPOS_TEXTO = new Set(['', 'text', 'number', 'search', 'tel', 'email', 'url', 'password']);
const SELECTOR_ENFOCABLES =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex="0"]';

const visible = (el: HTMLElement) => el.getClientRects().length > 0;

function enfocablesDeFila(fila: Element): HTMLElement[] {
  return Array.from(fila.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)).filter(visible);
}

/**
 * Misma columna en otra fila: se empareja por la celda (no por el número de
 * controles de la fila, que cambia si hay botones deshabilitados) y, dentro de
 * la celda, por la posición del control.
 */
function mismaColumna(origen: HTMLElement, filaOrigen: Element, filaDestino: Element): HTMLElement | undefined {
  const celda = origen.closest('td, th, [role="cell"], [role="gridcell"]');
  const idxCelda = celda ? Array.from(filaOrigen.children).indexOf(celda) : -1;
  if (celda && idxCelda >= 0) {
    const enCelda = enfocablesDeFila(celda).indexOf(origen);
    const celdaDestino = filaDestino.children[idxCelda];
    const candidatos = celdaDestino ? enfocablesDeFila(celdaDestino) : [];
    if (candidatos.length > 0) return candidatos[Math.min(Math.max(enCelda, 0), candidatos.length - 1)];
  }
  const todos = enfocablesDeFila(filaDestino);
  const col = enfocablesDeFila(filaOrigen).indexOf(origen);
  return todos[Math.min(Math.max(col, 0), todos.length - 1)];
}

function filaVecina(fila: Element, direccion: 1 | -1): Element | null {
  let actual = direccion === 1 ? fila.nextElementSibling : fila.previousElementSibling;
  while (actual) {
    if (enfocablesDeFila(actual).length > 0) return actual;
    actual = direccion === 1 ? actual.nextElementSibling : actual.previousElementSibling;
  }
  return null;
}

const SELECTOR_NAVEGABLES =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex="0"], [role="checkbox"]:not([aria-disabled="true"])';
const TIPOS_CAMPO_LINEA = new Set(['text', 'search', 'tel', 'email', 'url', 'password', 'number']);
const TIPOS_FECHA_HORA = new Set(['date', 'time', 'datetime-local', 'month', 'week']);

interface Caja { el: HTMLElement; x: number; y: number; w: number; h: number; izq: number; der: number }

function caja(el: HTMLElement): Caja {
  const r = el.getBoundingClientRect();
  return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, izq: r.left, der: r.right };
}

/**
 * Siguiente control según su POSICIÓN en pantalla (no según el orden del código):
 * ←/→ buscan el más cercano en la misma línea; ↑/↓ el de la línea de
 * arriba/abajo que mejor se alinea. Sin candidato en esa dirección no se mueve.
 */
export function campoEnDireccion(actual: Caja, otros: Caja[], tecla: string): HTMLElement | null {
  const tolerancia = Math.max(actual.h * 0.6, 8);
  if (tecla === 'ArrowLeft' || tecla === 'ArrowRight') {
    const signo = tecla === 'ArrowRight' ? 1 : -1;
    const enLinea = otros.filter((c) => Math.abs(c.y - actual.y) <= tolerancia && (c.x - actual.x) * signo > 2);
    enLinea.sort((a, b) => Math.abs(a.x - actual.x) - Math.abs(b.x - actual.x));
    return enLinea[0]?.el ?? null;
  }
  const signo = tecla === 'ArrowDown' ? 1 : -1;
  const solape = (c: Caja) => Math.min(c.der, actual.der) - Math.max(c.izq, actual.izq);
  const lineas = otros.filter((c) => (c.y - actual.y) * signo > tolerancia);
  if (lineas.length === 0) return null;
  // Se prefieren los controles que quedan realmente arriba/abajo (se solapan en horizontal).
  const alineados = lineas.filter((c) => solape(c) > 0);
  const grupo = alineados.length > 0 ? alineados : lineas;
  const dyMin = Math.min(...grupo.map((c) => Math.abs(c.y - actual.y)));
  const siguienteLinea = grupo.filter((c) => Math.abs(c.y - actual.y) - dyMin <= tolerancia);
  siguienteLinea.sort((a, b) => solape(b) - solape(a) || Math.abs(a.x - actual.x) - Math.abs(b.x - actual.x));
  return siguienteLinea[0]?.el ?? null;
}

/** Fuera de tablas: las cuatro flechas pasan al control vecino según su posición en pantalla. */
function moverEntreCampos(e: KeyboardEvent, el: HTMLElement): void {
  const k = e.key;
  if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight') return;
  if (el instanceof HTMLSelectElement) return; // la lista usa las flechas para cambiar de opción
  const esCampo = el instanceof HTMLInputElement;
  if (esCampo) {
    const inp = el as HTMLInputElement;
    const esCasilla = inp.type === 'checkbox';
    const esFechaHora = TIPOS_FECHA_HORA.has(inp.type);
    // En fechas y horas ← / → siguen moviendo entre día, mes y año; ↑ / ↓ pasan al campo de arriba/abajo.
    if (esFechaHora && (k === 'ArrowLeft' || k === 'ArrowRight')) return;
    if (!esCasilla && !esFechaHora && !TIPOS_CAMPO_LINEA.has(inp.type)) return;
    if (inp.hasAttribute('list') || inp.hasAttribute('aria-autocomplete') || inp.hasAttribute('aria-controls')) return;
    // ← / → en un campo de texto: solo cuando el cursor está al borde.
    if (!esCasilla && !esFechaHora && (k === 'ArrowLeft' || k === 'ArrowRight') && inp.selectionStart !== null && inp.selectionEnd !== null) {
      const alInicio = inp.selectionStart === 0 && inp.selectionEnd === 0;
      const alFinal = inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length;
      const todo = inp.selectionStart === 0 && inp.selectionEnd === inp.value.length;
      if (k === 'ArrowLeft' && !(alInicio || todo)) return;
      if (k === 'ArrowRight' && !(alFinal || todo)) return;
    }
  }
  // Dentro de una ventana emergente el foco no sale de ella.
  const contenedor = el.closest('[role="dialog"], [aria-modal="true"], dialog') || document.body;
  const otros = Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_NAVEGABLES))
    .filter((c) => c !== el && visible(c) && !c.closest('[data-sin-flechas]') && !c.contains(el) && !el.contains(c)
      && c.getAttribute('tabindex') !== '-1' && !c.closest('[aria-hidden="true"], [inert]'))
    .map(caja);
  const dest = campoEnDireccion(caja(el), otros, k);
  if (!dest) return;
  e.preventDefault();
  dest.focus();
  if (dest instanceof HTMLInputElement && TIPOS_TEXTO.has(dest.type)) {
    try { dest.select(); } catch { /* sin selección */ }
  }
  dest.scrollIntoView({ block: 'nearest' });
}

export function manejarFlechasEnTabla(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const k = e.key;
  if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Enter') return;

  const el = e.target as HTMLElement | null;
  if (!el || !(el instanceof HTMLElement)) return;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement) return;
  if (el.closest('[data-sin-flechas]')) return;
  const rol = el.getAttribute('role') || '';
  // Controles con su propio manejo de flechas (pestañas, menús, deslizadores, listas…).
  if (['combobox', 'tab', 'radio', 'slider', 'spinbutton', 'option', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'treeitem', 'scrollbar', 'separator'].includes(rol)) return;
  if (el instanceof HTMLInputElement && el.getAttribute('aria-expanded') === 'true') return;
  if (el.closest('[role="listbox"], [role="menu"], [role="tablist"], [role="radiogroup"], [role="tree"], [role="toolbar"][aria-orientation]')) return;

  const esInput = el instanceof HTMLInputElement;
  const esSelect = el instanceof HTMLSelectElement;
  const tipo = esInput ? (el as HTMLInputElement).type : '';
  if (esInput && tipo === 'radio') return; // las flechas ya eligen opción
  const esTexto = esInput && TIPOS_TEXTO.has(tipo);
  const esControlSimple = !esTexto && !esSelect; // casilla, botón, enlace…
  const esEnfocableGenerico = el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement || el.matches('[tabindex="0"], [role="checkbox"], [role="button"], [role="switch"], [role="link"]');
  if (!esInput && !esSelect && !esEnfocableGenerico) return;

  const fila = el.closest('tr, [role="row"]');
  if (!fila || !fila.closest('table, [role="grid"], [role="table"]')) {
    moverEntreCampos(e, el);
    return;
  }
  const enFila = enfocablesDeFila(fila);
  const col = enFila.indexOf(el);
  if (col < 0) return;

  const irA = (dest: HTMLElement | undefined | null) => {
    if (!dest) return;
    e.preventDefault();
    dest.focus();
    if (dest instanceof HTMLInputElement && TIPOS_TEXTO.has(dest.type)) {
      try { dest.select(); } catch { /* algunos tipos no permiten select() */ }
    }
    dest.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'Enter') {
    if (k === 'Enter' && !esTexto) return;            // Enter en botones/casillas/listas conserva su función
    if (esSelect && k !== 'Enter') return;            // ↑/↓ cambian la opción
    if (esSelect && k === 'Enter') return;
    const vecina = filaVecina(fila, k === 'ArrowUp' ? -1 : 1);
    if (!vecina) return;
    irA(mismaColumna(el, fila, vecina));
    return;
  }

  // ← / →
  if (esTexto) {
    const inp = el as HTMLInputElement;
    const ini = inp.selectionStart;
    const fin = inp.selectionEnd;
    if (ini !== null && fin !== null) { // los campos numéricos no exponen cursor: se navega siempre
      const alInicio = ini === 0 && fin === 0;
      const alFinal = ini === inp.value.length && fin === inp.value.length;
      const todo = ini === 0 && fin === inp.value.length;
      if (k === 'ArrowLeft' && !(alInicio || todo)) return;
      if (k === 'ArrowRight' && !(alFinal || todo)) return;
    }
  } else if (!esSelect && !esControlSimple) {
    return;
  }
  irA(enFila[col + (k === 'ArrowLeft' ? -1 : 1)]);
}

/** Activa la navegación para toda la aplicación. Devuelve la función que la desactiva. */
export function instalarNavegacionTablas(): () => void {
  document.addEventListener('keydown', manejarFlechasEnTabla);
  return () => document.removeEventListener('keydown', manejarFlechasEnTabla);
}
