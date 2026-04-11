@echo off
title MEDAIChain — Backend NestJS uniquement
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║       MEDAIChain — Demarrage Backend NestJS          ║
echo  ║         (sans serveur IA — demarrage rapide)         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── Verifier Node.js ────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERREUR] Node.js introuvable dans le PATH.
    echo  Installez Node.js : https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%V in ('node --version') do set NODE_VER=%%V
echo  [OK] Node.js detecte : %NODE_VER%

:: ── Verifier npm ────────────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERREUR] npm introuvable.
    pause
    exit /b 1
)

:: ── Verifier .env ────────────────────────────────────────────────────────────
if not exist ".env" (
    echo.
    echo  [ERREUR] Fichier .env introuvable !
    echo.
    echo  Creez un fichier .env avec le contenu suivant :
    echo.
    echo    MONGODB_URI=mongodb://localhost:27017/medaichain
    echo    JWT_SECRET=medaichain-secret-key-2024
    echo    JWT_EXPIRES_IN=7d
    echo    JWT_REFRESH_SECRET=medaichain-refresh-secret-2024
    echo    JWT_REFRESH_EXPIRES_IN=30d
    echo    PORT=3000
    echo.
    pause
    exit /b 1
)
echo  [OK] Fichier .env detecte.

:: ── Verifier node_modules ────────────────────────────────────────────────────
if not exist "node_modules" (
    echo.
    echo  [INFO] node_modules absent — installation des dependances...
    echo.
    npm install
    if errorlevel 1 (
        echo  [ERREUR] npm install a echoue.
        pause
        exit /b 1
    )
    echo  [OK] Dependances installees.
)

:: ── Verifier dist (build) ────────────────────────────────────────────────────
if not exist "dist" (
    echo.
    echo  [INFO] Dossier dist absent — premier build...
    echo.
    call npx nest build
    if errorlevel 1 (
        echo  [AVERTISSEMENT] Build initial echoue, tentative en mode watch...
    )
)

echo.
echo  ┌─────────────────────────────────────────────────────┐
echo  │  Configuration detectee :                           │
echo  │  Backend  : http://localhost:3000                   │
echo  │  Swagger  : http://localhost:3000/api               │
echo  │  Emulateur: http://10.0.2.2:3000                   │
echo  └─────────────────────────────────────────────────────┘
echo.
echo  [INFO] Serveur IA (LLaMA) NON demarre.
echo  [INFO] Pour activer l'IA, lancez aussi : start_ai_server.bat
echo.
echo  Raccourcis en cours d'execution :
echo    Ctrl+C = Arreter le serveur
echo.
echo  ════════════════════════════════════════════════════════
echo   Lancement : nest start --watch
echo  ════════════════════════════════════════════════════════
echo.

:: ── Lancer uniquement NestJS (sans AI server) ────────────────────────────────
npx nest start --watch

:: ── En cas d'erreur ──────────────────────────────────────────────────────────
if errorlevel 1 (
    echo.
    echo  [ERREUR] NestJS a rencontre un probleme au demarrage.
    echo.
    echo  Solutions courantes :
    echo  1. Verifiez votre fichier .env (MONGODB_URI valide ?)
    echo  2. Verifiez que MongoDB tourne :
    echo     - Local  : net start MongoDB
    echo     - Atlas  : verifiez votre IP dans MongoDB Atlas Network Access
    echo  3. npm install        (dependances manquantes)
    echo  4. npx nest build     (recompiler)
    echo  5. Verifiez le port 3000 : netstat -ano ^| findstr :3000
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Serveur arrete proprement.
pause
