# C1 / A1 / D3 — verificación

Fecha: 13 de septiembre de 2026. Alcance: cambios de catálogos y respaldos respecto de
`0d8e0c72da9f901a4a58e0e8886bc729b1b4b4c5`, incluidas las correcciones posteriores
al reporte de paneles duplicados. No se publicó el sitio ni se instalaron dependencias.

## Comportamiento comprobado

- Migración normal, simultánea e interrumpida; conservación de claves originales y
  reanudación del mismo Principal. Errores de carga, falta de espacio, abortos y reintentos.
- Catálogos vacíos, copias independientes, nombres, protección de Principal, reinicios,
  eliminación recuperable y eliminación definitiva con confirmaciones.
- Cambio con precios pendientes, guardados pendientes o fallidos y exportación activa.
  Aperturas fallidas conservan la selección y liberan solamente las nuevas URLs.
- Dos pestañas: selección independiente, conflictos, conservación del borrador como copia,
  eliminación remota y comparación transaccional de revisión sin BroadcastChannel.
- Respaldo y restauración en otro perfil persistente de Chrome con solicitudes externas
  bloqueadas: comparación de productos, ajustes, distribuciones y bytes originales de fotos
  y ambos fondos. Archivos corruptos, versiones desconocidas y fallos de restauración.
- Cambios repetidos mediante Mis catálogos entre 13 productos y un catálogo vacío:
  exactamente un panel de herramientas y una vista previa, sin recarga ni claves duplicadas.

## Correcciones de revisión

Se aplicó el flujo de `catalog-review` al alcance de la tarea. Los hallazgos confirmados
se corrigieron dentro de la implementación: claves distintas para herramientas y vista
previa al cambiar de sesión; revisión persistida del catálogo activo al modificar sus
metadatos; protección de callbacks antiguos; validación de respaldos sin campos de ajustes;
y espacio mínimo para el estado de guardado en la cabecera.

## Ejecuciones y límites

`npm run verify` pasó: TypeScript, build y comprobaciones de espacios de Git.
Vite mantiene los avisos de API CJS y tamaño de bundle.

La suite completa del proyecto Chromium se ejecutó con Google Chrome instalado:
226 de 231 casos pasaron. Un caso de PDF/HTML (60 productos, uno por página) fue
interrumpido por una recarga de Vite durante una edición del código. Cuatro casos de
desplazamiento de `ui.spec.ts` fallaron; por eso esa ejecución no constituye una suite verde.

La comparación aislada con la versión anterior, usando las mismas dependencias y Chrome,
reprodujo fallos de desplazamiento en 800×360, 768×900, 1023×900, 1024×900 y 1440×1000
(3 casos pasaron y 5 fallaron). Estos fallos previos al cambio de catálogos corresponden
a controles que salen del área visible durante edición, reordenamiento y cambios de altura;
su variación entre ejecuciones requiere seguimiento separado de navegación.

Los comandos usan `CATALOG_TEST_PORT=5189 CATALOG_TEST_CHROME=1 npm test -- --project=chromium`.
El puerto habitual 5173 estaba ocupado. La revisión de referencia se ejecutó en una copia
temporal del commit anterior, sin cambiar el árbol de trabajo ni los datos del usuario.

WebKit no está instalado en la versión requerida por Playwright; tampoco está disponible
el Chromium empaquetado requerido, por lo que se utilizó Google Chrome. No se descargaron
navegadores. Sigue pendiente la aceptación WebKit, dispositivos físicos y recorrido con
cada integrante de la familia. La emulación no verifica teclados móviles, compartir archivos,
formatos reales de fotos ni el escenario de 200 fotos del negocio. No se probó publicación real.
