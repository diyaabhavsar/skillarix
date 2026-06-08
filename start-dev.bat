@echo off
title Skillarix Dev Launcher
color 0A
echo.
echo  =============================================
echo    SKILLARIX - Starting Development Servers
echo  =============================================
echo.

REM Ensure Node.js is on PATH (nvm4w location used on this machine)
set PATH=C:\nvm4w\nodejs;%PATH%

REM ── Backend ──────────────────────────────────────────────────────────────
echo  [1/2] Starting Backend  ^>  http://localhost:8070
echo        API Docs          ^>  http://localhost:8070/docs
echo.
start "Skillarix BACKEND :8070" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8070"

REM Give the backend a moment to bind before starting the frontend
timeout /t 3 /nobreak > nul

REM ── Frontend ─────────────────────────────────────────────────────────────
echo  [2/2] Starting Frontend ^>  http://localhost:3005
echo.
start "Skillarix FRONTEND :3005" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Both servers are starting in separate windows.
echo.
echo  Backend  : http://localhost:8070
echo  API Docs : http://localhost:8070/docs
echo  Frontend : http://localhost:3005
echo.
echo  Close the individual terminal windows to stop each server.
echo  Press any key to close this launcher...
pause > nul
