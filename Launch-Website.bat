@echo off
title PIXMAP Website Launcher
cd /d "%~dp0"
set "PORT=9000"

echo ============================================
echo    PIXMAP - Local Website Launcher
echo ============================================
echo.

REM --- Prefer Python (py launcher) ---
where py >nul 2>nul && (
    start "PIXMAP Local Server" cmd /k py -m http.server %PORT%
    goto open
)

REM --- Then plain python ---
where python >nul 2>nul && (
    start "PIXMAP Local Server" cmd /k python -m http.server %PORT%
    goto open
)

REM --- Then Node (downloads http-server on first run, needs internet) ---
where node >nul 2>nul && (
    start "PIXMAP Local Server" cmd /k npx --yes http-server -p %PORT% -c-1
    goto open
)

REM --- Fallback: just open the file directly ---
echo No Python or Node was found on this PC.
echo Opening the site directly from the file instead.
echo.
echo For the smoothest experience, install Python from:
echo     https://www.python.org/downloads/
echo (tick "Add python.exe to PATH" during install), then run this again.
echo.
start "" "index.html"
pause
exit /b

:open
echo A small server window just opened - keep it open while you browse.
echo To stop the server later, simply close that window.
echo.
echo Opening the site in your browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%/"
exit /b
