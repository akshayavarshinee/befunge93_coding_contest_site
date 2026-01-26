import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Docker-based isolated Befunge-93 executor
 * Enforces CPU, memory, network restrictions and strict timeouts
 */
class DockerExecutor {
    constructor(options = {}) {
        this.imageName = options.imageName || 'befunge-runner:latest';
        this.cpuQuota = options.cpuQuota || 50000; // 50% of one CPU (100000 = 1 CPU)
        this.memoryLimit = options.memoryLimit || '128m'; // 128 MB
        this.timeoutMs = options.timeoutMs || 5000; // 5 seconds wall-clock timeout
        this.networkMode = options.networkMode || 'none'; // No network access
    }

    /**
     * Execute Befunge code in isolated Docker container
     * @param {string} code - Befunge-93 source code
     * @param {string} input - Input data for the program
     * @returns {Promise<{stdout: string, stderr: string, exitCode: number, verdict: string, executionTime: number}>}
     */
    async execute(code, input = '') {
        let workspaceDir = null;
        const startTime = Date.now();

        try {
            // 1. Create temporary workspace
            workspaceDir = await this.createWorkspace(code, input);

            // 2. Prepare container configuration
            const containerConfig = {
                image: this.imageName,
                cpuQuota: this.cpuQuota,
                memory: this.memoryLimit,
                networkMode: this.networkMode,
                workspaceDir,
                readOnly: true
            };

            // 3. Execute with timeout enforcement
            const result = await this.waitForCompletion(containerConfig, this.timeoutMs);

            // 4. Classify result
            const executionTime = Date.now() - startTime;
            const verdict = this.classifyResult(result, executionTime);

            return {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                verdict,
                executionTime,
                memoryUsed: result.memoryUsed
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            // Classify error
            if (error.message.includes('timeout') || error.message.includes('SIGKILL')) {
                return {
                    stdout: '',
                    stderr: 'Time Limit Exceeded',
                    exitCode: 137,
                    verdict: 'TLE',
                    executionTime
                };
            } else if (error.message.includes('OOMKilled') || error.message.includes('memory')) {
                return {
                    stdout: '',
                    stderr: 'Memory Limit Exceeded',
                    exitCode: 137,
                    verdict: 'MLE',
                    executionTime
                };
            } else {
                return {
                    stdout: '',
                    stderr: error.message,
                    exitCode: 1,
                    verdict: 'RE',
                    executionTime
                };
            }
        } finally {
            // 5. Cleanup resources
            await this.cleanup(null, workspaceDir); // No containerId since it auto-removes
        }
    }

    /**
     * Create temporary workspace with code and input files
     */
    async createWorkspace(code, input) {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'befunge-'));
        
        // Write code file
        await fs.writeFile(path.join(tmpDir, 'code.bf'), code, 'utf8');
        
        // Write input file
        await fs.writeFile(path.join(tmpDir, 'input.txt'), input, 'utf8');

        // Create runner script
        const runnerScript = `
const Befunge = require('befunge93');
const fs = require('fs');

const code = fs.readFileSync('/code/code.bf', 'utf8');
const input = fs.readFileSync('/code/input.txt', 'utf8');

const befunge = new Befunge();
let outputBuffer = '';
let inputIndex = 0;

befunge.onOutput = (char) => { outputBuffer += char; };
befunge.onInput = () => {
    if (inputIndex < input.length) {
        return input.charCodeAt(inputIndex++);
    }
    return -1; // EOF
};

try {
    befunge.run(code);
    process.stdout.write(outputBuffer);
    process.exit(0);
} catch (e) {
    process.stderr.write(e.message);
    process.exit(1);
}
`;
        await fs.writeFile(path.join(tmpDir, 'runner.js'), runnerScript, 'utf8');

        return tmpDir;
    }

    /**
     * Run Docker container with resource restrictions and capture output
     * Uses synchronous execution to properly capture stdout/stderr
     */
    async runContainer(config) {
        return new Promise((resolve, reject) => {
            const dockerArgs = [
                'run',
                '--rm',                                    // Auto-remove container
                `--cpu-quota=${config.cpuQuota}`,          // CPU limit
                `--memory=${config.memory}`,               // Memory limit
                '--memory-swap=0',                         // Disable swap
                `--network=${config.networkMode}`,         // Network isolation
                '--pids-limit=50',                         // Limit processes
                '--read-only',                             // Read-only root filesystem
                '--tmpfs=/tmp:rw,noexec,nosuid,size=10m', // Small writable tmp
                `-v`, `${config.workspaceDir}:/code:ro`,   // Mount user code to /code (read-only)
                config.image,
                'node', '/code/runner.js'                  // Run from /code
            ];

            const docker = spawn('docker', dockerArgs);
            let stdout = '';
            let stderr = '';

            docker.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            docker.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            docker.on('close', (exitCode) => {
                resolve({
                    stdout,
                    stderr,
                    exitCode: exitCode || 0,
                    memoryUsed: 'N/A' // Can't get stats for already-removed container
                });
            });

            docker.on('error', (err) => {
                reject(new Error(`Failed to run container: ${err.message}`));
            });
        });
    }

    /**
     * Wait for container completion with strict timeout
     * Now uses a timeout wrapper around the synchronous container execution
     */
    async waitForCompletion(config, timeoutMs) {
        return new Promise(async (resolve, reject) => {
            let timedOut = false;
            let containerProcess = null;

            // Strict wall-clock timeout
            const timeoutHandle = setTimeout(() => {
                timedOut = true;
                if (containerProcess) {
                    containerProcess.kill('SIGKILL');
                }
                reject(new Error('Execution timeout exceeded'));
            }, timeoutMs);

            try {
                const result = await this.runContainer(config);
                clearTimeout(timeoutHandle);

                if (!timedOut) {
                    resolve(result);
                }
            } catch (err) {
                clearTimeout(timeoutHandle);
                if (!timedOut) {
                    reject(err);
                }
            }
        });
    }

    /**
     * Get container resource usage statistics
     */
    async getContainerStats(containerId) {
        return new Promise((resolve) => {
            const statsProcess = spawn('docker', [
                'stats', containerId,
                '--no-stream',
                '--format', '{{.MemUsage}}'
            ]);

            let output = '';
            statsProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            statsProcess.on('close', () => {
                // Parse memory usage (e.g., "10.5MiB / 128MiB")
                const match = output.match(/([0-9.]+)([KMG]iB)/);
                const memoryUsed = match ? `${match[1]}${match[2]}` : 'unknown';
                resolve({ memoryUsed });
            });

            statsProcess.on('error', () => {
                resolve({ memoryUsed: 'unknown' });
            });
        });
    }

    /**
     * Classify execution result into verdict
     */
    classifyResult(result, executionTime) {
        // Check for timeout
        if (executionTime >= this.timeoutMs) {
            return 'TLE';
        }

        // Check for memory limit (exit code 137 often indicates OOMKilled)
        if (result.exitCode === 137 || result.stderr.includes('OOMKilled')) {
            return 'MLE';
        }

        // Check for runtime error
        if (result.exitCode !== 0) {
            return 'RE';
        }

        // Execution successful (output validation happens in worker)
        return 'OK';
    }

    /**
     * Kill container (graceful then forced)
     */
    async killContainer(containerId, force = false) {
        if (!containerId) return;

        try {
            if (force) {
                // Force kill immediately
                await this.execCommand('docker', ['kill', '-s', 'SIGKILL', containerId]);
            } else {
                // Try graceful stop first (SIGTERM)
                try {
                    await this.execCommand('docker', ['stop', '-t', '2', containerId]);
                } catch (err) {
                    // If graceful stop fails, force kill
                    await this.execCommand('docker', ['kill', '-s', 'SIGKILL', containerId]);
                }
            }
        } catch (err) {
            console.error(`Failed to kill container ${containerId}:`, err.message);
        }
    }

    /**
     * Cleanup all resources
     */
    async cleanup(containerId, workspaceDir) {
        // Kill container if still running
        if (containerId) {
            await this.killContainer(containerId, false);
        }

        // Remove workspace directory
        if (workspaceDir) {
            try {
                await fs.rm(workspaceDir, { recursive: true, force: true });
            } catch (err) {
                console.error(`Failed to remove workspace ${workspaceDir}:`, err.message);
            }
        }
    }

    /**
     * Helper to execute command and wait for completion
     */
    execCommand(command, args) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args);
            let output = '';
            let errorOutput = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Command failed: ${errorOutput}`));
                } else {
                    resolve(output);
                }
            });
        });
    }

    /**
     * Build Docker image (should be run once during setup)
     */
    static async buildImage(imageName = 'befunge-runner:latest') {
        const dockerfilePath = path.join(__dirname, 'Dockerfile.befunge');
        
        return new Promise((resolve, reject) => {
            const buildProcess = spawn('docker', [
                'build',
                '-t', imageName,
                '-f', dockerfilePath,
                __dirname
            ]);

            buildProcess.stdout.on('data', (data) => {
                console.log(data.toString());
            });

            buildProcess.stderr.on('data', (data) => {
                console.error(data.toString());
            });

            buildProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('Failed to build Docker image'));
                } else {
                    console.log(`✓ Docker image ${imageName} built successfully`);
                    resolve();
                }
            });
        });
    }
}

export default DockerExecutor;
