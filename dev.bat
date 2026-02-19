@echo off
echo Starting KobKlein dev servers...
echo.
echo  API    -> http://localhost:3001
echo  Web    -> http://localhost:3003
echo  Admin  -> http://localhost:3002
echo.
echo Press Ctrl+C to stop all servers.
echo.
cd /d "%~dp0"
pnpm dev
