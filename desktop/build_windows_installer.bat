@echo off
echo ================================================================
echo    EstateOS AI — Windows Desktop Application Installer Builder
echo ================================================================

cd /d "%~dp0\..\frontend"

echo [1/3] Building Optimized React / Vite Production Distribution...
call npm run build

echo [2/3] Checking Rust & Tauri Toolchain...
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo Note: Cargo/Rust is not detected in current PATH.
    echo Portable desktop wrapper has been configured in desktop\run_desktop.py
    echo When Cargo is installed, run: npm run tauri build
    goto end
)

echo [3/3] Compiling Native Tauri Windows Installer (.msi / .exe)...
call npm run tauri build

:end
echo ================================================================
echo Windows build process completed.
pause

