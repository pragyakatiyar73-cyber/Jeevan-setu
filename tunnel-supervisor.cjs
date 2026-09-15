// tunnel-supervisor.cjs - Automated Tunnel Manager & Watchdog
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const STATE_FILE = path.join(__dirname, 'tunnel_state.json');
const CHECK_INTERVAL_MS = 15000;
const MAX_CONSECUTIVE_FAILURES = 3;

let currentChild = null;
let currentUrl = null;
let consecutiveFailures = 0;
let isShuttingDown = false;
let checkTimer = null;
let restartTimer = null;
let startTime = Date.now();

function updateState(fields) {
  try {
    let existing = {};
    if (fs.existsSync(STATE_FILE)) {
      try { existing = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
    }
    const updated = {
      ...existing,
      ...fields,
      updatedAt: Date.now()
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2));
    console.log(`[Supervisor State Updated] healthy=${updated.healthy} url=${updated.url}`);
  } catch (err) {
    console.error('[Supervisor] Failed to write tunnel state:', err.message);
  }
}

function verifyUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.get(
        {
          hostname: parsed.hostname,
          port: 443,
          path: '/?health=1',
          timeout: 8000,
          headers: { 'User-Agent': 'TunnelSupervisor-HealthCheck/1.0' }
        },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) {
            resolve(true);
          } else {
            console.warn(`[Supervisor] Health check returned HTTP ${res.statusCode}`);
            resolve(false);
          }
        }
      );
      req.on('error', (e) => {
        console.warn(`[Supervisor] Health check network error: ${e.message}`);
        resolve(false);
      });
      req.on('timeout', () => {
        req.destroy();
        console.warn('[Supervisor] Health check timed out');
        resolve(false);
      });
    } catch (err) {
      resolve(false);
    }
  });
}

async function runHealthCheck() {
  if (!currentUrl || isShuttingDown) return;

  const isHealthy = await verifyUrl(currentUrl);
  if (isHealthy) {
    consecutiveFailures = 0;
    updateState({
      url: currentUrl,
      driverUrl: `${currentUrl}/?tab=driver`,
      healthy: true,
      lastChecked: Date.now(),
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
    });
  } else {
    consecutiveFailures++;
    console.warn(`[Supervisor] Health check failure ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} for ${currentUrl}`);
    updateState({
      healthy: false,
      lastChecked: Date.now(),
      failureCount: consecutiveFailures
    });

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`[Supervisor] Tunnel ${currentUrl} is non-responsive! Auto-restarting tunnel...`);
      restartTunnel();
    }
  }
}

function killCurrent() {
  if (currentChild) {
    try {
      currentChild.kill('SIGTERM');
      setTimeout(() => {
        try { currentChild && currentChild.kill('SIGKILL'); } catch (e) {}
      }, 1000);
    } catch (e) {}
    currentChild = null;
  }
}

function restartTunnel() {
  killCurrent();
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(startTunnel, 1500);
}

function startTunnel() {
  if (isShuttingDown) return;

  currentUrl = null;
  consecutiveFailures = 0;
  startTime = Date.now();
  updateState({ healthy: false, status: 'connecting', url: null });

  console.log('[Supervisor] Spawning Pinggy tunnel to port 3000...');
  
  const child = spawn('/usr/bin/ssh', [
    '-p', '443',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=3',
    '-R0:localhost:3000',
    'a.pinggy.io'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  currentChild = child;

  let urlDetected = false;

  function handleOutput(chunk) {
    const text = chunk.toString();
    console.log(`[Pinggy Output] ${text.trim()}`);
    if (!urlDetected) {
      // Look for free.pinggy.net or run.pinggy-free.link URL
      const matches = text.match(/https:\/\/[a-zA-Z0-9-]+\.(free\.pinggy\.net|run\.pinggy-free\.link)/g);
      if (matches && matches.length > 0) {
        // Prefer free.pinggy.net if found
        const preferred = matches.find(m => m.includes('free.pinggy.net')) || matches[0];
        urlDetected = true;
        currentUrl = preferred;
        console.log(`[Supervisor] Live Tunnel URL verified: ${currentUrl}`);
        updateState({
          url: currentUrl,
          driverUrl: `${currentUrl}/?tab=driver`,
          status: 'verifying',
          healthy: false
        });

        // Test after 2 seconds
        setTimeout(async () => {
          const ok = await verifyUrl(currentUrl);
          updateState({
            healthy: ok,
            status: ok ? 'active' : 'warmup',
            lastChecked: Date.now()
          });
        }, 2000);
      }
    }
  }

  child.stdout.on('data', handleOutput);
  child.stderr.on('data', handleOutput);

  child.on('exit', (code, signal) => {
    console.warn(`[Supervisor] Tunnel process exited (code=${code}, signal=${signal})`);
    if (!isShuttingDown) {
      console.log('[Supervisor] Auto-reconnecting tunnel in 2 seconds...');
      restartTunnel();
    }
  });

  child.on('error', (err) => {
    console.error('[Supervisor] Failed to spawn ssh:', err.message);
    if (!isShuttingDown) {
      restartTunnel();
    }
  });
}

checkTimer = setInterval(runHealthCheck, CHECK_INTERVAL_MS);

process.on('SIGINT', () => {
  isShuttingDown = true;
  clearInterval(checkTimer);
  killCurrent();
  process.exit(0);
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  clearInterval(checkTimer);
  killCurrent();
  process.exit(0);
});

startTunnel();
