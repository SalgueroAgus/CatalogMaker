# CI y protección de `main` y `Agustin`

GitHub Actions ejecuta las comprobaciones; un ruleset de GitHub las convierte en requisitos
para fusionar cambios. Agregar el workflow al repositorio no activa por sí solo la protección.

| Rama | Uso | Requisitos acordados | Despliegue |
|---|---|---|---|
| `main` | Versión publicada | Pull request y cuatro checks aprobados | Producción en Netlify |
| `Agustin` | Desarrollo de Agustín | Pull request y cuatro checks aprobados | Ninguno |

No se exige aprobación de otra persona. Cualquier colaborador con escritura puede fusionar
un pull request que cumpla los requisitos, incluso hacia `Agustin`. Cada integrante usa su
propia cuenta. La protección incluye al dueño de la cuenta mientras el ruleset esté activo
y no haya excepciones; quien administra el repositorio puede modificar esa configuración.

## 1. Publicar los cambios y ejecutar CI por primera vez

La configuración está en [ci.yml](../.github/workflows/ci.yml). Se incorpora junto con la rama
de trabajo que contiene la suite Playwright. Estos pasos publican esa rama; revisá qué cambios
incluye antes de hacer el commit y el push desde tu herramienta habitual de Git.

1. Hacé commit de los cambios revisados y publicá la rama de trabajo en GitHub.
2. Abrí el [repositorio](https://github.com/SalgueroAgus/CatalogMaker).
3. Entrá en **Pull requests → New pull request**.
4. Elegí **base: `Agustin`** y **compare: la rama de trabajo**. Base es el destino de los cambios.
5. Revisá la diferencia y creá el pull request.
6. Abrí **Checks** y esperá los cuatro resultados:

| Nombre exacto del check | Qué ejecuta |
|---|---|
| `Catalog build` | `npm ci` y `npm run verify` con Node.js 24 en Ubuntu 24.04 |
| `Catalog tests (chromium)` | Suite Chromium y comprobaciones de exportación en macOS 15 |
| `Catalog tests (firefox)` | Suite Firefox y comprobaciones de exportación en macOS 15 |
| `Catalog tests (webkit)` | Suite WebKit y comprobaciones de exportación en macOS 15 |

Si no aparece ningún workflow, entrá en **Settings → Actions → General** y verificá que
Actions esté habilitado y que permita las acciones oficiales de GitHub. No hace falta agregar
un token personal ni credenciales de Netlify. Si GitHub pide aprobar una ejecución procedente
de un fork, revisá los cambios antes de autorizarla.

No continúes con el primer merge mientras haya checks fallidos. La primera ejecución permite
comprobar el entorno de GitHub y registrar los nombres que se usarán en la protección.

## 2. Proteger las dos ramas con un ruleset

Necesitás acceso de administración. Esta función está disponible para repositorios públicos
en GitHub Free. Consultá la [guía oficial de rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository).

1. Entrá en **Settings → Rules → Rulesets**. Según la interfaz, el menú puede aparecer como **Rulesets**.
2. Elegí **New ruleset → New branch ruleset**.
3. Escribí **Protect main and Agustin** como nombre.
4. En **Enforcement status**, elegí **Active**.
5. Dejá **Bypass list** vacía: no agregues tu cuenta, administradores, colaboradores ni bots.
6. En **Target branches → Add a target → Include by pattern**, agregá `main`.
7. Agregá otra inclusión exacta para `Agustin`, con la `A` mayúscula. No uses `*`.
8. Configurá las protecciones de esta tabla:

| Opción de GitHub | Valor |
|---|---|
| Restrict deletions | Activada |
| Block force pushes | Activada |
| Require a pull request before merging | Activada |
| Required approvals | **0** |
| Require review from Code Owners | Desactivada |
| Require approval of the most recent reviewable push | Desactivada |
| Require status checks to pass | Activada |
| Require branches to be up to date before merging | Activada |
| Restrict updates | **Desactivada** |
| Restrict creations | Desactivada |
| Require deployments to succeed | Desactivada |
| Require linear history / merge queue / signed commits | Desactivadas |

Dejá las demás restricciones opcionales desactivadas. **Restrict updates** impediría las
actualizaciones normales sin permiso de bypass; la obligación de usar pull requests ya cubre
el flujo acordado. Las [reglas disponibles](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
explican la diferencia.

9. Dentro de los status checks requeridos, agregá **los cuatro nombres exactos de la sección 1**.
10. Seleccioná **GitHub Actions** como origen esperado de cada check cuando la interfaz lo ofrezca.
11. Verificá que los cuatro estén efectivamente agregados a la lista, no solamente escritos en el buscador.
12. Guardá con **Create** y comprobá que el ruleset siga en **Active** y apunte a ambas ramas.

Si un check no aparece, volvé al pull request inicial y verificá que se haya ejecutado
recientemente. No omitas ese requisito para completar la pantalla. Revisá también si ya hay
otras protecciones activas: se pueden combinar y exigir requisitos adicionales.

## 3. Completar la incorporación

1. Volvé al pull request hacia `Agustin` y comprobá que GitHub marque los cuatro checks como requeridos.
2. Cuando estén aprobados, fusioná ese pull request.
3. Cuando quieras publicar la versión, creá otro pull request con **base: `main`** y **compare: `Agustin`**.
4. Esperá sus cuatro checks; no se reutiliza la aprobación visual de un pull request anterior.
5. Para integrar estas dos ramas duraderas, elegí **Create a merge commit**. Si no está disponible,
   habilitá **Allow merge commits** en **Settings → General → Pull Requests**.
6. Conservá `Agustin` después del merge. Netlify publicará el cambio de `main` si está conectado como se indica abajo.

Es posible proteger `main` antes de que el workflow llegue a esa rama: el pull request desde
`Agustin` lo incorpora. Los pull requests antiguos que todavía no contengan la configuración
pueden quedar esperando checks. Una vez incorporado CI al destino, actualizá esas ramas desde
él. Si todavía no querés publicar la versión de `Agustin`, mantené pendiente el merge de salida.

## 4. Trabajar después de activar la protección

Para tus cambios, creá una rama nueva desde `Agustin`, trabajá ahí y abrí un pull request de
vuelta a `Agustin`. Para publicar, abrí el pull request de `Agustin` a `main`. Si `main` recibió
cambios de otros integrantes, incorporalos a `Agustin` mediante otro pull request antes de la
siguiente salida. Conservá el historial compartido con merge commits entre ramas duraderas.

Tu padre y tu hermano pueden crear sus ramas desde el destino correspondiente y abrir sus
propios pull requests. No se exige pasar por `Agustin` para llegar a `main`.

| Lo que muestra GitHub | Qué hacer |
|---|---|
| Un check rojo | Abrí **Details**, corregí el problema y subí el arreglo a la misma rama del pull request. |
| La rama está desactualizada | Incorporá los cambios del destino y esperá que CI vuelva a ejecutarse. Si la rama de origen también está protegida, usá un pull request para actualizarla. |
| Un check figura como Expected | Verificá el nombre requerido, que Actions esté habilitado y que el pull request incluya el workflow. |
| El workflow fue cancelado | Revisá la ejecución del último commit; un commit nuevo cancela la ejecución anterior de ese pull request. |
| Todos los checks requeridos están verdes | Revisá el diff y fusioná cuando corresponda. No se pide aprobación obligatoria de otra persona. |

Para investigar una falla, abrí **Actions → Catalog CI → la ejecución → Artifacts**. Descargá
el paquete `catalog-tests-<navegador>-<intento>`, que contiene el reporte HTML/JSON y los
diagnósticos retenidos. Se conserva siete días. Después de extraerlo, podés abrir el reporte
con la instalación existente de Playwright:

```sh
./node_modules/.bin/playwright show-report /ruta/al/paquete/playwright-report
```

Un fallo durante la instalación puede no producir reporte de pruebas; en ese caso consultá
los logs del paso fallido. La suite usa catálogos descartables y bloquea las solicitudes
externas de la app. Los PDF/HTML de inspección se generan en directorios temporales del runner;
el paquete de diagnósticos incluye los archivos guardados en `test-results` y `playwright-report`.

## 5. Netlify: publicar solamente `main`

La protección de GitHub no cambia la configuración de Netlify. En el proyecto de Netlify:

1. Entrá en **Project configuration → Build & deploy → Continuous deployment**.
2. Abrí **Branches and deploy contexts** y su opción de edición.
3. Confirmá **Production branch: `main`**.
4. Configurá **Branch deploys: None** para que `Agustin` y las demás ramas no se desplieguen.
5. Desactivá **Deploy Previews** si el objetivo es publicar únicamente al actualizar `main`.
6. Guardá la configuración. Conservá el comando de build `npm run build` y el directorio `dist`.

Branch deploys y Deploy Previews son opciones distintas. La [guía de Netlify](https://docs.netlify.com/deploy/deploy-overview/)
describe ambas. El workflow de CI no publica ni usa credenciales de Netlify. Las pruebas del
pull request bloquean el merge; la ejecución adicional después de un push a `main` no detiene
un despliegue que Netlify ya haya empezado.

## 6. Comprobar la protección

- Verificá que el ruleset esté activo sobre `main` y `Agustin`, con lista de bypass vacía.
- Confirmá los cuatro checks en un pull request a cada rama.
- En una rama descartable, introducí temporalmente una aserción fallida y abrí un pull request:
  GitHub debe bloquear el merge. Corregila y comprobá que la nueva ejecución permita fusionar.
  Repetí contra el otro destino y cerrá estos pull requests de diagnóstico sin fusionarlos.
- Verificá las reglas de borrado y force push en la configuración; no pruebes borrando ramas reales.
- Confirmá que actualizar `Agustin` no cree un despliegue y que una salida elegida a `main` sí lo haga.

Que las pruebas locales aprueben no valida la configuración de GitHub. La primera ejecución
alojada, el bloqueo efectivo y Netlify se comprueban después de publicar y activar las reglas.
Los tests tampoco sustituyen las pruebas de teclado/compartición en teléfonos reales ni
garantizan que cualquier cambio generado con IA sea correcto.

## Detalles para mantener CI

El workflow corre en cada pull request hacia `main` o `Agustin`, al actualizarlo o cambiar su
destino, y después de un push a cualquiera de esas ramas. También permite ejecución manual
desde **Actions → Catalog CI → Run workflow** una vez que existe en la rama predeterminada.
No filtra por archivos: los cambios de documentación también ejecutan los checks requeridos.

Cada navegador usa una máquina macOS 15 independiente, un worker y cero reintentos automáticos.
Se conserva la prueba de zoom nativo exclusiva de Chromium. `test.only` provoca error en CI.
El build tiene un límite de 15 minutos y cada navegador de 90 minutos. Los jobs no dependen
entre sí y una falla de un navegador no cancela los demás.

Node.js 24 y las versiones de `package-lock.json` fijan el entorno de dependencias. El cache
acelera las descargas de npm; no reemplaza `npm ci`. `npm run verify` incluye el build y la
comprobación de espacios del working tree; en el checkout limpio de CI esa comprobación Git
no revisa por sí sola el diff completo del pull request.

Las acciones oficiales están fijadas por commit. Al actualizarlas, verificá el commit en la
publicación oficial y cambiá las referencias repetidas del workflow y esta tabla juntas:

| Acción | Versión | Commit |
|---|---|---|
| [actions/checkout](https://github.com/actions/checkout/releases/tag/v7.0.1) | 7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [actions/setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0) | 7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.1) | 7.0.1 | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |

Los runners estándar son gratuitos para repositorios públicos; los reportes usan almacenamiento
y expiran a los siete días. Ver [runners de GitHub](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
y [facturación de Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
