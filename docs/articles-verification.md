# Verificación del listado compacto y modo Reordenar

Fecha: 12 de septiembre de 2026. Implementación sobre `7c8a182`, en
`feat/compact-articles-reorder`. El árbol inicial estaba limpio. No se agregaron dependencias,
no se modificaron las APIs del store ni el formato de IndexedDB, y no se publicó el sitio.

## Resultado implementado

- Fotos completas de 96 px junto a nombre y precio siempre editables. Campos de 16 px,
  etiquetas visibles y controles de al menos 44 px. Detalles independientes por artículo.
- Búsqueda de nombres sin distinguir mayúsculas o tildes, contador, limpieza y estado vacío.
  El artículo renombrado permanece mientras se edita; la búsqueda conserva el orden y la
  numeración del catálogo completo. Excel queda en una sección desplegable.
- Conservación de búsqueda, detalles y desplazamiento al cambiar de pestaña, visitar la
  vista previa o volver del modo Reordenar.
- Modal con grilla visual, búsqueda que destaca sin filtrar, miniaturas de páginas a la
  derecha desde 768 px y tira horizontal en celular. Las miniaturas comparten cantidades,
  resolución de diseños y geometría CSS con las páginas reales; muestran solamente fotos.
- Arrastre desde un agarre con Pointer Events, captura, marca de inserción, desplazamiento
  en bordes y cancelación. Subir, Bajar, Mover a posición y Deshacer último movimiento.
  Los movimientos conservan el artículo completo, se guardan mediante la cola existente y
  mantienen seleccionado el artículo. Un fallo mantiene el orden mostrado y ofrece reintento.
- Foco contenido y restaurado al cerrar; acceso directo por teclado a los controles de
  movimiento, devolución del foco al deshacer y limpiar búsqueda, y movimiento reducido.

## Densidad y tamaños

Con los mismos nombres cortos y detalles cerrados:

| Ancho de ventana | Altura anterior | Altura nueva | Foto | Campos | Desbordamiento horizontal |
|---|---|---|---|---|---|
| 320 px | 479 px | 218 px | 96 px | 16 px | No observado |
| 390 px | 479 px | 218 px | 96 px | 16 px | No observado |
| 768 px | 479 px | 218 px | 96 px | 16 px | No observado |
| 1000 px | 479 px | 218 px | 96 px | 16 px | No observado |
| 1440 px | 479 px | 218 px | 96 px | 16 px | No observado |

La reducción es de aproximadamente 54,5 %, por debajo del objetivo de 260 px. Los 96 px
incluyen el borde del contenedor; la imagen ocupa su interior y usa `object-fit: contain`.
Los nombres largos pueden aumentar la altura; el campo admite varias líneas y desplazamiento
propio. Las mediciones no establecen comodidad de lectura para los usuarios reales.

## Pruebas ejecutadas

Las regresiones afectadas suman 110 casos distintos de Chromium, ejecutados en tandas
selectivas. No se ejecutó la suite completa para todos los navegadores.

| Archivo | Casos | Comprobaciones principales |
|---|---:|---|
| `articles-reorder.spec.ts` | 14 | Cinco anchos, 50/200 artículos, cinco precios consecutivos, búsqueda y renombrado, recuperación de contexto, navegación, movimientos lejanos, deshacer, mouse/tacto, cancelación, bordes, modal, foco, guardado fallido y recarga, miniaturas y vaciado del catálogo filtrado. |
| `mutations-pagination.spec.ts` | 35 | Límites, descripciones largas, teclado, arrastre con mouse, orden persistido, cantidades 1–5, índices de 30/31 y páginas incompletas. |
| `accessibility-extra.spec.ts` | 5 | Flujo de teclado, foco y controles del editor, navegación a la vista previa y exportación. |
| `ui.spec.ts` | 8 | Editor adaptable, edición y acciones de Detalles en distintos tamaños. |
| `popup-busy.spec.ts` | 2 | Cierre y bloqueo de controles de color durante operaciones. |
| `contrast.spec.ts` | 2 | Mediciones de contraste y tamaño de los controles cubiertos; color por teclado. |
| `secondary-controls.spec.ts` | 2 | Estados y controles secundarios, ventana de color con altura reducida. |
| `ownership.spec.ts` | 7 | Fallos de guardado, propiedad de blobs/URLs, importación Excel con correcciones e hidratación. |
| `family-feedback.spec.ts` | 10 | Fotos, altura de descripción, volver arriba, cantidades por página y errores de persistencia. |
| `shapes-output.spec.ts` | 21 | Todas las distribuciones en PDF y HTML reales. |
| `family-output.spec.ts` | 3 | Salida mixta de 31 artículos, PDF de 61 artículos, texto, enlaces y dimensiones A4. |
| `zoom.spec.ts` | 1 | Zoom real de Chromium al 200 %, edición, detalles, teclado, mover/deshacer en Reordenar y exportación. |

Los tests nuevos comparan las posiciones CSS de todas las celdas de miniaturas y catálogo,
comprueban páginas personalizadas y excluyen formularios o `.page-a4` de las miniaturas.
La prueba táctil usa entrada de Chromium por CDP para ejercitar captura real de puntero,
arrastre desde el agarre y desplazamiento desde la foto. No equivale a usar un teléfono real.
Los escenarios de persistencia usan IndexedDB y fallos de transacción inyectados, con perfiles
temporales independientes. Las pruebas de exportación usan las herramientas locales de macOS
PDFKit/Vision para examinar archivos reales.

Comandos habituales con los navegadores del proyecto disponibles:

```sh
npm run verify
npm test -- --project chromium articles-reorder.spec.ts mutations-pagination.spec.ts accessibility-extra.spec.ts ui.spec.ts popup-busy.spec.ts contrast.spec.ts secondary-controls.spec.ts ownership.spec.ts family-feedback.spec.ts shapes-output.spec.ts family-output.spec.ts zoom.spec.ts
```

En este equipo, la revisión de Chromium esperada por Playwright no estaba descargada. Se usó
el Chromium 149 ya disponible en la caché, sin instalar herramientas. Una configuración temporal
en `/private/tmp/articles.playwright.config.ts` seleccionó ese ejecutable, los tests de Chromium
y el servidor Vite local existente. Para zoom, `/private/tmp/articles-zoom.playwright.config.ts`
seleccionó el Chrome completo de la misma caché, que expone sus ajustes nativos. Las fixtures
ahora respetan `launchOptions`; la configuración habitual del repositorio permanece igual.

## Revisión y comprobaciones pendientes

La revisión `$catalog-review` cubrió los cambios de esta tarea contra su estado inicial,
incluidos los archivos nuevos, la integración con paginación, acciones, persistencia y captura.
Se corrigieron los problemas confirmados de foco y nombre accesible; no quedaron hallazgos
accionables pendientes en el alcance revisado. `npm run verify` y la inspección explícita de
espacios de los seis archivos nuevos pasaron. Vite mantiene los avisos de su API CJS y de tamaño
de bundle; no son errores de compilación. Los resultados de build no reemplazan las pruebas
de navegador anteriores.

No se pudieron ejecutar WebKit/Safari en este entorno, teclado virtual de teléfonos reales ni
la prueba de usabilidad con los padres. También falta observar rendimiento y reconocimiento de
fotos con sus 200 imágenes reales, en particular en el teléfono que usan.

Con cada padre, en su PC y teléfono, queda realizar:

1. Encontrar un artículo por foto y por nombre; cambiar cinco precios seguidos.
2. Editar un nombre bajo búsqueda, abrir varios detalles, cambiar una descripción y una foto.
3. Visitar el catálogo y volver comprobando que se conserva el contexto.
4. Reordenar con el agarre, mover un artículo a una posición lejana y deshacerlo.
5. Reconocer las páginas en las miniaturas y comprobar la página de destino.

Registrar legibilidad, ayuda requerida, errores, comodidad del gesto y tiempo aproximado.
El diseño acordado y las hipótesis originales están en [investigación de UX](articles-ux-research.md).
