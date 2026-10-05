/**
 * Navegación con el teclado en cualquier tabla del sistema.
 *
 *  ↑ / ↓      misma celda de la fila anterior / siguiente
 *  Enter      baja a la siguiente fila (en campos de texto y numéricos)
 *  ← / →      celda vecina de la misma fila; en un campo de texto solo cuando
 *             el cursor está al inicio / al final, para no estorbar la edición
 *  Listas desplegables: ↑ / ↓ siguen cambiando la opción; ← / → y Enter salen de la lista.
 *
 * Funciona con campos, listas, casillas, botones y enlaces dentro de filas
 * (`<tr>` o `role="row"`) de una `<table>` o `role="grid"`. Fuera de las tablas,
 * en cualquier formulario o ventana de la aplicación, ↑ / ↓ en un campo de texto
 * pasan al campo anterior / siguiente (←, → y Enter conservan su función normal). Se desactiva con
 * `data-sin-flechas` en el control o en un contenedor, y no actúa en áreas de
 * texto, en elementos editables ni en listas de sugerencias abiertas.
 */

const TIPOS_TEXTO = new Set(['', 'text', 'number', 'search', 'tel', 'email', 'url', 'password']);
const SELECTOR_ENFOCABLES =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), button:not([disabled]), a[href]';

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

const SELECTOR_CAMPOS = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
const TIPOS_CAMPO_LINEA = new Set(['text', 'search', 'tel', 'email', 'url', 'password']);

/** Fuera de tablas: ↑ / ↓ en un campo de una sola línea pasan al campo anterior / siguiente. */
function moverEntreCampos(e: KeyboardEvent, el: HTMLElement): void {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  if (!(el instanceof HTMLInputElement) || !TIPOS_CAMPO_LINEA.has(el.type)) return;
  if (el.hasAttribute('list') || el.hasAttribute('aria-autocomplete') || el.hasAttribute('aria-controls')) return;
  const contenedor = el.closest('form, [role="dialog"], dialog, main') || document.body;
  const campos = Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_CAMPOS)).filter(visible);
  const i = campos.indexOf(el);
  const dest = campos[i + (e.key === 'ArrowUp' ? -1 : 1)];
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
  if (el.getAttribute('role') === 'combobox' || el.getAttribute('aria-expanded') === 'true') return;
  if (el.closest('[role="listbox"], [role="menu"]')) return;

  const esInput = el instanceof HTMLInputElement;
  const esSelect = el instanceof HTMLSelectElement;
  const tipo = esInput ? (el as HTMLInputElement).type : '';
  if (esInput && tipo === 'radio') return; // las flechas ya eligen opción
  const esTexto = esInput && TIPOS_TEXTO.has(tipo);
  const esControlSimple = !esTexto && !esSelect; // casilla, botón, enlace…
  if (!esInput && !esSelect && !(el instanceof HTMLButtonElement) && !(el instanceof HTMLAnchorElement)) return;

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
