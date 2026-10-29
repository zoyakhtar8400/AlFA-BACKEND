
@echo off
cd /d %~dp0
title ALFA SOFTWARE - Backend Server (Port 8000)
color 0A
echo ========================================================
echo   ALFA SOFTWARE - Local Backend Server (Port 8000)
echo ========================================================
echo.
echo Starting backend...
node.exe server.js
pause
