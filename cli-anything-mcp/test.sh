#!/bin/bash
# Test CLI-Anything MCP Server

echo "Testing CLI-Anything MCP Server..."
echo ""

# Set path to CLI-Anything in Kali container
export CLI_ANYTHING_PATH="/home/kali/.openclaw/workspace/cli-anything"

echo "1. Testing tool discovery..."
docker exec kali-pentest python3 /home/Ubuntu/worldmonitor/cli-anything-mcp/server.py <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
echo ""

echo "2. Testing resource listing..."
docker exec kali-pentest python3 /home/Ubuntu/worldmonitor/cli-anything-mcp/server.py <<< '{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}'
echo ""

echo "3. Testing SKILL.md read..."
docker exec kali-pentest python3 /home/Ubuntu/worldmonitor/cli-anything-mcp/server.py <<< '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"skill://gimp"}}'
echo ""
