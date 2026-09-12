# Hito 1

### Meta: Crear 6 vistas independientes

- Inicio: Hugo González
- Perfil: Luciano Tapia
- Publicación: Raúl Alquinta
- Moderación: Maira Rojas
- Meme Individual: Benjamín Silva
- Ranking: Renato Núñez

Esta creada la carpeta tanto para el frontend como para el backend, pero podemos ignorar esta última. en `frontend/src/types/index.ts` esta el modelo de tipos (si estiman que debemos cambiar o agregar yo creo que cambienlo nomás)

## 🛠️ Guía para Desarrollar tu Vista (para nada hecha por Gémini)

Para evitar conflictos al hacer *merge* en Git, cada integrante debe desarrollar su interfaz de forma aislada (creando su propia rama) dentro de la carpeta `frontend/src/views/`.

### 1. Estructura de Archivos
Crea tu componente en `frontend/src/views/` según tu vista asignada:

* **Inicio:** `src/views/HomeView.tsx`
* **Perfil:** `src/views/ProfileView.tsx`
* **Publicación/Subir:** `src/views/UploadView.tsx`
* **Moderación:** `src/views/ModerationView.tsx`
* **Meme Individual:** `src/views/MemeDetailView.tsx`
* **Ranking:** `src/views/RankingView.tsx`


Si quieren crear componentes pequeñas pueden hacerlo en `frontend/src/components/`.

---

### 2. Plantilla Base para tu Vista
Usa los tipos y los datos sintéticos expuestos en `src/mockData.ts` para maquetar tu vista. 

Ejemplo de cómo debe verse tu archivo (ej. `HomeView.tsx`):

```tsx
import { mockMemes } from '../mockData';

export function HomeView() {
  return (
    <div>
      <h2>Vista: Inicio</h2>
      {/* Tu maquetación utilizando mockMemes */}
    </div>
  );
}