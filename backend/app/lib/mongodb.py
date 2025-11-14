import os
import dotenv
dotenv.load_dotenv()
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

class MongoDBManager:
    def __init__(self): 
        self.uri = os.getenv("MONGO_URI")
        self.client = MongoClient(self.uri)
        
    def ping(self):
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
    
    def save_history(self, history: list):
        """ Guarda el historial de conversación en la base de datos MongoDB. Solamente existe uno actualmente, si ya existe se actualiza si no se crea."""
        try:
            db = self.client['locally']
            collection = db['history']
            record = {
                'history': history
            }
            # Busca cualquier documento existente y lo reemplaza, o crea uno nuevo si no existe
            collection.replace_one({}, record, upsert=True)
            print(f"\033[92mMONGO DB: \033[0m    Conversation history saved successfully.")
        except Exception as e:
            print(f"\033[91mMONGO DB: \033[0m    Failed to save conversation history: {e}")
            
    def load_history(self) -> list:
        """ Carga el historial de conversación desde la base de datos MongoDB. Devuelve None si no existe historial."""
        try:
            db = self.client['locally']
            collection = db['history']
            record = collection.find_one({})
            if record and 'history' in record:
                # Filtrar solo los mensajes con role 'user' o 'assistant'
                filtered_history = [msg for msg in record['history'] if msg.get('role') in ['user', 'assistant']]
                print(f"\033[92mMONGO DB HISTORY: \033[0m    Conversation history loaded successfully.")
                return filtered_history
            else:
                print(f"\033[92mMONGO DB HISTORY: \033[0m    No conversation history found.")
                return None
        except Exception as e:
            print(f"\033[91mMONGO DB HISTORY: \033[0m    Failed to load conversation history: {e}")
            return []