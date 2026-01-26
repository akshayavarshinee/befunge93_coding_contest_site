# Quick Start Guide - Docker-Based Execution

## Prerequisites

1. **Docker Desktop** - Must be installed and running
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Download and install Docker Desktop
   - Start Docker Desktop and wait for it to be running

2. **Node.js 18+** - Already installed (you have this)

3. **Redis** - Must be running on localhost:6379
   ```bash
   # Check if Redis is running
   redis-cli ping
   # Should return: PONG
   ```

## Setup (One-time)

### Step 1: Build Docker Image

```bash
npm run setup:docker
```

This will:

- ✅ Check Docker installation
- ✅ Build the `befunge-runner:latest` image (~2-3 minutes)
- ✅ Run a test execution to verify everything works

**Expected output:**

```
🚀 Setting up Docker-based Befunge execution system...

1. Checking Docker installation...
   ✓ Docker is installed

2. Building Docker image (this may take a few minutes)...
   [Docker build output...]
   ✓ Docker image built successfully

3. Testing isolated execution...
   ✓ Test execution successful

✅ Setup complete! You can now start the worker with:
   node worker_docker.js
```

### Step 2: Test the Executor (Optional but Recommended)

```bash
npm run test:docker
```

This runs comprehensive tests including:

- ✅ Simple output
- ✅ Hello World
- ✅ Input/Output
- ✅ Timeout detection (TLE)
- ✅ Runtime error detection (RE)

**Expected output:**

```
🧪 Running Docker Executor Tests
============================================================

📝 Test: Simple Output (Expected: OK)
   ✅ PASSED - Verdict matches

📝 Test: Infinite Loop (Expected: TLE)
   ✅ PASSED - Verdict matches

...

📊 Test Results: 6 passed, 0 failed
✅ All tests passed!
```

## Running the System

### Start the Backend Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Start the Docker Worker

**In a new terminal:**

```bash
npm run worker:docker
```

**Expected output:**

```
[Worker] Started and waiting for jobs...
```

## Verify It Works

### Test via API

1. **Submit a job:**

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d "{\"userId\": 1, \"contestID\": 1, \"problemId\": 1, \"code\": \"52*,@\"}"
```

Response:

```json
{
  "submissionId": "1",
  "status": "queued"
}
```

2. **Check job status:**

```bash
curl http://localhost:3000/api/submissions/1
```

Response:

```json
{
  "status": "completed",
  "verdict": "Accepted",
  "output": "All 1 test case(s) passed"
}
```

### Monitor Worker Logs

You should see in the worker terminal:

```
[Worker] Processing job 1
[Worker] Job 1: Running test case 1/1
[Worker] Job 1: Test case 1 verdict: OK
[Worker] Job 1 Final Verdict: Accepted
```

## Architecture Overview

```
User Submits Code
       ↓
Backend API (index.js)
       ↓
BullMQ Queue (Redis)
       ↓
Worker (worker_docker.js)
       ↓
Docker Executor (dockerExecutor.js)
       ↓
Isolated Docker Container
  • CPU: 50% limit
  • RAM: 128 MB limit
  • Network: Disabled
  • Timeout: 5 seconds
  • Read-only filesystem
       ↓
Result (AC/TLE/RE/MLE/WA)
       ↓
Database + Leaderboard Update
```

## Security Features

✅ **User code NEVER runs directly** - Always in isolated container
✅ **Resource limits enforced** - CPU, RAM, processes, timeout
✅ **No network access** - Container cannot make external requests
✅ **Read-only filesystem** - Cannot modify system files
✅ **Non-root user** - Runs as unprivileged user
✅ **Automatic cleanup** - All resources freed after execution

## Troubleshooting

### "Docker is not installed or not in PATH"

**Solution:** Install Docker Desktop and ensure it's running

- Open Docker Desktop
- Wait for "Docker Desktop is running" status
- Try setup again

### "Failed to build Docker image"

**Solution:** Check Docker is running

```bash
docker ps
# Should show running containers or empty list (not error)
```

### "Cannot connect to Redis"

**Solution:** Start Redis server

```bash
# Windows (if installed via Chocolatey)
redis-server

# Or check if running
redis-cli ping
```

### Worker shows "Connection refused"

**Solution:** Ensure Redis is running on port 6379

```bash
redis-cli ping
# Should return: PONG
```

### Tests fail with timeout

**Solution:** Increase timeout in `dockerExecutor.js`:

```javascript
const dockerExecutor = new DockerExecutor({
  timeoutMs: 10000, // Increase to 10 seconds
  // ... other options
});
```

## Switching Between Workers

### Use Old Worker (Direct Execution - NOT RECOMMENDED)

```bash
npm run worker
```

### Use New Docker Worker (Secure Isolated Execution - RECOMMENDED)

```bash
npm run worker:docker
```

**Only one worker should be running at a time!**

## Performance Notes

- **First execution:** ~2-3 seconds (Docker container startup)
- **Subsequent executions:** ~200-500ms overhead per test case
- **Concurrency:** 3 workers by default (configurable in `worker_docker.js`)
- **Throughput:** ~6-15 submissions/second depending on test case count

## Next Steps

1. ✅ Run `npm run setup:docker` to build the image
2. ✅ Run `npm run test:docker` to verify everything works
3. ✅ Start backend: `npm run dev`
4. ✅ Start worker: `npm run worker:docker`
5. ✅ Submit test code via API or frontend

## Production Deployment

For production, consider:

- Increase worker concurrency for higher throughput
- Use Docker Swarm or Kubernetes for distributed workers
- Monitor Docker resource usage
- Set up log aggregation for worker logs
- Configure alerts for failed jobs

## Questions?

See `DOCKER_EXECUTION.md` for detailed documentation.
