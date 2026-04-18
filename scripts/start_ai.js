// @ts-nocheck
/**
 * MedAIChain — Lanceur automatique du serveur IA (llama-server)
 * Utilisé par npm run start:dev pour démarrer le modèle avec le backend.
 *
 * Comportement :
 *  - Détecte automatiquement le fichier .gguf dans models/
 *  - Lance llama-server sur le port 8081
 *  - N'échoue PAS si le modèle est absent (NestJS continue)
 *  - Affiche les logs prefixés [AI]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Constantes ────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const ENGINE_PATH = path.join(ROOT, 'engine', 'llama-server.exe');
const MODELS_DIR = path.join(ROOT, 'models');
const PORT = 8081;
const HOST = '127.0.0.1';
const CTX_SIZE = 2048;
const THREADS = 6;

// Couleurs console
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(msg, color = C.cyan) {
  const ts = new Date().toLocaleTimeString('fr-FR');
  console.log(`${C.dim}[${ts}]${C.reset} ${color}[AI]${C.reset} ${msg}`);
}

function warn(msg) {
  log(`⚠  ${msg}`, C.yellow);
}
function error(msg) {
  log(`✖  ${msg}`, C.red);
}
function ok(msg) {
  log(`✔  ${msg}`, C.green);
}
function info(msg) {
  log(`ℹ  ${msg}`, C.blue);
}

// ── Priorité de détection du modèle ──────────────────────────────────────────
const MODEL_PRIORITY = [
  {
    file: 'medaichain-medical-3B-Q4_K_M.gguf',
    label: 'MedAIChain Medical 3B (optimal)',
    type: 'text',
    gpu: 99,
    ctx: 4096,
  },
  {
    file: 'medaichain-medical-3B.gguf',
    label: 'MedAIChain Medical 3B',
    type: 'text',
    gpu: 99,
    ctx: 4096,
  },
  {
    file: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    label: 'Llama 3.2 3B Instruct',
    type: 'text',
    gpu: 99,
    ctx: 4096,
  },
  {
    file: 'llama-3.2-3B-Q4_K_M.gguf',
    label: 'Llama 3.2 3B',
    type: 'text',
    gpu: 99,
    ctx: 4096,
  },
  {
    file: 'llama-3.1-8B-Q4_K_M.gguf',
    label: 'Llama 3.1 8B',
    type: 'text',
    gpu: 35,
    ctx: 2048,
  },
  {
    file: 'mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    label: 'Mistral 7B Instruct',
    type: 'text',
    gpu: 32,
    ctx: 2048,
  },
  {
    file: 'mistral-7b-v0.1.Q4_K_M.gguf',
    label: 'Mistral 7B',
    type: 'text',
    gpu: 32,
    ctx: 2048,
  },
  {
    file: 'llava-v1.5-7b-Q4_K.gguf',
    label: 'LLaVA 1.5 7B (lent sur 4GB GPU)',
    type: 'llava',
    gpu: 20,
    ctx: 1024,
  },
  {
    file: 'llava-v1.6-mistral-7b-Q4_K_M.gguf',
    label: 'LLaVA 1.6 Mistral 7B',
    type: 'llava',
    gpu: 20,
    ctx: 1024,
  },
];

// Clip model associé pour LLaVA (multimodal)
const CLIP_CANDIDATES = [
  'mmproj-model-f16.gguf',
  'llava-v1.5-7b-mmproj-model-f16.gguf',
  'llava-v1.6-mmproj-model-f16.gguf',
  'clip-vit-large-patch14-336-f16.gguf',
];

// ── Détection du modèle ───────────────────────────────────────────────────────
function detectModel() {
  if (!fs.existsSync(MODELS_DIR)) {
    return null;
  }

  // 1. Chercher dans l'ordre de priorité
  for (const candidate of MODEL_PRIORITY) {
    const fullPath = path.join(MODELS_DIR, candidate.file);
    if (fs.existsSync(fullPath)) {
      return { ...candidate, fullPath };
    }
  }

  // 2. Fallback : premier .gguf trouvé
  try {
    const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith('.gguf'));
    // Exclure les modèles clip/mmproj pour le modèle principal
    const mainFiles = files.filter(
      (f) =>
        !f.includes('mmproj') &&
        !f.includes('clip') &&
        !f.includes('projector'),
    );
    if (mainFiles.length > 0) {
      return {
        file: mainFiles[0],
        label: `${mainFiles[0]} (auto-détecté)`,
        type: 'text',
        gpu: 20,
        ctx: 2048,
        fullPath: path.join(MODELS_DIR, mainFiles[0]),
      };
    }
  } catch (_) {}

  return null;
}

// ── Détection du modèle CLIP pour LLaVA ──────────────────────────────────────
function detectClipModel() {
  for (const candidate of CLIP_CANDIDATES) {
    const fullPath = path.join(MODELS_DIR, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

// ── Vérifier si le port 8081 est déjà utilisé ────────────────────────────────
function checkPortInUse() {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.once('error', () => resolve(true)); // port occupé
    server.once('listening', () => {
      server.close();
      resolve(false); // port libre
    });
    server.listen(PORT, HOST);
  });
}

// ── Vérification que le serveur répond (health check) ────────────────────────
function waitForServer(maxWaitMs = 60000) {
  const http = require('http');
  const start = Date.now();
  const interval = 2000;

  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(
        `http://${HOST}:${PORT}/v1/models`,
        { timeout: 1500 },
        (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            retry();
          }
        },
      );
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - start >= maxWaitMs) {
        resolve(false);
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  info(`${C.bold}MedAIChain — Serveur IA Local${C.reset}`);
  console.log('');

  // 1. Vérifier llama-server.exe
  if (!fs.existsSync(ENGINE_PATH)) {
    warn(`llama-server.exe introuvable dans engine/`);
    warn(`Lancez : node download_engine.js`);
    warn(`Le backend NestJS démarre quand même sans l'IA.`);
    process.exit(0); // Sortie propre — NestJS continue
  }
  ok(`llama-server.exe détecté.`);

  // 2. Détecter le modèle
  const model = detectModel();
  if (!model) {
    warn(`Aucun modèle .gguf trouvé dans models/`);
    warn(`Placez un fichier .gguf dans medaichain-backend/models/`);
    warn(`Recommandé : Llama-3.2-3B-Instruct-Q4_K_M.gguf (1.9 GB)`);
    warn(`Le backend NestJS démarre quand même sans l'IA.`);
    process.exit(0); // Sortie propre — NestJS continue
  }
  ok(`Modèle : ${C.bold}${model.label}${C.reset}`);

  // 3. Vérifier si le port est déjà occupé
  const portInUse = await checkPortInUse();
  if (portInUse) {
    info(`Port ${PORT} déjà occupé — le serveur IA tourne peut-être déjà.`);
    info(`Si ce n'est pas le cas : netstat -ano | findstr :${PORT}`);
    process.exit(0);
  }

  // 4. Construire les arguments llama-server
  const args = [
    '-m',
    model.fullPath,
    '--port',
    String(PORT),
    '--host',
    HOST,
    '-ngl',
    String(model.gpu),
    '-c',
    String(model.ctx || CTX_SIZE),
    '-t',
    String(THREADS),
    '--log-disable',
  ];

  // Ajouter --mmproj si LLaVA
  if (model.type === 'llava') {
    const clipPath = detectClipModel();
    if (clipPath) {
      args.push('--mmproj', clipPath);
      ok(`Modèle CLIP : ${path.basename(clipPath)}`);
    } else {
      warn(`Modèle LLaVA détecté mais aucun fichier CLIP (mmproj) trouvé.`);
      warn(
        `Démarrage en mode texte uniquement (images gérées par OCR Tesseract).`,
      );
    }
    warn(`LLaVA 7B est lent sur GPU < 8GB. Envisagez un modèle 3B.`);
  }

  info(`GPU layers  : ${model.gpu}`);
  info(`Contexte    : ${model.ctx || CTX_SIZE} tokens`);
  info(`Port        : ${PORT}`);
  console.log('');

  // 5. Lancer llama-server
  info(`Démarrage du serveur IA...`);

  const proc = spawn(ENGINE_PATH, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverStarted = false;

  proc.stdout.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((l) => l.trim());
    for (const line of lines) {
      // Ignorer les lignes de log parasites (DLL injection etc.)
      if (
        line.includes('HookApp') ||
        line.includes('injectWindow') ||
        line.includes('graphicsWindow')
      )
        continue;

      if (
        line.includes('listening') ||
        line.includes('HTTP server') ||
        line.includes('server started') ||
        line.includes('all slots are idle')
      ) {
        if (!serverStarted) {
          serverStarted = true;
          console.log('');
          ok(
            `${C.bold}Serveur IA opérationnel sur http://${HOST}:${PORT}${C.reset}`,
          );
          ok(`Endpoint : http://${HOST}:${PORT}/v1/chat/completions`);
          console.log('');
        }
      } else {
        log(line.trim(), C.dim);
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((l) => l.trim());
    for (const line of lines) {
      if (
        line.includes('HookApp') ||
        line.includes('injectWindow') ||
        line.includes('graphicsWindow')
      )
        continue;

      // Afficher les infos GPU comme info, les erreurs comme erreurs
      if (
        line.includes('ggml_vulkan') ||
        line.includes('llama_model') ||
        line.includes('llm_load') ||
        line.includes('clip_model')
      ) {
        log(line.trim(), C.dim);
      } else if (line.includes('error') || line.includes('ERRO')) {
        error(line.trim());
      } else {
        log(line.trim(), C.dim);
      }
    }
  });

  proc.on('error', (err) => {
    error(`Impossible de lancer llama-server : ${err.message}`);
    process.exit(0); // Sortie propre
  });

  proc.on('close', (code) => {
    console.log('');
    if (code === 0) {
      info(`Serveur IA arrêté proprement.`);
    } else {
      warn(`Serveur IA terminé avec code ${code}.`);
      warn(`Causes possibles :`);
      warn(`  1. Mémoire GPU insuffisante → réduisez les GPU layers`);
      warn(`  2. Modèle corrompu → retéléchargez le .gguf`);
      warn(`  3. Conflit de port → vérifiez le port ${PORT}`);
    }
    // Ne pas exit(1) — NestJS doit continuer à tourner
    process.exit(0);
  });

  // 6. Health check : attendre que le serveur réponde
  info(`Attente du démarrage du serveur (max 60s)...`);
  const ready = await waitForServer(60000);
  if (ready && !serverStarted) {
    serverStarted = true;
    console.log('');
    ok(`${C.bold}Serveur IA opérationnel sur http://${HOST}:${PORT}${C.reset}`);
    console.log('');
  } else if (!ready) {
    warn(
      `Serveur IA non accessible après 60s. Il charge peut-être encore le modèle.`,
    );
    info(
      `Vous pouvez vérifier manuellement : http://${HOST}:${PORT}/v1/models`,
    );
  }

  // Garder le processus actif tant que llama-server tourne
  await new Promise(() => {}); // Attente infinie (tué par Ctrl+C ou concurrently)
}

main().catch((err) => {
  error(`Erreur inattendue : ${err.message}`);
  process.exit(0); // Toujours exit(0) pour ne pas tuer NestJS
});
