@echo off
title MedAIChain — Serveur IA Local
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║        MedAIChain — Serveur IA Medical Local             ║
echo  ║        Détection automatique du modèle...                ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Vérifier llama-server.exe ────────────────────────────────────────────────
if not exist "engine\llama-server.exe" (
    echo  [ERREUR] llama-server.exe introuvable dans engine\
    echo  Lancez d'abord : python download_engine.py
    pause
    exit /b 1
)
echo  [OK] llama-server.exe détecté.

:: ── Détection automatique du modèle ──────────────────────────────────────────
echo.
echo  Recherche du modèle dans models\ ...
echo.

set MODEL_FILE=
set MODEL_TYPE=text

:: Priorité 1 — modèle médical fine-tuné 3B (optimal)
if exist "models\medaichain-medical-3B-Q4_K_M.gguf" (
    set MODEL_FILE=models\medaichain-medical-3B-Q4_K_M.gguf
    set MODEL_TYPE=text
    set MODEL_LABEL=MedAIChain Medical 3B (optimal)
    goto :model_found
)

:: Priorité 2 — modèle médical 3B variante
if exist "models\medaichain-medical-3B.gguf" (
    set MODEL_FILE=models\medaichain-medical-3B.gguf
    set MODEL_TYPE=text
    set MODEL_LABEL=MedAIChain Medical 3B
    goto :model_found
)

:: Priorité 3 — Llama 3.2 3B (léger, rapide)
if exist "models\llama-3.2-3B-Q4_K_M.gguf" (
    set MODEL_FILE=models\llama-3.2-3B-Q4_K_M.gguf
    set MODEL_TYPE=text
    set MODEL_LABEL=Llama 3.2 3B
    goto :model_found
)

:: Priorité 4 — Llama 3.1 8B (plus lent mais plus précis)
if exist "models\llama-3.1-8B-Q4_K_M.gguf" (
    set MODEL_FILE=models\llama-3.1-8B-Q4_K_M.gguf
    set MODEL_TYPE=text
    set MODEL_LABEL=Llama 3.1 8B
    goto :model_found
)

:: Priorité 5 — Mistral 7B
if exist "models\mistral-7b-instruct-v0.2.Q4_K_M.gguf" (
    set MODEL_FILE=models\mistral-7b-instruct-v0.2.Q4_K_M.gguf
    set MODEL_TYPE=text
    set MODEL_LABEL=Mistral 7B Instruct
    goto :model_found
)

:: Priorité 6 — LLaVA 7B (multimodal — ATTENTION: nécessite --mmproj)
if exist "models\llava-v1.5-7b-Q4_K.gguf" (
    set MODEL_FILE=models\llava-v1.5-7b-Q4_K.gguf
    set MODEL_TYPE=llava
    set MODEL_LABEL=LLaVA 1.5 7B (multimodal - lent)
    goto :model_found
)

:: Priorité 7 — LLaVA variante
if exist "models\llava-v1.6-mistral-7b-Q4_K_M.gguf" (
    set MODEL_FILE=models\llava-v1.6-mistral-7b-Q4_K_M.gguf
    set MODEL_TYPE=llava
    set MODEL_LABEL=LLaVA 1.6 Mistral 7B
    goto :model_found
)

:: Priorité 8 — N'importe quel .gguf trouvé
for %%F in (models\*.gguf) do (
    if "!MODEL_FILE!"=="" (
        set MODEL_FILE=%%F
        set MODEL_TYPE=text
        set MODEL_LABEL=%%~nF (détecté automatiquement)
    )
)

if not "!MODEL_FILE!"=="" goto :model_found

echo  [ERREUR] Aucun modèle .gguf trouvé dans models\
echo.
echo  Modèles compatibles (placez dans models\) :
echo    - medaichain-medical-3B-Q4_K_M.gguf    (recommandé - rapide)
echo    - llama-3.2-3B-Q4_K_M.gguf             (alternative légère)
echo    - mistral-7b-instruct-v0.2.Q4_K_M.gguf (alternative 7B)
echo.
echo  Téléchargement :
echo    python download_engine.py
echo    OU depuis Kaggle / HuggingFace
echo.
pause
exit /b 1

:model_found
echo  [OK] Modèle détecté : %MODEL_LABEL%
echo  [OK] Fichier        : %MODEL_FILE%
echo  [OK] Type           : %MODEL_TYPE%

:: ── Avertissement LLaVA ──────────────────────────────────────────────────────
if "%MODEL_TYPE%"=="llava" (
    echo.
    echo  ┌─────────────────────────────────────────────────────────┐
    echo  │  AVERTISSEMENT : Modèle LLaVA (multimodal) détecté     │
    echo  │  Ce modèle est LENT sur GPU 4GB (GTX 1650 etc.)        │
    echo  │  Chaque analyse peut prendre 1-3 minutes               │
    echo  │  Recommandation : utilisez un modèle texte 3B          │
    echo  └─────────────────────────────────────────────────────────┘
    echo.
    echo  Cherche le modèle CLIP associé pour LLaVA...

    set CLIP_FILE=
    if exist "models\mmproj-model-f16.gguf" (
        set CLIP_FILE=models\mmproj-model-f16.gguf
        echo  [OK] Modèle CLIP trouvé : models\mmproj-model-f16.gguf
    ) else if exist "models\llava-v1.5-7b-mmproj-model-f16.gguf" (
        set CLIP_FILE=models\llava-v1.5-7b-mmproj-model-f16.gguf
        echo  [OK] Modèle CLIP trouvé : %CLIP_FILE%
    ) else (
        echo  [INFO] Modèle CLIP (--mmproj) absent — démarrage en mode texte seul
        echo  [INFO] L'analyse d'images sera gérée par OCR (Tesseract) côté backend
        set MODEL_TYPE=text
    )
)

:: ── Détection GPU ─────────────────────────────────────────────────────────────
echo.
echo  Détection GPU...
set GPU_LAYERS=0
set GPU_LABEL=CPU uniquement

:: Vérifier si Vulkan est disponible (GTX 1650, AMD, etc.)
where vulkaninfo >nul 2>&1
if not errorlevel 1 (
    set GPU_LAYERS=32
    set GPU_LABEL=GPU Vulkan (partiel)
)

:: NVIDIA CUDA disponible ?
where nvcc >nul 2>&1
if not errorlevel 1 (
    set GPU_LAYERS=99
    set GPU_LABEL=GPU CUDA (NVIDIA)
)

:: Forcer GPU si GTX 1650 connue (Vulkan)
nvidia-smi >nul 2>&1
if not errorlevel 1 (
    set GPU_LAYERS=32
    set GPU_LABEL=GPU NVIDIA via nvidia-smi
    echo  [OK] GPU NVIDIA détecté via nvidia-smi
)

echo  [INFO] GPU layers : %GPU_LAYERS% (%GPU_LABEL%)

:: ── Paramètres selon le type de modèle ───────────────────────────────────────
set CTX_SIZE=2048
set THREADS=6
set MAX_TOKENS=400

if "%MODEL_TYPE%"=="llava" (
    :: LLaVA 7B — réduire le contexte pour économiser la VRAM
    set CTX_SIZE=1024
    set THREADS=4
    set MAX_TOKENS=350
)

:: ── Vérifier port 8081 disponible ────────────────────────────────────────────
echo.
netstat -ano | findstr ":8081" >nul 2>&1
if not errorlevel 1 (
    echo  [AVERTISSEMENT] Port 8081 déjà occupé !
    echo  Un autre serveur IA tourne peut-être déjà.
    echo.
    set /p KILL_PORT="  Tuer le processus sur 8081 ? [O/n] : "
    if /i not "%KILL_PORT%"=="n" (
        for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8081"') do (
            taskkill /PID %%P /F >nul 2>&1
        )
        echo  [OK] Processus tué.
        timeout /t 2 /nobreak >nul
    )
)

:: ── Afficher configuration finale ────────────────────────────────────────────
echo.
echo  ┌─────────────────────────────────────────────────────────┐
echo  │  Configuration du serveur IA :                          │
echo  │  Modèle  : %MODEL_LABEL%
echo  │  Port    : 8081 (backend NestJS sur 3000)               │
echo  │  GPU     : %GPU_LAYERS% layers (%GPU_LABEL%)
echo  │  Contexte: %CTX_SIZE% tokens                                    │
echo  │  Threads : %THREADS%                                            │
echo  └─────────────────────────────────────────────────────────┘
echo.
echo  URL de l'API IA : http://127.0.0.1:8081/v1/chat/completions
echo  Swagger backend : http://localhost:3000/api
echo.
echo  Appuyez sur Ctrl+C pour arrêter le serveur.
echo  ════════════════════════════════════════════════════════════
echo.

:: ── Lancer le serveur selon le type ──────────────────────────────────────────
if "%MODEL_TYPE%"=="llava" (
    if not "%CLIP_FILE%"=="" (
        echo  [Démarrage] LLaVA avec CLIP multimodal...
        engine\llama-server.exe ^
            -m %MODEL_FILE% ^
            --mmproj %CLIP_FILE% ^
            --port 8081 ^
            --host 127.0.0.1 ^
            -ngl %GPU_LAYERS% ^
            -c %CTX_SIZE% ^
            -t %THREADS% ^
            --log-disable
    ) else (
        echo  [Démarrage] LLaVA en mode texte (sans CLIP)...
        engine\llama-server.exe ^
            -m %MODEL_FILE% ^
            --port 8081 ^
            --host 127.0.0.1 ^
            -ngl %GPU_LAYERS% ^
            -c %CTX_SIZE% ^
            -t %THREADS% ^
            --log-disable
    )
) else (
    echo  [Démarrage] Modèle texte médical...
    engine\llama-server.exe ^
        -m %MODEL_FILE% ^
        --port 8081 ^
        --host 127.0.0.1 ^
        -ngl %GPU_LAYERS% ^
        -c %CTX_SIZE% ^
        -t %THREADS% ^
        --log-disable
)

:: ── Gestion erreur ────────────────────────────────────────────────────────────
if errorlevel 1 (
    echo.
    echo  [ERREUR] Le serveur IA s'est arrêté avec une erreur.
    echo.
    echo  Causes fréquentes :
    echo  1. Mémoire insuffisante (GPU ou RAM)
    echo     → Réduisez GPU layers : modifiez GPU_LAYERS=0 (CPU pur)
    echo  2. Modèle corrompu
    echo     → Retéléchargez le fichier .gguf
    echo  3. Port 8081 encore occupé
    echo     → netstat -ano ^| findstr :8081
    echo  4. LLaVA sans --mmproj
    echo     → Téléchargez mmproj-model-f16.gguf dans models\
    echo.
    echo  Pour tester manuellement :
    echo    engine\llama-server.exe -m %MODEL_FILE% --port 8081 -ngl 0
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] Serveur arrêté proprement.
pause
