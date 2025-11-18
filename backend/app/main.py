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
from typing import List, Dict, Optional

# Archivos locales

from models.mcpManager import MCPManager
from constants.systemPrompt import SYSTEM_PROMPT
from lib.mongodb import MongoDBManager

# Modelos para las peticiones
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None  # Opcional: si no se provee, se crea una nueva conversación
    
class ConversationCreate(BaseModel):
    title: str = "Nueva conversación"
    
class ConversationRename(BaseModel):
    title: str
    
# Inicializar gestores y bases de datos.
mcpManager = MCPManager()
mongodbManager = MongoDBManager()

# Definir el lifespan (ciclo de vida) de la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Paso 1: Verificar que los servicios funcionen correctamente.
    mongodbManager.ping()
    await mcpManager.load_mcps_from_config()
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
    """
    Endpoint principal para enviar mensajes al modelo y recibir respuestas en streaming.
    
    Args:
        request: ChatRequest con el mensaje y opcionalmente el conversation_id
        
    Returns:
        StreamingResponse: Respuesta en formato SSE (Server-Sent Events)
    """
    async def generate():
        try:
            # Paso 1: Verificar o crear conversación
            conversation_id = request.conversation_id
            is_new_conversation = False
            
            if not conversation_id:
                # Crear nueva conversación si no existe
                conversation_id = mongodbManager.create_conversation()
                is_new_conversation = True
                # Enviar el conversation_id al frontend
                yield f"data: {json.dumps({'conversation_id': conversation_id})}\n\n"
            
            # Paso 2: Guardar mensaje del usuario
            mongodbManager.save_message(conversation_id, 'user', request.message)
            
            # Paso 3: Si es una conversación nueva, generar el título ANTES de responder
            if is_new_conversation:
                try:
                    # Generar título basado en el primer mensaje del usuario
                    title_prompt = f"Genera un título corto y descriptivo (máximo 5 palabras) para una conversación que comienza con este mensaje del usuario: '{request.message}'. Responde SOLO con el título, sin comillas ni puntuación extra."
                    
                    title_response = ollama.chat(
                        model='gpt-oss:20b',
                        messages=[
                            {'role': 'system', 'content': 'Eres un asistente que genera títulos concisos para conversaciones. Responde únicamente con el título, sin explicaciones adicionales.'},
                            {'role': 'user', 'content': title_prompt}
                        ],
                        stream=False
                    )
                    
                    # Extraer y limpiar el título
                    generated_title = title_response['message']['content'].strip()
                    # Limitar a 60 caracteres y eliminar comillas si las tiene
                    generated_title = generated_title.strip('"\'').strip()[:60]
                    
                    # Actualizar el título de la conversación
                    mongodbManager.rename_conversation(conversation_id, generated_title)
                    
                    # Notificar al frontend sobre el nuevo título
                    yield f"data: {json.dumps({'title': generated_title})}\n\n"
                    
                except Exception as title_error:
                    # Si falla la generación del título, no afecta el flujo principal
                    print(f"\033[93mTITLE GENERATION: \033[0m    Failed to generate title: {title_error}")
            
            # Paso 4: Cargar historial de la conversación para contexto
            messages_history = mongodbManager.get_conversation_messages(conversation_id)
            
            # Paso 5: Construir el historial para Ollama (incluir system prompt)
            conversation_history = [{'role': 'system', 'content': SYSTEM_PROMPT}]
            for msg in messages_history:
                conversation_history.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
            
            # Paso 6: Stream de respuesta desde Ollama con todo el historial
            stream = ollama.chat(
                model='gpt-oss:20b',
                messages=conversation_history,
                stream=True
            )
            
            # Paso 7: Acumular la respuesta del asistente
            assistant_response = ""
            
            # Paso 8: Enviar cada chunk al frontend
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    assistant_response += content
                    # Formato SSE (Server-Sent Events)
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            # Paso 9: Guardar la respuesta completa del asistente
            mongodbManager.save_message(conversation_id, 'assistant', assistant_response)
            
            # Paso 10: Señal de finalización
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

# ==================== ENDPOINTS DE CONVERSACIONES ====================

@app.get("/api/conversations")
def get_conversations():
    """
    Obtiene la lista de todas las conversaciones ordenadas de más antigua a más reciente.
    
    Returns:
        List: Lista de conversaciones con sus datos
    """
    return mongodbManager.get_conversations()

@app.post("/api/conversations")
def create_conversation(request: ConversationCreate):
    """
    Crea una nueva conversación.
    
    Args:
        request: ConversationCreate con el título opcional
        
    Returns:
        Dict: Conversación creada con su ID
    """
    conversation_id = mongodbManager.create_conversation(request.title)
    conversation = mongodbManager.get_conversation_by_id(conversation_id)
    return conversation

@app.get("/api/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str):
    """
    Obtiene todos los mensajes de una conversación específica.
    
    Args:
        conversation_id: ID de la conversación
        
    Returns:
        List: Lista de mensajes de la conversación
    """
    return mongodbManager.get_conversation_messages(conversation_id)

@app.put("/api/conversations/{conversation_id}")
def rename_conversation(conversation_id: str, request: ConversationRename):
    """
    Renombra una conversación existente.
    
    Args:
        conversation_id: ID de la conversación
        request: ConversationRename con el nuevo título
        
    Returns:
        Dict: Resultado de la operación
    """
    success = mongodbManager.rename_conversation(conversation_id, request.title)
    if success:
        return {"success": True, "message": "Conversation renamed successfully"}
    else:
        return {"success": False, "message": "Failed to rename conversation"}

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str):
    """
    Elimina una conversación y todos sus mensajes.
    
    Args:
        conversation_id: ID de la conversación a eliminar
        
    Returns:
        Dict: Resultado de la operación
    """
    success = mongodbManager.delete_conversation(conversation_id)
    if success:
        return {"success": True, "message": "Conversation deleted successfully"}
    else:
        return {"success": False, "message": "Failed to delete conversation"}

# ==================== ENDPOINT LEGACY ====================

@app.get("/api/history")
def get_history():
    """
    Endpoint legacy: Devuelve todas las conversaciones.
    Se mantiene por compatibilidad pero se recomienda usar /api/conversations
    """
    return mongodbManager.get_conversations()