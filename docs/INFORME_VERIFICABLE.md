# Informe verificable: sello, PDF oficial y verificación pública

Antes, el "código QR y validación" de un informe era decorativo: el hash se
generaba con `Math.random()` en el navegador y el QR apuntaba a un dominio sin
ninguna ruta detrás. Cualquiera podía fabricar o editar un PDF que "se veía
oficial". Ahora la autenticidad la decide el **servidor**.

## Qué pasa al publicar (`PATCH /api/informes/:id/publicar`)

1. Se aplica la regla de doble verificación de críticos (Fase 8).
2. El servidor emite un **código de verificación** aleatorio de 16 caracteres
   (~79 bits; nunca lo decide el navegador) y calcula la **huella SHA-256** del
   contenido clínico (identificación del informe, datos del paciente,
   parámetros con valor/unidad/rango/estado, hallazgos, conclusiones,
   explicación, recomendaciones y quién publicó). No entran fechas ni ids
   internos.
3. Guarda quién publicó (nombre, colegiado, especialidad) tomado de la sesión
   autenticada, no de lo que mande el navegador.
4. Registra la publicación en la bitácora (`historial_auditoria`).

Si el informe se vuelve a publicar tras una corrección se **conserva el código**
y se recalcula la huella: los PDF ya impresos siguen resolviendo y la
verificación avisa que esa copia es de una versión anterior.

## Verificación pública

- Página: `https://<tu-dominio>/verificar/<CÓDIGO>` (es el destino del QR).
- JSON: `GET /api/verificar/<CÓDIGO>`.

Recalcula la huella desde la base y responde: **auténtico**, **modificado**
(alguien cambió el contenido tras publicar), **no publicado** o **anulado**. El
QR lleva además `?h=<16 hex>` de la versión impresa para detectar copias viejas.

Es pública a propósito (quien escanea un QR no tiene cuenta), así que solo
muestra lo mínimo: nombre del paciente enmascarado, laboratorio, firmantes y
fechas. Nunca documento, teléfono ni valores clínicos. Límite de 120 consultas
por IP cada 15 minutos.

## PDF oficial del servidor (`GET /api/informes/:id/pdf`, requiere sesión)

PDF vectorial (texto seleccionable) con membrete de `configuracion_laboratorio`,
tabla de resultados, conclusiones, **firmantes reales** (quién validó, quién
verificó los críticos, quién publicó), QR, código y huella, y numeración de
páginas. Un borrador sale con marca de agua "BORRADOR". Un informe publicado
cuyo contenido cambió después del sello **no se emite** (409
`INFORME_MODIFICADO`): hay que volver a publicarlo. Uno publicado antes de esta
migración tampoco (409 `INFORME_SIN_SELLO`).

La fuente estándar de PDF no dibuja `µ`, `²`, `³`: se escriben `u`, `^2`, `^3`
(`10^3/uL`) para que nunca salga una unidad en blanco.

## Configuración

- `PUBLIC_BASE_URL` (recomendado en producción, p. ej. `https://vaclinic.onrender.com`):
  base del enlace del QR. Si falta se usa el `Host` de la petición.
- Con el servidor detrás de Render se activó `trust proxy` (1 salto) para que
  los límites de tasa por IP vean la IP real del visitante y no la del proxy.

## Límites conocidos

- Verifica que el contenido **no cambió desde que se publicó**; no sustituye una
  firma electrónica avanzada con certificado de una autoridad certificadora.
- Quien edite la base de datos directamente puede cambiar contenido **y** huella.
  La bitácora y los respaldos cifrados (Fase 7) son la defensa para eso.
- La hoja que imprime el navegador (maqueta) sigue existiendo; el documento
  oficial para entregar es el botón **PDF oficial (servidor)**.
