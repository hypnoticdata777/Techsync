@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\local_dev.ps1" -ResetDemo
echo.
echo TechSync demo launcher finished. Close this window when you are done reading the output.
pause
