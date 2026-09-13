# Listado de artículos: investigación y propuesta

Fecha: 12 de septiembre de 2026. Investigación de fuentes primarias, inspección del código y evaluación del flujo actual. Las recomendaciones son hipótesis de diseño para CatalogMaker; todavía no son resultados de pruebas con sus usuarios.

El diseño se acordó después de esta investigación y se implementó con edición siempre visible,
búsqueda y un modo amplio de reordenamiento. Las secciones de diagnóstico y alternativas
conservan el razonamiento inicial. El alcance final y la evidencia están en
[verificación del listado](articles-verification.md); falta validarlo con los padres en sus dispositivos.

## Necesidades confirmadas

- Catálogos de 50 a 200 artículos.
- Según la temporada, tienen igual importancia editar varios nombres/precios, buscar y editar detalles, y reordenar/revisar páginas.
- Los padres del propietario son los usuarios principales. Usan más PC, pero mobile y desktop tienen igual prioridad de diseño.
- Reconocen los artículos principalmente por la foto. Leer letras pequeñas les cuesta; reducir la tipografía perjudicaría el objetivo.

## Diagnóstico anterior al refactor

El listado mostraba un formulario completo por artículo: número, eliminar, foto, nombre, precio, fondo, cambiar foto, subir/bajar y descripción plegada. No tenía buscador. Importar Excel y descargar plantilla aparecían antes de los artículos.

En la versión inicial de [ProductListItem](../src/components/molecules/ProductListItem.tsx) se repetían esos controles para cada producto. [editor.css](../src/styles/editor.css) apilaba foto y campos verticalmente, con foto de 96 px, campos de 16 px y controles de al menos 44 px. La columna mide 340 px en desktop y 300 px en tablet; en mobile ocupa el ancho de pantalla. Esto limita también las opciones de diseño en PC.

La altura viene de la composición y de cuántas funciones se muestran simultáneamente. La solución debe conservar legibilidad, reconocimiento visual y acceso a las tareas frecuentes. Las páginas del catálogo y su orden tienen significado: filtrar el editor no debe cambiar el PDF ni renumerar los resultados como si fueran otro catálogo.

Medición de referencia con 13 productos de prueba, descripciones plegadas y viewport de 844 px de alto:

| Ancho de pantalla | Ancho del listado | Alto de cada tarjeta | Alto desplazable del panel |
|---|---|---|---|
| 1440 px | 340 px | 479 px | 6558 px |
| 1000 px | 300 px | 479 px | 6608 px |
| 390 px | 390 px | 479 px | 6558 px |
| 320 px | 320 px | 479 px | 6608 px |

En los cuatro anchos, fotos de 96 px, campos de 44 px y tipografía de 16 px; no se observó desbordamiento horizontal del panel. Se usaron datos descartables y solicitudes externas bloqueadas. Estas medidas describen el estado anterior al refactor, con nombres cortos y fotos de reemplazo. Chromium local disponible, revisión 1228, se ejecutó con ruta explícita: la revisión 1243 esperada por el Playwright instalado no estaba descargada. No se instalaron navegadores. No es una verificación en teléfonos físicos ni una ejecución de toda la suite.

## Qué aportan las referencias

| Evidencia | Aplicación a este caso | Límite |
|---|---|---|
| NN/g recomienda presentar primero lo necesario y revelar funciones menos frecuentes bajo demanda. | Descripción, fondo y eliminación pueden salir del resumen permanente; la foto y los datos que identifican el artículo permanecen visibles. [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | No significa ocultar todo lo editable. La frecuencia de uso define la jerarquía. |
| NN/g describe que los acordeones reducen desplazamiento, pero añaden interacciones y dificultan consultar varios paneles, especialmente si se cierran entre sí. | Mantener nombre y precio accesibles favorece las actualizaciones consecutivas. Si hay detalles desplegables, permitir comparar más de uno. [Accordions on Desktop](https://www.nngroup.com/articles/accordions-on-desktop/) | Es orientación sobre el patrón, no una prueba de este editor. |
| Carbon distingue información de las filas, expansión de detalles, búsqueda y acciones globales de la colección. | Buscador visible, contador de resultados y separación entre importar y editar cada artículo. [Data table usage](https://carbondesignsystem.com/components/data-table/usage/) | Adoptar esta jerarquía no obliga a usar una tabla ni agregar Carbon como dependencia. |
| El patrón adaptable lista-detalle muestra ambos paneles con espacio suficiente y uno a la vez en pantallas pequeñas. | Es una alternativa para editar un artículo con foco, con retorno a la misma posición. [Android: list-detail](https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail) | La guía es de Android; aquí se toma el principio espacial, no sus APIs. Agregar un panel junto a la actual columna estrecha requeriría ampliar el rediseño. |
| NN/g señala que muchos iconos no tienen un significado universal y se benefician de etiquetas de texto. | Acciones como «Detalles», «Mover» y «Ver en catálogo» deben entenderse sin adivinar iconos ni pasar el mouse. [Icon Usability](https://www.nngroup.com/articles/icon-usability/) | Los iconos familiares pueden acompañar al texto; no hace falta eliminarlos. |
| WCAG 2.2 distingue el mínimo AA de 24 × 24 CSS px, con excepciones, del criterio mejorado AAA de 44 × 44. | Conservar 44 px como objetivo de interacción del producto y 16 px en campos; ganar espacio mediante composición. [Mínimo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [mejorado](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) | Las medidas por sí solas no prueban accesibilidad ni comodidad real. |
| WCAG requiere una alternativa a las acciones que dependen de arrastrar, salvo excepciones. | Conservar acciones por clic/toque y teclado. Evaluar movimiento directo a una posición para recorridos largos. [Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | Botones subir/bajar cubren desplazamientos cortos; la conveniencia de un destino directo depende del uso. |

## Alternativas consideradas

| Variante | Ventaja | Costo en este editor |
|---|---|---|
| **Foto + nombre/precio editables + detalles plegados** | Conserva edición consecutiva y reconocimiento visual. Reduce controles permanentes y aprovecha foto/campos lado a lado. | Muestra menos artículos a la vez que una fila de solo lectura. Es la recomendación inicial para las tres tareas igualmente importantes. |
| Resumen compacto + «Editar» | Más artículos visibles; formulario completo solo para el elegido. | Agrega apertura por artículo. Anterior/siguiente puede aliviar la edición consecutiva, pero cambia el flujo. |
| Tabla densa tipo planilla | Buena para comparar y editar muchos valores en un área ancha. | Poco espacio en columnas de 300–340 px, nombres largos y fotos relevantes. Necesitaría una reorganización mayor o una adaptación diferente en mobile. |
| Grilla de fotos | Facilita exploración visual. | La edición de texto y el orden lineal de páginas se vuelven menos directos. No cubre por sí sola las tres tareas. |

Las dos primeras alternativas se presentaron al propietario para decidir el comportamiento. No se plantea paginar el listado del editor como primera medida: primero conviene resolver búsqueda y altura, y medir con 200 artículos. Las páginas del PDF conservan su propia organización. Virtualización o renderizado diferido solo deberían incorporarse si la medición revela un problema de rendimiento.

## Propuesta inicial a validar

1. **Encontrar:** buscador visible por nombre, sin distinguir mayúsculas ni tildes; limpiar fácilmente; cantidad de coincidencias y estado sin resultados. Foto de aproximadamente 80–96 px, con el producto completo reconocible. Mantener número de artículo y página reales.
2. **Editar seguido:** nombre y precio con etiquetas y tamaño legible, junto a la foto cuando el ancho lo permita. Si se adopta el editor separado, incluir anterior/siguiente y retorno al resultado original. Conservar el guardado automático y su estado real.
3. **Editar detalles:** desplegar descripción, fondo, cambio de foto y eliminación mediante una acción explícita. Eliminar mantiene confirmación y distancia respecto de las acciones frecuentes. No anidar otro acordeón innecesario para la descripción.
4. **Reordenar:** controles comprensibles de subir/bajar y, si se confirma, mover directamente a una posición. Arrastre como atajo en PC, iniciado desde su agarre para no interferir con selección de texto. Mantener el foco en el artículo movido e indicar el resultado.
5. **Revisar páginas:** conservar agrupación por página y ofrecer «Ver en catálogo». En mobile cambia a Vista previa y lleva al producto; volver al listado conserva búsqueda y contexto.
6. **Importar:** conservar Excel y su plantilla con menor peso visual que encontrar y editar. Su confirmación y corrección de errores siguen accesibles.

La estructura debe funcionar en la columna real de desktop, en tablet y en teléfonos de 320–430 px. Un nombre o precio largo no debe forzar desplazamiento horizontal de todo el panel. El buscador puede permanecer accesible durante el desplazamiento, comprobando que no tape campos con foco o con el teclado abierto.

Esquema de la opción recomendada; orientativo, sin fijar todavía medidas finales:

```text
Buscar artículos           [Limpiar]
50 artículos

PÁGINA 3
┌──────────────────────────────────┐
│  Foto           Nombre           │
│  reconocible    [Sillón lounge  ] │
│  80–96 px       Precio           │
│  Artículo 01    [$ 120.000      ] │
│                                  │
│ [Detalles] [Mover] [Ver catálogo] │
└──────────────────────────────────┘
```

El número no necesita un botón grande si la navegación tiene una etiqueta explícita. Las acciones del esquema se distribuyen en más de una línea cuando el ancho o el aumento de texto lo requieren. «Mover» abre controles de orden sin obligar a desplegar los campos de diseño.

## Contratos de interacción que debe resolver la implementación

- Al cambiar un nombre bajo búsqueda, el artículo no desaparece mientras se escribe ni se pierde el foco.
- Buscar y limpiar modifican solo la vista del listado; no alteran productos, orden, páginas ni exportación.
- Con búsqueda activa, el movimiento debe expresar posiciones del catálogo completo. Deshabilitar el arrastre entre resultados filtrados evita destinos ambiguos; mantener una vía explícita para mover.
- Después de mover, cambiar de pestaña o visitar la vista previa, conservar una ubicación útil y predecible.
- Conservar límites y mensajes de descripción, fotos como blobs, persistencia y bloqueos durante exportación/operaciones de gestión.
- Resultados vacíos, catálogo vacío, primer/último artículo y eliminación del artículo activo necesitan estados completos.

## Plan de validación

Medir la altura antes/después con los mismos datos y anchos, sin reducir letra ni controles. Revisar 320, 390, 1000 y 1440 px, nombres largos, teclado, foco, zoom y ausencia de desbordamiento. Usar 50 y 200 artículos para búsqueda, edición consecutiva y reordenamiento; 30/31 artículos para verificar cambios en las páginas del índice.

Ejercitar guardado y recarga, reemplazo de foto, descripción, mover primer/último artículo, destino lejano si se incorpora, búsqueda sin coincidencias, edición que deja de coincidir con la búsqueda y regreso desde Vista previa. Ejecutar `npm run verify` y revisar el cambio con `catalog-review` antes de entregar implementación.

Con cada padre, comprobar en PC y teléfono: encontrar por foto, cambiar cinco precios seguidos, cambiar una descripción/foto, mover un artículo y localizarlo en el catálogo. Registrar tiempo, errores y ayuda requerida, comparando con la interfaz actual. La prueba de navegador no reemplaza esa validación ni acredita comodidad con teclado móvil real.

## Decisiones confirmadas e implementadas

- Foto de 96 px junto al nombre y precio siempre editables; detalles secundarios plegados.
- Reordenamiento amplio, de un artículo por vez, con guardado automático, destino numérico y deshacer el último movimiento de esa sesión.
- Miniaturas con fotos y distribución real de las páginas: lateral en PC y tira horizontal visible en celular. Sirven para orientar y navegar, sin recibir arrastres.
- La comodidad de fotos, densidad y controles sigue pendiente de observación con los padres.
