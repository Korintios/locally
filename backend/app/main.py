from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import ollama
import json

# Modelo para la petición
class ChatRequest(BaseModel):
    message: str

# Crear la aplicación
app = FastAPI()

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
            # Stream de respuesta desde Ollama
            stream = ollama.chat(
                model='gpt-oss:20b',
                messages=[{
                    'role': 'user',
                    'content': request.message
                }],
                stream=True
            )
            
            # Enviar cada chunk al frontend
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    # Formato SSE (Server-Sent Events)
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            # Señal de finalización
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
