# CatalogFlow Pro

Generador de catálogos PDF profesionales. Cargás fotos, editás nombre y precio, y descargás un PDF listo para compartir.

---

## Para usar la app (sin instalar nada)

Abrí el link del proyecto en el navegador y listo. No necesitás instalar nada.

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
Debería mostrar algo como `v20.x.x`.

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
│   ├── chunks.ts       # Divide productos en páginas de 3
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
