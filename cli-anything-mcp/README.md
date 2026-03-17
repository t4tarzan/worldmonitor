# CLI-Anything MCP Server

Model Context Protocol (MCP) server for [CLI-Anything](https://github.com/HKUDS/CLI-Anything) - making all software agent-native.

## What is This?

This MCP server exposes all CLI-Anything generated tools to AI agents via the Model Context Protocol. It automatically discovers available CLI tools and makes them callable through a standardized interface.

## Features

- **Auto-discovery**: Scans CLI-Anything repository and discovers all available tools
- **SKILL.md parsing**: Extracts metadata and usage examples from generated skill files
- **Tool execution**: Execute any CLI-Anything command through MCP
- **Resource access**: Read SKILL.md documentation for any tool
- **Standardized interface**: Works with OpenClaw, Claude Code, and other MCP-compatible agents

## Installation

1. **Clone CLI-Anything** (if not already done):
```bash
git clone https://github.com/HKUDS/CLI-Anything.git
cd CLI-Anything
```

2. **Install CLI-Anything tools** you want to use:
```bash
cd gimp/agent-harness
pip install -e .

cd ../../blender/agent-harness
pip install -e .

# Install any other tools you need
```

3. **Make MCP server executable**:
```bash
chmod +x /path/to/cli-anything-mcp/server.py
```

## Usage

### With OpenClaw

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "mcpServers": {
    "cli-anything": {
      "command": "python3",
      "args": ["/path/to/cli-anything-mcp/server.py"],
      "env": {
        "CLI_ANYTHING_PATH": "/path/to/CLI-Anything"
      }
    }
  }
}
```

### Standalone Testing

```bash
# Test tool discovery
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | python3 server.py

# Test resource listing
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}' | python3 server.py

# Read a SKILL.md file
echo '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"skill://gimp"}}' | python3 server.py

# Execute a tool
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"cli_anything_gimp","arguments":{"command":"--help"}}}' | python3 server.py
```

## Available Tools

The MCP server exposes tools for all installed CLI-Anything packages:

- `cli_anything_gimp` - GIMP image editing
- `cli_anything_blender` - Blender 3D rendering
- `cli_anything_audacity` - Audio processing
- `cli_anything_libreoffice` - Document generation
- `cli_anything_drawio` - Diagram creation
- `cli_anything_inkscape` - Vector graphics
- `cli_anything_kdenlive` - Video editing
- And more...

Each tool accepts:
- `command`: The subcommand to execute
- `args`: Optional array of additional arguments

## Example Agent Usage

```python
# In your AI agent code
response = mcp_client.call_tool(
    "cli_anything_gimp",
    {
        "command": "resize",
        "args": ["input.png", "output.png", "--width", "800", "--height", "600"]
    }
)
```

## How It Works

1. **Discovery**: Scans the CLI-Anything repository for tool directories
2. **Parsing**: Reads SKILL.md files to extract tool metadata
3. **Exposure**: Exposes tools via MCP protocol
4. **Execution**: Runs CLI commands and returns results

## Requirements

- Python 3.8+
- CLI-Anything repository cloned
- Individual CLI tools installed via `pip install -e .`

## Environment Variables

- `CLI_ANYTHING_PATH`: Path to CLI-Anything repository (default: `~/.openclaw/workspace/cli-anything`)

## License

MIT

## Related Projects

- [CLI-Anything](https://github.com/HKUDS/CLI-Anything) - The underlying CLI generation framework
- [OpenClaw](https://openclaw.ai) - AI agent framework with MCP support
- [Model Context Protocol](https://modelcontextprotocol.io) - Protocol specification
