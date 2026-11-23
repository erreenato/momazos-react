# Momazos React

Aplicación web de memes desarrollada para el curso CC5003. El proyecto está
compuesto por una SPA en React y un backend REST en TypeScript con Express,
Mongoose y MongoDB.

## Tecnologías principales

- React, React Router, TypeScript y Vite.
- Material UI (MUI) como librería visual, con tipografía Inter (ver
  [Guía visual](#guía-visual)).
- Node.js, Express y TypeScript.
- MongoDB mediante Mongoose.
- JWT en cookie `httpOnly` para la autenticación.
- Token CSRF enviado mediante `X-CSRF-Token`.
- Multer para la carga de imágenes.

## Requisitos

- Node.js y npm.
- Una instancia de MongoDB local o remota.
- Dos terminales para ejecutar el backend y el frontend por separado.

## Variables de entorno

### Backend

Crear `backend/.env` a partir de [`backend/.env.example`](./backend/.env.example):

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/momazos_db
JWT_SECRET=tu_secreto_super_seguro
FRONTEND_URL=http://localhost:5173
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/momazos_test
```

- `PORT`: puerto del backend.
- `MONGO_URI`: URI de la base de datos principal.
- `JWT_SECRET`: secreto utilizado para firmar los JWT.
- `FRONTEND_URL`: origen permitido para CORS.
- `TEST_MONGODB_URI`: URI de MongoDB utilizada por las pruebas.

### Frontend

Crear `frontend/.env` a partir de
[`frontend/.env.example`](./frontend/.env.example):

```env
VITE_API_URL=http://localhost:4000/api
```

Los archivos `.env` no deben subirse al repositorio. Los valores de ejemplo
sí están incluidos en los archivos `.env.example`.

## Instalación

Desde la raíz del repositorio:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
```

## Carga de datos de prueba

Con MongoDB ejecutándose y `backend/.env` configurado, ejecutar desde la raíz:

```powershell
npm run seed
```

El seed crea usuarios, memes, comentarios y reacciones de demostración.
También crea el usuario moderador:

```text
Email: admin@memes.com
Contraseña: password123
```

La contraseña de demostración es compartida por los usuarios creados por el
seed. No debe utilizarse como credencial real en producción.

## Ejecución local

El backend y el frontend se ejecutan en terminales separadas.

### Terminal 1: backend

Desde la raíz:

```powershell
npm run dev:backend
```

El backend queda disponible, por defecto, en:

```text
http://localhost:4000
```

### Terminal 2: frontend

Desde la raíz:

```powershell
npm run dev:frontend
```

El frontend queda disponible, por defecto, en:

```text
http://localhost:5173
```

También se pueden ejecutar los comandos directamente dentro de cada carpeta:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

## Scripts útiles

Desde la raíz del repositorio:

| Comando | Uso |
|---|---|
| `npm run seed` | Carga los datos de demostración en MongoDB. |
| `npm run dev:backend` | Inicia el backend conectado a `MONGO_URI`. |
| `npm run dev:frontend` | Inicia el frontend con Vite. |
| `npm run build` | Compila el frontend y el backend. |
| `npm run build:frontend` | Compila solamente el frontend. |
| `npm run build:backend` | Compila solamente el backend. |
| `npm test --prefix backend` | Ejecuta las pruebas del backend. |
| `npm run test:e2e` | Ejecuta las pruebas E2E con Playwright (ver [`e2etests/README.md`](./e2etests/README.md)). |

## API

Todos los endpoints del backend utilizan el prefijo `/api`.

### Autenticación

- `POST /api/auth/register`: registra un usuario.
- `POST /api/auth/login`: inicia sesión.
- `POST /api/auth/logout`: cierra sesión.
- `GET /api/auth/me`: obtiene la sesión actual.

### Recursos principales

- Memes: `/api/memes`.
- Usuarios: `/api/users`.
- Comentarios: `/api/comments`.
- Moderación: `/api/moderation/memes` y `/api/memes/:id/status`.

Las operaciones protegidas requieren una sesión válida. Las operaciones de
moderación requieren el rol `moderator`.

## Guía visual

La interfaz usa **Material UI** (`@mui/material` + `@mui/icons-material`).
Todo el diseño parte de un único tema definido en
[`frontend/src/theme/theme.ts`](frontend/src/theme/theme.ts), que se aplica a
toda la app con `<ThemeProvider>` en `frontend/src/main.tsx`.

El tema publica su paleta como variables CSS (`--mui-palette-*`). Las variables
del CSS original (`--accent`, `--bg`, `--text`, etc. en `frontend/src/index.css`)
leen esas variables, así que los componentes MUI y el CSS existente usan
exactamente los mismos colores.

### Colores

| Rol | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `primary` | `#8900ff` | `#b366ff` | Acciones principales, enlaces, elemento activo del menú. |
| `secondary` | `#00a6dd` | `#00c2ff` | Acento secundario. |
| `success` | `#16a34a` | `#22c55e` | Aprobar memes, estado "Aprobado", mensajes de éxito. |
| `warning` | `#f59f00` | `#fbbf24` | Estado "Pendiente". |
| `error` | `#dc2626` | `#f87171` | Errores, rechazar/eliminar, puntajes negativos. |
| `background.default` | `#f4f3ec` | `#1f2028` | Fondo de la página, barra de navegación. |
| `background.paper` | `#ffffff` | `#16171d` | Tarjetas, diálogos, formularios. |
| `text.primary` / `text.secondary` | `#08060d` / `#6b6375` | `#f3f4f6` / `#9ca3af` | Títulos / texto secundario. |

El modo claro u oscuro se elige automáticamente según la preferencia del
sistema operativo (`prefers-color-scheme`).

### Tipografía

- Fuente **Inter** (pesos 400, 500, 600 y 700), cargada con `@fontsource/inter`.
- Títulos `h1`–`h4` en peso 700; botones en peso 600 y **sin mayúsculas forzadas**.

### Botones

| Variante | Cuándo usarla |
| --- | --- |
| `contained` | Acción principal de la vista (Entrar, Publicar, Guardar, Compartir, Aprobar). |
| `outlined` | Acción secundaria o alternable (reacciones, Editar perfil, Rechazar, Ver ranking). |
| `text` | Acciones de baja prioridad (Cancelar, Responder, Cerrar sesión). |

- Forma de **píldora** (`border-radius: 999px`) en todos los botones.
- Color `error` para acciones destructivas (rechazar, eliminar).
- Mientras se envía una acción, el botón usa la prop `loading` (spinner y botón deshabilitado).

### Espaciados y formas

- Escala de espaciado de MUI: **1 unidad = 8px** (`sx={{ p: 2 }}` = 16px).
- Separación entre campos de formulario: 16px (`<Stack spacing={2}>`).
- Radio de borde: 12px por defecto (inputs, alertas), 20px en tarjetas y diálogos.

### Estados hover

- Botones y elementos de lista: fondo/color de hover de MUI.
- Tarjetas de memes: el borde toma el color de acento.
- Tarjetas del perfil: se elevan 4px y el borde toma el color de acento.
- Filas de tablas (ranking, moderación): resaltado con `TableRow hover`.

### Mensajes de error y feedback

- Errores: `<Alert severity="error">` bajo el formulario o sección afectada.
- Éxito: `<Alert severity="success">` (subir meme) o `<Snackbar>` (moderación, copiar enlace).
- Validación de formularios: `TextField` con `error` y `helperText` (p. ej. contraseñas que no coinciden).
- Confirmaciones destructivas: `<ConfirmDialog>` (rechazar o eliminar un meme), nunca `window.confirm`.

### Indicadores de carga y estados vacíos

Componentes compartidos en `frontend/src/components/ui/`:

- `LoadingState`: spinner (`CircularProgress`) con mensaje; variante `compact` para espacios chicos.
- `EmptyState`: emoji, título, descripción y acción opcional (p. ej. "Subir meme").
- `ConfirmDialog`: diálogo de confirmación reutilizable.
- `FormCard`: contenedor común de los formularios (login, registro, subir meme).

### Comportamiento en móvil

| Ancho | Comportamiento |
| --- | --- |
| `< 900px` (`md`) | Menú de navegación dentro de un `Drawer` (botón hamburguesa); el perfil muestra solo el avatar. |
| `900px – 1199px` | Enlaces del menú solo con ícono (con `Tooltip`). |
| `≥ 1200px` (`lg`) | Enlaces del menú con ícono y texto. |
| `< 1024px` | El ranking semanal pasa de columna lateral a bloque bajo el contenido. |
| `< 600px` (`sm`) | Moderación en tarjetas en vez de tabla; el ranking oculta la columna "Autor"; el perfil apila la cabecera. |

Ninguna vista principal genera scroll horizontal a 375px de ancho.

### Transiciones

- El Anti-Ranking se abre con el botón **"Ver Anti-Ranking"** dentro del Ranking
  (ya no tiene enlace propio en la barra; la URL `/anti-ranking` sigue funcionando).
- Ranking → Anti-Ranking: tormenta con **rayos** y la tabla tiembla.
- Anti-Ranking → Ranking: resplandor con **arcoíris** y destellos.
- La vista se cambia a mitad de la animación (0,52 s de 1,3 s), cuando la pantalla
  está cubierta. Código en `frontend/src/components/RankingTransition.tsx`.
- Si el sistema tiene activado "reducir movimiento", se cambia sin animación.

## Aplicación desplegada

La aplicación se encuentra desplegada y operativa en el servidor del curso CC5003.

**URL pública:** https://fullstack.dcc.uchile.cl:7039/

### Configuración de producción

- **Frontend:** React, TypeScript y Vite.
- **Backend:** Node.js, Express y TypeScript.
- **Base de datos:** MongoDB.
- **Puerto asignado:** 7039.
- **Protocolo:** HTTPS.
- **Gestión del proceso:** PM2 (`momazos-react-7039`).

### Funcionalidades verificadas

- Registro e inicio de sesión.
- Publicación de memes con imágenes.
- Visualización y eliminación de memes.
- Moderación y aprobación de publicaciones.
- Votaciones positivas y negativas.
- Publicación y visualización de comentarios.
- Perfil de usuario y sistema de puntajes.
- Ranking semanal.

La aplicación utiliza MongoDB para almacenar los datos y mantiene las
imágenes subidas en el directorio `backend/uploads` del servidor.

**Estado del despliegue:** operativo.
