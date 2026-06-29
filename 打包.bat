@echo off
chcp 65001 >nul
title CareerAssistant - 打包免安装版

echo 正在打包 CareerAssistant 免安装版...
echo.

cd /d "%~dp0"

:: 设置环境变量跳过签名
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CODESIGN_SKIP=1
set ELECTRON_BUILDER_SKIP_WINCODE_SIGN=1

:: 构建并打包
npm run build
npm run dist:win

if errorlevel 1 (
    echo.
    echo [错误] 打包失败，尝试备用方案...
    echo 使用 electron 直接运行 out/main/index.js
    npx electron out/main/index.js
) else (
    echo.
    echo [成功] 打包完成！
    echo 可执行文件位于: dist_electron\win-unpacked\CareerAssistant.exe
    echo.
    pause
)
