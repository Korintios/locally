# Librerías y módulos necesarios

import dotenv
dotenv.load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import ollama
import json
from typing import List, Dict

# Archivos locales

from models.mcpManager import MCPManager
from constants.systemPrompt import SYSTEM_PROMPT
from lib.mongodb import MongoDBManager

# Modelo para la petición
class ChatRequest(BaseModel):
    message: str
    
# Historial global de la conversación
conversation_history: List[Dict[str, str]] = None
    
# Inicializar gestores y bases de datos.
mcpManager = MCPManager()
mongodbManager = MongoDBManager()

# Definir el lifespan (ciclo de vida) de la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Paso 1: Verificar que los servicios funcionen correctamente.
    mongodbManager.ping()
    await mcpManager.load_mcps_from_config()
    
    # Paso 2: Cargar el historial de conversación previo desde MongoDB.
    global conversation_history
    conversation_history = mongodbManager.load_history()
    if conversation_history is None:
        conversation_history = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    yield
    
# Crear la aplicación
app = FastAPI(lifespan=lifespan)

# Agregar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Primera ruta - la más simple
@app.get("/", status_code=200)
def read_root():
    return {
        "message": "Locally Backend is running!"
    }

# Endpoint para chat con streaming
@app.post("/api/chat")
async def chat_stream(request: ChatRequest):
    async def generate():
        try:
            # Paso 1: Agregar mensaje del usuario al historial
            conversation_history.append({
                'role': 'user',
                'content': request.message
            })
            
            # Paso 2: Stream de respuesta desde Ollama con todo el historial
            stream = ollama.chat(
                model='gpt-oss:20b',
                messages=conversation_history,
                stream=True
            )
            
            # Paso 2.1: Estructurar la respuesta en formato JSON para la ejecucion de posibles herramientas, si es necesario (si no es necesario se omite este paso).
            # Paso 2.2: Ejecutar herramientas a través de MCPs.
            
            # Paso 3: Acumular la respuesta del asistente
            assistant_response = ""
            
            # Paso 4: Enviar cada chunk al frontend
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    assistant_response += content
                    # Formato SSE (Server-Sent Events)
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            # Paso 5: Guardar la respuesta completa del asistente en la base de datos y en el historial.
            try:
                mongodbManager.save_history(conversation_history)
                conversation_history.append({
                    'role': 'assistant',
                    'content': assistant_response
                })
            except Exception as e:
                raise Exception(f"Failed to save conversation history: {e}")
            
            # Paso 6: Señal de finalización
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/history")
def get_history():
    return mongodbManager.load_history()