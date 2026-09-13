# CI de build y protección de `main` y `Agustin`

GitHub Actions ejecuta solamente **Catalog build**: instala las dependencias fijadas con
`npm ci` y corre `npm run verify` con Node.js 24 en Ubuntu 24.04. No instala navegadores,
no ejecuta Playwright y no sube reportes de pruebas. El workflow está en
[ci.yml](../.github/workflows/ci.yml).

| Rama | Uso | Requisitos acordados | Despliegue |
|---|---|---|---|
| `main` | Versión publicada | Pull request y `Catalog build` aprobado | Producción en Netlify |
| `Agustin` | Desarrollo de Agustín | Pull request y `Catalog build` aprobado | Ninguno |

No se exige aprobación de otra persona. Cualquier colaborador con escritura puede fusionar
un pull request que cumpla los requisitos. Cada integrante usa su propia cuenta.

## 1. Si ya configuraste los checks de navegador

1. Publicá los cambios revisados en la rama de tu pull request. La nueva ejecución de
   **Catalog CI** tendrá solamente el job **Catalog build**.
2. Entrá en **Settings → Rules → Rulesets** y editá **Protect main and Agustin**.
3. En los status checks requeridos, conservá solamente **Catalog build**.
4. Eliminá `Catalog tests (chromium)`, `Catalog tests (firefox)` y `Catalog tests (webkit)`
   si todavía aparecen. Guardá el ruleset y verificá que cubra ambas ramas.
5. Si usaste reglas clásicas en **Settings → Branches**, quitá también esos requisitos de
   cada regla aplicable a `main` y `Agustin`.
6. Si quedan ejecuciones antiguas con navegadores, podés cancelarlas desde
   **Actions → Catalog CI → la ejecución antigua → Cancel workflow**. Conservá la ejecución nueva.

Eliminar los jobs del archivo no elimina los requisitos guardados en GitHub. Si quedan
checks de navegador obligatorios, el merge seguirá esperando resultados que ya no se generan.
Los pasos anteriores cambian la configuración de GitHub; los cambios locales no los ejecutan.

## 2. Configurar la protección desde cero

Si todavía no activaste protección, hacé commit y push de los cambios revisados a tu rama
habitual. Abrí **Pull requests → New pull request**, con **base: `Agustin`** y **compare: tu rama**.
Base es el destino de los cambios. Esperá que **Catalog build** termine correctamente en **Checks**.

Si no aparece el workflow, revisá **Settings → Actions → General**: Actions debe estar
habilitado y permitir las acciones oficiales de GitHub. No hace falta agregar credenciales.

Con acceso de administración, configurá un ruleset según la
[guía oficial de GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository):

1. Entrá en **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. Usá el nombre **Protect main and Agustin** y **Enforcement status: Active**.
3. Dejá **Bypass list** vacía para que también se aplique a tu cuenta.
4. En **Target branches → Add a target → Include by pattern**, agregá dos patrones exactos:
   `main` y `Agustin`. Conservá la `A` mayúscula y no uses `*`.
5. Configurá estas opciones:

| Opción de GitHub | Valor |
|---|---|
| Restrict deletions | Activada |
| Block force pushes | Activada |
| Require a pull request before merging | Activada |
| Required approvals | **0** |
| Require status checks to pass | Activada; solamente **Catalog build** |
| Require branches to be up to date before merging | Activada |
| Restrict updates | **Desactivada** |
| Require deployments to succeed | Desactivada |

Dejá las demás restricciones opcionales desactivadas. **Restrict updates** impediría
actualizaciones normales sin bypass; la obligación de usar pull requests ya cubre el flujo
acordado. Consultá las [reglas disponibles](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

6. Seleccioná **GitHub Actions** como origen esperado de **Catalog build** cuando la interfaz
   lo ofrezca. Confirmá que el check quede agregado a la lista.
7. Guardá con **Create** y verificá que el ruleset esté activo sobre ambas ramas.

Si el check no aparece, revisá que la primera ejecución haya ocurrido recientemente. No
agregues requisitos de las antiguas suites de navegador. Revisá otras reglas existentes si
GitHub sigue pidiendo checks o aprobaciones adicionales.

## 3. Trabajar y publicar

Para tus cambios, creá una rama desde `Agustin`, trabajá ahí y abrí un pull request de vuelta
a `Agustin`. Para publicar, abrí otro con **base: `main`** y **compare: `Agustin`**. Esperá
**Catalog build**, revisá el diff y fusioná cuando corresponda.

Usá **Create a merge commit** entre estas ramas duraderas y conservá `Agustin` después del
merge. Si `main` recibió cambios de otros integrantes, incorporalos a `Agustin` mediante
otro pull request antes de la siguiente salida. Tu padre y tu hermano pueden abrir pull
requests hacia el destino correspondiente sin pasar obligatoriamente por `Agustin`.

| Lo que muestra GitHub | Qué hacer |
|---|---|
| `Catalog build` rojo | Abrí **Details**, corregí el error y subí el arreglo a la misma rama. |
| La rama está desactualizada | Incorporá los cambios del destino y esperá el nuevo build; usá un pull request si el origen también está protegido. |
| Un antiguo check de navegador figura como Expected | Quitalo del ruleset y de cualquier regla clásica aplicable. |
| El workflow fue cancelado | Revisá la ejecución más reciente; otra ejecución para el mismo pull request puede reemplazar la anterior. |
| `Catalog build` verde | Revisá y fusioná cuando corresponda, sin esperar pruebas de navegador. |

Para investigar errores, abrí **Actions → Catalog CI → la ejecución → Catalog build** y
revisá los logs del paso que falló. No hay paquetes de resultados de navegador en este workflow.

## 4. Netlify: publicar solamente `main`

En Netlify, entrá en **Project configuration → Build & deploy → Continuous deployment →
Branches and deploy contexts** y verificá:

- **Production branch: `main`**.
- **Branch deploys: None**.
- **Deploy Previews** desactivado si querés publicar solamente desde `main`.
- Comando de build **npm run build** y directorio de publicación **dist**.

Branch deploys y Deploy Previews son opciones diferentes; consultá la
[guía de Netlify](https://docs.netlify.com/deploy/deploy-overview/). El workflow de GitHub no
publica ni usa credenciales de Netlify. El check del pull request protege el merge; el build
adicional después de un push a `main` no detiene un despliegue que Netlify ya haya comenzado.

## Detalles del build y comprobación final

El workflow corre para pull requests hacia `main` o `Agustin`, incluyendo actualizaciones
y cambios de destino, y después de un push a esas ramas. Permite ejecución manual desde
**Actions → Catalog CI → Run workflow** cuando está en la rama predeterminada. No filtra por
archivos, por lo que los cambios de documentación también generan el check requerido.

El job tiene un límite de 15 minutos y cachea las descargas de npm. `npm run verify` compila
TypeScript, construye la app y comprueba espacios en los cambios locales de Git. En un
checkout limpio esa última comprobación no valida por sí sola el diff completo del pull request.
Las pruebas Chromium/WebKit siguen disponibles manualmente con `npm test`; no son parte de CI.

Las acciones oficiales siguen fijadas por commit:

| Acción | Versión | Commit |
|---|---|---|
| [actions/checkout](https://github.com/actions/checkout/releases/tag/v7.0.1) | 7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [actions/setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0) | 7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` |

Antes de dar por activada la protección, verificá en un pull request a cada rama que
**Catalog build** sea el único check requerido y que ningún test antiguo quede pendiente.
Un build correcto comprueba la compilación; no valida las interacciones del navegador ni
la apariencia del PDF. La configuración efectiva de GitHub y Netlify se verifica en sus paneles.
