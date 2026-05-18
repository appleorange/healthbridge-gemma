#!/bin/bash
echo "Starting HealthBridge..."
echo "Make sure Ollama is running with gemma4:e4b pulled"
npm run dev &
sleep 3
open http://localhost:3000
