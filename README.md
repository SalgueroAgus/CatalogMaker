# CatalogMaker

Generador de catálogos PDF profesionales. Cargás fotos, editás nombre y precio, y descargás un PDF listo para compartir.

---

## Para usar la app (sin instalar nada)

Abrí el link del proyecto en el navegador y listo. No necesitás instalar nada.

## Guardado en este navegador

El catálogo se guarda localmente en el navegador y dispositivo que estás usando. Iniciar sesión
no sincroniza los productos con otros equipos. Esperá **Guardado en este navegador** antes de
recargar o cerrar. Si aparece un error, mantené la pestaña abierta y usá **Reintentar guardado**;
también podés descargar el PDF con los cambios de la sesión. Los cambios sin confirmar pueden
perderse al cerrar por fuerza. Si la carga falla, usá **Reintentar carga**: la app no vacía tus datos.

Editá con los campos etiquetados de **Productos** y usá **Cambiar foto**, **Subir** y **Bajar**.
La flecha **Volver arriba** lleva al comienzo de Productos o Vista Previa.
En **Productos → Páginas** podés elegir una cantidad general y, en cada página,
seleccionar de 1 a 5 fotos o volver a **General**. Los productos siguientes se
redistribuyen conservando su orden; las cantidades propias se guardan en este navegador.
La altura de la descripción se ajusta al texto y a la tipografía.

Las descripciones nuevas admiten hasta 500 caracteres. Una importación que excede ese límite
se detiene para que corrijas la fila; no recorta el texto importado.

En **Ajustes → Administración del catálogo** hay tres acciones con confirmación:

- **Vaciar catálogo** elimina los productos y sus fotos; conserva los ajustes y el fondo.
- **Restablecer ajustes** conserva los productos, su orden y fotos; restaura diseño y fondo.
- **Restablecer todo** elimina los productos y fotos y restaura los ajustes.

En **Página → Fondo**, cambiar entre Color e Imagen solo muestra otros controles. La foto se
elimina mediante **Quitar imagen**.

El PDF sirve para compartir y consultar el catálogo, pero no permite restaurar una sesión
editable. El backup completo y la transferencia editable entre dispositivos siguen pendientes;
no borres los datos del navegador esperando recuperarlos desde el PDF o una plantilla Excel.

La verificación automatizada de Prioridad 1 está registrada. Faltan las pruebas con dispositivos
reales y ambos padres; consultá el [registro de pruebas](docs/priority1-verification.md).

---

## Para desarrollar (configuración inicial)

Necesitás instalar dos herramientas una sola vez:

### 1. Instalar Node.js

Node.js es el motor que corre el proyecto localmente.

1. Entrá a https://nodejs.org
2. Descargá la versión **LTS** (la que dice "Recommended for most users")
3. Instalala con los valores por defecto

Para verificar que funcionó, abrí una terminal y escribí:
```
node --version
```
Debería mostrar algo como `v24.x.x`; CI usa Node.js 24 LTS.

### 2. Instalar las dependencias del proyecto

Abrí una terminal **dentro de la carpeta del proyecto** y ejecutá:
```
npm install
```
Esto descarga todas las librerías que el proyecto necesita. Solo hay que hacerlo una vez (o cuando alguien agregue librerías nuevas).

---

## Comandos del día a día

Todos se ejecutan desde la terminal, dentro de la carpeta del proyecto.

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Arranca el servidor local. Abrí http://localhost:5173 en el navegador. Los cambios se ven al instante. |
| `npm run build` | Genera la versión final lista para subir a internet (carpeta `dist/`). |
| `npm run preview` | Previsualiza el build final antes de subir. |
| `npm run verify` | Build y comprobaciones de espacios en los cambios Git. |
| `npm run test` | Regresiones Playwright con datos y perfiles descartables. |

## Checks antes de fusionar cambios

GitHub Actions ejecuta solamente `npm run verify` como **Catalog build** para los pull requests
hacia `main` y `Agustin`. Las pruebas de navegador quedan disponibles para ejecución local manual.
`main` es la rama de producción; `Agustin` no se despliega. Seguí el
[tutorial de GitHub y Netlify](docs/ci-github-setup.md) para exigir únicamente **Catalog build**
y quitar los antiguos checks de navegador del ruleset. El archivo de CI por sí solo no bloquea
merges. No se exige aprobación de otra persona.

---

## Cómo está organizado el código

```
src/
├── components/
│   ├── atoms/          # Piezas mínimas: Button, Input, Select, Toggle…
│   ├── molecules/      # Combinaciones de átomos: ProductCard, ColorGroup…
│   ├── organisms/      # Secciones completas: LeftSidebar, Workspace, RightSidebar…
│   └── templates/      # Estructura de la página: AppLayout
│
├── store/              # Estado global (productos y configuración)
│   ├── useProductStore.ts
│   └── useSettingsStore.ts
│
├── hooks/              # Lógica reutilizable
│   ├── usePDF.ts       # Exportación a PDF
│   └── usePageScale.ts # Escala de la página en mobile/tablet
│
├── utils/              # Funciones de ayuda
│   ├── chunks.ts       # Paginación y distribuciones de 1–5 productos
│   ├── image.ts        # Manejo de imágenes (placeholder, base64)
│   └── scroll.ts       # Scroll suave a productos
│
├── constants/
│   └── fonts.ts        # Lista de tipografías disponibles
│
├── styles/             # Archivos CSS (uno por sección)
│   ├── globals.css
│   ├── layout.css
│   ├── sidebar-left.css
│   ├── sidebar-right.css
│   ├── workspace.css
│   ├── page.css
│   ├── product.css
│   ├── index-page.css
│   ├── mobile.css
│   └── print.css
│
├── types/
│   └── index.ts        # Definiciones de tipos TypeScript
│
├── App.tsx             # Componente raíz
└── main.tsx            # Punto de entrada
```

### Reglas básicas para agregar cosas con IA

- **¿Querés cambiar algo visual?** Empezá por el componente en `components/` y su CSS en `styles/`.
- **¿Querés agregar una función nueva?** Si modifica productos, hacelo en `store/useProductStore.ts`. Si modifica configuración (colores, fuentes), en `store/useSettingsStore.ts`.
- **¿Querés agregar un botón?** Usá el átomo `Button` que ya existe en `components/atoms/Button.tsx`.
- Después de cualquier cambio, corré `npm run build` para verificar que no haya errores.

---

## Despliegue en Netlify

El proyecto se despliega automáticamente desde la rama `main`.

Si necesitás hacerlo manualmente:
1. Corré `npm run build`
2. Subí la carpeta `dist/` a Netlify (drag & drop en el panel de control)

La configuración de build ya está en `netlify.toml`.

## Pruebas de desarrollo

La suite usa Chromium y WebKit de Playwright. En esta sesión los binarios autorizados
se instalaron en `/private/tmp/catalogmaker-playwright-browsers`; ejecutá:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/catalogmaker-playwright-browsers npm run test
npm run verify
```

Los tests de archivos exportados usan `swiftc`, PDFKit y Vision incluidos en el entorno macOS;
no son dependencias de la aplicación. Si no están disponibles, esas comprobaciones quedan
pendientes y deben ejecutarse en un entorno compatible. Los artefactos y reportes se escriben
en `/private/tmp/catalogmaker-priority1-*`, fuera del código versionado. No se publica nada
ni se usan datos personales. La suite necesita el puerto local 5173 libre. Estas pruebas no se
ejecutan automáticamente en GitHub ni son un requisito para fusionar cambios.

Las pruebas con teléfonos reales y ambos padres se registran por separado con esta
[guía](docs/priority1-device-checks.md). La emulación de pantallas pequeñas no prueba el teclado
real ni la descarga/compartición del sistema.
