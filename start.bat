@echo off
REM ========================================
REM Script para iniciar Locally
REM Inicia Backend (FastAPI) y Frontend (Vite) simultáneamente
REM ========================================

echo.
echo ===================================
echo    Iniciando Locally
echo ===================================
echo.

REM Verificar si existe el entorno virtual del backend
if not exist "backend\venv\" (
    echo [ERROR] No se encontro el entorno virtual de Python.
    echo Por favor, crea el entorno virtual primero:
    echo    cd backend
    echo    python -m venv venv
    echo    venv\Scripts\activate
    echo    pip install -r requirements.txt
    pause
    exit /b 1
)

REM Verificar si existen los node_modules del frontend
if not exist "frontend\node_modules\" (
    echo [ERROR] No se encontraron las dependencias de Node.js.
    echo Por favor, instala las dependencias primero:
    echo    cd frontend
    echo    npm install
    pause
    exit /b 1
)

REM Iniciar Backend en una nueva ventana
echo [1/2] Iniciando Backend (FastAPI)...
start "Locally - Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Esperar un poco para que el backend inicie
timeout /t 3 /nobreak >nul

REM Iniciar Frontend en una nueva ventana
echo [2/2] Iniciando Frontend (Vite)...
start "Locally - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================
echo    Locally iniciado correctamente!
echo ===================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
