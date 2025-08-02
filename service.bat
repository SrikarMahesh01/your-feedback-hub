@echo off
:: =============================================================================
:: Your Feedback Hub - Complete NSSM Service Management
:: =============================================================================
:: One file to handle everything: build, install, manage NSSM service
:: Usage:
::   service.bat install    - Build app and install service (run as Admin)
::   service.bat start      - Start service
::   service.bat stop       - Stop service
::   service.bat restart    - Restart service
::   service.bat remove     - Remove service (run as Admin)
::   service.bat status     - Show service status
::   service.bat logs       - Show recent logs
:: =============================================================================

setlocal enabledelayedexpansion

set SERVICE_NAME=YourFeedbackHub
set APP_DIR=%~dp0
set APP_DIR=%APP_DIR:~0,-1%
set NODE_EXE=node
set SERVER_SCRIPT="%APP_DIR%\server.js"
set NSSM_EXE=nssm.exe

:: Colors
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

if "%1"=="" goto SHOW_HELP

:: Commands
if /i "%1"=="install" goto INSTALL_SERVICE
if /i "%1"=="start" goto START_SERVICE
if /i "%1"=="stop" goto STOP_SERVICE
if /i "%1"=="restart" goto RESTART_SERVICE
if /i "%1"=="remove" goto REMOVE_SERVICE
if /i "%1"=="uninstall" goto REMOVE_SERVICE
if /i "%1"=="status" goto SERVICE_STATUS
if /i "%1"=="logs" goto VIEW_LOGS
if /i "%1"=="build" goto BUILD_ONLY
goto SHOW_HELP

:INSTALL_SERVICE
echo.
echo %BLUE%=============================================%NC%
echo %BLUE%  Installing Your Feedback Hub Service     %NC%
echo %BLUE%=============================================%NC%
echo.

:: Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%✗ Administrator privileges required for service installation%NC%
    echo %YELLOW%Please run as Administrator: service.bat install%NC%
    goto END
)

:: Check Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%✗ Node.js not found. Please install Node.js first.%NC%
    goto END
)

:: Check NSSM
%NSSM_EXE% >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%✗ NSSM not found. Please download nssm.exe from https://nssm.cc/download%NC%
    echo %YELLOW%Place nssm.exe in: %APP_DIR%%NC%
    goto END
)

:: Install dependencies
echo %YELLOW%📦 Installing dependencies...%NC%
call npm install express
if %errorLevel% neq 0 (
    echo %RED%✗ Failed to install Express dependency%NC%
    goto END
)

:: Build application
echo %YELLOW%🔨 Building application...%NC%
call npm run build
if %errorLevel% neq 0 (
    echo %RED%✗ Build failed%NC%
    goto END
)

:: Create logs directory
if not exist "logs" mkdir logs

:: Remove existing service if it exists
%NSSM_EXE% status %SERVICE_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo %YELLOW%Removing existing service...%NC%
    %NSSM_EXE% stop %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
    %NSSM_EXE% remove %SERVICE_NAME% confirm
)

:: Install new service
echo %YELLOW%📋 Installing NSSM service...%NC%
%NSSM_EXE% install %SERVICE_NAME% "%NODE_EXE%" %SERVER_SCRIPT%
%NSSM_EXE% set %SERVICE_NAME% AppDirectory "%APP_DIR%"
%NSSM_EXE% set %SERVICE_NAME% DisplayName "Your Feedback Hub"
%NSSM_EXE% set %SERVICE_NAME% Description "Student Feedback Management System"
%NSSM_EXE% set %SERVICE_NAME% Start SERVICE_AUTO_START

:: Configure logging
%NSSM_EXE% set %SERVICE_NAME% AppStdout "%APP_DIR%\logs\output.log"
%NSSM_EXE% set %SERVICE_NAME% AppStderr "%APP_DIR%\logs\error.log"
%NSSM_EXE% set %SERVICE_NAME% AppRotateFiles 1
%NSSM_EXE% set %SERVICE_NAME% AppRotateOnline 1
%NSSM_EXE% set %SERVICE_NAME% AppRotateSeconds 86400

:: Start service
echo %YELLOW%🚀 Starting service...%NC%
%NSSM_EXE% start %SERVICE_NAME%
timeout /t 3 /nobreak >nul

:: Check status
%NSSM_EXE% status %SERVICE_NAME% | find "SERVICE_RUNNING" >nul
if %errorLevel% equ 0 (
    echo.
    echo %GREEN%✅ Service installed and started successfully!%NC%
    echo %GREEN%🌐 Your Feedback Hub: http://localhost:3000%NC%
    echo.
) else (
    echo %RED%✗ Service installation completed but not running%NC%
    echo %YELLOW%Check logs: service.bat logs%NC%
)
goto END

:BUILD_ONLY
echo %YELLOW%🔨 Building application only...%NC%
call npm install express
call npm run build
echo %GREEN%✅ Build completed%NC%
goto END

:START_SERVICE
echo %YELLOW%▶️ Starting Your Feedback Hub service...%NC%
%NSSM_EXE% start %SERVICE_NAME%
timeout /t 2 /nobreak >nul
goto SERVICE_STATUS

:STOP_SERVICE
echo %YELLOW%⏹️ Stopping Your Feedback Hub service...%NC%
%NSSM_EXE% stop %SERVICE_NAME%
timeout /t 2 /nobreak >nul
goto SERVICE_STATUS

:RESTART_SERVICE
echo %YELLOW%🔄 Restarting Your Feedback Hub service...%NC%
%NSSM_EXE% restart %SERVICE_NAME%
timeout /t 3 /nobreak >nul
goto SERVICE_STATUS

:REMOVE_SERVICE
:: Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%✗ Administrator privileges required for service removal%NC%
    echo %YELLOW%Please run as Administrator: service.bat remove%NC%
    goto END
)

echo %YELLOW%🗑️ Removing Your Feedback Hub service...%NC%
%NSSM_EXE% stop %SERVICE_NAME%
timeout /t 2 /nobreak >nul
%NSSM_EXE% remove %SERVICE_NAME% confirm
echo %GREEN%✅ Service removed%NC%
goto END

:SERVICE_STATUS
echo.
echo %BLUE%📊 Service Status:%NC%
%NSSM_EXE% status %SERVICE_NAME% 2>nul
if %errorLevel% neq 0 (
    echo %RED%Service not installed%NC%
    echo %YELLOW%Run: service.bat install%NC%
) else (
    echo %GREEN%Service is installed%NC%
    echo %BLUE%URL: http://localhost:3000%NC%
)
echo.
goto END

:VIEW_LOGS
echo %BLUE%📋 Recent Logs:%NC%
if exist "logs\output.log" (
    echo %YELLOW%--- Output Log (last 15 lines) ---%NC%
    powershell "Get-Content 'logs\output.log' -Tail 15"
    echo.
)
if exist "logs\error.log" (
    echo %YELLOW%--- Error Log (last 10 lines) ---%NC%
    powershell "Get-Content 'logs\error.log' -Tail 10"
    echo.
)
if not exist "logs\output.log" (
    echo %YELLOW%No logs found%NC%
)
goto END

:SHOW_HELP
echo.
echo %BLUE%Your Feedback Hub - NSSM Service Manager%NC%
echo %BLUE%=======================================%NC%
echo.
echo %GREEN%Commands:%NC%
echo   %YELLOW%service.bat install%NC%   - Build app and install service %RED%(Admin)%NC%
echo   %YELLOW%service.bat start%NC%     - Start the service
echo   %YELLOW%service.bat stop%NC%      - Stop the service
echo   %YELLOW%service.bat restart%NC%   - Restart the service
echo   %YELLOW%service.bat remove%NC%    - Remove the service %RED%(Admin)%NC%
echo   %YELLOW%service.bat status%NC%    - Show service status
echo   %YELLOW%service.bat logs%NC%      - Show recent logs
echo   %YELLOW%service.bat build%NC%     - Build application only
echo.
echo %GREEN%Quick Start:%NC%
echo   %YELLOW%1. Download nssm.exe to this folder%NC%
echo   %YELLOW%2. Run as Admin: service.bat install%NC%
echo   %YELLOW%3. Access: http://localhost:3000%NC%
echo.
echo %GREEN%Prerequisites:%NC%
echo   %YELLOW%- Node.js installed%NC%
echo   %YELLOW%- nssm.exe in current directory%NC%
echo   %YELLOW%- Admin rights for install/remove%NC%
echo.

:END
exit /b 0
