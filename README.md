# 🎮 GameVault

GameVault es una aplicación web desarrollada como proyecto individual para la asignatura **Programación III**. Su propósito es permitir la administración de una colección de videojuegos mediante un sistema CRUD completo, utilizando Supabase como base de datos y autenticación con Google para el acceso de los usuarios.

---

## 📖 Descripción

La aplicación permite iniciar sesión con una cuenta de Google y gestionar una biblioteca de videojuegos de forma sencilla e intuitiva.

Cada videojuego almacena la siguiente información:

- Título
- Género
- Plataforma
- Desarrollador
- Año de lanzamiento
- Precio

Toda la información se almacena en una base de datos de Supabase y es administrada mediante una API desarrollada con Node.js y Express.

---

## ✨ Funcionalidades

- 🔐 Inicio de sesión con Google.
- ➕ Registrar nuevos videojuegos.
- 📋 Visualizar todos los videojuegos almacenados.
- ✏️ Editar la información de un videojuego.
- 🗑️ Eliminar videojuegos.
- 🔄 Actualización automática de la lista sin recargar la página.
- 💾 Persistencia de datos mediante Supabase.

---

## 🛠️ Tecnologías utilizadas

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Base de datos
- Supabase
- PostgreSQL

### Autenticación
- Supabase Authentication
- Google OAuth

### Control de versiones
- Git
- GitHub
- Git Flow

---

## 📁 Estructura del proyecto

```text
GameVault/
│
├── config/
│   └── supabase.js
│
├── controllers/
│
├── public/
│   ├── assets/
│   ├── index.html
│   ├── script.js
│   └── styles.css
│
├── server.js
├── package.json
├── .env
└── README.md
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/xmanusaddy/GameVault.git
```

### 2. Entrar al proyecto

```bash
cd GameVault
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Crear el archivo `.env`

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_KEY=TU_SUPABASE_PUBLISHABLE_KEY
PORT=5000
```

### 5. Ejecutar la aplicación

```bash
npm run dev
```

Abrir el navegador en:

```text
http://localhost:5000
```

---

## 🗄️ Base de datos

La tabla `games` contiene los siguientes campos:

| Campo | Descripción |
|--------|-------------|
| title | Título del videojuego |
| genre | Género |
| platform | Plataforma |
| developer | Desarrollador |
| release_year | Año de lanzamiento |
| price | Precio |
| created_at | Fecha de creación del registro |

---

## 🌿 Flujo de desarrollo

Durante el desarrollo del proyecto se utilizó la metodología **Git Flow**, implementando ramas de tipo `feature/*` para cada funcionalidad y realizando Pull Requests hacia las ramas `dev`, `qa` y `main` para mantener un flujo de integración ordenado.

---

## 👤 Autor

**Darlyn Feliz**
