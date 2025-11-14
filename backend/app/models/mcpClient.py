import subprocess
import asyncio
import json
import os
from typing import Dict, Optional, List


class MCPClient:
    """Cliente para manejar un servidor MCP"""
    
    def __init__(self, name: str, command: str, args: List[str], cwd: str, env: Dict[str, str]):
        self.name = name
        self.command = command
        self.args = args
        self.cwd = cwd
        self.env = env
        self.process = None
        self.request_id = 0
        self.tools = []
        
    async def start(self):
        """Inicia el proceso del MCP"""
        env = os.environ.copy()
        env.update(self.env)
        
        self.process = subprocess.Popen(
            [self.command] + self.args,
            cwd=self.cwd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True,
            bufsize=1
        )
        
        await asyncio.sleep(1)
        await self._load_tools()
        print(f"\033[94mMCPs:\033[0m     {self.name.capitalize()} loaded with {len(self.tools)} tools.")
        
    async def _load_tools(self):
        """Carga las herramientas disponibles del MCP"""
        request = {
            "jsonrpc": "2.0",
            "id": self._get_next_id(),
            "method": "tools/list",
            "params": {}
        }
        
        response = await self._send_request(request)
        if response and 'result' in response:
            self.tools = response['result'].get('tools', [])
            
    def _get_next_id(self) -> int:
        """Genera un ID único para cada request"""
        self.request_id += 1
        return self.request_id
        
    async def _send_request(self, request: Dict) -> Optional[Dict]:
        """Envía una request al MCP y retorna la respuesta"""
        if not self.process:
            return None
            
        try:
            self.process.stdin.write(json.dumps(request) + '\n')
            self.process.stdin.flush()
            
            response_line = self.process.stdout.readline()
            if response_line:
                return json.loads(response_line)
        except Exception as e:
            print(f"\033[91mMCPs: \033[0m    Error in {self.name.capitalize()} MCP request: {e}")
            return None
            
    async def call_tool(self, tool_name: str, arguments: Dict = None) -> Optional[Dict]:
        """Ejecuta una herramienta del MCP"""
        if arguments is None:
            arguments = {}
            
        request = {
            "jsonrpc": "2.0",
            "id": self._get_next_id(),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        response = await self._send_request(request)
        return response
        
    def stop(self):
        """Detiene el proceso del MCP"""
        if self.process:
            self.process.terminate()
            self.process = None
            print(f"🛑 MCP '{self.name}' detenido")