## Locally (Stack: React, FastAPI, Mongo)

**Filosofía:** Un asistente de IA 100% local y auto-alojado (self-hosted). La privacidad es la prioridad. El usuario controla sus datos y sus modelos.

**Objetivo:** Proveer una aplicación web completa que permita al usuario chatear con modelos LLM locales (servidos por Ollama), guardando y gestionando su historial de chats.

### Arquitectura de Servicios (Docker Compose)

El proyecto se compondrá de **4 servicios** principales orquestados por `docker-compose.yml`:

1.  **`frontend` (React):** El cliente web construido con React + Vite. En producción, será servido por un servidor web ligero (como Nginx) dentro de su contenedor.
2.  **`backend` (FastAPI):** El servidor de lógica de negocio. Actúa como intermediario (proxy) entre el frontend y los otros servicios (Ollama, Mongo).
3.  **`database` (MongoDB):** La base de datos oficial de Mongo. Se usará para persistir el historial de chats y configuraciones de usuario.
4.  **`models` (Ollama):** El servidor de modelos. Usará la imagen oficial `ollama/ollama`.

### Flujo de Datos (Arquitectura B)

El flujo de comunicación es clave:

1.  El **Frontend (React)** solo habla con el **Backend (FastAPI)**.
2.  El **Backend (FastAPI)** recibe una solicitud de chat.
3.  El **Backend (FastAPI)** se comunica con **`models` (Ollama)** para obtener la respuesta del LLM.
4.  El **Backend (FastAPI)** guarda la conversación (prompt y respuesta) en **`database` (MongoDB)**.
5.  El **Backend (FastAPI)** devuelve la respuesta al **Frontend (React)** para mostrarla.

### 1. Alcance: Frontend (Servicio: `frontend`)

- **Stack:** React + Vite, TypeScript, TailwindCSS, HeroUI.
- **Vistas:**
  - **Vista de Chat:** Interfaz principal para la conversación.
  - **Panel de Historial:** Sidebar para ver chats pasados.
- **Funcionalidad:**
  - Enviar prompts al backend y recibir respuestas en _streaming_.
  - Renderizar respuestas en Markdown.
  - Crear, seleccionar, renombrar y eliminar chats (realizando peticiones al backend).

### 2. Alcance: Backend (Servicio: `backend`)

- **Stack:** FastAPI (Python 3.10+), Pydantic (para modelos de datos).
- **Endpoints (API REST):**
  - `POST /api/chat/stream`: Endpoint principal. Recibe el prompt y el ID de la conversación (opcional). Hace _streaming_ de la respuesta de Ollama y guarda cada mensaje en Mongo. Si no se provee conversation_id, crea una nueva conversación.
  - `GET /api/conversations`: Obtiene la lista de todas las conversaciones ordenadas de más antigua a más reciente.
  - `POST /api/conversations`: Crea una nueva conversación con un título opcional.
  - `GET /api/conversations/{conversation_id}/messages`: Obtiene los mensajes de una conversación específica.
  - `PUT /api/conversations/{conversation_id}`: Renombra una conversación.
  - `DELETE /api/conversations/{conversation_id}`: Elimina una conversación y todos sus mensajes.
  - `GET /api/history`: (Legacy) Devuelve todas las conversaciones. Se mantiene por compatibilidad.
- **Lógica de Negocio:**
  - Manejar la serialización/deserialización de datos con Pydantic.
  - Conectarse a MongoDB para todas las operaciones de historial y conversaciones.
  - Crear conversaciones automáticamente cuando se envía el primer mensaje sin conversation_id.
  - Guardar cada mensaje (user/assistant) individualmente en la colección messages.

### 3. Alcance: Base de Datos (Servicio: `database`)

- **Esquemas (Colecciones):**
  - **`conversations`**:
    - `_id`: (ObjectID) - ID único de la conversación
    - `title`: (String, ej. "Chat sobre Python") - Título de la conversación
    - `created_at`: (ISODate) - Fecha de creación
    - `updated_at`: (ISODate) - Fecha de última actualización
  - **`messages`**:
    - `_id`: (ObjectID) - ID único del mensaje
    - `conversation_id`: (String, referencia a `conversations._id`) - ID de la conversación a la que pertenece
    - `role`: (String, "user" o "assistant") - Rol del emisor del mensaje
    - `content`: (String) - Contenido del mensaje
    - `timestamp`: (ISODate) - Fecha y hora del mensaje
- **Índices:**
  - `messages.conversation_id`: Para búsquedas rápidas de mensajes por conversación
  - `conversations.created_at`: Para ordenamiento eficiente por fecha
