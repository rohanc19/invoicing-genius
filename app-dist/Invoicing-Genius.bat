@echo off
echo Starting Invoicing Genius...
cd /d "%~dp0"

:: Set environment variables
set ELECTRON_DISABLE_SECURITY_WARNINGS=1
set NODE_ENV=production

:: Run the application
echo Running Electron app...
npx electron .

:: If there was an error, pause so the user can see it
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo An error occurred while starting the application.
  echo Please check the console for more information.
  pause
)
