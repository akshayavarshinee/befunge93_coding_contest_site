# Docker-Based Isolated Execution System

## Overview

This system provides **secure, isolated execution** of Befunge-93 submissions using Docker containers. User code is **never executed directly** in the worker process.

## Architecture

```
┌─────────────────┐
│   BullMQ Job    │
│   (Submission)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Worker (worker_docker.js)                   │
│  • Fetches test cases from database                     │
│  • Orchestrates Docker container execution              │
│  • Classifies results (AC/TLE/RE/MLE/WA)               │
│  • Updates database and leaderboard                     │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│         DockerExecutor (dockerExecutor.js)              │
│  • Creates temporary workspace                          │
│  • Starts isolated Docker container                     │
│  • Enforces resource limits (CPU, RAM, network)         │
│  • Monitors execution with strict timeout               │
│  • Captures stdout/stderr and exit status               │
│  • Kills container on timeout (graceful → forced)       │
│  • Cleans up all resources                              │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│      Docker Container (befunge-runner:latest)           │
│  • Minimal Alpine Linux + Node.js                       │
│  • Non-root user (befunge)                              │
│  • Read-only root filesystem                            │
│  • No network access                                    │
│  • CPU quota: 50% of one core                           │
│  • Memory limit: 128 MB                                 │
│  • Process limit: 50                                    │
│  • Executes Befunge code with befunge93 package         │
└─────────────────────────────────────────────────────────┘
```

## Security Features

### Container Isolation

- ✅ **Read-only root filesystem** - Prevents file system tampering
- ✅ **No network access** (`--network=none`) - Prevents external communication
- ✅ **Non-root user** - Runs as unprivileged `befunge` user
- ✅ **Process limits** - Maximum 50 processes
- ✅ **Temporary workspace** - Mounted read-only, auto-deleted after execution

### Resource Limits

- ✅ **CPU quota**: 50% of one CPU core (configurable)
- ✅ **Memory limit**: 128 MB RAM (configurable)
- ✅ **No swap** - Prevents swap usage
- ✅ **Wall-clock timeout**: 5 seconds (configurable)
- ✅ **Strict enforcement** - Container killed if limits exceeded

### Execution Safety

- ✅ **Never executes user code directly** - All code runs in isolated container
- ✅ **Automatic cleanup** - Resources freed even on errors
- ✅ **Graceful termination** - SIGTERM first, then SIGKILL
- ✅ **Error classification** - TLE, MLE, RE, WA properly detected

## Setup

### Prerequisites

- Docker Desktop installed and running
- Node.js 18+ with npm
- Redis server running on localhost:6379

### Installation

1. **Build the Docker image**:

   ```bash
   node setup_docker.js
   ```

   This will:
   - Check Docker installation
   - Build the `befunge-runner:latest` image
   - Run a test execution to verify setup

2. **Start the worker**:
   ```bash
   node worker_docker.js
   ```

## Configuration

Edit `dockerExecutor.js` constructor to customize limits:

```javascript
const dockerExecutor = new DockerExecutor({
  imageName: "befunge-runner:latest",
  cpuQuota: 50000, // 50% of one CPU (100000 = 100%)
  memoryLimit: "128m", // 128 MB RAM
  timeoutMs: 5000, // 5 second timeout
  networkMode: "none", // No network access
});
```

## Verdict Classification

| Verdict                         | Description           | Exit Code | Criteria                              |
| ------------------------------- | --------------------- | --------- | ------------------------------------- |
| **AC** (Accepted)               | All test cases passed | 0         | Output matches expected for all tests |
| **WA** (Wrong Answer)           | Incorrect output      | 0         | Output doesn't match expected         |
| **TLE** (Time Limit Exceeded)   | Execution timeout     | 137       | Exceeds wall-clock timeout            |
| **MLE** (Memory Limit Exceeded) | Out of memory         | 137       | Exceeds memory limit                  |
| **RE** (Runtime Error)          | Execution error       | Non-zero  | Code crashed or threw error           |

## Execution Flow

### For Each Submission:

1. **Create Workspace**
   - Generate temporary directory in `/tmp`
   - Write `code.bf` (Befunge source)
   - Write `input.txt` (test case input)
   - Write `runner.js` (execution script)

2. **Start Container**

   ```bash
   docker run --rm -d \
     --cpu-quota=50000 \
     --memory=128m \
     --memory-swap=0 \
     --network=none \
     --pids-limit=50 \
     --read-only \
     --tmpfs=/tmp:rw,noexec,nosuid,size=10m \
     -v /tmp/befunge-xxx:/workspace:ro \
     befunge-runner:latest \
     node /workspace/runner.js
   ```

3. **Monitor Execution**
   - Attach to container logs (stdout/stderr)
   - Wait for container exit with timeout
   - Kill container if timeout exceeded

4. **Classify Result**
   - Check execution time → TLE if exceeded
   - Check exit code 137 → MLE (OOMKilled)
   - Check exit code non-zero → RE
   - Compare output → WA if mismatch
   - All pass → AC

5. **Cleanup**
   - Stop container (graceful SIGTERM, then SIGKILL)
   - Remove temporary workspace
   - Free all resources

## Testing

### Test the Docker executor directly:

```javascript
import DockerExecutor from "./dockerExecutor.js";

const executor = new DockerExecutor();

// Test successful execution
const result = await executor.execute("52*,@", ""); // Outputs "10"
console.log(result);
// { stdout: '10', stderr: '', exitCode: 0, verdict: 'OK', executionTime: 234 }

// Test timeout
const infiniteLoop = "> v\n  >\n  ^\n  <";
const result2 = await executor.execute(infiniteLoop, "");
console.log(result2);
// { stdout: '', stderr: 'Time Limit Exceeded', exitCode: 137, verdict: 'TLE', ... }
```

### Test the full worker:

Submit a job via the API:

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "contestID": 1,
    "problemId": 1,
    "code": "52*,@"
  }'
```

Check job status:

```bash
curl http://localhost:3000/api/submissions/{submissionId}
```

## Troubleshooting

### Docker image not found

```bash
# Rebuild the image
node setup_docker.js
```

### Container fails to start

```bash
# Check Docker is running
docker ps

# Check image exists
docker images | grep befunge-runner
```

### Timeout issues

- Increase `timeoutMs` in `dockerExecutor.js`
- Check Docker resource limits in Docker Desktop settings

### Memory issues

- Increase `memoryLimit` in `dockerExecutor.js`
- Ensure Docker has sufficient memory allocated

## Performance

- **Overhead**: ~200-500ms per execution (Docker startup)
- **Concurrency**: 3 workers by default (configurable)
- **Throughput**: ~6-15 submissions/second (depends on test case count)

## Production Considerations

1. **Docker Image Caching**: Image is cached after first build
2. **Workspace Cleanup**: Automatic cleanup even on crashes
3. **Resource Monitoring**: Container stats captured for debugging
4. **Graceful Shutdown**: Worker handles SIGTERM/SIGINT properly
5. **Error Recovery**: Failed jobs don't crash the worker

## Security Audit Checklist

- [x] User code never executed directly in worker
- [x] Container runs as non-root user
- [x] Read-only root filesystem
- [x] No network access
- [x] CPU and memory limits enforced
- [x] Process limits enforced
- [x] Workspace mounted read-only
- [x] Automatic resource cleanup
- [x] Timeout strictly enforced
- [x] No persistent state in container

## License

MIT
