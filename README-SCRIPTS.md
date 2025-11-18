# 🚀 Scripts de Inicio - Locally

Este directorio contiene scripts para facilitar el inicio del proyecto Locally (Backend + Frontend).

## 📋 Scripts Disponibles

### 1️⃣ `start.bat` (Recomendado para Windows)

Script de arranque rápido que abre dos ventanas de terminal separadas:

- Una para el Backend (FastAPI)
- Otra para el Frontend (Vite)

**Uso:**

```bash
# Doble click en el archivo start.bat
# O desde la terminal:
start.bat
```

**Ventajas:**

- ✅ Fácil de usar (doble click)
- ✅ Dos ventanas separadas para ver logs independientes
- ✅ Puedes cerrar una ventana sin afectar la otra
- ✅ Verifica dependencias antes de iniciar

---

## 🔧 Requisitos Previos

Antes de usar cualquier script, asegúrate de tener instalado:

### Backend (Python)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend (Node.js)

```bash
cd frontend
npm install
```

### Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` con:

```env
MONGO_URI=mongodb://localhost:27017/locally
```

---

## 🌐 URLs de Acceso

Una vez iniciados los servicios:

| Servicio         | URL                        | Descripción                            |
| ---------------- | -------------------------- | -------------------------------------- |
| **Backend API**  | http://localhost:8000      | FastAPI REST API                       |
| **Backend Docs** | http://localhost:8000/docs | Swagger UI (Documentación interactiva) |
| **Frontend**     | http://localhost:5173      | Aplicación React + Vite                |

---

## 🛑 Detener los Servicios

### Con `start.bat`:

- Cierra las ventanas individuales de terminal

### Con `start-dev.ps1`:

- Presiona `Ctrl + C` en la terminal

---

## 🐛 Solución de Problemas

### Error: "No se encontró el entorno virtual"

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "No se encontraron las dependencias de Node.js"

```bash
cd frontend
npm install
```

### Error: "Cannot connect to MongoDB"

Asegúrate de que MongoDB esté corriendo:

```bash
# Con Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# O instala MongoDB localmente
```

### El puerto 8000 o 5173 ya está en uso

```bash
# Encuentra el proceso que usa el puerto:
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Mata el proceso:
taskkill /PID <PID> /F
```

---

## 💡 Consejos

- **Desarrollo rápido:** Usa `start.bat` para tener ventanas separadas
- **Debugging:** Usa `start-dev.ps1` para ver logs centralizados
- **Primera vez:** Verifica que todos los requisitos previos estén instalados

---

## 📝 Estructura del Proyecto

```
Locally/
├── backend/              # Backend FastAPI
│   ├── app/
│   │   ├── main.py      # Entrada principal
│   │   ├── lib/         # MongoDB y utilidades
│   │   └── models/      # MCPs
│   ├── venv/            # Entorno virtual Python
│   └── requirements.txt
├── frontend/            # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx     # Componente principal
│   │   ├── components/ # Componentes UI
│   │   └── lib/        # API client
│   ├── node_modules/
│   └── package.json
├── start.bat           # Script de inicio (Windows)
└── start-dev.ps1       # Script de inicio (PowerShell)
```

---

## 🎯 Siguiente Paso

Después de iniciar los servicios, abre tu navegador en:
👉 **http://localhost:5173**

¡Disfruta desarrollando con Locally! 🎉
