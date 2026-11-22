# Pruebas E2E (Playwright)

Pruebas de extremo a extremo de Momazos: se abre un navegador real (Chromium) y se recorre la
aplicación como lo haría un usuario.

## Requisitos

- Haber ejecutado `npm install`, `npm install --prefix backend` y `npm install --prefix frontend`.
- Los puertos **4000** (backend) y **5173** (frontend) libres: cierra `npm run dev` si lo tienes abierto.
- No hace falta tener MongoDB instalado: las pruebas usan una base **en memoria**, ya sembrada
  (la primera vez se descarga el binario de MongoDB).

## Instalación (una sola vez)

Desde la raíz del repositorio:

```powershell
npm install
npx playwright install chromium
```

## Ejecución

Desde la raíz. Playwright levanta solo el backend y el frontend.

| Comando | Qué hace |
|---|---|
| `npm run test:e2e` | Corre todas las pruebas. |
| `npm run test:e2e:headed` | Igual, mostrando el navegador. |
| `npm run test:e2e:ui` | Abre el modo interactivo de Playwright. |
| `npx playwright show-report` | Abre el reporte HTML de la última corrida. |

Una prueba suelta: `npx playwright test e2etests/auth.spec.ts -g "registrarse"`.

## Qué se prueba

| Archivo | Flujos |
|---|---|
| `navegacion.spec.ts` | Página principal con memes reales de la API, ranking y anti-ranking, `/meme/:id` (acceso directo y recarga), rutas protegidas sin sesión, ruta inexistente, back/forward, recarga (F5). |
| `auth.spec.ts` | Registro, login, login inválido, logout, volver a la ruta original tras el login, sesión tras F5, usuario normal sin acceso a moderación. |
| `memes.spec.ts` | Publicar un meme, error al publicar sin imagen, votar y comentar desde el feed de inicio (con y sin sesión). |
| `moderacion.spec.ts` | Entrar como moderador, aprobar y rechazar un meme pendiente y comprobar que aparece (o no) en el inicio. |

## Cómo se mantienen deterministas

- La base de datos en memoria se crea y se siembra en cada corrida: no queda nada de ejecuciones anteriores.
- Cada prueba crea sus propios usuarios y memes con nombres únicos (`e2etests/support/helpers.ts`)
  y no depende de los datos que dejen otras pruebas.
- Los ids de los memes no se escriben a mano: se consultan a la API.
- Las pruebas corren de a una (`workers: 1`).
- La única cuenta del seed que se usa es el moderador `admin@memes.com` (usuario `AdminGatito`, ver README principal).

## Probar el despliegue

```powershell
$env:E2E_BASE_URL = "https://fullstack.dcc.uchile.cl:7039"
npx playwright test --grep "@readonly"
```

Solo las pruebas con la etiqueta `@readonly` (`navegacion.spec.ts`) son seguras contra el despliegue.
Las demás crean usuarios y memes en la base de datos del servidor.

## Estructura

```text
playwright.config.ts          configuración (en la raíz)
e2etests/
├── auth.spec.ts
├── memes.spec.ts
├── moderacion.spec.ts
├── navegacion.spec.ts
├── fixtures/meme.png         imagen usada al publicar
└── support/
    ├── env.ts                URLs y credenciales del moderador
    └── helpers.ts            usuarios únicos, login, publicar, moderador
```
