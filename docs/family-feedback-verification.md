# Verificación de las mejoras tras el uso familiar

Estado: mejoras implementadas y verificadas automáticamente; evaluación de la versión nueva por la familia pendiente. No se publicaron cambios ni se instaló ninguna dependencia.

## Alcance acordado

El dueño informó que la familia probó las tareas que haría diariamente, sin incidentes observados. Fue una prueba exploratoria reportada; no se detallaron dispositivos, versiones, tareas individuales ni ayuda requerida. Este reporte no se presenta como una ejecución del protocolo formal anterior.

Se solicitaron y confirmaron cuatro cambios:

| Cambio | Comportamiento acordado | Estado |
|---|---|---|
| Volver arriba | Flecha en Productos y Vista Previa; lleva al comienzo del panel usado. Páginas utiliza su propia lista desplazable. | Verificado en tres motores, teclado y anchos 390/1000/1440 |
| Descripción | Ajustar la altura al texto, tamaño/familia tipográfica, carga de fuentes y ancho disponible, sin agregar caracteres. | Verificados tamaño, redistribución, recarga y texto completo en PDF/HTML; carga remota de fuentes no ejercitada |
| Cantidad por página | Elegir 1–5 por página y redistribuir los siguientes productos conservando el orden. General mantiene el valor común; las cantidades propias permanecen al cambiarlo. | Verificados interfaz, persistencia, errores, registros antiguos, índice y PDF/HTML |
| Fondo detrás del producto | El dueño confirmó que el fondo se ve detrás y no reemplaza la foto. Cada ficha tiene una base opaca; su color propio sigue aplicándose sobre ella. | Verificados bytes/fotos tras reemplazar fondo y recargar; píxeles de PDF/HTML |

Esta confirmación amplía expresamente el alcance anterior, que solo contemplaba una cantidad global. Con cantidades propias, los límites se calculan acumulando las capacidades de las páginas. Los catálogos sin ajustes por página conservan el comportamiento uniforme. El campo opcional `pageItemCounts` mantiene la compatibilidad de los registros antiguos; restablecer ajustes elimina estas personalizaciones.

## Punto de partida y evidencia

HEAD inicial: `10c228ea335913d3c29378ce38f82652279d5ac7`. Árbol limpio al comenzar. Estado Git, diffs y lista de archivos sin seguimiento: `/private/tmp/catalogmaker-family-feedback-baseline-20260912T231926Z`. Los cambios anteriores de Prioridad 1 ya estaban incorporados por el dueño; esta tarea no los vuelve a atribuir como cambios nuevos.

- Reproducción inicial, Chromium: 1 aprobada / 1 fallida. La descripción conservaba una caja 326px más baja que el contenido tras aumentar la letra. Cambiar el fondo conservó las fotos y sus bytes en IndexedDB. Archivo: `/private/tmp/catalogmaker-family-feedback-reproduction/`.
- Primera ejecución de los nuevos casos, tres motores: 8 aprobadas / 13 fallidas. Se corrigió el destino del botón de Páginas para usar su contenedor desplazable real. Los otros fallos eran precondiciones de los tests: esperar a que se reduzca la altura antes de medir el ancho siguiente y localizar el selector por su nombre accesible, en vez del texto completo de su etiqueta envolvente. Los límites y resultados esperados se conservaron. Archivo: `/private/tmp/catalogmaker-family-feedback-first/`.
- Segunda ejecución: 29 aprobadas / 1 fallida. Los nueve casos nuevos de PDF/HTML aprobaron; Chromium móvil interrumpía el desplazamiento inicial a 48px del comienzo. El botón ahora enfoca el panel y desplaza en el siguiente frame. Cinco repeticiones dirigidas aprobaron; luego 27/27 casos de interfaz, incluidos cinco ciclos de interrupción por motor, aprobaron. Archivos: `/private/tmp/catalogmaker-family-feedback-output-pass-except-scroll/`, `/private/tmp/catalogmaker-family-feedback-scroll-repeat/` y `/private/tmp/catalogmaker-family-feedback-ui-pass/`.
- Regresión de rutas compartidas: **319/319**, salida 0, sin omitidos ni reintentos inestables. Incluye persistencia real, errores/cupos/abortos, propiedad de imágenes, las 90 combinaciones uniformes de paginación, 63 exportaciones por forma, recuperación de exportación, teclado, puntos de quiebre y zoom real Chromium al 200%. Archivo: `/private/tmp/catalogmaker-family-feedback-regression-pass/`.
- La revisión posterior encontró un fallo en el resaltado de productos visibles después de redistribuir páginas. Se corrigieron las dependencias del observador y se agregó una regresión. Repetición afectada: **69/69**, salida 0, sin omitidos ni reintentos inestables, incluidos los 30 casos nuevos de interfaz. Archivo: `/private/tmp/catalogmaker-family-feedback-reviewed-pass/`.
- `npm run verify` final: **aprobado, salida 0**. TypeScript, build Vite y whitespace staged/unstaged correctos; seis archivos nuevos también inspeccionados explícitamente por whitespace y salto final. Avisos previos sin ampliar alcance: API CJS de Vite y tamaño del bundle.

Los tests usan perfiles y datos descartables y bloquean solicitudes externas. Se reutilizaron Playwright 1.63.0, Chromium 153.0.8010.12, Firefox 155.0 y WebKit 26.6 ya instalados y autorizados. Los nuevos PDF/HTML y sus inspecciones están en `/private/tmp/catalogmaker-family-feedback-artifacts/`; los de formas/recuperación en `/private/tmp/catalogmaker-priority1-artifacts/`. Se preservaron sus 486 archivos anteriores en `/private/tmp/catalogmaker-family-feedback-prior-output/` antes de repetirlos.

Los nueve casos nuevos de salida comprueban catálogos de 31/61 productos con cantidades mixtas 1–5, cambios de cantidad y repetición de exportación, páginas parciales, nombres sin duplicación/omisión, numeración, destinos del índice y dimensiones A4. El caso de descripción usa letra 22 y comprueba por OCR el final del texto. El fondo azul opaco queda fuera de la ficha blanca tanto en el PDF renderizado con PDFKit como en el JPEG extraído del HTML. Además se inspeccionaron visualmente capturas móviles/tablet/escritorio, PDF de descripción/fondo, HTML de descripción/fondo y última página parcial de 31 productos.

Huella antes de la corrección del observador: `/private/tmp/catalogmaker-family-feedback-final-source.json`. Huella revisada: `/private/tmp/catalogmaker-family-feedback-reviewed-source.json`, SHA-256 `49a18e6a5c87c53089c601d905565d182dfec0e3f1f61ca97d6251c0a8eea9fc`. Solo cambiaron `Workspace.tsx` y el test del resaltado entre ambas. La evidencia de salida se reutiliza porque las correcciones posteriores afectan navegación fuera de las páginas capturadas; no cambiaron paginación, fichas ni exportadores.

El conjunto tiene **358 casos distintos con evidencia aprobada vigente**: 319 regresiones existentes, 30 nuevos casos de interfaz y 9 nuevos casos de salida. Son resultados de varias ejecuciones con repeticiones afectadas, no una única ejecución de 358. El inventario por caso, motor y reporte está en `/private/tmp/catalogmaker-family-feedback-current-evidence.json`; se comprobó que los hashes de código y tests coinciden con la huella revisada.

## Comandos reproducibles

Las ejecuciones usaron una configuración temporal que importa `playwright.config.ts` y cambia únicamente las rutas absolutas del servidor, tests y resultados. No altera expectativas, tiempos ni motores. Se puede omitir ese argumento para ejecutar con la configuración del repositorio.

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/catalogmaker-playwright-browsers npm run test -- --config=/private/tmp/catalogmaker-family-feedback.config.ts --workers=2 tests/family-feedback.spec.ts tests/family-output.spec.ts
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/catalogmaker-playwright-browsers npm run test -- --config=/private/tmp/catalogmaker-family-feedback.config.ts --workers=2 tests/accessibility-extra.spec.ts tests/contrast.spec.ts tests/export-recovery.spec.ts tests/mutations-pagination.spec.ts tests/ownership.spec.ts tests/persistence-additional.spec.ts tests/persistence.spec.ts tests/popup-busy.spec.ts tests/secondary-controls.spec.ts tests/shapes-output.spec.ts tests/ui.spec.ts tests/zoom.spec.ts
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/catalogmaker-playwright-browsers npm run test -- --config=/private/tmp/catalogmaker-family-feedback.config.ts --workers=2 tests/family-feedback.spec.ts tests/accessibility-extra.spec.ts tests/ui.spec.ts
npm run verify
```

## Revisión

Se aplicó `catalog-review` al diff de esta tarea contra el HEAD inicial limpio, incluyendo archivos nuevos, tests y documentación. Se trazaron los cambios desde los controles hasta Zustand/IndexedDB y desde la vista previa hasta PDF/HTML; se inspeccionaron capturas y archivos reales.

Hallazgo confirmado y corregido: **[P2] Actualizar el observador al redistribuir páginas — `Workspace.tsx`**. Con nueve productos y cantidad general 3, elegir 1 en la primera página recreaba fichas sin registrar sus nuevos nodos en el observador. Al mostrar la segunda página, no se resaltaban esos productos. Ahora las cantidades general y propias actualizan el observador; también corrige la misma omisión previa del flujo general. La nueva prueba recorre cantidades 1, 5 y vuelta a General/2. Evidencia inicial: `/private/tmp/catalogmaker-family-feedback-review-before-fix.json`.

La corrección y su prueba fueron revisadas y aprobaron en Chromium, Firefox y WebKit. No quedan hallazgos confirmados de esta tarea sin resolver. Este resultado se limita al diff y escenarios descritos; no implica ausencia de todos los defectos posibles.

## Relación con Prioridad 1

La prueba familiar comunicada es evidencia reportada de uso cotidiano sin incidentes en la versión que probaron. No identifica la huella de esa versión ni acredita cada paso del protocolo original. Las mejoras solicitadas se atienden aquí; el objetivo original continúa **incomplete—awaiting verification** por sus requisitos de dispositivos/personas.

| ID | Evidencia automatizada repetida en este seguimiento | Límite |
|---|---|---|
| D1 | Persistencia, demoras, errores, reintentos y recarga; guardado fallido de cantidades propias | Falta el registro manual requerido por el objetivo original |
| D2 | Cancelación, tres restablecimientos y fallos; reset de ajustes elimina cantidades propias sin tocar productos | Mismo límite manual |
| A3 | Ownership, fallos de fotos y bytes conservados al reemplazar fondo | No se afirma prueba con fotos representativas de teléfonos reales |
| A2 | Identidad, mutaciones inválidas, importación y límites compartidos | El alcance sigue siendo un único catálogo |
| U2 | Controles, contraste, teclado, zoom y botón de regreso | Falta la evaluación por persona de la versión nueva |
| U3 | Movimientos con teclado y arrastre, orden persistido | Falta el registro manual por persona |
| U5 | Emulación móvil/tablet, cambios de tamaño y exportación desde pestañas | No prueba teclado físico del dispositivo, rotación ni compartir PDF nativo |
| L1 | Matriz DOM uniforme, formas, salida real mixta 31/61 y fondo de ficha | Los 87 casos de `artifacts.spec.ts` se conservan como evidencia histórica; no se repitió esa matriz completa en este seguimiento |

## Límites y siguiente comprobación de uso

Repetir el uso cotidiano en la nueva versión permitirá confirmar que los cuatro cambios resuelven las observaciones de la familia. No se realizaron pruebas físicas nuevas, carga de fuentes de Google, publicación externa ni validación de todo el espacio posible de cantidades mixtas. El registro formal de equipos, versiones, tamaño usual y tareas de cada padre sigue en [priority1-device-checks.md](priority1-device-checks.md); no se declara aprobado por estas pruebas automatizadas.
