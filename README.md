# Momazos React

Aplicación web de memes desarrollada para el curso CC5003. El proyecto está
compuesto por una SPA en React y un backend REST en TypeScript con Express,
Mongoose y MongoDB.

## Tecnologías principales

- React, React Router, TypeScript y Vite.
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

## Aplicación desplegada

La URL destinada para el despliegue en el servidor del curso es:

<https://fullstack.dcc.uchile.cl:7029/>

**Estado:** el despliegue se encuentra pendiente. La URL quedará disponible
cuando la aplicación sea publicada correctamente en el servidor del curso.
