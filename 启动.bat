@echo off
chcp 65001 >nul
title CareerAssistant - 启动中...

echo 正在启动 CareerAssistant...
echo.

cd /d "%~dp0"

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 检查依赖是否安装
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
)

echo [启动] CareerAssistant 正在启动...
echo.

:: 启动应用
npm run dev

if errorlevel 1 (
    echo.
    echo [错误] 启动失败，请检查错误信息
    pause
)
