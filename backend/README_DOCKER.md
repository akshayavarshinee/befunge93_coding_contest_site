# Docker-Based Job Execution System

## 🎯 Overview

A **secure, isolated job execution system** for Befunge-93 code submissions. User code **never runs directly** in the worker process - everything executes in isolated Docker containers with strict resource limits.

## 🚀 Quick Start

```bash
# 1. Setup (one-time)
npm run setup:docker

# 2. Test
npm run test:docker

# 3. Run
npm run worker:docker
```

See [`QUICKSTART_DOCKER.md`](./QUICKSTART_DOCKER.md) for detailed instructions.

## 📋 Files Overview

| File                      | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `Dockerfile.befunge`      | Minimal Alpine image for Befunge execution    |
| `dockerExecutor.js`       | Core Docker orchestration and isolation logic |
| `worker_docker.js`        | Enhanced BullMQ worker using Docker executor  |
| `setup_docker.js`         | One-time setup script to build Docker image   |
| `test_docker_executor.js` | Comprehensive test suite                      |
| `DOCKER_EXECUTION.md`     | Detailed technical documentation              |
| `QUICKSTART_DOCKER.md`    | Step-by-step setup guide                      |
| `MIGRATION_GUIDE.md`      | Migration from old worker                     |

## 🔒 Security Features

### Complete Isolation

- ✅ User code runs in separate Docker container
- ✅ Read-only root filesystem
- ✅ No network access (`--network=none`)
- ✅ Non-root user execution
- ✅ Process limit: 50 processes

### Resource Limits

- ✅ CPU: 50% of one core
- ✅ RAM: 128 MB
- ✅ Timeout: 5 seconds (strict wall-clock)
- ✅ No swap memory
- ✅ Temporary workspace: 10 MB

### Safety Guarantees

- ✅ Cannot access host filesystem
- ✅ Cannot make network requests
- ✅ Cannot consume unlimited resources
- ✅ Cannot crash the worker
- ✅ Cannot access database credentials
- ✅ Automatic cleanup on success/failure

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Submission Flow                           │
└─────────────────────────────────────────────────────────────┘

User submits code
       ↓
Backend API (index.js)
       ↓
BullMQ Queue (Redis)
       ↓
┌──────────────────────────────────────────────────────────┐
│ Worker (worker_docker.js)                                │
│  • Fetches test cases from DB                            │
│  • For each test case:                                   │
│    └─→ Calls DockerExecutor                             │
│  • Classifies verdict (AC/TLE/RE/MLE/WA)                │
│  • Updates database and leaderboard                      │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ DockerExecutor (dockerExecutor.js)                       │
│  1. Create temporary workspace                           │
│     • code.bf (Befunge source)                          │
│     • input.txt (test input)                            │
│     • runner.js (execution script)                      │
│                                                           │
│  2. Start Docker container                               │
│     • Mount workspace read-only                         │
│     • Apply CPU/RAM limits                              │
│     • Disable network                                   │
│     • Set timeout                                       │
│                                                           │
│  3. Monitor execution                                    │
│     • Capture stdout/stderr                             │
│     • Enforce timeout                                   │
│     • Track resource usage                              │
│                                                           │
│  4. Kill container if timeout                            │
│     • Try graceful SIGTERM                              │
│     • Force SIGKILL if needed                           │
│                                                           │
│  5. Cleanup                                              │
│     • Remove container                                  │
│     • Delete workspace                                  │
│     • Free all resources                                │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ Docker Container (befunge-runner:latest)                 │
│  • OS: Alpine Linux (minimal)                            │
│  • Runtime: Node.js 20                                   │
│  • User: befunge (non-root)                             │
│  • Filesystem: Read-only                                │
│  • Network: Disabled                                     │
│  • CPU: 50% limit                                        │
│  • RAM: 128 MB limit                                     │
│  • Executes: node /workspace/runner.js                  │
└──────────────────────────────────────────────────────────┘
       ↓
Result: {verdict, stdout, stderr, exitCode, executionTime}
       ↓
Database + Leaderboard Update
```

## 📊 Verdict Classification

| Verdict | Description           | Detection                                    |
| ------- | --------------------- | -------------------------------------------- |
| **AC**  | Accepted              | All test cases pass, output matches expected |
| **WA**  | Wrong Answer          | Output doesn't match expected                |
| **TLE** | Time Limit Exceeded   | Execution time ≥ timeout (5s)                |
| **MLE** | Memory Limit Exceeded | Exit code 137 (OOMKilled)                    |
| **RE**  | Runtime Error         | Non-zero exit code, exceptions               |

## 🧪 Testing

### Run All Tests

```bash
npm run test:docker
```

### Test Individual Verdicts

**Accepted (AC):**

```javascript
const result = await executor.execute("52*,@", "");
// Output: "10", Verdict: OK
```

**Time Limit Exceeded (TLE):**

```javascript
const result = await executor.execute("> v\n  >\n  ^\n  <", "");
// Infinite loop, Verdict: TLE
```

**Runtime Error (RE):**

```javascript
const result = await executor.execute("00/,@", "");
// Division by zero, Verdict: RE
```

## ⚙️ Configuration

Edit `worker_docker.js`:

```javascript
const dockerExecutor = new DockerExecutor({
  imageName: "befunge-runner:latest",
  cpuQuota: 50000, // 100000 = 100% of one CPU
  memoryLimit: "128m", // '256m' for 256 MB
  timeoutMs: 5000, // Milliseconds
  networkMode: "none", // 'bridge' to enable network
});
```

## 📈 Performance

- **Container startup overhead:** ~200-500ms
- **Concurrency:** 3 workers (configurable)
- **Throughput:** ~6-15 submissions/second
- **Resource usage:** ~128 MB RAM per container

## 🔄 Comparison with Old System

| Metric          | Old Worker    | Docker Worker        |
| --------------- | ------------- | -------------------- |
| Security        | ❌ None       | ✅ Full isolation    |
| Resource Limits | ❌ None       | ✅ CPU, RAM, timeout |
| TLE Detection   | ⚠️ Unreliable | ✅ Reliable          |
| MLE Detection   | ❌ No         | ✅ Yes               |
| Worker Safety   | ❌ Can crash  | ✅ Protected         |
| Overhead        | ~10-50ms      | ~200-500ms           |

**Recommendation:** Always use Docker worker in production.

## 🛠️ Troubleshooting

### Docker not found

```bash
# Install Docker Desktop and ensure it's running
docker --version
```

### Image build fails

```bash
# Check Docker is running
docker ps

# Rebuild
npm run setup:docker
```

### All submissions timeout

```javascript
// Increase timeout in dockerExecutor.js
timeoutMs: 10000; // 10 seconds
```

### Worker can't connect to Redis

```bash
# Ensure Redis is running
redis-cli ping
# Should return: PONG
```

## 📚 Documentation

- **Quick Start:** [`QUICKSTART_DOCKER.md`](./QUICKSTART_DOCKER.md)
- **Technical Details:** [`DOCKER_EXECUTION.md`](./DOCKER_EXECUTION.md)
- **Migration Guide:** [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

## 🚦 Production Checklist

Before deploying:

- [ ] Docker Desktop installed and running
- [ ] Image built: `npm run setup:docker`
- [ ] Tests pass: `npm run test:docker`
- [ ] Redis running and accessible
- [ ] Database schema updated (if needed)
- [ ] Worker configured with appropriate limits
- [ ] Monitoring set up for failed jobs
- [ ] Log aggregation configured
- [ ] Backup worker ready for rollback

## 🔐 Security Audit

- [x] User code never executed directly
- [x] Container runs as non-root user
- [x] Read-only root filesystem
- [x] No network access
- [x] CPU and memory limits enforced
- [x] Process limits enforced
- [x] Workspace mounted read-only
- [x] Automatic resource cleanup
- [x] Timeout strictly enforced
- [x] No persistent state in container
- [x] Graceful and forced termination
- [x] Error handling for all failure modes

## 📝 License

MIT

---

**Need help?** See the documentation files or run `npm run test:docker` to verify your setup.
