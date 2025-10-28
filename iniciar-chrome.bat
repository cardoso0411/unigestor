@echo off
title UniGestor - Sistema de Controle de Estoque (Chrome)
color 0A
echo ============================================
echo        Iniciando UniGestor no Chrome...
echo ============================================
echo.

:: Caminho para o Chrome (ajuste se necessário)
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"

:: Caminho da página inicial do sistema
set "PAGE_PATH=%cd%\frontend\itens.html"

:: Navega até a pasta backend
cd backend

:: Verifica se Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Node.js não encontrado!
  echo Baixe e instale em: https://nodejs.org/
  pause
  exit /b
)

:: Inicia o servidor Node em background (nova janela)
start "Servidor UniGestor" cmd /c "node server.js"

:: Aguarda 2 segundos para o servidor iniciar
timeout /t 2 >nul

:: Abre o Chrome com o sistema
echo 🚀 Abrindo UniGestor no Chrome...
start "" "%CHROME_PATH%" "file:///%PAGE_PATH%"

echo.
echo ✅ UniGestor iniciado com sucesso!
pause