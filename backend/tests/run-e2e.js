import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SERVER_PATH = path.resolve(__dirname, '../index.js');

// Generate unique database filename for concurrent run isolation
const uniqueId = Math.random().toString(36).substring(2, 15);
const DB_PATH = process.env.DB_PATH || path.join(FIXTURES_DIR, `test_db_${uniqueId}.json`);

let PORT = 5001;
let HEALTH_URL = `http://localhost:${PORT}/api/health`;
let serverProcess = null;

// Helper to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to find a free port dynamically to prevent port conflicts
function getFreePort(startingPort = 5001) {
  return new Promise((resolve, reject) => {
    let port = startingPort;
    const tryBind = () => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          port++;
          tryBind();
        } else {
          reject(err);
        }
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port);
    };
    tryBind();
  });
}

// Cleanup temporary files
function cleanup() {
  console.log('Cleaning up test files...');
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
      console.log(`Database file ${path.basename(DB_PATH)} deleted.`);
    } catch (err) {
      console.error(`Error deleting database file ${path.basename(DB_PATH)}:`, err);
    }
  }
}

// Stop the server, resolving when it is fully terminated
function stopServer() {
  return new Promise((resolve) => {
    if (!serverProcess || serverProcess.exitCode !== null) {
      resolve();
      return;
    }
    console.log('Stopping backend server...');
    serverProcess.once('close', () => {
      console.log('Backend server stopped.');
      resolve();
    });
    serverProcess.kill('SIGTERM');
    
    // Fallback force kill after 2 seconds
    setTimeout(() => {
      if (serverProcess && serverProcess.exitCode === null) {
        console.log('Backend server did not stop, sending SIGKILL...');
        serverProcess.kill('SIGKILL');
        resolve();
      }
    }, 2000);
  });
}

// Poll health check endpoint
async function waitForServer(timeoutMs = 5000) {
  const start = Date.now();
  console.log(`Polling health check at ${HEALTH_URL}...`);
  while (Date.now() - start < timeoutMs) {
    if (serverProcess && serverProcess.exitCode !== null) {
      console.error(`Backend server exited prematurely with code ${serverProcess.exitCode}`);
      return false;
    }
    try {
      const res = await fetch(HEALTH_URL);
      if (res.status === 200) {
        const body = await res.json();
        if (body.status === 'ok') {
          console.log('Backend server is healthy and ready!');
          return true;
        }
      }
    } catch (err) {
      // Server not ready yet
    }
    await sleep(250);
  }
  return false;
}

// Run a single test file
function runTestSuite(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, fileName);
    console.log(`\n==================================================`);
    console.log(`Running Test Suite: ${fileName}`);
    console.log(`==================================================`);
    
    // Spawn a node child process to execute the test suite
    const child = spawn('node', [filePath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: PORT.toString(),
        NODE_ENV: 'test',
        MOCK_GEMINI: 'true',
        DB_PATH
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`Suite ${fileName} PASSED!`);
        resolve(true);
      } else {
        console.error(`Suite ${fileName} FAILED with exit code ${code}`);
        resolve(false);
      }
    });

    child.on('error', (err) => {
      console.error(`Failed to start suite ${fileName}:`, err);
      reject(err);
    });
  });
}

// Main execution flow
async function main() {
  try {
    // 1. Dynamically resolve a free port to avoid conflicts
    PORT = await getFreePort(5001);
    HEALTH_URL = `http://localhost:${PORT}/api/health`;
    console.log(`Using dynamically allocated port: ${PORT}`);

    // 2. Initialize the isolated database
    if (!fs.existsSync(FIXTURES_DIR)) {
      fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    console.log(`Initialized isolated database fixture: ${DB_PATH}`);

    console.log('Spawning backend server...');
    serverProcess = spawn('node', [SERVER_PATH], {
      env: {
        ...process.env,
        PORT: PORT.toString(),
        NODE_ENV: 'test',
        MOCK_GEMINI: 'true',
        DB_PATH
      }
    });

    // Capture server process output for debugging if it crashes
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data}`);
    });

    serverProcess.on('close', (code) => {
      if (code && code !== 0) {
        console.error(`Server exited unexpectedly with code ${code}`);
      }
    });

    // Wait for the server to be ready
    const ready = await waitForServer(5000);
    if (!ready) {
      console.error('Error: Server failed to start or did not become healthy within 5 seconds.');
      await stopServer();
      cleanup();
      process.exit(1);
    }

    // Run suites sequentially
    const suites = ['tier1.test.js', 'tier2.test.js', 'tier3.test.js', 'tier4.test.js', 'tier5.test.js'];
    let allPassed = true;

    for (const suite of suites) {
      const passed = await runTestSuite(suite);
      if (!passed) {
        allPassed = false;
      }
    }

    // Terminate server and cleanup database file
    await stopServer();
    cleanup();

    if (allPassed) {
      console.log('\nAll E2E test suites passed successfully!');
      process.exit(0);
    } else {
      console.error('\nSome E2E test suites failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during E2E test run:', err);
    await stopServer();
    cleanup();
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGINT', async () => {
  await stopServer();
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await stopServer();
  cleanup();
  process.exit(1);
});

main();
