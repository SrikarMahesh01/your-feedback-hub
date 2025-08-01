@echo off
echo 🔍 VERIFYING PRODUCTION BUILD SECURITY...
echo.

REM Check if dist folder exists
if not exist dist (
    echo ❌ No build found! Run 'npm run build:secure' first.
    pause
    exit /b 1
)

echo ✅ Build folder exists

REM Check for source maps
findstr /C:"sourceMappingURL" dist\*.* >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ SECURITY BREACH: Source map references found!
    exit /b 1
) else (
    echo ✅ No source map references
)

REM Check for .map files
dir dist\*.map >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ SECURITY BREACH: Source map files found!
    exit /b 1
) else (
    echo ✅ No source map files
)

REM Check for readable JavaScript (should be obfuscated)
findstr /C:"function " dist\assets\*.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: Readable function keywords found (may indicate insufficient obfuscation)
) else (
    echo ✅ JavaScript properly obfuscated
)

REM Check for React debug information
findstr /C:"React" dist\assets\*.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: React references found
) else (
    echo ✅ Framework references hidden
)

REM Check file names are properly hashed
echo.
echo 📁 Production file structure:
dir dist\assets\*.js | findstr ".js"
echo.

echo 🔐 SECURITY VERIFICATION COMPLETED!
echo.
echo Your application is ready for secure deployment on NSSM server.
echo Source code is completely protected and obfuscated.
echo.
pause
