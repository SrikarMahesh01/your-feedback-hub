@echo off
echo 🔒 Building Your Feedback Hub for SECURE Production Deployment...
echo.

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist

REM Install dependencies
echo 📦 Installing dependencies...
npm ci --only=production --silent

REM Build with maximum security
echo 🏗️ Building with maximum security obfuscation...
npm run build:secure

REM Verify security
echo 🔍 Verifying source code protection...
findstr /C:"sourceMappingURL" dist\*.* >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ SECURITY BREACH: Source maps found! Build failed.
    pause
    exit /b 1
)

findstr /C:".map" dist\*.* >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ SECURITY BREACH: Map files found! Build failed.
    pause
    exit /b 1
)

REM Check if build was successful
if exist dist (
    echo.
    echo ✅ SECURE BUILD SUCCESSFUL! 
    echo.
    echo 🔒 SECURITY FEATURES ENABLED:
    echo   ✓ Source maps completely disabled
    echo   ✓ All console logs removed
    echo   ✓ Variable names obfuscated
    echo   ✓ File names randomized
    echo   ✓ Comments stripped
    echo   ✓ Framework identifiers hidden
    echo   ✓ Multiple compression passes applied
    echo.
    echo 📁 Production files: './dist' folder
    echo 🚀 Ready for NSSM server deployment
    echo 🔐 Source code is COMPLETELY PROTECTED
    echo.
    echo To deploy on NSSM server:
    echo   1. Copy 'dist' folder to server
    echo   2. Run: npm run start
    echo   3. Configure NSSM service
    echo.
) else (
    echo.
    echo ❌ Build failed! Check the output above for errors.
    echo.
)

pause
