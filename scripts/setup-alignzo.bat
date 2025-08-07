@echo off
REM =============================================================================
REM Alignzo V2 - Setup Script (Windows Batch Wrapper)
REM =============================================================================
REM This batch file provides a simple way to run the PowerShell setup script
REM =============================================================================

setlocal enabledelayedexpansion

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell 5.1 or later.
    pause
    exit /b 1
)

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "POWERSHELL_SCRIPT=%SCRIPT_DIR%setup-alignzo.ps1"

REM Check if the PowerShell script exists
if not exist "%POWERSHELL_SCRIPT%" (
    echo ERROR: PowerShell script not found at: %POWERSHELL_SCRIPT%
    echo Please ensure setup-alignzo.ps1 is in the same directory.
    pause
    exit /b 1
)

REM Get command line arguments
set "COMMAND=%1"
if "%COMMAND%"=="" set "COMMAND=setup"

REM Display welcome message
echo.
echo =============================================================================
echo Alignzo V2 - Setup Script
echo =============================================================================
echo.
echo Running command: %COMMAND%
echo PowerShell script: %POWERSHELL_SCRIPT%
echo.
echo Note: This batch file calls the PowerShell script for full functionality.
echo For more options, run: powershell -File "%POWERSHELL_SCRIPT%" help
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%POWERSHELL_SCRIPT%" %COMMAND%

REM Check if PowerShell script executed successfully
if errorlevel 1 (
    echo.
    echo ERROR: PowerShell script failed with exit code %errorlevel%
    echo.
    echo Troubleshooting tips:
    echo 1. Make sure you have administrator privileges
    echo 2. Check if PowerShell execution policy allows script execution
    echo 3. Review the log files for detailed error information
    echo.
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Start the application: %0 start
echo 2. Check status: %0 status
echo 3. View logs in: setup-alignzo.log
echo.
pause
