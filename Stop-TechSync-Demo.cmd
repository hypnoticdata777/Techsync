@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\local_stop.ps1" -AlsoDatabase
echo.
echo TechSync demo stop command finished.
pause
