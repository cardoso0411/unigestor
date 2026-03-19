@echo off
title UniGestor - Backend

:: Porta usada pelo servidor
set PORT=3000

:: Verifica se a porta já está em uso
netstat -ano | findstr ":%PORT% " >nul
if %errorlevel% equ 0 (
  :: Servidor já está rodando
  exit /b 0
)

:: Vai para a pasta backend
cd backend

:: Verifica se Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Node.js não encontrado!
  echo Baixe e instale em: https://nodejs.org/
  pause
  exit /b
)

:: Inicia o servidor
node server.js