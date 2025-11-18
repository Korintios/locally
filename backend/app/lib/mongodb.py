import os
import dotenv
dotenv.load_dotenv()
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Optional

class MongoDBManager:
    def __init__(self): 
        self.uri = os.getenv("MONGO_URI")
        self.client = MongoClient(self.uri)
        self.db = self.client['locally']
        
        # Colecciones principales
        self.conversations = self.db['conversations']
        self.messages = self.db['messages']
        
        # Crear índices para optimizar consultas
        self._create_indexes()
        
    def _create_indexes(self):
        """
        Crea índices en las colecciones para optimizar las consultas.
        - conversation_id en messages para búsquedas rápidas
        - created_at en conversations para ordenamiento
        """
        try:
            self.messages.create_index("conversation_id")
            self.conversations.create_index("created_at")
        except Exception as e:
            print(f"\033[93mMONGO DB: \033[0m    Warning: Could not create indexes: {e}")
        
    def ping(self):
        """
        Verifica la conexión con MongoDB mediante el comando 'ismaster'.
        """
        try:
            print(f"\033[92mMONGO DB: \033[0m    Connecting to MongoDB...")
            
            if self.uri is None:
                raise Exception("MongoDB uri is not initialized")
            
            if not self.client:
                raise Exception("MongoDB client is not initialized")
            
            # The ismaster command is cheap and does not require auth.
            self.client.admin.command('ismaster')
            print(f"\033[92mMONGO DB: \033[0m    Successfully connected to MongoDB")
        except (ConnectionFailure, ConfigurationError) as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to connect to MongoDB: {e}")
    
    # ==================== GESTIÓN DE CONVERSACIONES ====================
    
    def create_conversation(self, title: str = "Nueva conversación") -> str:
        """
        Crea una nueva conversación en la base de datos.
        
        Args:
            title: Título de la conversación (por defecto "Nueva conversación")
            
        Returns:
            str: ID de la conversación creada
        """
        try:
            conversation = {
                'title': title,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            result = self.conversations.insert_one(conversation)
            conversation_id = str(result.inserted_id)
            print(f"\033[92mMONGO DB: \033[0m    Conversation created with ID: {conversation_id}")
            return conversation_id
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to create conversation: {e}")
            raise
    
    def get_conversations(self) -> List[Dict]:
        """
        Obtiene todas las conversaciones ordenadas de más antigua a más reciente.
        
        Returns:
            List[Dict]: Lista de conversaciones con sus datos
        """
        try:
            conversations = list(self.conversations.find().sort('created_at', 1))
            
            # Convertir ObjectId a string para serialización JSON
            for conv in conversations:
                conv['_id'] = str(conv['_id'])
                # Formatear fechas a ISO string
                conv['created_at'] = conv['created_at'].isoformat()
                conv['updated_at'] = conv['updated_at'].isoformat()
            
            print(f"\033[92mMONGO DB: \033[0m    Retrieved {len(conversations)} conversations")
            return conversations
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to get conversations: {e}")
            return []
    
    def get_conversation_by_id(self, conversation_id: str) -> Optional[Dict]:
        """
        Obtiene una conversación específica por su ID.
        
        Args:
            conversation_id: ID de la conversación
            
        Returns:
            Optional[Dict]: Datos de la conversación o None si no existe
        """
        try:
            conversation = self.conversations.find_one({'_id': ObjectId(conversation_id)})
            if conversation:
                conversation['_id'] = str(conversation['_id'])
                conversation['created_at'] = conversation['created_at'].isoformat()
                conversation['updated_at'] = conversation['updated_at'].isoformat()
            return conversation
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to get conversation: {e}")
            return None
    
    def rename_conversation(self, conversation_id: str, new_title: str) -> bool:
        """
        Renombra una conversación existente.
        
        Args:
            conversation_id: ID de la conversación
            new_title: Nuevo título para la conversación
            
        Returns:
            bool: True si se renombró exitosamente, False en caso contrario
        """
        try:
            result = self.conversations.update_one(
                {'_id': ObjectId(conversation_id)},
                {
                    '$set': {
                        'title': new_title,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"\033[92mMONGO DB: \033[0m    Conversation {conversation_id} renamed to: {new_title}")
                return True
            else:
                print(f"\033[93mMONGO DB: \033[0m    No conversation found with ID: {conversation_id}")
                return False
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to rename conversation: {e}")
            return False
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Elimina una conversación y todos sus mensajes asociados.
        
        Args:
            conversation_id: ID de la conversación a eliminar
            
        Returns:
            bool: True si se eliminó exitosamente, False en caso contrario
        """
        try:
            # Primero eliminar todos los mensajes de la conversación
            self.messages.delete_many({'conversation_id': conversation_id})
            
            # Luego eliminar la conversación
            result = self.conversations.delete_one({'_id': ObjectId(conversation_id)})
            
            if result.deleted_count > 0:
                print(f"\033[92mMONGO DB: \033[0m    Conversation {conversation_id} and its messages deleted")
                return True
            else:
                print(f"\033[93mMONGO DB: \033[0m    No conversation found with ID: {conversation_id}")
                return False
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to delete conversation: {e}")
            return False
    
    # ==================== GESTIÓN DE MENSAJES ====================
    
    def save_message(self, conversation_id: str, role: str, content: str) -> str:
        """
        Guarda un mensaje individual en una conversación.
        
        Args:
            conversation_id: ID de la conversación
            role: Rol del mensaje ('user' o 'assistant')
            content: Contenido del mensaje
            
        Returns:
            str: ID del mensaje guardado
        """
        try:
            message = {
                'conversation_id': conversation_id,
                'role': role,
                'content': content,
                'timestamp': datetime.utcnow()
            }
            result = self.messages.insert_one(message)
            
            # Actualizar timestamp de la conversación
            self.conversations.update_one(
                {'_id': ObjectId(conversation_id)},
                {'$set': {'updated_at': datetime.utcnow()}}
            )
            
            message_id = str(result.inserted_id)
            print(f"\033[92mMONGO DB: \033[0m    Message saved in conversation {conversation_id}")
            return message_id
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to save message: {e}")
            raise
    
    def get_conversation_messages(self, conversation_id: str) -> List[Dict]:
        """
        Obtiene todos los mensajes de una conversación específica.
        
        Args:
            conversation_id: ID de la conversación
            
        Returns:
            List[Dict]: Lista de mensajes ordenados por timestamp
        """
        try:
            messages = list(
                self.messages.find({'conversation_id': conversation_id})
                .sort('timestamp', 1)
            )
            
            # Convertir ObjectId y datetime a string para serialización JSON
            for msg in messages:
                msg['_id'] = str(msg['_id'])
                msg['timestamp'] = msg['timestamp'].isoformat()
            
            print(f"\033[92mMONGO DB: \033[0m    Retrieved {len(messages)} messages from conversation {conversation_id}")
            return messages
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to get messages: {e}")
            return []