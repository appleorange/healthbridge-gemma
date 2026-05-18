@echo off
echo Starting HealthBridge...
echo Make sure Ollama is running with gemma4:e4b pulled
start npm run dev
timeout /t 3
start "" "http://localhost:3000"
