@echo off
title Haroon Zarai Markaz Server
cd /d "%~dp0"
echo ====================================================
echo   🌾 HAROON ZARAI MARKAZ (ہارون زرعی مرکز) 🌾
echo   Starting web server on http://localhost:5000
echo   Admin Link: http://localhost:5000/admin (PIN: 1234)
echo ====================================================
node server.js
pause
