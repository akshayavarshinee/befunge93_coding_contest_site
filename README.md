# 🚀 Quick Start Guide

## Available Scripts

Run these from the **root directory** (`coding_contest_site/`):

### 🔧 One-Time Setup

```bash
# Build the Docker image for secure code execution
npm run setup:docker
```

### 🧪 Testing

```bash
# Test the Docker executor (verify everything works)
npm run test:docker
```

### 🏃 Running the Application

#### **Option 1: Secure Docker Worker (RECOMMENDED)** ✅

```bash
npm run dev
```

This starts:

- ✅ Redis (Docker container)
- ✅ Backend API (port 3000)
- ✅ **Docker Worker** (secure, isolated execution)
- ✅ Frontend (port 8080)

#### **Option 2: Old Worker (NOT RECOMMENDED)** ⚠️

```bash
npm start
```

This starts:

- ✅ Redis (Docker container)
- ✅ Backend API (port 3000)
- ⚠️ **Old Worker** (direct execution, insecure)
- ✅ Frontend (port 8080)

### 📦 Individual Services

Run individual services separately:

```bash
# Start Redis
npm run docker

# Start backend only
npm run backend

# Start old worker only (insecure)
npm run worker

# Start Docker worker only (secure)
npm run worker:docker

# Start frontend only
npm run frontend
```

## 🎯 Recommended Workflow

### First Time Setup

1. **Build Docker image** (one-time):

   ```bash
   npm run setup:docker
   ```

2. **Test the system**:

   ```bash
   npm run test:docker
   ```

3. **Start everything**:
   ```bash
   npm run dev
   ```

### Daily Development

Just run:

```bash
npm run dev
```

This will start all services with the **secure Docker worker**.

## 🔍 What Each Script Does

| Script                  | What It Does                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run setup:docker`  | Builds the Docker image for Befunge execution       |
| `npm run test:docker`   | Runs comprehensive tests on the Docker executor     |
| `npm run dev`           | **Starts all services with Docker worker (SECURE)** |
| `npm start`             | Starts all services with old worker (insecure)      |
| `npm run backend`       | Starts only the backend API server                  |
| `npm run worker`        | Starts only the old worker (insecure)               |
| `npm run worker:docker` | Starts only the Docker worker (secure)              |
| `npm run frontend`      | Starts only the frontend dev server                 |
| `npm run docker`        | Starts Redis container                              |

## 🌐 Access Points

After running `npm run dev`:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Redis**: localhost:6379

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal where you ran `npm run dev`.

This will stop all services (Redis, backend, worker, frontend).

## 📊 Monitoring

Watch the terminal output to see:

- **[0]** - Redis logs
- **[1]** - Backend logs
- **[2]** - Worker logs (job processing)
- **[3]** - Frontend logs (Vite dev server)

## ⚠️ Troubleshooting

### "Redis connection refused"

Make sure Docker Desktop is running, then:

```bash
docker start redis
```

### "Docker image not found"

Run the setup:

```bash
npm run setup:docker
```

### "Port already in use"

Kill the process using the port:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or just restart your computer
```

### Worker not processing jobs

Check that:

1. Redis is running: `docker ps` (should show redis container)
2. Backend is running (check terminal output)
3. Worker is running (check terminal output)

## 🔒 Security Note

**Always use `npm run dev` (Docker worker) in production!**

The old worker (`npm start`) runs user code directly and is **NOT SECURE**.

## 📚 More Documentation

- **Docker Execution System**: `backend/README_DOCKER.md`
- **Quick Start Guide**: `backend/QUICKSTART_DOCKER.md`
- **Migration Guide**: `backend/MIGRATION_GUIDE.md`
- **Technical Details**: `backend/DOCKER_EXECUTION.md`

---

**Ready to start?** Run `npm run dev` and open http://localhost:8080 🚀
