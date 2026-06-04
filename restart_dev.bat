@echo off
echo ========================================
echo   RESTARTING DEV SERVER
echo ========================================
echo.
echo Step 1: Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing npm cache...
npm cache clean --force

echo.
echo Step 3: Starting dev server...
echo.
echo ========================================
echo   DEV SERVER STARTING
echo ========================================
echo.
echo Watch for these logs to confirm chunking is working:
echo   [database.js] Large message detected, using chunked storage
echo   [MessageChunking] Split content into X chunks
echo   [MessageChunking] Created parent message...
echo.
npm run dev
