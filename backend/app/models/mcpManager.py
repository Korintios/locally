import os
from typing import Dict, Optional, List
from models.mcpClient import MCPClient

class MCPManager:
    """Gestor central de todos los MCPs"""
    
    def __init__(self):
        self.mcps: Dict[str, MCPClient] = {}
        
    async def load_mcps_from_config(self):
        """Carga los MCPs desde una configuración"""
        # Aquí defines todos tus MCPs
        mcp_configs = {
            "trello": {
                "command": "bun",
                "args": ["src/index.ts"],
                "cwd": "C:/Users/eljua/Desktop/MCPs/mcp-server-trello",
                "env": {
                    "TRELLO_API_KEY": os.getenv("TRELLO_API_KEY"),
                    "TRELLO_TOKEN": os.getenv("TRELLO_TOKEN")
                }
            },
            # Puedes agregar más MCPs aquí:
            # "github": {
            #     "command": "node",
            #     "args": ["dist/index.js"],
            #     "cwd": "C:/Users/eljua/Desktop/MCPs/mcp-github",
            #     "env": {"GITHUB_TOKEN": "tu_token"}
            # }
        }
        
        # Iniciar cada MCP
        print("\033[94mMCPs:\033[0m     Loading...")
        for name, config in mcp_configs.items():
            mcp = MCPClient(
                name=name,
                command=config["command"],
                args=config["args"],
                cwd=config["cwd"],
                env=config["env"]
            )
            await mcp.start()
            self.mcps[name] = mcp
            
    async def call_tool(self, mcp_name: str, tool_name: str, arguments: Dict = None) -> Optional[Dict]:
        """Llama a una herramienta de un MCP específico"""
        if mcp_name not in self.mcps:
            print(f"\033[91mMCPs: \033[0m    {mcp_name.capitalize()} not found")
            return None
            
        return await self.mcps[mcp_name].call_tool(tool_name, arguments)
        
    def get_all_tools(self) -> Dict[str, List[Dict]]:
        """Obtiene todas las herramientas de todos los MCPs"""
        all_tools = {}
        for name, mcp in self.mcps.items():
            all_tools[name] = mcp.tools
        return all_tools
        
    def stop_all(self):
        """Detiene todos los MCPs"""
        print("🛑 Deteniendo todos los MCPs...")
        for mcp in self.mcps.values():
            mcp.stop()