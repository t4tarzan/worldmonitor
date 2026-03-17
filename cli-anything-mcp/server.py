#!/usr/bin/env python3
"""
CLI-Anything MCP Server
Exposes CLI-Anything generated tools via Model Context Protocol
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# MCP protocol implementation
class CLIAnythingMCP:
    def __init__(self, cli_anything_path: Optional[str] = None):
        """Initialize MCP server for CLI-Anything tools"""
        import os
        default_path = os.environ.get('CLI_ANYTHING_PATH', str(Path.home() / ".openclaw/workspace/cli-anything"))
        self.cli_anything_path = Path(cli_anything_path) if cli_anything_path else Path(default_path)
        self.tools = self._discover_tools()
    
    def _discover_tools(self) -> Dict[str, Dict[str, Any]]:
        """Discover all CLI-Anything tools from the repository"""
        tools = {}
        
        if not self.cli_anything_path.exists():
            return tools
        
        # Scan for tool directories (each contains agent-harness)
        for tool_dir in self.cli_anything_path.iterdir():
            if not tool_dir.is_dir() or tool_dir.name.startswith('.'):
                continue
            
            harness_dir = tool_dir / "agent-harness"
            if not harness_dir.exists():
                continue
            
            # Look for SKILL.md
            skill_files = list(harness_dir.rglob("SKILL.md"))
            if skill_files:
                skill_md = skill_files[0]
                tool_info = self._parse_skill_md(skill_md, tool_dir.name)
                if tool_info:
                    tools[tool_dir.name] = tool_info
        
        return tools
    
    def _parse_skill_md(self, skill_path: Path, tool_name: str) -> Optional[Dict[str, Any]]:
        """Parse SKILL.md to extract tool metadata"""
        try:
            content = skill_path.read_text()
            
            # Extract YAML frontmatter if present
            description = f"CLI interface for {tool_name}"
            commands = []
            
            # Simple parsing - look for command examples
            in_code_block = False
            for line in content.split('\n'):
                if line.strip().startswith('```'):
                    in_code_block = not in_code_block
                elif in_code_block and line.strip().startswith('cli-anything-'):
                    commands.append(line.strip())
                elif 'description:' in line.lower():
                    description = line.split(':', 1)[1].strip()
            
            return {
                "name": tool_name,
                "description": description,
                "cli_command": f"cli-anything-{tool_name}",
                "skill_path": str(skill_path),
                "commands": commands[:5]  # First 5 example commands
            }
        except Exception as e:
            print(f"Error parsing {skill_path}: {e}", file=sys.stderr)
            return None
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """List all available CLI-Anything tools"""
        return [
            {
                "name": f"cli_anything_{name}",
                "description": info["description"],
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": f"Command to execute with {info['cli_command']}"
                        },
                        "args": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Additional arguments"
                        }
                    },
                    "required": ["command"]
                }
            }
            for name, info in self.tools.items()
        ]
    
    def list_resources(self) -> List[Dict[str, Any]]:
        """List available resources (SKILL.md files)"""
        return [
            {
                "uri": f"skill://{name}",
                "name": f"{name} SKILL.md",
                "description": f"Skill documentation for {info['cli_command']}",
                "mimeType": "text/markdown"
            }
            for name, info in self.tools.items()
        ]
    
    def read_resource(self, uri: str) -> Optional[str]:
        """Read a resource (SKILL.md content)"""
        if not uri.startswith("skill://"):
            return None
        
        tool_name = uri.replace("skill://", "")
        if tool_name not in self.tools:
            return None
        
        skill_path = Path(self.tools[tool_name]["skill_path"])
        if skill_path.exists():
            return skill_path.read_text()
        return None
    
    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a CLI-Anything tool"""
        # Extract tool name from MCP tool name (cli_anything_gimp -> gimp)
        if not name.startswith("cli_anything_"):
            return {"error": f"Unknown tool: {name}"}
        
        tool_name = name.replace("cli_anything_", "")
        if tool_name not in self.tools:
            return {"error": f"Tool not found: {tool_name}"}
        
        tool_info = self.tools[tool_name]
        cli_command = tool_info["cli_command"]
        
        # Build command
        cmd = [cli_command]
        if "command" in arguments:
            cmd.append(arguments["command"])
        if "args" in arguments:
            cmd.extend(arguments["args"])
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
                "success": result.returncode == 0
            }
        except subprocess.TimeoutExpired:
            return {"error": "Command timed out after 5 minutes"}
        except Exception as e:
            return {"error": str(e)}
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle MCP protocol request"""
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "tools/list":
            return {"tools": self.list_tools()}
        
        elif method == "resources/list":
            return {"resources": self.list_resources()}
        
        elif method == "resources/read":
            uri = params.get("uri")
            content = self.read_resource(uri)
            if content:
                return {"contents": [{"uri": uri, "mimeType": "text/markdown", "text": content}]}
            return {"error": "Resource not found"}
        
        elif method == "tools/call":
            name = params.get("name")
            arguments = params.get("arguments", {})
            return {"content": [{"type": "text", "text": json.dumps(self.call_tool(name, arguments), indent=2)}]}
        
        else:
            return {"error": f"Unknown method: {method}"}


def main():
    """Run MCP server in stdio mode"""
    server = CLIAnythingMCP()
    
    # MCP stdio protocol
    for line in sys.stdin:
        try:
            request = json.loads(line)
            response = server.handle_request(request)
            response["jsonrpc"] = "2.0"
            response["id"] = request.get("id")
            print(json.dumps(response), flush=True)
        except Exception as e:
            error_response = {
                "jsonrpc": "2.0",
                "id": request.get("id") if 'request' in locals() else None,
                "error": {"code": -32603, "message": str(e)}
            }
            print(json.dumps(error_response), flush=True)


if __name__ == "__main__":
    main()
